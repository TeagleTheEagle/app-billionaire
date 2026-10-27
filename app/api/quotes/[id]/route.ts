import { requireApiBusiness } from "@/lib/auth/current";
import { handler, HttpError, json, parseBody } from "@/lib/utils/api";
import { getQuote, quoteUpdateSchema, updateQuote } from "@/services/quote-service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler<Ctx>(async (_req, ctx) => {
  const { business } = await requireApiBusiness();
  const { id } = await ctx.params;
  const quote = await getQuote(business.id, id);
  if (!quote) throw new HttpError("Quote not found", 404);
  return json({ quote });
});

export const PUT = handler<Ctx>(async (req, ctx) => {
  const { user, business } = await requireApiBusiness();
  const { id } = await ctx.params;
  const input = await parseBody(req, quoteUpdateSchema);
  return json({ quote: await updateQuote(business.id, user.id, id, input) });
});
