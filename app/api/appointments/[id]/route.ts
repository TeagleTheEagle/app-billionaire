import { requireApiBusiness } from "@/lib/auth/current";
import { handler, json, parseBody } from "@/lib/utils/api";
import { appointmentUpdateSchema, updateAppointment } from "@/services/booking-service";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handler<Ctx>(async (req, ctx) => {
  const { user, business } = await requireApiBusiness();
  const { id } = await ctx.params;
  const input = await parseBody(req, appointmentUpdateSchema);
  return json({ appointment: await updateAppointment(business.id, user.id, id, input) });
});
