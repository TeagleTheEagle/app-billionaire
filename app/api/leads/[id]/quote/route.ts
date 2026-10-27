import { requireApiBusiness } from "@/lib/auth/current";
import { handler, json } from "@/lib/utils/api";
import { generateQuoteForLead } from "@/services/quote-service";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handler<Ctx>(async (_req, ctx) => {
  const { user, business } = await requireApiBusiness();
  const { id } = await ctx.params;
  const result = await generateQuoteForLead(business.id, user.id, id);
  return json(result, { status: 201 });
});
