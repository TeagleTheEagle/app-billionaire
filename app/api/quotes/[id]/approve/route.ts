import { requireApiBusiness } from "@/lib/auth/current";
import { handler, json } from "@/lib/utils/api";
import { approveQuote } from "@/services/quote-service";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handler<Ctx>(async (_req, ctx) => {
  const { user, business } = await requireApiBusiness();
  const { id } = await ctx.params;
  return json({ quote: await approveQuote(business.id, user.id, id) });
});
