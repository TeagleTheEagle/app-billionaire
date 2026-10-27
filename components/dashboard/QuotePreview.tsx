"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useToast } from "@/components/common/Toast";
import { api } from "@/lib/client/api";
import { formatMoney, formatDateTime } from "@/lib/utils/format";
import type { LineItem, QuoteDTO } from "@/types/lead";

export function QuotePreview({ quote, onChanged, onSend, bookingUrl }: { quote: QuoteDTO; onChanged: () => void; onSend: () => void; bookingUrl: string }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [items, setItems] = useState<LineItem[]>(quote.lineItemsJson);
  const [assumptions, setAssumptions] = useState(quote.assumptions.join("\n"));
  const [terms, setTerms] = useState(quote.terms);
  const [customerMessage, setCustomerMessage] = useState(quote.customerMessage);
  const [tax, setTax] = useState(quote.tax);

  const subtotal = Math.round(items.reduce((s, li) => s + Number(li.total || 0), 0) * 100) / 100;
  const isRange = quote.priceLow != null && quote.priceHigh != null && quote.totalPrice === 0;

  async function run(label: string, fn: () => Promise<unknown>, success: string) {
    setBusy(label);
    try {
      await fn();
      toast(success);
      onChanged();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong", "error");
    } finally {
      setBusy(null);
    }
  }

  function updateItem(i: number, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((li, idx) => {
        if (idx !== i) return li;
        const next = { ...li, ...patch };
        if (patch.quantity !== undefined || patch.unitPrice !== undefined) next.total = Math.round(Number(next.quantity) * Number(next.unitPrice) * 100) / 100;
        return next;
      }),
    );
  }

  const save = () =>
    run(
      "save",
      () =>
        api(`/api/quotes/${quote.id}`, {
          method: "PUT",
          body: { lineItems: items, tax, assumptions: assumptions.split("\n").map((a) => a.trim()).filter(Boolean), terms, customerMessage },
        }).then(() => setEditing(false)),
      "Quote saved",
    );

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Quote · {quote.serviceType}</h3>
          <StatusBadge status={quote.status} />
          <span className="text-xs text-slate-400">{quote.generatedBy === "ai" ? "AI-generated" : "Rules-based"} · {formatDateTime(quote.createdAt)}</span>
        </div>
        <div className="flex gap-2">
          {quote.status === "draft" && !editing && (
            <>
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
              <Button size="sm" variant="ghost" loading={busy === "reject"} onClick={() => run("reject", () => api(`/api/quotes/${quote.id}/reject`, { method: "POST", body: {} }), "Quote rejected")}>Reject</Button>
              <Button size="sm" loading={busy === "approve"} onClick={() => run("approve", () => api(`/api/quotes/${quote.id}/approve`, { method: "POST", body: {} }), "Quote approved. Ready to send.")}>Approve</Button>
            </>
          )}
          {editing && (
            <>
              <Button size="sm" variant="secondary" onClick={() => { setEditing(false); setItems(quote.lineItemsJson); }}>Cancel</Button>
              <Button size="sm" loading={busy === "save"} onClick={save}>Save</Button>
            </>
          )}
          {(quote.status === "approved" || quote.status === "sent") && (
            <>
              <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard?.writeText(bookingUrl); toast("Booking link copied", "info"); }}>Copy link</Button>
              <Button size="sm" variant={quote.status === "sent" ? "secondary" : "accent"} onClick={onSend}>{quote.status === "sent" ? "Resend" : "Send to customer"}</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 px-5 py-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2">Item</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2 text-right">Unit</th>
                <th className="pb-2 text-right">Total</th>
                {editing && <th />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((li, i) => (
                <tr key={i}>
                  <td className="py-2 pr-2">
                    {editing ? (
                      <input className="input" value={li.name} onChange={(e) => updateItem(i, { name: e.target.value })} />
                    ) : (
                      <>
                        <p className="font-medium text-slate-800">{li.name}</p>
                        {li.description && <p className="text-xs text-slate-500">{li.description}</p>}
                      </>
                    )}
                  </td>
                  <td className="py-2 text-right">{editing ? <input type="number" className="input w-20 text-right" value={li.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} /> : li.quantity}</td>
                  <td className="py-2 text-right">{editing ? <input type="number" className="input w-24 text-right" value={li.unitPrice} onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })} /> : formatMoney(li.unitPrice)}</td>
                  <td className="py-2 text-right font-medium">{formatMoney(li.total)}</td>
                  {editing && (
                    <td className="py-2 pl-2 text-right">
                      <button className="text-xs text-red-600" onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))}>Remove</button>
                    </td>
                  )}
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-sm text-slate-500">No line items. {editing ? "Add one below." : "Edit the quote to add pricing."}</td>
                </tr>
              )}
            </tbody>
          </table>
          {editing && (
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => setItems((p) => [...p, { name: "New item", quantity: 1, unitPrice: 0, total: 0 }])}>+ Add line item</Button>
          )}
          <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatMoney(editing ? subtotal : quote.subtotal)}</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Tax</span>{editing ? <input type="number" className="input w-24 text-right" value={tax} onChange={(e) => setTax(Number(e.target.value))} /> : <span>{formatMoney(quote.tax)}</span>}</div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{isRange ? `${formatMoney(quote.priceLow)} – ${formatMoney(quote.priceHigh)}` : formatMoney(editing ? subtotal + tax : quote.totalPrice)}</span>
            </div>
            {!isRange && quote.priceLow != null && quote.priceHigh != null && <p className="text-xs text-slate-500">Likely range {formatMoney(quote.priceLow)} – {formatMoney(quote.priceHigh)}</p>}
          </div>
        </div>

        <div className="space-y-4 text-sm lg:col-span-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Assumptions</p>
            {editing ? (
              <textarea className="input min-h-24" value={assumptions} onChange={(e) => setAssumptions(e.target.value)} placeholder="One per line" />
            ) : quote.assumptions.length ? (
              <ul className="list-disc space-y-0.5 pl-5 text-slate-700">{quote.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
            ) : (
              <p className="text-slate-500">None</p>
            )}
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Terms</p>
            {editing ? <textarea className="input min-h-16" value={terms} onChange={(e) => setTerms(e.target.value)} /> : <p className="text-slate-700">{quote.terms}</p>}
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Customer message</p>
            {editing ? <textarea className="input min-h-24" value={customerMessage} onChange={(e) => setCustomerMessage(e.target.value)} /> : <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-slate-700">{quote.customerMessage}</p>}
          </div>
          {quote.internalNotes && !editing && (
            <details>
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500">Internal notes</summary>
              <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{quote.internalNotes.split("\n\nEmail subject:")[0]}</p>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
