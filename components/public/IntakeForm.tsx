"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { api } from "@/lib/client/api";

export function IntakeForm({ token, businessName, color, services }: { token: string; businessName: string; color: string; services: string[] }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await api(`/api/public/intake/${token}`, { body: { customerName: fd.get("customerName"), customerPhone: fd.get("customerPhone") || null, customerEmail: fd.get("customerEmail") || null, serviceRequested: fd.get("serviceRequested") || null, location: fd.get("location") || null, inquiryText: fd.get("inquiryText"), urgency: fd.get("urgency") || "normal" } });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send. Please call us.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <p className="text-3xl">📨</p>
        <h2 className="mt-2 text-lg font-semibold">Thanks! We got your request.</h2>
        <p className="mt-1 text-sm text-slate-600">{businessName} will text or email you an estimate shortly.</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Your name" htmlFor="in-name" required><input id="in-name" name="customerName" className="input" required /></FormField>
        <FormField label="Phone" htmlFor="in-phone" help="For a quick text with your estimate"><input id="in-phone" name="customerPhone" className="input" type="tel" /></FormField>
        <FormField label="Email" htmlFor="in-email"><input id="in-email" name="customerEmail" className="input" type="email" /></FormField>
        <FormField label="Job address or area" htmlFor="in-loc"><input id="in-loc" name="location" className="input" /></FormField>
        <FormField label="What do you need?" htmlFor="in-svc">
          <select id="in-svc" name="serviceRequested" className="input" defaultValue="">
            <option value="">Choose a service</option>
            {services.map((s) => <option key={s} value={s}>{s}</option>)}
            <option value="Something else">Something else</option>
          </select>
        </FormField>
        <FormField label="How soon?" htmlFor="in-urg">
          <select id="in-urg" name="urgency" className="input" defaultValue="normal">
            <option value="low">Just planning</option><option value="normal">In the next few weeks</option><option value="high">This week</option><option value="emergency">Today / emergency</option>
          </select>
        </FormField>
      </div>
      <FormField label="Tell us about the job" htmlFor="in-text" required help="Sizes, counts, and photos-in-words help us quote accurately. e.g. '150 ft of fence, one gate'"><textarea id="in-text" name="inquiryText" className="input min-h-32" required /></FormField>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" size="lg" loading={loading} style={{ background: color }}>Get my estimate</Button>
    </form>
  );
}
