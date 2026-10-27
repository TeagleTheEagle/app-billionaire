"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { useToast } from "@/components/common/Toast";
import { api } from "@/lib/client/api";

export type PricingRuleDTO = { id: string; ruleType: string; label: string; value: number; unit: string | null; note: string | null; active: boolean };
export type ServiceDTO = {
  id: string; name: string; category: string; description: string | null; pricingType: string; basePrice: number | null; minPrice: number | null; maxPrice: number | null;
  unitLabel: string | null; laborHoursEstimate: number | null; minimumCharge: number | null; active: boolean; pricingRules: PricingRuleDTO[];
};

const num = (v: FormDataEntryValue | null) => (v === null || v === "" ? null : Number(v));

export function ServiceForm({ service, onDone, onCancel }: { service?: ServiceDTO; onDone: () => void; onCancel?: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pricingType, setPricingType] = useState(service?.pricingType ?? "flat");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"), category: fd.get("category"), description: fd.get("description") || null, pricingType,
      basePrice: num(fd.get("basePrice")), minPrice: num(fd.get("minPrice")), maxPrice: num(fd.get("maxPrice")), unitLabel: fd.get("unitLabel") || null,
      laborHoursEstimate: num(fd.get("laborHoursEstimate")), minimumCharge: num(fd.get("minimumCharge")),
    };
    try {
      if (service) await api(`/api/business/services/${service.id}`, { method: "PUT", body });
      else await api("/api/business/services", { body });
      toast(service ? "Service updated" : "Service added");
      (e.target as HTMLFormElement).reset();
      onDone();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "error");
    } finally {
      setLoading(false);
    }
  }

  const showBase = pricingType === "flat" || pricingType === "hourly" || pricingType === "per_unit";
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Service name" htmlFor="svc-name" required><input id="svc-name" name="name" className="input" required defaultValue={service?.name} placeholder="Fence installation" /></FormField>
        <FormField label="Category" htmlFor="svc-cat" required><input id="svc-cat" name="category" className="input" required defaultValue={service?.category} placeholder="Landscaping" list="category-options" /></FormField>
      </div>
      <datalist id="category-options">
        {["Landscaping", "Plumbing", "Electrical", "Handyman", "Cleaning", "Painting", "Garage door", "Pool service", "Pest control", "HVAC", "Junk removal", "Remodeling"].map((c) => <option key={c} value={c} />)}
      </datalist>
      <FormField label="Description" htmlFor="svc-desc" help="What's included. The AI reads this when matching customer requests."><textarea id="svc-desc" name="description" className="input min-h-16" defaultValue={service?.description ?? ""} /></FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Pricing type" htmlFor="svc-type">
          <select id="svc-type" className="input" value={pricingType} onChange={(e) => setPricingType(e.target.value)}>
            <option value="flat">Flat price</option>
            <option value="hourly">Hourly</option>
            <option value="per_unit">Per unit (sq ft, ft, room…)</option>
            <option value="range">Price range</option>
            <option value="quote_on_site">Quote on site</option>
          </select>
        </FormField>
        {showBase && <FormField label={pricingType === "hourly" ? "Rate per hour ($)" : pricingType === "per_unit" ? "Price per unit ($)" : "Base price ($)"} htmlFor="svc-base"><input id="svc-base" name="basePrice" type="number" min="0" step="0.01" className="input" defaultValue={service?.basePrice ?? ""} /></FormField>}
        {pricingType === "per_unit" && <FormField label="Unit label" htmlFor="svc-unit" help="ft, sq ft, room, window…"><input id="svc-unit" name="unitLabel" className="input" defaultValue={service?.unitLabel ?? ""} placeholder="sq ft" /></FormField>}
        {(pricingType === "range" || pricingType === "quote_on_site") && (
          <>
            <FormField label="Typical low ($)" htmlFor="svc-min"><input id="svc-min" name="minPrice" type="number" min="0" className="input" defaultValue={service?.minPrice ?? ""} /></FormField>
            <FormField label="Typical high ($)" htmlFor="svc-max"><input id="svc-max" name="maxPrice" type="number" min="0" className="input" defaultValue={service?.maxPrice ?? ""} /></FormField>
          </>
        )}
        <FormField label="Minimum charge ($)" htmlFor="svc-minc"><input id="svc-minc" name="minimumCharge" type="number" min="0" className="input" defaultValue={service?.minimumCharge ?? ""} /></FormField>
        <FormField label="Typical labor hours" htmlFor="svc-hours"><input id="svc-hours" name="laborHoursEstimate" type="number" min="0" step="0.5" className="input" defaultValue={service?.laborHoursEstimate ?? ""} /></FormField>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" loading={loading}>{service ? "Save service" : "Add service"}</Button>
      </div>
    </form>
  );
}
