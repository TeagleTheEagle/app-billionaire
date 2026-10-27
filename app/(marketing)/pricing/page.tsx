import type { Metadata } from "next";
import { Button } from "@/components/common/Button";
import { PLANS, type PlanKey } from "@/lib/stripe/plans";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Simple pricing that pays for itself with one job.</h1>
        <p className="mt-3 text-slate-600">Start with 10 free AI quotes. No card required. Cancel anytime.</p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {(Object.keys(PLANS) as PlanKey[]).map((key) => {
          const p = PLANS[key];
          return (
            <div key={key} className={`card flex flex-col p-6 ${key === "pro" ? "border-brand-400 ring-1 ring-brand-200" : ""}`}>
              <h2 className="font-semibold">{p.name}</h2>
              <p className="mt-2 text-4xl font-bold">${p.price}<span className="text-base font-normal text-slate-500">/mo</span></p>
              <p className="mt-1 text-sm text-slate-500">{p.blurb}</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-700">{p.features.map((f) => <li key={f}>✓ {f}</li>)}</ul>
              <Button href="/signup" className="mt-6" variant={key === "pro" ? "primary" : "secondary"}>Start free</Button>
            </div>
          );
        })}
      </div>
      <p className="mt-8 text-center text-sm text-slate-500">SMS delivery uses your own Twilio account at carrier rates. Email is included.</p>
    </div>
  );
}
