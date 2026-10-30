import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { formatMoney } from "@/lib/utils/format";
import { bookingUrlFor } from "@/services/quote-service";
import { sendMessage } from "@/services/message-service";

const FOLLOW_UP_AFTER_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * Daily job (see vercel.json). For businesses with auto follow-ups on, nudge customers who
 * received a quote 2+ days ago and haven't booked. One nudge per quote.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!env.cronSecret || auth !== `Bearer ${env.cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const cutoff = new Date(Date.now() - FOLLOW_UP_AFTER_MS);
  const quotes = await prisma.quote.findMany({
    where: {
      status: "sent",
      sentAt: { lte: cutoff },
      lead: { status: "quote_sent" },
      business: { settings: { autoSendFollowUps: true } },
      messages: { none: { messageType: "follow_up" } },
    },
    include: { lead: true, business: true },
    take: 200,
  });

  let sent = 0;
  const errors: string[] = [];
  for (const q of quotes) {
    const channel = q.lead.customerPhone ? "sms" : q.lead.customerEmail ? "email" : null;
    if (!channel) continue;
    const first = q.lead.customerName.split(" ")[0];
    const total = q.priceLow != null && q.priceHigh != null && q.totalPrice === 0 ? `${formatMoney(q.priceLow)}–${formatMoney(q.priceHigh)}` : formatMoney(q.totalPrice);
    const link = bookingUrlFor(q.publicToken);
    const content =
      channel === "sms"
        ? `Hi ${first}, ${q.business.name} here. Just checking in on the ${q.serviceType} estimate (${total}). Happy to answer questions or get you on the schedule: ${link}`
        : `Hi ${first},\n\nJust checking in on the estimate we sent for ${q.serviceType} (${total}). If you have questions or want to pick a time, you can do that here: ${link}\n\nThanks,\n${q.business.name}`;
    try {
      await sendMessage(q.businessId, null, { leadId: q.leadId, quoteId: q.id, channel, messageType: "follow_up", subject: `Following up on your ${q.serviceType} estimate`, content });
      sent += 1;
    } catch (err) {
      errors.push(`${q.id}: ${err instanceof Error ? err.message : "failed"}`);
    }
  }
  return Response.json({ checked: quotes.length, sent, errors });
}
