import { z } from "zod";
import { prisma } from "@/lib/db";
import { handler, HttpError, json, parseBody } from "@/lib/utils/api";
import { createAppointment } from "@/services/booking-service";

type Ctx = { params: Promise<{ token: string }> };

const schema = z.object({
  scheduledAt: z.coerce.date(),
  appointmentType: z.enum(["consultation", "quote_review", "site_walk", "installation", "callback"]).default("consultation"),
  notes: z.string().trim().max(1000).optional().nullable(),
  contactMethod: z.enum(["text", "call", "email"]).optional(),
});

/** Customer self-booking from the public quote page. */
export const POST = handler<Ctx>(async (req, ctx) => {
  const { token } = await ctx.params;
  const quote = await prisma.quote.findUnique({ where: { publicToken: token } });
  if (!quote || quote.status === "draft" || quote.status === "rejected") throw new HttpError("Quote not available", 404);
  const input = await parseBody(req, schema);
  const appointment = await createAppointment(quote.businessId, null, { ...input, leadId: quote.leadId }, { bookedByCustomer: true });
  return json({ ok: true, appointment: { id: appointment.id, scheduledAt: appointment.scheduledAt, status: appointment.status } }, { status: 201 });
});
