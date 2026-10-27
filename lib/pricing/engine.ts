import type { Lead, PricingRule, Service, Urgency } from "@prisma/client";

export type LineItem = {
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type Estimate = {
  serviceType: string;
  serviceId: string | null;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  priceLow: number | null;
  priceHigh: number | null;
  confidence: "high" | "medium" | "low";
  assumptions: string[];
  internalNotes: string;
};

export type ServiceWithRules = Service & { pricingRules: PricingRule[] };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Pull "150 ft", "3 rooms", "2 hours" style quantities out of free text. */
export function extractQuantities(text: string): Record<string, number> {
  const out: Record<string, number> = {};
  const re = /(\d+(?:[.,]\d+)?)\s*(?:-|to)?\s*(?:\d+(?:[.,]\d+)?)?\s*(sq\.?\s*ft|square\s*feet|sqft|linear\s*feet|lin\.?\s*ft|ft|feet|foot|hours?|hrs?|rooms?|bedrooms?|windows?|doors?|acres?|yards?|units?|fixtures?|outlets?|trees?|panels?|gallons?|items?|loads?)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const qty = parseFloat(m[1].replace(",", "."));
    const unitRaw = m[2].toLowerCase().replace(/\s+/g, " ");
    const unit = normalizeUnit(unitRaw);
    if (!out[unit]) out[unit] = qty;
  }
  return out;
}

export function normalizeUnit(unit: string) {
  const u = unit.toLowerCase().replace(/\./g, "").trim();
  if (/^(sq ?ft|square feet|sqft)$/.test(u)) return "sq ft";
  if (/^(linear feet|lin ?ft|ft|feet|foot)$/.test(u)) return "ft";
  if (/^(hours?|hrs?)$/.test(u)) return "hour";
  return u.replace(/s$/, "");
}

/** Pick the catalog service that best matches the lead's text. */
export function matchService(lead: Pick<Lead, "serviceRequested" | "inquiryText" | "serviceId">, services: ServiceWithRules[]) {
  if (lead.serviceId) {
    const direct = services.find((s) => s.id === lead.serviceId);
    if (direct) return direct;
  }
  const haystack = `${lead.serviceRequested ?? ""} ${lead.inquiryText}`.toLowerCase();
  let best: { service: ServiceWithRules; score: number } | null = null;
  for (const s of services) {
    if (!s.active) continue;
    const terms = [s.name, s.category, ...(s.description ?? "").split(/[,.]/)]
      .flatMap((t) => t.toLowerCase().split(/\s+/))
      .filter((t) => t.length > 3);
    let score = 0;
    for (const t of new Set(terms)) if (haystack.includes(t)) score += t.length;
    if (haystack.includes(s.name.toLowerCase())) score += 50;
    if (!best || score > best.score) best = { service: s, score };
  }
  return best && best.score > 0 ? best.service : null;
}

function keywordHit(label: string, text: string) {
  const words = label.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  return words.some((w) => text.includes(w));
}

/**
 * Deterministic estimate from the business's own pricing rules.
 * This is the source of truth the AI layer refines; it also powers rules-only mode.
 */
export function estimateFromRules(input: {
  lead: Pick<Lead, "serviceRequested" | "inquiryText" | "serviceId" | "urgency" | "budgetEstimate">;
  services: ServiceWithRules[];
  taxRatePercent?: number;
}): Estimate {
  const { lead, services } = input;
  const taxRate = (input.taxRatePercent ?? 0) / 100;
  const text = `${lead.serviceRequested ?? ""} ${lead.inquiryText}`.toLowerCase();
  const quantities = extractQuantities(lead.inquiryText);
  const service = matchService(lead, services);
  const assumptions: string[] = [];
  const notes: string[] = [];
  const lineItems: LineItem[] = [];

  if (!service) {
    return {
      serviceType: lead.serviceRequested || "General service request",
      serviceId: null,
      lineItems: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      priceLow: null,
      priceHigh: null,
      confidence: "low",
      assumptions: ["No matching service in your catalog. Pricing requires a site visit or manual quote."],
      internalNotes: "No catalog match. Add a service or edit the quote manually.",
    };
  }

  const rules = service.pricingRules.filter((r) => r.active);
  const rule = (t: PricingRule["ruleType"]) => rules.filter((r) => r.ruleType === t);
  let confidence: Estimate["confidence"] = rules.length > 0 ? "medium" : "low";

  // 1. Base / flat pricing
  for (const r of rule("base_rate")) {
    lineItems.push({ name: r.label, quantity: 1, unitPrice: r.value, total: r.value, description: r.note });
  }
  if (rule("base_rate").length === 0 && service.pricingType === "flat" && service.basePrice) {
    lineItems.push({ name: service.name, quantity: 1, unitPrice: service.basePrice, total: service.basePrice });
  }

  // 2. Per-unit pricing (materials, per sq ft, etc.)
  for (const r of rule("per_unit")) {
    const unit = normalizeUnit(r.unit ?? service.unitLabel ?? "unit");
    const qty = quantities[unit];
    if (qty) {
      lineItems.push({ name: r.label, quantity: qty, unitPrice: r.value, total: round2(qty * r.value), description: `${qty} ${unit} × ${r.value}` });
      confidence = "high";
    } else {
      assumptions.push(`${r.label}: quantity not stated, priced per ${unit}. Confirm measurements.`);
      notes.push(`Missing quantity for "${r.label}" (${unit}).`);
    }
  }
  if (rule("per_unit").length === 0 && service.pricingType === "per_unit" && service.basePrice) {
    const unit = normalizeUnit(service.unitLabel ?? "unit");
    const qty = quantities[unit];
    if (qty) {
      lineItems.push({ name: service.name, quantity: qty, unitPrice: service.basePrice, total: round2(qty * service.basePrice), description: `${qty} ${unit}` });
      confidence = "high";
    } else {
      assumptions.push(`Quantity in ${unit} not provided; final price depends on measurements.`);
    }
  }

  // 3. Hourly labor
  const hourly = rule("hourly_rate");
  const hoursInText = quantities["hour"];
  const hours = hoursInText ?? service.laborHoursEstimate ?? (hourly.length ? 2 : 0);
  for (const r of hourly) {
    if (hours > 0) {
      lineItems.push({ name: r.label, quantity: hours, unitPrice: r.value, total: round2(hours * r.value), description: `${hours} hr × ${r.value}/hr` });
      if (!hoursInText) assumptions.push(`Labor estimated at ${hours} hour${hours === 1 ? "" : "s"}.`);
    }
  }
  if (hourly.length === 0 && service.pricingType === "hourly" && service.basePrice && hours > 0) {
    lineItems.push({ name: "Labor", quantity: hours, unitPrice: service.basePrice, total: round2(hours * service.basePrice) });
    if (!hoursInText) assumptions.push(`Labor estimated at ${hours} hours.`);
  }

  // 4. Markup on materials/per-unit items
  for (const r of rule("markup_percent")) {
    const base = lineItems.filter((li) => /material|supply|supplies|parts/i.test(li.name)).reduce((s, li) => s + li.total, 0);
    if (base > 0) {
      const amt = round2((base * r.value) / 100);
      lineItems.push({ name: r.label, quantity: 1, unitPrice: amt, total: amt, description: `${r.value}% on ${round2(base)}` });
    }
  }

  // 5. Add-ons that the customer mentioned
  for (const r of rule("add_on")) {
    if (keywordHit(r.label, text)) {
      lineItems.push({ name: r.label, quantity: 1, unitPrice: r.value, total: r.value, description: r.note });
    }
  }

  // 6. Fixed fees
  for (const r of rule("fee")) {
    lineItems.push({ name: r.label, quantity: 1, unitPrice: r.value, total: r.value, description: r.note });
  }

  let subtotal = round2(lineItems.reduce((s, li) => s + li.total, 0));

  // 7. Surcharges (after-hours, emergency)
  const urgent: Urgency[] = ["emergency"];
  for (const r of rule("surcharge_percent")) {
    const applies = keywordHit(r.label, text) || urgent.includes(lead.urgency) || /after.?hours|weekend|tonight|asap|emergency|urgent/i.test(text);
    if (applies && subtotal > 0) {
      const amt = round2((subtotal * r.value) / 100);
      lineItems.push({ name: r.label, quantity: 1, unitPrice: amt, total: amt, description: `${r.value}%` });
      subtotal = round2(subtotal + amt);
      assumptions.push(`${r.label} applied based on the request timing.`);
    }
  }

  // 8. Minimum charge
  const minimum = Math.max(service.minimumCharge ?? 0, ...rule("minimum_charge").map((r) => r.value));
  if (minimum > 0 && subtotal < minimum) {
    if (subtotal > 0) {
      lineItems.push({ name: "Minimum charge adjustment", quantity: 1, unitPrice: round2(minimum - subtotal), total: round2(minimum - subtotal) });
    } else {
      lineItems.push({ name: "Minimum charge", quantity: 1, unitPrice: minimum, total: minimum });
    }
    subtotal = minimum;
    assumptions.push(`Minimum charge of ${minimum} applies.`);
  }

  // Ranges / quote-on-site
  let priceLow: number | null = null;
  let priceHigh: number | null = null;
  if (service.pricingType === "range" || service.pricingType === "quote_on_site") {
    priceLow = service.minPrice ?? (subtotal ? round2(subtotal * 0.85) : null);
    priceHigh = service.maxPrice ?? (subtotal ? round2(subtotal * 1.2) : null);
    if (subtotal === 0 && priceLow !== null && priceHigh !== null) {
      subtotal = round2((priceLow + priceHigh) / 2);
      lineItems.push({ name: service.name, quantity: 1, unitPrice: subtotal, total: subtotal, description: `Typical range ${priceLow}–${priceHigh}` });
    }
    assumptions.push("Final pricing confirmed after an on-site visit.");
    confidence = confidence === "high" ? "medium" : confidence;
  }
  if (service.minPrice && subtotal < service.minPrice && service.pricingType !== "range") {
    assumptions.push(`Typical jobs start at ${service.minPrice}.`);
  }

  if (lead.budgetEstimate && subtotal > lead.budgetEstimate) {
    notes.push(`Estimate (${subtotal}) exceeds stated budget (${lead.budgetEstimate}).`);
  }

  const tax = round2(subtotal * taxRate);
  const total = round2(subtotal + tax);

  if (lineItems.length === 0) {
    assumptions.push("Not enough pricing rules to compute a total. Add rules or price this manually.");
    confidence = "low";
  }

  return {
    serviceType: service.name,
    serviceId: service.id,
    lineItems,
    subtotal,
    tax,
    total,
    priceLow,
    priceHigh,
    confidence,
    assumptions,
    internalNotes: notes.join(" ") || `Priced from ${rules.length} rule(s) on "${service.name}".`,
  };
}
