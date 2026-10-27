"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { ServiceForm, type ServiceDTO } from "@/components/forms/ServiceForm";
import { PricingRuleEditor } from "@/components/dashboard/PricingRuleEditor";
import { api } from "@/lib/client/api";
import { formatMoney, humanize } from "@/lib/utils/format";

export function ServiceCard({ service, showRules = true }: { service: ServiceDTO; showRules?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const priceLabel =
    service.pricingType === "range" ? `${formatMoney(service.minPrice)} – ${formatMoney(service.maxPrice)}` :
    service.pricingType === "quote_on_site" ? "Quote on site" :
    service.basePrice != null ? `${formatMoney(service.basePrice)}${service.pricingType === "hourly" ? "/hr" : service.pricingType === "per_unit" ? `/${service.unitLabel ?? "unit"}` : ""}` : "No base price";

  async function remove() {
    if (!confirm(`Delete "${service.name}" and its pricing rules?`)) return;
    try {
      await api(`/api/business/services/${service.id}`, { method: "DELETE" });
      toast("Service deleted", "info");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  }
  async function toggle() {
    await api(`/api/business/services/${service.id}`, { method: "PUT", body: { active: !service.active } });
    router.refresh();
  }

  if (editing) return <div className="card p-5"><ServiceForm service={service} onDone={() => { setEditing(false); router.refresh(); }} onCancel={() => setEditing(false)} /></div>;

  return (
    <div className={`card p-5 ${service.active ? "" : "opacity-60"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{service.name}</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{service.category}</span>
            {!service.active && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px]">Inactive</span>}
          </div>
          <p className="mt-0.5 text-sm text-slate-600">{humanize(service.pricingType)} · {priceLabel}{service.minimumCharge ? ` · min ${formatMoney(service.minimumCharge)}` : ""}{service.laborHoursEstimate ? ` · ~${service.laborHoursEstimate}h labor` : ""}</p>
          {service.description && <p className="mt-1 text-sm text-slate-500">{service.description}</p>}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button size="sm" variant="ghost" onClick={toggle}>{service.active ? "Deactivate" : "Activate"}</Button>
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={remove} className="text-red-600">Delete</Button>
        </div>
      </div>
      {showRules && <div className="mt-4 border-t border-slate-100 pt-4"><PricingRuleEditor serviceId={service.id} rules={service.pricingRules} /></div>}
    </div>
  );
}
