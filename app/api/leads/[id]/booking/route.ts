import { requireApiBusiness } from "@/lib/auth/current";
import { handler, json, parseBody } from "@/lib/utils/api";
import { appointmentSchema, createAppointment } from "@/services/booking-service";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handler<Ctx>(async (req, ctx) => {
  const { user, business } = await requireApiBusiness();
  const { id } = await ctx.params;
  const input = await parseBody(req, appointmentSchema.omit({ leadId: true }));
  const appointment = await createAppointment(business.id, user.id, { ...input, leadId: id });
  return json({ appointment }, { status: 201 });
});
