"use client";

import { useState } from "react";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useToast } from "@/components/common/Toast";
import { api } from "@/lib/client/api";
import { formatDate } from "@/lib/utils/format";
import { PLANS, type PlanKey } from "@/lib/stripe/plans";

type Sub = { planName: string; status: string; currentPeriodEnd: string | null; stripeCustomerId: string | null } | null;

export function SubscriptionCard({ subscription, quota, billingEnabled, checkoutResult }: { subscription: Sub; quota: { used: number; limit: number | null; plan: string }; billingEnabled: boolean; checkoutResult?: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const current = subscription?.planName ?? "trial";
  const paid = current !== "trial" && (subscription?.status === "active" || subscription?.status === "trialing");

  async function checkout(plan: PlanKey) {
    setLoading(plan);
    try {
      const { url } = await api<{ url: string }>("/api/billing/create-checkout-session", { body: { plan } });
      window.location.assign(url);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Checkout failed", "error");
      setLoading(null);
    }
  }
  async function portal() {
    setLoading("portal");
    try {
      const { url } = await api<{ url: string }>("/api/billing/portal", { method: "POST", body: {} });
      window.location.assign(url);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not open billing portal", "error");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {checkoutResult === "success" && <Alert tone="success" title="You're subscribed">Your plan activates as soon as Stripe confirms payment, usually within a few seconds.</Alert>}
      {checkoutResult === "canceled" && <Alert tone="info">Checkout canceled. Your trial continues.</Alert>}
      {!billingEnabled && <Alert tone="warn" title="Billing not configured">Stripe keys are not set on this server, so plans can’t be purchased yet. The trial limit still applies.</Alert>}

      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current plan</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xl font-semibold capitalize">{paid ? PLANS[current as PlanKey]?.name ?? current : "Free trial"}</p>
            <StatusBadge status={subscription?.status ?? "trialing"} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {quota.limit === null ? `${quota.used} quotes used · unlimited` : `${quota.used} of ${quota.limit} quotes used`}
            {subscription?.currentPeriodEnd && paid ? ` · renews ${formatDate(subscription.currentPeriodEnd)}` : ""}
          </p>
          <div className="mt-2 h-2 w-64 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-brand-600" style={{ width: quota.limit ? `${Math.min(100, (quota.used / quota.limit) * 100)}%` : "8%" }} />
          </div>
        </div>
        {paid && subscription?.stripeCustomerId && <Button variant="secondary" loading={loading === "portal"} onClick={portal}>Manage billing</Button>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(PLANS) as PlanKey[]).map((key) => {
          const p = PLANS[key];
          const isCurrent = paid && current === key;
          return (
            <div key={key} className={`card flex flex-col p-5 ${key === "pro" ? "border-brand-400 ring-1 ring-brand-200" : ""}`}>
              <div className="flex items-baseline justify-between">
                <h3 className="font-semibold">{p.name}</h3>
                {key === "pro" && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-800">Most popular</span>}
              </div>
              <p className="mt-2 text-3xl font-semibold">${p.price}<span className="text-sm font-normal text-slate-500">/mo</span></p>
              <p className="mt-1 text-sm text-slate-500">{p.blurb}</p>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-slate-700">{p.features.map((f) => <li key={f}>✓ {f}</li>)}</ul>
              <Button className="mt-5" variant={key === "pro" ? "primary" : "secondary"} disabled={isCurrent || !billingEnabled} loading={loading === key} onClick={() => checkout(key)}>
                {isCurrent ? "Current plan" : paid ? "Switch plan" : "Choose " + p.name}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
