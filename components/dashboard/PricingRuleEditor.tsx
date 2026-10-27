"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import type { PricingRuleDTO } from "@/components/forms/ServiceForm";
import { api } from "@/lib/client/api";

const ruleTypes = [
  ["base_rate", "Base rate ($, flat)"],
  ["hourly_rate", "Hourly rate ($/hr)"],
  ["per_unit", "Per unit ($ per unit)"],
  ["minimum_charge", "Minimum charge ($)"],
  ["add_on", "Add-on ($, when mentioned)"],
  ["fee", "Fixed fee ($, always)"],
  ["markup_percent", "Markup on materials (%)"],
  ["surcharge_percent", "Surcharge (%, after-hours / emergency)"],
] as const;

function describe(r: PricingRuleDTO) {
  const pct = r.ruleType.endsWith("percent");
  const amount = pct ? `${r.value}%` : `$${r.value}`;
  const per = r.ruleType === "hourly_rate" ? "/hr" : r.ruleType === "per_unit" ? `/${r.unit ?? "unit"}` : "";
  return `${amount}${per}`;
}

export function PricingRuleEditor({ serviceId, rules }: { serviceId: string; rules: PricingRuleDTO[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ruleType, setRuleType] = useState<string>("hourly_rate");

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await api("/api/business/pricing/rules", { body: { serviceId, ruleType, label: fd.get("label"), value: Number(fd.get("value")), unit: fd.get("unit") || null, note: fd.get("note") || null } });
      toast("Rule added");
      setAdding(false);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not add rule", "error");
    } finally {
      setLoading(false);
    }
  }
  async function remove(id: string) {
    await api(`/api/business/pricing/rules/${id}`, { method: "DELETE" });
    router.refresh();
  }
  async function toggle(r: PricingRuleDTO) {
    await api(`/api/business/pricing/rules/${r.id}`, { method: "PUT", body: { active: !r.active } });
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pricing rules</p>
        {!adding && <Button size="sm" variant="ghost" onClick={() => setAdding(true)}>+ Add rule</Button>}
      </div>
      {rules.length === 0 && !adding && <p className="mt-1 text-sm text-slate-500">No rules yet. Rules make quotes accurate: rates, minimums, add-ons, fees.</p>}
      <ul className="mt-2 divide-y divide-slate-100">
        {rules.map((r) => (
          <li key={r.id} className={`flex items-center justify-between gap-2 py-1.5 text-sm ${r.active ? "" : "opacity-50"}`}>
            <span>
              <span className="font-medium">{r.label}</span> <span className="text-slate-600">{describe(r)}</span>
              <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-slate-500">{r.ruleType.replace("_", " ")}</span>
              {r.note && <span className="ml-2 text-xs text-slate-400">{r.note}</span>}
            </span>
            <span className="flex shrink-0 gap-1">
              <button className="text-xs text-slate-500 hover:underline" onClick={() => toggle(r)}>{r.active ? "Disable" : "Enable"}</button>
              <button className="text-xs text-red-600 hover:underline" onClick={() => remove(r.id)}>Remove</button>
            </span>
          </li>
        ))}
      </ul>
      {adding && (
        <form onSubmit={add} className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-5">
          <select className="input sm:col-span-2" value={ruleType} onChange={(e) => setRuleType(e.target.value)} aria-label="Rule type">
            {ruleTypes.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input name="label" className="input sm:col-span-2" required placeholder={ruleType === "add_on" ? "Gate installation" : ruleType === "surcharge_percent" ? "After-hours" : "Labor"} aria-label="Label" />
          <input name="value" type="number" min="0" step="0.01" className="input" required placeholder={ruleType.endsWith("percent") ? "%" : "$"} aria-label="Value" />
          {ruleType === "per_unit" && <input name="unit" className="input" placeholder="unit (ft, sq ft, room)" aria-label="Unit" />}
          <input name="note" className="input sm:col-span-3" placeholder="Note (optional)" aria-label="Note" />
          <div className="flex gap-2 sm:col-span-5 sm:justify-end">
            <Button type="button" size="sm" variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
            <Button type="submit" size="sm" loading={loading}>Save rule</Button>
          </div>
        </form>
      )}
    </div>
  );
}
