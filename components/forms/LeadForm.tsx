"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { useToast } from "@/components/common/Toast";
import { api } from "@/lib/client/api";

type ServiceOption = { id: string; name: string };

export function LeadForm({ services, initial, leadId }: { services: ServiceOption[]; initial?: Record<string, unknown>; leadId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const get = (k: string) => (initial?.[k] as string | number | null | undefined) ?? "";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      customerName: fd.get("customerName"),
      customerEmail: fd.get("customerEmail") || null,
      customerPhone: fd.get("customerPhone") || null,
      serviceRequested: fd.get("serviceRequested") || null,
      serviceId: fd.get("serviceId") || null,
      location: fd.get("location") || null,
      inquiryText: fd.get("inquiryText"),
      customerNotes: fd.get("customerNotes") || null,
      source: fd.get("source") || "manual",
      urgency: fd.get("urgency") || "normal",
      budgetEstimate: fd.get("budgetEstimate") ? Number(fd.get("budgetEstimate")) : null,
    };
    try {
      if (leadId) {
        await api(`/api/leads/${leadId}`, { method: "PUT", body });
        toast("Lead updated");
        router.push(`/dashboard/leads/${leadId}`);
      } else {
        const res = await api<{ lead: { id: string } }>("/api/leads", { body });
        toast("Lead added");
        router.push(`/dashboard/leads/${res.lead.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save lead");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Customer name" htmlFor="customerName" required>
          <input id="customerName" name="customerName" className="input" required defaultValue={get("customerName")} placeholder="Jane Smith" />
        </FormField>
        <FormField label="Phone" htmlFor="customerPhone" help="Needed for SMS follow-ups">
          <input id="customerPhone" name="customerPhone" className="input" defaultValue={get("customerPhone")} placeholder="+1 555 010 1234" />
        </FormField>
        <FormField label="Email" htmlFor="customerEmail">
          <input id="customerEmail" name="customerEmail" type="email" className="input" defaultValue={get("customerEmail")} placeholder="jane@example.com" />
        </FormField>
        <FormField label="Job location" htmlFor="location">
          <input id="location" name="location" className="input" defaultValue={get("location")} placeholder="123 Main St, Austin TX" />
        </FormField>
        <FormField label="Service" htmlFor="serviceId" help="Leave blank and the AI will pick the closest match">
          <select id="serviceId" name="serviceId" className="input" defaultValue={get("serviceId")}>
            <option value="">Auto-detect from message</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Service requested (as the customer said it)" htmlFor="serviceRequested">
          <input id="serviceRequested" name="serviceRequested" className="input" defaultValue={get("serviceRequested")} placeholder="Fence replacement" />
        </FormField>
      </div>
      <FormField label="Customer message" htmlFor="inquiryText" required help="Paste the text, email, or voicemail transcript. Include measurements if they gave any.">
        <textarea id="inquiryText" name="inquiryText" className="input min-h-32" required defaultValue={get("inquiryText")} placeholder="Need a fence replaced around the backyard, about 150 ft. Just need a rough estimate. Thanks." />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Urgency" htmlFor="urgency">
          <select id="urgency" name="urgency" className="input" defaultValue={get("urgency") || "normal"}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="emergency">Emergency</option>
          </select>
        </FormField>
        <FormField label="Source" htmlFor="source">
          <select id="source" name="source" className="input" defaultValue={get("source") || "manual"}>
            <option value="manual">Manual</option>
            <option value="phone">Phone call</option>
            <option value="web_form">Web form</option>
            <option value="referral">Referral</option>
            <option value="other">Other</option>
          </select>
        </FormField>
        <FormField label="Budget mentioned ($)" htmlFor="budgetEstimate">
          <input id="budgetEstimate" name="budgetEstimate" type="number" min="0" step="1" className="input" defaultValue={get("budgetEstimate")} />
        </FormField>
      </div>
      <FormField label="Internal notes" htmlFor="customerNotes" help="Only you see this. The AI uses it as context.">
        <textarea id="customerNotes" name="customerNotes" className="input min-h-20" defaultValue={get("customerNotes")} />
      </FormField>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" loading={loading}>{leadId ? "Save changes" : "Add lead"}</Button>
      </div>
    </form>
  );
}
