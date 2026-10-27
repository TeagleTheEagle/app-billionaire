import type { Metadata } from "next";
import { requireBusiness } from "@/lib/auth/current";
import { BusinessProfileForm } from "@/components/forms/BusinessProfileForm";
import { BrandForm } from "@/components/forms/SettingsForms";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Business profile" };

export default async function ProfileSettingsPage() {
  const { business } = await requireBusiness();
  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="font-semibold">Business profile</h2>
        <p className="mb-5 mt-1 text-sm text-slate-500">Shown to customers on quotes and in messages.</p>
        <BusinessProfileForm mode="edit" business={business} />
      </section>
      <section className="card p-6">
        <h2 className="font-semibold">Brand</h2>
        <p className="mb-5 mt-1 text-sm text-slate-500">Colors and logo for the customer-facing quote page.</p>
        <BrandForm settings={business.settings} />
      </section>
      <section className="card p-6">
        <h2 className="font-semibold">Lead intake</h2>
        <p className="mt-1 text-sm text-slate-500">Share this form link, or POST JSON to the same path with an <code>x-lead-source: api</code> header.</p>
        <p className="mt-3 rounded-lg bg-slate-50 p-3 font-mono text-sm">{env.appUrl}/intake/{business.intakeToken}</p>
      </section>
    </div>
  );
}
