import { requireApiBusiness } from "@/lib/auth/current";
import { handler, HttpError, json, parseBody } from "@/lib/utils/api";
import { deleteLead, getLead, leadUpdateSchema, updateLead } from "@/services/lead-service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler<Ctx>(async (_req, ctx) => {
  const { business } = await requireApiBusiness();
  const { id } = await ctx.params;
  const lead = await getLead(business.id, id);
  if (!lead) throw new HttpError("Lead not found", 404);
  return json({ lead });
});

export const PUT = handler<Ctx>(async (req, ctx) => {
  const { user, business } = await requireApiBusiness();
  const { id } = await ctx.params;
  const input = await parseBody(req, leadUpdateSchema);
  const lead = await updateLead(business.id, user.id, id, input);
  if (!lead) throw new HttpError("Lead not found", 404);
  return json({ lead });
});

export const DELETE = handler<Ctx>(async (_req, ctx) => {
  const { business } = await requireApiBusiness();
  const { id } = await ctx.params;
  if (!(await deleteLead(business.id, id))) throw new HttpError("Lead not found", 404);
  return json({ ok: true });
});
