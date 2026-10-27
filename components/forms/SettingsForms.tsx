"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { useToast } from "@/components/common/Toast";
import { api } from "@/lib/client/api";

type Settings = {
  brandPrimaryColor: string; brandSecondaryColor: string; logoUrl: string | null; tone: string; defaultQuoteTerms: string; defaultFollowUpText: string; defaultFollowUpEmail: string;
  defaultBookingUrl: string | null; autoSendQuotes: boolean; autoSendFollowUps: boolean; notifyNewLeadEmail: boolean; notifyBookingEmail: boolean; taxRatePercent: number;
} | null;

function useSave(path: string, method: "PUT" | "POST", success: string) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  return {
    loading,
    async save(body: Record<string, unknown>) {
      setLoading(true);
      try {
        await api(path, { method, body });
        toast(success);
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Save failed", "error");
      } finally {
        setLoading(false);
      }
    },
  };
}

export function BrandForm({ settings }: { settings: Settings }) {
  const { loading, save } = useSave("/api/settings", "PUT", "Brand saved");
  return (
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); save({ brandPrimaryColor: fd.get("brandPrimaryColor"), brandSecondaryColor: fd.get("brandSecondaryColor"), logoUrl: fd.get("logoUrl") || "", taxRatePercent: Number(fd.get("taxRatePercent") || 0) }); }} className="grid gap-4 sm:grid-cols-2">
      <FormField label="Primary color" htmlFor="brandPrimaryColor"><input id="brandPrimaryColor" name="brandPrimaryColor" type="color" className="input h-10 p-1" defaultValue={settings?.brandPrimaryColor ?? "#2b3a8f"} /></FormField>
      <FormField label="Accent color" htmlFor="brandSecondaryColor"><input id="brandSecondaryColor" name="brandSecondaryColor" type="color" className="input h-10 p-1" defaultValue={settings?.brandSecondaryColor ?? "#f4a61d"} /></FormField>
      <FormField label="Logo URL" htmlFor="logoUrl" help="Link to a hosted PNG or SVG"><input id="logoUrl" name="logoUrl" className="input" defaultValue={settings?.logoUrl ?? ""} placeholder="https://…/logo.png" /></FormField>
      <FormField label="Sales tax rate (%)" htmlFor="taxRatePercent" help="Applied to quote subtotals. Leave 0 if you quote tax-inclusive."><input id="taxRatePercent" name="taxRatePercent" type="number" min="0" max="30" step="0.01" className="input" defaultValue={settings?.taxRatePercent ?? 0} /></FormField>
      <div className="sm:col-span-2 flex justify-end"><Button type="submit" loading={loading}>Save brand</Button></div>
    </form>
  );
}

export function TemplatesForm({ settings }: { settings: Settings }) {
  const { loading, save } = useSave("/api/settings/templates", "POST", "Templates saved");
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(Object.fromEntries(new FormData(e.currentTarget).entries())); }} className="space-y-4">
      <FormField label="Tone" htmlFor="tone" help="How the AI should sound. e.g. friendly and professional, direct and no-nonsense, warm and casual"><input id="tone" name="tone" className="input" defaultValue={settings?.tone ?? ""} /></FormField>
      <FormField label="Default quote terms" htmlFor="defaultQuoteTerms"><textarea id="defaultQuoteTerms" name="defaultQuoteTerms" className="input min-h-20" defaultValue={settings?.defaultQuoteTerms ?? ""} /></FormField>
      <FormField label="SMS template" htmlFor="defaultFollowUpText" help="Used when AI is off or as a fallback. Placeholders: {{customerName}} {{businessName}} {{service}} {{total}} {{assumptions}} {{bookingUrl}} {{phone}}"><textarea id="defaultFollowUpText" name="defaultFollowUpText" className="input min-h-24" defaultValue={settings?.defaultFollowUpText ?? ""} /></FormField>
      <FormField label="Email template" htmlFor="defaultFollowUpEmail" help="Same placeholders as SMS"><textarea id="defaultFollowUpEmail" name="defaultFollowUpEmail" className="input min-h-48" defaultValue={settings?.defaultFollowUpEmail ?? ""} /></FormField>
      <div className="flex justify-end"><Button type="submit" loading={loading}>Save templates</Button></div>
    </form>
  );
}

function Toggle({ name, label, help, checked }: { name: string; label: string; help: string; checked: boolean }) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
      <input type="checkbox" name={name} defaultChecked={checked} className="mt-1" />
      <span><span className="block text-sm font-medium">{label}</span><span className="block text-xs text-slate-500">{help}</span></span>
    </label>
  );
}

export function NotificationsForm({ settings }: { settings: Settings }) {
  const { loading, save } = useSave("/api/settings", "PUT", "Notification settings saved");
  return (
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); save({ notifyNewLeadEmail: fd.get("notifyNewLeadEmail") === "on", notifyBookingEmail: fd.get("notifyBookingEmail") === "on", autoSendQuotes: fd.get("autoSendQuotes") === "on", autoSendFollowUps: fd.get("autoSendFollowUps") === "on" }); }} className="space-y-3">
      <Toggle name="notifyNewLeadEmail" label="Email me when a new lead arrives" help="From the intake form or API." checked={settings?.notifyNewLeadEmail ?? true} />
      <Toggle name="notifyBookingEmail" label="Email me when a customer books" help="Self-bookings from the quote page." checked={settings?.notifyBookingEmail ?? true} />
      <Toggle name="autoSendQuotes" label="Auto-send approved quotes" help="Coming soon: send the moment you approve. Currently you choose the channel each time." checked={settings?.autoSendQuotes ?? false} />
      <Toggle name="autoSendFollowUps" label="Auto follow-up after 2 days" help="Coming soon: nudge customers who haven't booked." checked={settings?.autoSendFollowUps ?? false} />
      <div className="flex justify-end"><Button type="submit" loading={loading}>Save</Button></div>
    </form>
  );
}
