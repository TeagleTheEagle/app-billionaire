import { z } from "zod";
import { requireApiBusiness } from "@/lib/auth/current";
import { handler, HttpError, json, parseBody } from "@/lib/utils/api";
import { getQuote } from "@/services/quote-service";
import { draftQuoteMessages, sendMessage } from "@/services/message-service";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  channel: z.enum(["sms", "email"]),
  content: z.string().trim().min(1).max(5000).optional(),
  subject: z.string().trim().max(200).optional(),
});

/** GET returns the suggested SMS/email drafts; POST sends the quote through a channel. */
export const GET = handler<Ctx>(async (_req, ctx) => {
  const { business } = await requireApiBusiness();
  const { id } = await ctx.params;
  return json(await draftQuoteMessages(business.id, id));
});

export const POST = handler<Ctx>(async (req, ctx) => {
  const { user, business } = await requireApiBusiness();
  const { id } = await ctx.params;
  const quote = await getQuote(business.id, id);
  if (!quote) throw new HttpError("Quote not found", 404);
  const input = await parseBody(req, schema);
  const drafts = await draftQuoteMessages(business.id, id);
  const message = await sendMessage(business.id, user.id, {
    leadId: quote.leadId,
    quoteId: quote.id,
    channel: input.channel,
    messageType: "quote",
    subject: input.subject ?? drafts.emailSubject,
    content: input.content ?? (input.channel === "sms" ? drafts.sms : drafts.emailBody),
  });
  return json({ message }, { status: 201 });
});
