"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { useToast } from "@/components/common/Toast";
import { api } from "@/lib/client/api";

type Business = { name: string; phone: string | null; email: string | null; address: string | null; city: string | null; state: string | null; country: string; timezone: string; serviceArea: string | null; website: string | null };

export function BusinessProfileForm({ business, mode, onSaved }: { business?: Partial<Business>; mode: "create" | "edit"; onSaved?: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const v = (k: keyof Business) => (business?.[k] as string | null | undefined) ?? "";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      await api("/api/business", { method: mode === "create" ? "POST" : "PUT", body });
      toast(mode === "create" ? "Business created" : "Profile saved");
      if (onSaved) onSaved();
      else router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Business name" htmlFor="b-name" required><input id="b-name" name="name" className="input" required defaultValue={v("name")} placeholder="Hill Country Fence Co." /></FormField>
        <FormField label="Phone" htmlFor="b-phone" help="Shown to customers in messages"><input id="b-phone" name="phone" className="input" defaultValue={v("phone")} /></FormField>
        <FormField label="Business email" htmlFor="b-email"><input id="b-email" name="email" type="email" className="input" defaultValue={v("email")} /></FormField>
        <FormField label="Website" htmlFor="b-web"><input id="b-web" name="website" className="input" defaultValue={v("website")} placeholder="https://" /></FormField>
        <FormField label="Street address" htmlFor="b-addr"><input id="b-addr" name="address" className="input" defaultValue={v("address")} /></FormField>
        <FormField label="City" htmlFor="b-city"><input id="b-city" name="city" className="input" defaultValue={v("city")} /></FormField>
        <FormField label="State" htmlFor="b-state"><input id="b-state" name="state" className="input" defaultValue={v("state")} /></FormField>
        <FormField label="Timezone" htmlFor="b-tz">
          <select id="b-tz" name="timezone" className="input" defaultValue={v("timezone") || "America/New_York"}>
            {["America/New_York", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu", "America/Toronto", "Europe/London", "Australia/Sydney"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Service area" htmlFor="b-area" help="Cities or radius you cover. Used in quotes."><input id="b-area" name="serviceArea" className="input" defaultValue={v("serviceArea")} placeholder="Austin metro, within 40 miles" /></FormField>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end"><Button type="submit" loading={loading}>{mode === "create" ? "Continue" : "Save profile"}</Button></div>
    </form>
  );
}
