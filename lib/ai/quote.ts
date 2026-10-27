import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { Business, BusinessSettings, Lead } from "@prisma/client";
import { env, features } from "@/lib/env";
import { estimateFromRules, type Estimate, type ServiceWithRules } from "@/lib/pricing/engine";
import { fillTemplate, formatMoney } from "@/lib/utils/format";
import { QuoteOutputSchema, type QuoteOutput } from "@/lib/ai/schema";

export type QuoteContext = {
  business: Business;
  settings: BusinessSettings;
  services: ServiceWithRules[];
  lead: Lead;
  bookingUrl: string;
};

export type GeneratedQuote = QuoteOutput & {
  serviceId: string | null;
  generatedBy: "ai" | "rules";
};

const SYSTEM_PROMPT = `You are the quoting assistant for a local service business. You turn a customer's inquiry into a realistic, itemized preliminary estimate plus the customer-facing messages that go with it.

Rules you must follow:
- The business's pricing rules are the source of truth. Never invent prices that the rules do not support. A deterministic baseline estimate computed from those rules is provided; keep its figures unless the customer's message clearly justifies a change, and explain any change in internalNotes.
- If important details are missing (quantities, materials, access, condition), state the assumptions you made and keep the estimate conservative.
- If you cannot estimate with confidence, provide a price range (priceLow/priceHigh) and use "subject to site visit" wording. Set confidence to low.
- Never claim facts about the customer that are not in the lead.
- lineItems totals must add up to subtotal; total = subtotal + tax.
- Write for a real person: straightforward, warm, not robotic. No marketing fluff.
- The customer message and email must include the estimate, the key assumption, and a clear call to action to book using the booking link provided.
- Match the business's tone preference.`;

function buildUserPrompt(ctx: QuoteContext, baseline: Estimate) {
  const catalog = ctx.services
    .filter((s) => s.active)
    .map((s) => {
      const rules = s.pricingRules
        .filter((r) => r.active)
        .map((r) => `    - [${r.ruleType}] ${r.label}: ${r.value}${r.unit ? ` per ${r.unit}` : ""}${r.note ? ` (${r.note})` : ""}`)
        .join("\n");
      const base = [
        s.pricingType,
        s.basePrice != null ? `base ${s.basePrice}${s.unitLabel ? `/${s.unitLabel}` : ""}` : null,
        s.minPrice != null ? `min ${s.minPrice}` : null,
        s.maxPrice != null ? `max ${s.maxPrice}` : null,
        s.minimumCharge != null ? `minimum charge ${s.minimumCharge}` : null,
        s.laborHoursEstimate != null ? `typical labor ${s.laborHoursEstimate}h` : null,
      ]
        .filter(Boolean)
        .join(", ");
      return `  • ${s.name} (${s.category}) — ${base}${s.description ? `\n    ${s.description}` : ""}${rules ? `\n${rules}` : ""}`;
    })
    .join("\n");

  return `BUSINESS
Name: ${ctx.business.name}
Service area: ${ctx.business.serviceArea ?? "not specified"}
Phone: ${ctx.business.phone ?? "not specified"}
Tone: ${ctx.settings.tone}
Tax rate: ${ctx.settings.taxRatePercent}%
Default terms: ${ctx.settings.defaultQuoteTerms}

SERVICE CATALOG AND PRICING RULES
${catalog || "  (no services configured)"}

LEAD
Customer: ${ctx.lead.customerName}
Requested service: ${ctx.lead.serviceRequested ?? "not specified"}
Location: ${ctx.lead.location ?? "not specified"}
Urgency: ${ctx.lead.urgency}
Budget mentioned: ${ctx.lead.budgetEstimate ?? "none"}
Source: ${ctx.lead.source}
Customer message:
"""
${ctx.lead.inquiryText}
"""
${ctx.lead.customerNotes ? `Internal notes on this lead: ${ctx.lead.customerNotes}\n` : ""}
BASELINE ESTIMATE FROM PRICING RULES (JSON)
${JSON.stringify(baseline, null, 2)}

BOOKING LINK to include in messages: ${ctx.bookingUrl}

Produce the quote, the SMS-length customer message, the email, and internal notes.`;
}

/** Template-based output used when no AI key is configured or the AI call fails. */
export function quoteFromRulesOnly(ctx: QuoteContext, baseline: Estimate): GeneratedQuote {
  const total = baseline.priceLow != null && baseline.priceHigh != null && baseline.total === 0
    ? `${formatMoney(baseline.priceLow)}–${formatMoney(baseline.priceHigh)}`
    : formatMoney(baseline.total);
  const vars = {
    customerName: ctx.lead.customerName.split(" ")[0],
    businessName: ctx.business.name,
    service: baseline.serviceType,
    total,
    assumptions: baseline.assumptions.join("; ") || "Standard job conditions",
    bookingUrl: ctx.bookingUrl,
    phone: ctx.business.phone ?? "",
  };
  return {
    serviceType: baseline.serviceType,
    serviceId: baseline.serviceId,
    lineItems: baseline.lineItems.map((li) => ({ ...li, description: li.description ?? null })),
    subtotal: baseline.subtotal,
    tax: baseline.tax,
    total: baseline.total,
    priceLow: baseline.priceLow,
    priceHigh: baseline.priceHigh,
    confidence: baseline.confidence,
    assumptions: baseline.assumptions,
    terms: ctx.settings.defaultQuoteTerms,
    customerMessage: fillTemplate(ctx.settings.defaultFollowUpText, vars),
    emailSubject: `Your estimate for ${baseline.serviceType}`,
    emailBody: fillTemplate(ctx.settings.defaultFollowUpEmail, vars),
    internalNotes: baseline.internalNotes,
    generatedBy: "rules",
  };
}

export async function generateQuote(ctx: QuoteContext): Promise<GeneratedQuote> {
  const baseline = estimateFromRules({
    lead: ctx.lead,
    services: ctx.services,
    taxRatePercent: ctx.settings.taxRatePercent,
  });

  if (!features.ai()) return quoteFromRulesOnly(ctx, baseline);

  try {
    const client = new Anthropic({ apiKey: env.anthropicApiKey });
    const response = await client.messages.parse({
      model: env.anthropicModel,
      max_tokens: 8000,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildUserPrompt(ctx, baseline) }],
      output_config: { format: zodOutputFormat(QuoteOutputSchema) },
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      console.warn("[ai] quote generation returned no usable output", response.stop_reason);
      return quoteFromRulesOnly(ctx, baseline);
    }

    const out = response.parsed_output;
    return { ...out, serviceId: baseline.serviceId, generatedBy: "ai" };
  } catch (err) {
    console.error("[ai] quote generation failed, falling back to rules", err);
    return quoteFromRulesOnly(ctx, baseline);
  }
}
