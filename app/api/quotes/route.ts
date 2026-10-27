import { z } from "zod";
import { requireApiBusiness } from "@/lib/auth/current";
import { handler, json, parseBody } from "@/lib/utils/api";
import { generateQuoteForLead, listQuotes } from "@/services/quote-service";

export const GET = handler(async (req) => {
  const { business } = await requireApiBusiness();
  const status = new URL(req.url).searchParams.get("status") ?? undefined;
  return json({ quotes: await listQuotes(business.id, status) });
});

export const POST = handler(async (req) => {
  const { user, business } = await requireApiBusiness();
  const { leadId } = await parseBody(req, z.object({ leadId: z.string().min(1) }));
  return json(await generateQuoteForLead(business.id, user.id, leadId), { status: 201 });
});
