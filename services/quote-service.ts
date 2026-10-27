import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { logActivity } from "@/lib/activity";
import { generateQuote } from "@/lib/ai/quote";
import { HttpError } from "@/lib/utils/api";
import { advanceLeadStatus } from "@/services/lead-service";
import { assertCanGenerateQuote, recordQuoteUsage } from "@/services/billing-service";

export const quoteUpdateSchema = z.object({
  serviceType: z.string().trim().min(1).max(120).optional(),
  lineItems: z
    .array(z.object({ name: z.string().trim().min(1), description: z.string().nullable().optional(), quantity: z.number().min(0), unitPrice: z.number().min(0), total: z.number().min(0) }))
    .optional(),
  tax: z.number().min(0).optional(),
  priceLow: z.number().min(0).nullable().optional(),
  priceHigh: z.number().min(0).nullable().optional(),
  assumptions: z.array(z.string().trim()).optional(),
  terms: z.string().trim().max(2000).optional(),
  customerMessage: z.string().trim().max(1000).optional(),
  internalNotes: z.string().trim().max(2000).nullable().optional(),
});

export function bookingUrlFor(publicToken: string) {
  return `${env.appUrl}/q/${publicToken}`;
}

export async function generateQuoteForLead(businessId: string, userId: string, leadId: string) {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, businessId } });
  if (!lead) throw new HttpError("Lead not found", 404);
  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId }, include: { settings: true, subscription: true } });
  const settings = business.settings ?? (await prisma.businessSettings.create({ data: { businessId } }));
  const services = await prisma.service.findMany({ where: { businessId, active: true }, include: { pricingRules: true } });

  await assertCanGenerateQuote(business.subscription);

  // Reserve the token up front so the AI can put the booking link in the message.
  const publicToken = crypto.randomUUID().replace(/-/g, "");
  const generated = await generateQuote({ business, settings, services, lead, bookingUrl: bookingUrlFor(publicToken) });

  const quote = await prisma.quote.create({
    data: {
      leadId,
      businessId,
      publicToken,
      status: "draft",
      serviceType: generated.serviceType,
      totalPrice: generated.total,
      subtotal: generated.subtotal,
      tax: generated.tax,
      priceLow: generated.priceLow,
      priceHigh: generated.priceHigh,
      lineItemsJson: generated.lineItems as unknown as Prisma.InputJsonValue,
      assumptions: generated.assumptions,
      terms: generated.terms,
      customerMessage: generated.customerMessage,
      internalNotes: [generated.internalNotes, `Email subject: ${generated.emailSubject}`, `Email body:\n${generated.emailBody}`].join("\n\n"),
      generatedBy: generated.generatedBy,
      createdByUserId: userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  if (generated.serviceId && !lead.serviceId) {
    await prisma.lead.update({ where: { id: leadId }, data: { serviceId: generated.serviceId } });
  }
  await recordQuoteUsage(businessId);
  await advanceLeadStatus(leadId, "quote_created");
  await logActivity({ businessId, userId, entityType: "quote", entityId: quote.id, action: "generated", metadata: { leadId, total: quote.totalPrice, generatedBy: quote.generatedBy, confidence: generated.confidence } });
  return { quote, emailSubject: generated.emailSubject, emailBody: generated.emailBody, confidence: generated.confidence };
}

export async function getQuote(businessId: string, quoteId: string) {
  return prisma.quote.findFirst({ where: { id: quoteId, businessId }, include: { lead: true, messages: { orderBy: { createdAt: "desc" } } } });
}

export async function listQuotes(businessId: string, status?: string) {
  return prisma.quote.findMany({
    where: { businessId, ...(status && status !== "all" ? { status: status as Prisma.QuoteWhereInput["status"] } : {}) },
    include: { lead: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateQuote(businessId: string, userId: string, quoteId: string, input: z.infer<typeof quoteUpdateSchema>) {
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, businessId } });
  if (!quote) throw new HttpError("Quote not found", 404);
  if (quote.status === "sent") throw new HttpError("A sent quote cannot be edited. Generate a new one instead.", 409);

  const lineItems = input.lineItems ?? (quote.lineItemsJson as unknown as Array<{ total: number }>);
  const subtotal = Math.round(lineItems.reduce((s, li) => s + Number(li.total ?? 0), 0) * 100) / 100;
  const tax = input.tax ?? quote.tax;
  const data: Prisma.QuoteUpdateInput = {
    ...(input.serviceType !== undefined ? { serviceType: input.serviceType } : {}),
    ...(input.lineItems !== undefined ? { lineItemsJson: input.lineItems as unknown as Prisma.InputJsonValue } : {}),
    ...(input.assumptions !== undefined ? { assumptions: input.assumptions } : {}),
    ...(input.terms !== undefined ? { terms: input.terms } : {}),
    ...(input.customerMessage !== undefined ? { customerMessage: input.customerMessage } : {}),
    ...(input.internalNotes !== undefined ? { internalNotes: input.internalNotes } : {}),
    ...(input.priceLow !== undefined ? { priceLow: input.priceLow } : {}),
    ...(input.priceHigh !== undefined ? { priceHigh: input.priceHigh } : {}),
    subtotal,
    tax,
    totalPrice: Math.round((subtotal + tax) * 100) / 100,
    // Editing an approved quote sends it back to draft so it gets re-approved.
    status: quote.status === "approved" ? "draft" : quote.status,
    approvedAt: quote.status === "approved" ? null : quote.approvedAt,
  };
  const updated = await prisma.quote.update({ where: { id: quoteId }, data });
  await logActivity({ businessId, userId, entityType: "quote", entityId: quoteId, action: "edited", metadata: { total: updated.totalPrice } });
  return updated;
}

export async function approveQuote(businessId: string, userId: string, quoteId: string) {
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, businessId } });
  if (!quote) throw new HttpError("Quote not found", 404);
  if (quote.status !== "draft") throw new HttpError(`Quote is already ${quote.status}`, 409);
  const updated = await prisma.quote.update({ where: { id: quoteId }, data: { status: "approved", approvedAt: new Date() } });
  await logActivity({ businessId, userId, entityType: "quote", entityId: quoteId, action: "approved" });
  return updated;
}

export async function rejectQuote(businessId: string, userId: string, quoteId: string) {
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, businessId } });
  if (!quote) throw new HttpError("Quote not found", 404);
  if (quote.status === "sent") throw new HttpError("A sent quote cannot be rejected", 409);
  const updated = await prisma.quote.update({ where: { id: quoteId }, data: { status: "rejected" } });
  await logActivity({ businessId, userId, entityType: "quote", entityId: quoteId, action: "rejected" });
  return updated;
}

export async function markQuoteSent(quoteId: string) {
  const quote = await prisma.quote.update({ where: { id: quoteId }, data: { status: "sent", sentAt: new Date() } });
  await advanceLeadStatus(quote.leadId, "quote_sent");
  return quote;
}

/** Parse the email subject/body we stashed in internalNotes at generation time. */
export function extractEmailFromNotes(internalNotes: string | null) {
  if (!internalNotes) return { subject: null as string | null, body: null as string | null, notes: "" };
  const subjectMatch = internalNotes.match(/Email subject: (.*)/);
  const bodyMatch = internalNotes.match(/Email body:\n([\s\S]*)$/);
  const notes = internalNotes.split("\n\nEmail subject:")[0];
  return { subject: subjectMatch?.[1]?.trim() ?? null, body: bodyMatch?.[1]?.trim() ?? null, notes };
}
