import { requireApiBusiness } from "@/lib/auth/current";
import { handler, HttpError, json, parseBody } from "@/lib/utils/api";
import { createPricingRule, pricingRuleSchema } from "@/services/business-service";

export const POST = handler(async (req) => {
  const { business } = await requireApiBusiness();
  const input = await parseBody(req, pricingRuleSchema);
  const rule = await createPricingRule(business.id, input);
  if (!rule) throw new HttpError("Service not found", 404);
  return json({ rule }, { status: 201 });
});
