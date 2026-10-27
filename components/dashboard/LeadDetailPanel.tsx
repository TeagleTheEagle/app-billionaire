"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useToast } from "@/components/common/Toast";
import { BookingModal } from "@/components/dashboard/BookingModal";
import { MessageComposer } from "@/components/dashboard/MessageComposer";
import { QuotePreview } from "@/components/dashboard/QuotePreview";
import { Timeline } from "@/components/dashboard/Timeline";
import { api } from "@/lib/client/api";
import { formatMoney, timeAgo } from "@/lib/utils/format";
import type { LeadDetailDTO } from "@/types/lead";

const statuses = ["new", "contacted", "quote_created", "quote_sent", "booked", "won", "lost", "archived"];

export function LeadDetailPanel({ lead, appUrl, aiEnabled, quota }: { lead: LeadDetailDTO; appUrl: string; aiEnabled: boolean; quota: { used: number; limit: number | null; plan: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [composer, setComposer] = useState<{ open: boolean; quoteId: string | null }>({ open: false, quoteId: null });
  const [booking, setBooking] = useState(false);
  const refresh = () => router.refresh();
  const latest = lead.quotes[0] ?? null;
  const quotaLeft = quota.limit === null ? null : Math.max(0, quota.limit - quota.used);

  async function generate() {
    setGenerating(true);
    try {
      const res = await api<{ confidence: string; quote: { totalPrice: number } }>(`/api/leads/${lead.id}/quote`, { method: "POST", body: {} });
      toast(`Quote drafted at ${formatMoney(res.quote.totalPrice)} (${res.confidence} confidence). Review and approve.`);
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not generate quote", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function setStatus(status: string) {
    try {
      await api(`/api/leads/${lead.id}`, { method: "PUT", body: { status } });
      toast("Status updated", "info");
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Update failed", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{lead.customerName}</h1>
            <StatusBadge status={lead.status} />
            <span className="text-xs text-slate-400">added {timeAgo(lead.createdAt)} · {lead.source.replace("_", " ")}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {lead.customerPhone && <a className="hover:underline" href={`tel:${lead.customerPhone}`}>{lead.customerPhone}</a>}
            {lead.customerPhone && lead.customerEmail && " · "}
            {lead.customerEmail && <a className="hover:underline" href={`mailto:${lead.customerEmail}`}>{lead.customerEmail}</a>}
            {lead.location && <span className="text-slate-400"> · {lead.location}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto" value={lead.status} onChange={(e) => setStatus(e.target.value)} aria-label="Lead status">
            {statuses.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          <Button variant="secondary" href={`/dashboard/leads/${lead.id}/edit`}>Edit</Button>
          <Button variant="secondary" onClick={() => setComposer({ open: true, quoteId: null })}>Message</Button>
          <Button variant="secondary" onClick={() => setBooking(true)}>Book</Button>
          <Button loading={generating} onClick={generate} disabled={quotaLeft === 0}>{latest ? "Regenerate quote" : "Generate quote"}</Button>
        </div>
      </div>

      {quotaLeft !== null && quotaLeft <= 3 && (
        <Alert tone={quotaLeft === 0 ? "error" : "warn"}>
          {quotaLeft === 0 ? "You've used all your included quotes." : `${quotaLeft} quote${quotaLeft === 1 ? "" : "s"} left on your ${quota.plan} plan.`} <Link href="/settings/billing" className="font-medium underline">Upgrade</Link>
        </Alert>
      )}
      {!aiEnabled && !latest && <Alert tone="info">AI is not configured on this server, so quotes are computed directly from your pricing rules. Add an Anthropic API key to get AI-written estimates and messages.</Alert>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {latest ? (
            <QuotePreview key={latest.id + latest.status} quote={latest} onChanged={refresh} onSend={() => setComposer({ open: true, quoteId: latest.id })} bookingUrl={`${appUrl}/q/${latest.publicToken}`} />
          ) : (
            <div className="card flex flex-col items-center px-6 py-12 text-center">
              <p className="text-3xl">🧾</p>
              <h3 className="mt-2 font-semibold">No quote yet</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">Generate a draft from the customer’s message and your pricing rules. You review it before anything goes out.</p>
              <Button className="mt-4" loading={generating} onClick={generate} disabled={quotaLeft === 0}>Generate quote</Button>
            </div>
          )}
          {lead.quotes.length > 1 && (
            <details className="card px-5 py-3 text-sm">
              <summary className="cursor-pointer font-medium">Previous quotes ({lead.quotes.length - 1})</summary>
              <ul className="mt-2 divide-y divide-slate-100">
                {lead.quotes.slice(1).map((q) => (
                  <li key={q.id} className="flex items-center justify-between py-2"><span>{q.serviceType} · {formatMoney(q.totalPrice)}</span><StatusBadge status={q.status} /></li>
                ))}
              </ul>
            </details>
          )}
          <div className="card px-5 py-4">
            <h3 className="mb-3 font-semibold">Activity</h3>
            <Timeline quotes={lead.quotes} messages={lead.messages} appointments={lead.appointments} createdAt={lead.createdAt} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card px-5 py-4">
            <h3 className="mb-2 font-semibold">Customer message</h3>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{lead.inquiryText}</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <dt className="text-slate-500">Service</dt><dd>{lead.service?.name ?? lead.serviceRequested ?? "—"}</dd>
              <dt className="text-slate-500">Urgency</dt><dd className="capitalize">{lead.urgency}</dd>
              <dt className="text-slate-500">Budget</dt><dd>{lead.budgetEstimate ? formatMoney(lead.budgetEstimate) : "—"}</dd>
            </dl>
            {lead.customerNotes && (
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                <p className="text-xs font-semibold uppercase tracking-wide">Internal notes</p>
                <p className="mt-1 whitespace-pre-wrap">{lead.customerNotes}</p>
              </div>
            )}
            {lead.attachments.length > 0 && (
              <ul className="mt-4 space-y-1 text-sm">
                {lead.attachments.map((a) => <li key={a.id}><a href={a.url} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">📎 {a.fileName}</a></li>)}
              </ul>
            )}
          </div>
          {lead.appointments.length > 0 && (
            <div className="card px-5 py-4">
              <h3 className="mb-2 font-semibold">Appointments</h3>
              <ul className="space-y-2 text-sm">
                {lead.appointments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between"><span>{a.appointmentType.replace("_", " ")} · {new Date(a.scheduledAt).toLocaleString()}</span><StatusBadge status={a.status} /></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {composer.open && <MessageComposer onClose={() => setComposer({ open: false, quoteId: null })} leadId={lead.id} quoteId={composer.quoteId} hasPhone={Boolean(lead.customerPhone)} hasEmail={Boolean(lead.customerEmail)} onSent={refresh} />}
      <BookingModal open={booking} onClose={() => setBooking(false)} leadId={lead.id} onBooked={refresh} />
    </div>
  );
}
