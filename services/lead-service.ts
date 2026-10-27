import { z } from "zod";
import type { LeadStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { notifyOwnerNewLead } from "@/lib/notifications";

export const leadSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required").max(120),
  customerEmail: z.string().trim().email("Enter a valid email").optional().nullable().or(z.literal("")),
  customerPhone: z.string().trim().max(40).optional().nullable(),
  serviceRequested: z.string().trim().max(120).optional().nullable(),
  serviceId: z.string().optional().nullable().or(z.literal("")),
  location: z.string().trim().max(200).optional().nullable(),
  inquiryText: z.string().trim().min(5, "Describe the job in a sentence or two").max(5000),
  customerNotes: z.string().trim().max(2000).optional().nullable(),
  source: z.enum(["web_form", "manual", "api", "phone", "referral", "other"]).optional(),
  budgetEstimate: z.number().min(0).optional().nullable(),
  urgency: z.enum(["low", "normal", "high", "emergency"]).optional(),
  attachments: z.array(z.object({ fileName: z.string(), url: z.string().url(), mimeType: z.string() })).optional(),
});

export const leadUpdateSchema = leadSchema.partial().extend({
  status: z.enum(["new", "contacted", "quote_created", "quote_sent", "booked", "won", "lost", "archived"]).optional(),
});

export type LeadFilters = { status?: LeadStatus | "all"; source?: string; q?: string; from?: Date; to?: Date };

export async function listLeads(businessId: string, filters: LeadFilters = {}) {
  const where: Prisma.LeadWhereInput = { businessId };
  if (filters.status && filters.status !== "all") where.status = filters.status;
  if (filters.source && filters.source !== "all") where.source = filters.source as Prisma.LeadWhereInput["source"];
  if (filters.q) {
    where.OR = [
      { customerName: { contains: filters.q, mode: "insensitive" } },
      { inquiryText: { contains: filters.q, mode: "insensitive" } },
      { serviceRequested: { contains: filters.q, mode: "insensitive" } },
      { location: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.from || filters.to) where.createdAt = { gte: filters.from, lte: filters.to };
  return prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { service: true, quotes: { orderBy: { createdAt: "desc" }, take: 1 }, appointments: { orderBy: { scheduledAt: "asc" }, take: 1 } },
  });
}

export async function getLead(businessId: string, leadId: string) {
  return prisma.lead.findFirst({
    where: { id: leadId, businessId },
    include: {
      service: true,
      attachments: true,
      quotes: { orderBy: { createdAt: "desc" } },
      messages: { orderBy: { createdAt: "desc" } },
      appointments: { orderBy: { scheduledAt: "desc" } },
    },
  });
}

export async function createLead(businessId: string, userId: string | null, input: z.infer<typeof leadSchema>) {
  const { attachments, ...rest } = input;
  const lead = await prisma.lead.create({
    data: {
      businessId,
      ...rest,
      customerEmail: rest.customerEmail || null,
      serviceId: rest.serviceId || null,
      source: rest.source ?? (userId ? "manual" : "web_form"),
      attachments: attachments?.length ? { create: attachments } : undefined,
    },
  });
  await logActivity({ businessId, userId, entityType: "lead", entityId: lead.id, action: "created", metadata: { source: lead.source, customerName: lead.customerName } });
  if (!userId) {
    // Inbound lead (web form or API): tell the owner.
    notifyOwnerNewLead(lead).catch((err) => console.error("[notify] new lead", err));
  }
  return lead;
}

export async function updateLead(businessId: string, userId: string, leadId: string, input: z.infer<typeof leadUpdateSchema>) {
  const existing = await prisma.lead.findFirst({ where: { id: leadId, businessId } });
  if (!existing) return null;
  const { attachments: _ignored, ...rest } = input;
  void _ignored;
  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: { ...rest, customerEmail: rest.customerEmail === "" ? null : rest.customerEmail, serviceId: rest.serviceId === "" ? null : rest.serviceId },
  });
  if (input.status && input.status !== existing.status) {
    await logActivity({ businessId, userId, entityType: "lead", entityId: leadId, action: `status:${input.status}`, metadata: { from: existing.status } });
  } else {
    await logActivity({ businessId, userId, entityType: "lead", entityId: leadId, action: "updated" });
  }
  return lead;
}

export async function deleteLead(businessId: string, leadId: string) {
  const existing = await prisma.lead.findFirst({ where: { id: leadId, businessId } });
  if (!existing) return false;
  await prisma.lead.delete({ where: { id: leadId } });
  return true;
}

/** Move a lead forward in the pipeline but never backwards automatically. */
export async function advanceLeadStatus(leadId: string, status: LeadStatus) {
  const order: LeadStatus[] = ["new", "contacted", "quote_created", "quote_sent", "booked", "won"];
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;
  if (["lost", "archived"].includes(lead.status)) return;
  if (order.indexOf(status) > order.indexOf(lead.status)) {
    await prisma.lead.update({ where: { id: leadId }, data: { status } });
  }
}
