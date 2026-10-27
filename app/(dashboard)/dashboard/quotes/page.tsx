import type { Metadata } from "next";
import Link from "next/link";
import { requireBusiness } from "@/lib/auth/current";
import { listQuotes } from "@/services/quote-service";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Table, Td, Th } from "@/components/common/Table";
import { formatDate, formatMoney } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Quotes" };
const statuses = ["all", "draft", "approved", "sent", "rejected", "expired"];

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { business } = await requireBusiness();
  const { status = "all" } = await searchParams;
  const quotes = await listQuotes(business.id, status);
  const total = quotes.filter((q) => q.status === "sent").reduce((s, q) => s + q.totalPrice, 0);
  return (
    <div>
      <PageHeader title="Quotes" description={`${quotes.length} quotes · ${formatMoney(total)} sent`} />
      <div className="mb-4 flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Link key={s} href={s === "all" ? "/dashboard/quotes" : `/dashboard/quotes?status=${s}`} className={`rounded-full px-3 py-1 text-sm ${status === s ? "bg-brand-700 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
            {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>
      {quotes.length === 0 ? (
        <EmptyState title="No quotes yet" description="Open a lead and generate a quote to see it here." icon="🧾" />
      ) : (
        <Table>
          <thead><tr><Th>Customer</Th><Th>Service</Th><Th className="text-right">Total</Th><Th>Status</Th><Th>Created</Th><Th>Sent</Th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {quotes.map((q) => (
              <tr key={q.id} className="hover:bg-slate-50">
                <Td><Link href={`/dashboard/leads/${q.leadId}`} className="font-medium text-slate-900 hover:underline">{q.lead.customerName}</Link></Td>
                <Td>{q.serviceType}<span className="block text-xs text-slate-400">{q.generatedBy === "ai" ? "AI" : "Rules"}</span></Td>
                <Td className="text-right font-medium">{q.priceLow != null && q.priceHigh != null && q.totalPrice === 0 ? `${formatMoney(q.priceLow)}–${formatMoney(q.priceHigh)}` : formatMoney(q.totalPrice)}</Td>
                <Td><StatusBadge status={q.status} /></Td>
                <Td>{formatDate(q.createdAt)}</Td>
                <Td>{formatDate(q.sentAt)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
