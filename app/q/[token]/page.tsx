import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PublicQuote } from "@/components/public/PublicQuote";
import type { LineItem } from "@/types/lead";

export const metadata: Metadata = { title: "Your estimate" };

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    include: { lead: { include: { appointments: { where: { status: { in: ["pending", "confirmed"] } }, orderBy: { scheduledAt: "asc" }, take: 1 } } }, business: { include: { settings: true } } },
  });
  if (!quote || quote.status === "draft" || quote.status === "rejected") notFound();
  const booked = quote.lead.appointments[0];
  return (
    <PublicQuote
      token={token}
      business={{ name: quote.business.name, phone: quote.business.phone, email: quote.business.email, color: quote.business.settings?.brandPrimaryColor ?? "#0f766e", logoUrl: quote.business.settings?.logoUrl ?? null }}
      quote={{ serviceType: quote.serviceType, lineItems: quote.lineItemsJson as unknown as LineItem[], subtotal: quote.subtotal, tax: quote.tax, total: quote.totalPrice, priceLow: quote.priceLow, priceHigh: quote.priceHigh, assumptions: quote.assumptions, terms: quote.terms, status: quote.status, expiresAt: quote.expiresAt?.toISOString() ?? null }}
      customerName={quote.lead.customerName}
      alreadyBooked={booked ? { scheduledAt: booked.scheduledAt.toISOString(), status: booked.status } : null}
    />
  );
}
