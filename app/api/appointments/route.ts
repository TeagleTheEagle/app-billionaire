import { requireApiBusiness } from "@/lib/auth/current";
import { handler, json, parseBody } from "@/lib/utils/api";
import { appointmentSchema, createAppointment, listAppointments } from "@/services/booking-service";

export const GET = handler(async (req) => {
  const { business } = await requireApiBusiness();
  const p = new URL(req.url).searchParams;
  const appointments = await listAppointments(business.id, {
    status: p.get("status") ?? undefined,
    from: p.get("from") ? new Date(p.get("from")!) : undefined,
    to: p.get("to") ? new Date(p.get("to")!) : undefined,
  });
  return json({ appointments });
});

export const POST = handler(async (req) => {
  const { user, business } = await requireApiBusiness();
  const input = await parseBody(req, appointmentSchema);
  return json({ appointment: await createAppointment(business.id, user.id, input) }, { status: 201 });
});
