import { requireApiBusiness } from "@/lib/auth/current";
import { handler, HttpError, json, parseBody } from "@/lib/utils/api";
import { deletePricingRule, pricingRuleSchema, updatePricingRule } from "@/services/business-service";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handler<Ctx>(async (req, ctx) => {
  const { business } = await requireApiBusiness();
  const { id } = await ctx.params;
  const input = await parseBody(req, pricingRuleSchema.omit({ serviceId: true }).partial());
  const rule = await updatePricingRule(business.id, id, input);
  if (!rule) throw new HttpError("Rule not found", 404);
  return json({ rule });
});

export const DELETE = handler<Ctx>(async (_req, ctx) => {
  const { business } = await requireApiBusiness();
  const { id } = await ctx.params;
  if (!(await deletePricingRule(business.id, id))) throw new HttpError("Rule not found", 404);
  return json({ ok: true });
});
