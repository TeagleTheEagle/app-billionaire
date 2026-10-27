"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { ToastProvider } from "@/components/common/Toast";
import { BusinessProfileForm } from "@/components/forms/BusinessProfileForm";
import { ServiceForm, type ServiceDTO } from "@/components/forms/ServiceForm";
import { api } from "@/lib/client/api";

const STEPS = ["Business", "Services", "First lead"];

export function OnboardingWizard({ hasBusiness, services }: { hasBusiness: boolean; services: ServiceDTO[] }) {
  const router = useRouter();
  const [step, setStep] = useState(hasBusiness ? (services.length ? 2 : 1) : 0);
  const [localServices, setLocalServices] = useState(services);

  async function reloadServices() {
    const res = await api<{ services: ServiceDTO[] }>("/api/business/services");
    setLocalServices(res.services);
  }

  return (
    <ToastProvider>
      <div className="mx-auto w-full max-w-2xl">
        <ol className="mb-8 flex items-center gap-2 text-sm">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${i <= step ? "bg-brand-700 text-white" : "bg-slate-200 text-slate-600"}`}>{i + 1}</span>
              <span className={i === step ? "font-medium" : "text-slate-500"}>{s}</span>
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-8 bg-slate-300" />}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="card p-6">
            <h1 className="text-xl font-semibold">Tell us about your business</h1>
            <p className="mb-5 mt-1 text-sm text-slate-500">This shows up in quotes and messages to customers.</p>
            <BusinessProfileForm mode="create" onSaved={() => { router.refresh(); setStep(1); }} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="card p-6">
              <h1 className="text-xl font-semibold">Add the services you quote most</h1>
              <p className="mb-5 mt-1 text-sm text-slate-500">Start with two or three. You can add pricing rules (hourly rates, add-ons, minimums) right after.</p>
              <ServiceForm onDone={reloadServices} />
            </div>
            {localServices.length > 0 && (
              <div className="card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Added so far</p>
                <ul className="mt-2 space-y-1 text-sm">{localServices.map((s) => <li key={s.id}>✓ {s.name} <span className="text-slate-400">· {s.category}</span></li>)}</ul>
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
              <Button onClick={() => setStep(2)} disabled={localServices.length === 0}>Continue</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card p-6">
            <h1 className="text-xl font-semibold">You’re set up</h1>
            <p className="mt-1 text-sm text-slate-500">Next, add pricing rules so quotes come out accurate, then test with a real inquiry.</p>
            <ol className="mt-5 space-y-3 text-sm">
              <li className="flex gap-3"><span className="font-semibold text-brand-700">1.</span> Add pricing rules to each service (rates, minimums, add-ons).</li>
              <li className="flex gap-3"><span className="font-semibold text-brand-700">2.</span> Paste a recent customer message as your first lead.</li>
              <li className="flex gap-3"><span className="font-semibold text-brand-700">3.</span> Generate, review, approve, and send the quote.</li>
            </ol>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button href="/settings/pricing" variant="secondary">Add pricing rules</Button>
              <Button href="/dashboard/leads/new">Add your first lead</Button>
            </div>
          </div>
        )}
      </div>
    </ToastProvider>
  );
}
