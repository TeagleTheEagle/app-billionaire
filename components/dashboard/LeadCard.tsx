import Link from "next/link";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatMoney, timeAgo, truncate } from "@/lib/utils/format";

export type LeadRow = {
  id: string;
  customerName: string;
  serviceRequested: string | null;
  location: string | null;
  inquiryText: string;
  status: string;
  source: string;
  urgency: string;
  createdAt: string | Date;
  service?: { name: string } | null;
  quotes?: Array<{ totalPrice: number; status: string }>;
  appointments?: Array<{ scheduledAt: string | Date }>;
};

export function LeadCard({ lead }: { lead: LeadRow }) {
  const quote = lead.quotes?.[0];
  return (
    <Link href={`/dashboard/leads/${lead.id}`} className="card block px-5 py-4 transition hover:border-brand-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">{lead.customerName}</p>
            <StatusBadge status={lead.status} />
            {lead.urgency === "emergency" || lead.urgency === "high" ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">{lead.urgency}</span> : null}
          </div>
          <p className="mt-0.5 text-sm text-slate-600">
            {lead.service?.name ?? lead.serviceRequested ?? "Service not specified"}
            {lead.location ? <span className="text-slate-400"> · {lead.location}</span> : null}
          </p>
          <p className="mt-1.5 text-sm text-slate-500">{truncate(lead.inquiryText, 140)}</p>
        </div>
        <div className="shrink-0 text-right text-xs text-slate-500">
          <p>{timeAgo(lead.createdAt)}</p>
          <p className="mt-0.5 capitalize">{lead.source.replace("_", " ")}</p>
          {quote && <p className="mt-2 text-sm font-semibold text-slate-800">{formatMoney(quote.totalPrice)}</p>}
        </div>
      </div>
    </Link>
  );
}
