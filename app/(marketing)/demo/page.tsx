import type { Metadata } from "next";
import { Button } from "@/components/common/Button";
import { estimateFromRules } from "@/lib/pricing/engine";
import { formatMoney } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Demo" };

const demoServices = [
  {
    id: "fence", businessId: "demo", name: "Fence installation", category: "Landscaping", description: "Wood privacy fence install and replacement", pricingType: "per_unit" as const, basePrice: null, minPrice: null, maxPrice: null,
    unitLabel: "ft", laborHoursEstimate: 12, minimumCharge: 500, active: true, createdAt: new Date(0), updatedAt: new Date(0),
    pricingRules: [
      { id: "r1", serviceId: "fence", ruleType: "per_unit" as const, label: "Materials", value: 14, unit: "ft", note: null, active: true, createdAt: new Date(0) },
      { id: "r2", serviceId: "fence", ruleType: "hourly_rate" as const, label: "Labor", value: 65, unit: null, note: null, active: true, createdAt: new Date(0) },
      { id: "r3", serviceId: "fence", ruleType: "add_on" as const, label: "Gate installation", value: 250, unit: null, note: null, active: true, createdAt: new Date(0) },
      { id: "r4", serviceId: "fence", ruleType: "fee" as const, label: "Permit fee", value: 150, unit: null, note: null, active: true, createdAt: new Date(0) },
    ],
  },
];

export default function DemoPage() {
  const inquiry = "Need a fence replaced around the backyard, about 150 ft, with one gate. We just need a rough estimate. Thanks.";
  const est = estimateFromRules({ lead: { serviceRequested: "Fence replacement", inquiryText: inquiry, serviceId: null, urgency: "normal", budgetEstimate: null }, services: demoServices, taxRatePercent: 0 });
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">See the quote engine work.</h1>
      <p className="mt-3 text-slate-600">This is a live calculation from the same rules engine that runs inside the app, using a sample fence business. With an AI key configured, the model refines this baseline and writes the customer messages.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer message</p>
          <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm">{inquiry}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Pricing rules</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            <li>Materials: $14 per ft</li>
            <li>Labor: $65/hr, ~12 hr typical</li>
            <li>Add-on: gate installation +$250</li>
            <li>Permit fee: +$150</li>
            <li>Minimum charge: $500</li>
          </ul>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Generated estimate · {est.serviceType}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {est.lineItems.map((li, i) => (
              <li key={i} className="flex justify-between"><span>{li.name}{li.description ? <span className="text-slate-400"> · {li.description}</span> : null}</span><span>{formatMoney(li.total)}</span></li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-2 font-semibold"><span>Total</span><span>{formatMoney(est.total)}</span></div>
          <p className="mt-3 text-xs text-slate-500">Confidence: {est.confidence}</p>
          <ul className="mt-2 list-disc pl-5 text-xs text-slate-500">{est.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </div>
      </div>
      <div className="mt-10"><Button href="/signup" size="lg">Try it with your own pricing</Button></div>
    </div>
  );
}
