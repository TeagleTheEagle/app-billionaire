import type { Appointment, Lead } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/messaging/email";
import { formatDateTime, humanize } from "@/lib/utils/format";

async function ownerContext(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId }, include: { owner: true, settings: true } });
  if (!business) return null;
  return { business, owner: business.owner, settings: business.settings };
}

/** Email the owner when a lead arrives from the intake form or API. */
export async function notifyOwnerNewLead(lead: Lead) {
  const ctx = await ownerContext(lead.businessId);
  if (!ctx || ctx.settings?.notifyNewLeadEmail === false) return;
  const link = `${env.appUrl}/dashboard/leads/${lead.id}`;
  const body = [
    `New lead for ${ctx.business.name}`,
    "",
    `Customer: ${lead.customerName}`,
    lead.customerPhone ? `Phone: ${lead.customerPhone}` : null,
    lead.customerEmail ? `Email: ${lead.customerEmail}` : null,
    lead.serviceRequested ? `Service: ${lead.serviceRequested}` : null,
    lead.location ? `Location: ${lead.location}` : null,
    `Urgency: ${lead.urgency}`,
    "",
    "Message:",
    lead.inquiryText,
    "",
    `Generate a quote: ${link}`,
  ]
    .filter((l) => l !== null)
    .join("\n");
  const result = await sendEmail(ctx.owner.email, `New lead: ${lead.customerName}${lead.serviceRequested ? ` · ${lead.serviceRequested}` : ""}`, body);
  if (result.status === "failed") console.error("[notify] new lead email failed", result.error);
}

/** Email the owner when a customer books from the public quote page. */
export async function notifyOwnerBooking(appointment: Appointment, lead: Lead) {
  const ctx = await ownerContext(lead.businessId);
  if (!ctx || ctx.settings?.notifyBookingEmail === false) return;
  const when = formatDateTime(appointment.scheduledAt);
  const body = [
    `${lead.customerName} booked a ${humanize(appointment.appointmentType).toLowerCase()} for ${when}.`,
    "",
    lead.customerPhone ? `Phone: ${lead.customerPhone}` : null,
    lead.customerEmail ? `Email: ${lead.customerEmail}` : null,
    lead.location ? `Location: ${lead.location}` : null,
    appointment.notes ? `Notes: ${appointment.notes}` : null,
    appointment.contactMethod ? `Prefers: ${appointment.contactMethod}` : null,
    "",
    `Confirm it: ${env.appUrl}/dashboard/appointments`,
  ]
    .filter((l) => l !== null)
    .join("\n");
  const result = await sendEmail(ctx.owner.email, `Booked: ${lead.customerName} on ${when}`, body);
  if (result.status === "failed") console.error("[notify] booking email failed", result.error);
}
