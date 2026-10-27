import { z } from "zod";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { notifyOwnerBooking } from "@/lib/notifications";
import { HttpError } from "@/lib/utils/api";
import { formatDateTime } from "@/lib/utils/format";
import { advanceLeadStatus } from "@/services/lead-service";
import { sendMessage } from "@/services/message-service";

export const appointmentSchema = z.object({
  leadId: z.string().min(1),
  scheduledAt: z.coerce.date(),
  durationMinutes: z.number().int().min(15).max(600).optional(),
  appointmentType: z.enum(["consultation", "quote_review", "site_walk", "installation", "callback"]).default("consultation"),
  notes: z.string().trim().max(1000).optional().nullable(),
  contactMethod: z.string().trim().max(40).optional().nullable(),
  sendConfirmation: z.boolean().optional(),
});

export const appointmentUpdateSchema = z.object({
  scheduledAt: z.coerce.date().optional(),
  durationMinutes: z.number().int().min(15).max(600).optional(),
  appointmentType: z.enum(["consultation", "quote_review", "site_walk", "installation", "callback"]).optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
  status: z.enum(["pending", "confirmed", "completed", "canceled"]).optional(),
});

export async function listAppointments(businessId: string, opts: { from?: Date; to?: Date; status?: string } = {}) {
  return prisma.appointment.findMany({
    where: {
      businessId,
      ...(opts.status && opts.status !== "all" ? { status: opts.status as "pending" } : {}),
      ...(opts.from || opts.to ? { scheduledAt: { gte: opts.from, lte: opts.to } } : {}),
    },
    include: { lead: true },
    orderBy: { scheduledAt: "asc" },
  });
}

export async function createAppointment(businessId: string, userId: string | null, input: z.infer<typeof appointmentSchema>, opts: { bookedByCustomer?: boolean } = {}) {
  const lead = await prisma.lead.findFirst({ where: { id: input.leadId, businessId }, include: { business: true } });
  if (!lead) throw new HttpError("Lead not found", 404);
  if (input.scheduledAt.getTime() < Date.now() - 60_000) throw new HttpError("Pick a time in the future", 422);

  const appointment = await prisma.appointment.create({
    data: {
      leadId: lead.id,
      businessId,
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes ?? 60,
      appointmentType: input.appointmentType,
      notes: input.notes ?? null,
      contactMethod: input.contactMethod ?? null,
      status: opts.bookedByCustomer ? "pending" : "confirmed",
    },
  });
  await advanceLeadStatus(lead.id, "booked");
  await logActivity({ businessId, userId, entityType: "appointment", entityId: appointment.id, action: opts.bookedByCustomer ? "booked_by_customer" : "created", metadata: { leadId: lead.id, scheduledAt: input.scheduledAt.toISOString() } });
  if (opts.bookedByCustomer) {
    notifyOwnerBooking(appointment, lead).catch((err) => console.error("[notify] booking", err));
  }

  if (input.sendConfirmation !== false) {
    const when = formatDateTime(input.scheduledAt);
    const channel = lead.customerPhone ? "sms" : lead.customerEmail ? "email" : null;
    if (channel) {
      try {
        await sendMessage(businessId, userId, {
          leadId: lead.id,
          channel,
          messageType: "booking_confirmation",
          subject: `Confirmed: ${lead.business.name} on ${when}`,
          content: `Hi ${lead.customerName.split(" ")[0]}, you're booked with ${lead.business.name} for a ${appointment.appointmentType.replace("_", " ")} on ${when}.${lead.business.phone ? ` Questions? Call ${lead.business.phone}.` : ""}`,
        });
      } catch (err) {
        console.error("[booking] confirmation failed", err);
      }
    }
  }
  return appointment;
}

export async function updateAppointment(businessId: string, userId: string, appointmentId: string, input: z.infer<typeof appointmentUpdateSchema>) {
  const existing = await prisma.appointment.findFirst({ where: { id: appointmentId, businessId } });
  if (!existing) throw new HttpError("Appointment not found", 404);
  const updated = await prisma.appointment.update({ where: { id: appointmentId }, data: input });
  if (input.status === "completed") await advanceLeadStatus(existing.leadId, "won");
  await logActivity({ businessId, userId, entityType: "appointment", entityId: appointmentId, action: input.status ? `status:${input.status}` : "updated" });
  return updated;
}
