import { requireApiBusiness } from "@/lib/auth/current";
import { handler, json, parseBody } from "@/lib/utils/api";
import { createService, listServices, serviceSchema } from "@/services/business-service";

export const GET = handler(async () => {
  const { business } = await requireApiBusiness();
  return json({ services: await listServices(business.id) });
});

export const POST = handler(async (req) => {
  const { user, business } = await requireApiBusiness();
  const input = await parseBody(req, serviceSchema);
  return json({ service: await createService(business.id, user.id, input) }, { status: 201 });
});
