import { requireApiBusiness } from "@/lib/auth/current";
import { handler, HttpError, json, parseBody } from "@/lib/utils/api";
import { deleteService, serviceSchema, updateService } from "@/services/business-service";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handler<Ctx>(async (req, ctx) => {
  const { business } = await requireApiBusiness();
  const { id } = await ctx.params;
  const input = await parseBody(req, serviceSchema.partial());
  const service = await updateService(business.id, id, input);
  if (!service) throw new HttpError("Service not found", 404);
  return json({ service });
});

export const DELETE = handler<Ctx>(async (_req, ctx) => {
  const { business } = await requireApiBusiness();
  const { id } = await ctx.params;
  if (!(await deleteService(business.id, id))) throw new HttpError("Service not found", 404);
  return json({ ok: true });
});
