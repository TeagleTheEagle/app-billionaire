import { z } from "zod";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { sendSms } from "@/lib/messaging/sms";
import { sendEmail } from "@/lib/messaging/email";
import { HttpError } from "@/lib/utils/api";
import { fillTemplate, formatMoney } from "@/lib/utils/format";
import { advanceLeadStatus } from "@/services/lead-service";
import { bookingUrlFor, extractEmailFromNotes, markQuoteSent } from "@/services/quote-service";

export const sendMessageSchema = z.object({
  leadId: z.string().min(1),
  quoteId: z.string().optional().nullable(),
  channel: z.enum(["sms", "email"]),
  messageType: z.enum(["quote", "follow_up", "booking_confirmation", "custom"]).default("custom"),
  subject: z.string().trim().max(200).optional().nullable(),
  content: z.string().trim().min(1, "Message cannot be empty").max(5000),
  recipient: z.string().trim().max(200).optional().nullable(),
});

export async function sendMessage(businessId: string, userId: string | null, input: z.infer<typeof sendMessageSchema>) {
  const lead = await prisma.lead.findFirst({ where: { id: input.leadId, businessId } });
  if (!lead) throw new HttpError("Lead not found", 404);
  const recipient = input.recipient || (input.channel === "sms" ? lead.customerPhone : lead.customerEmail);
  if (!recipient) throw new HttpError(`This lead has no ${input.channel === "sms" ? "phone number" : "email address"} on file`, 422);
  if (input.quoteId) {
    const quote = await prisma.quote.findFirst({ where: { id: input.quoteId, businessId } });
    if (!quote) throw new HttpError("Quote not found", 404);
    if (quote.status === "draft" || quote.status === "rejected") throw new HttpError("Approve the quote before sending it", 409);
  }

  const message = await prisma.message.create({
    data: {
      leadId: lead.id,
      businessId,
      quoteId: input.quoteId || null,
      channel: input.channel,
      messageType: input.messageType,
      subject: input.channel === "email" ? input.subject || "Your estimate" : null,
      content: input.content,
      recipient,
      status: "queued",
    },
  });

  const result = input.channel === "sms" ? await sendSms(recipient, input.content) : await sendEmail(recipient, message.subject ?? "Your estimate", input.content);

  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { status: result.status, providerId: result.providerId ?? null, error: result.error ?? null, sentAt: result.status === "failed" ? null : new Date() },
  });

  if (result.status !== "failed") {
    if (input.quoteId) await markQuoteSent(input.quoteId);
    else if (input.messageType !== "booking_confirmation") await advanceLeadStatus(lead.id, "contacted");
  }
  await logActivity({ businessId, userId, entityType: "message", entityId: updated.id, action: `sent:${result.status}`, metadata: { channel: input.channel, leadId: lead.id, messageType: input.messageType } });
  return updated;
}

export async function listMessages(businessId: string, leadId?: string) {
  return prisma.message.findMany({ where: { businessId, ...(leadId ? { leadId } : {}) }, orderBy: { createdAt: "desc" }, take: 200 });
}

/** Build the suggested SMS and email for a quote so the owner can edit before sending. */
export async function draftQuoteMessages(businessId: string, quoteId: string) {
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, businessId }, include: { lead: true, business: { include: { settings: true } } } });
  if (!quote) throw new HttpError("Quote not found", 404);
  const settings = quote.business.settings;
  const email = extractEmailFromNotes(quote.internalNotes);
  const total = quote.priceLow != null && quote.priceHigh != null && quote.totalPrice === 0 ? `${formatMoney(quote.priceLow)}–${formatMoney(quote.priceHigh)}` : formatMoney(quote.totalPrice);
  const vars = {
    customerName: quote.lead.customerName.split(" ")[0],
    businessName: quote.business.name,
    service: quote.serviceType,
    total,
    assumptions: quote.assumptions.join("; ") || "Standard job conditions",
    bookingUrl: bookingUrlFor(quote.publicToken),
    phone: quote.business.phone ?? "",
  };
  return {
    sms: quote.customerMessage || fillTemplate(settings?.defaultFollowUpText ?? "", vars),
    emailSubject: email.subject ?? `Your estimate for ${quote.serviceType}`,
    emailBody: email.body ?? fillTemplate(settings?.defaultFollowUpEmail ?? "", vars),
    bookingUrl: vars.bookingUrl,
  };
}
