import { requireApiBusiness } from "@/lib/auth/current";
import { prisma } from "@/lib/db";
import { handler, json } from "@/lib/utils/api";
import { approveQuote } from "@/services/quote-service";
import { draftQuoteMessages, sendMessage } from "@/services/message-service";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handler<Ctx>(async (_req, ctx) => {
  const { user, business } = await requireApiBusiness();
  const { id } = await ctx.params;
  const quote = await approveQuote(business.id, user.id, id);

  // Auto-send: text if the lead has a phone, otherwise email. Failures don't undo the approval.
  let autoSent = null;
  if (business.settings?.autoSendQuotes) {
    const lead = await prisma.lead.findUnique({ where: { id: quote.leadId } });
    const channel = lead?.customerPhone ? "sms" : lead?.customerEmail ? "email" : null;
    if (lead && channel) {
      try {
        const drafts = await draftQuoteMessages(business.id, quote.id);
        autoSent = await sendMessage(business.id, user.id, {
          leadId: lead.id,
          quoteId: quote.id,
          channel,
          messageType: "quote",
          subject: drafts.emailSubject,
          content: channel === "sms" ? drafts.sms : drafts.emailBody,
        });
      } catch (err) {
        console.error("[auto-send] failed", err);
      }
    }
  }
  return json({ quote: autoSent ? await prisma.quote.findUnique({ where: { id: quote.id } }) : quote, autoSent });
});
