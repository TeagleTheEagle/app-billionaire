"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Logo } from "@/components/common/Logo";
import { FormField } from "@/components/common/FormField";
import { api } from "@/lib/client/api";
import { formatMoney } from "@/lib/utils/format";
import type { LineItem } from "@/types/lead";

type Props = {
  token: string;
  business: { name: string; phone: string | null; email: string | null; color: string; logoUrl: string | null };
  quote: { serviceType: string; lineItems: LineItem[]; subtotal: number; tax: number; total: number; priceLow: number | null; priceHigh: number | null; assumptions: string[]; terms: string; status: string; expiresAt: string | null };
  customerName: string;
  alreadyBooked: { scheduledAt: string; status: string } | null;
};

function defaultDate() {
  const d = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T10:00`;
}

export function PublicQuote({ token, business, quote, customerName, alreadyBooked }: Props) {
  const [when, setWhen] = useState(defaultDate);
  const [type, setType] = useState("consultation");
  const [contact, setContact] = useState("text");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(alreadyBooked ? new Date(alreadyBooked.scheduledAt).toLocaleString() : null);
  const [error, setError] = useState<string | null>(null);
  const isRange = quote.priceLow != null && quote.priceHigh != null && quote.total === 0;

  async function book() {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ appointment: { scheduledAt: string } }>(`/api/public/quotes/${token}/book`, { body: { scheduledAt: new Date(when).toISOString(), appointmentType: type, contactMethod: contact, notes } });
      setDone(new Date(res.appointment.scheduledAt).toLocaleString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not book. Please call us.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-center gap-3">
          {business.logoUrl ? <img src={business.logoUrl} alt="" className="h-10 w-10 rounded-lg object-contain" /> : <span className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-white" style={{ background: business.color }}>{business.name[0]}</span>}
          <div>
            <p className="font-semibold">{business.name}</p>
            <p className="text-xs text-slate-500">{[business.phone, business.email].filter(Boolean).join(" · ")}</p>
          </div>
        </header>

        <section className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preliminary estimate for {customerName}</p>
          <h1 className="mt-1 text-2xl font-semibold">{quote.serviceType}</h1>
          <div className="mt-4 text-4xl font-bold" style={{ color: business.color }}>{isRange ? `${formatMoney(quote.priceLow)} – ${formatMoney(quote.priceHigh)}` : formatMoney(quote.total)}</div>
          {quote.lineItems.length > 0 && (
            <table className="mt-5 w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {quote.lineItems.map((li, i) => (
                  <tr key={i}><td className="py-2">{li.name}{li.description && <span className="block text-xs text-slate-400">{li.description}</span>}</td><td className="py-2 text-right">{formatMoney(li.total)}</td></tr>
                ))}
                {quote.tax > 0 && <tr><td className="py-2 text-slate-500">Tax</td><td className="py-2 text-right">{formatMoney(quote.tax)}</td></tr>}
              </tbody>
            </table>
          )}
          {quote.assumptions.length > 0 && (
            <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm">
              <p className="font-medium">This estimate assumes</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-600">{quote.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          )}
          <p className="mt-4 text-xs text-slate-500">{quote.terms}{quote.expiresAt ? ` Valid until ${new Date(quote.expiresAt).toLocaleDateString()}.` : ""}</p>
        </section>

        <section className="card p-6">
          {done ? (
            <div className="text-center">
              <p className="text-3xl">✅</p>
              <h2 className="mt-2 text-lg font-semibold">You’re booked for {done}</h2>
              <p className="mt-1 text-sm text-slate-600">{business.name} will confirm shortly.{business.phone ? ` Need to change it? Call ${business.phone}.` : ""}</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold">Ready to move forward? Pick a time.</h2>
              <p className="mt-1 text-sm text-slate-500">We’ll confirm the details and finalize pricing on site.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField label="What would you like?" htmlFor="pq-type">
                  <select id="pq-type" className="input" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="consultation">Free consultation</option>
                    <option value="site_walk">On-site visit to confirm the quote</option>
                    <option value="callback">A phone call</option>
                    <option value="installation">Schedule the job</option>
                  </select>
                </FormField>
                <FormField label="Preferred date and time" htmlFor="pq-when"><input id="pq-when" type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} /></FormField>
                <FormField label="Best way to reach you" htmlFor="pq-contact">
                  <select id="pq-contact" className="input" value={contact} onChange={(e) => setContact(e.target.value)}>
                    <option value="text">Text</option><option value="call">Call</option><option value="email">Email</option>
                  </select>
                </FormField>
                <FormField label="Anything we should know?" htmlFor="pq-notes"><input id="pq-notes" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate code, parking, pets…" /></FormField>
              </div>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <Button className="mt-5 w-full" size="lg" loading={loading} onClick={book} style={{ background: business.color }}>Book it</Button>
            </>
          )}
        </section>
        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">Powered by <Logo size={16} className="gap-1 text-slate-500" /></p>
      </div>
    </div>
  );
}
