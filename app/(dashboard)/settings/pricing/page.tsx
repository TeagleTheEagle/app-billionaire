import type { Metadata } from "next";
import Link from "next/link";
import { requireBusiness } from "@/lib/auth/current";
import { listServices } from "@/services/business-service";
import { serialize } from "@/lib/utils/serialize";
import { ServiceCard } from "@/components/dashboard/ServiceCard";

export const metadata: Metadata = { title: "Pricing rules" };

export default async function PricingSettingsPage() {
  const { business } = await requireBusiness();
  const services = serialize(await listServices(business.id));
  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h2 className="font-semibold">Pricing rules</h2>
        <p className="mt-1 text-sm text-slate-500">Rules are the source of truth for every quote. Typical setup per service: an hourly or per-unit rate, a minimum charge, add-ons customers mention, and any fixed fees.</p>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-brand-700">Example: fence installation</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
            <li>Per unit · Materials · $14 per ft</li>
            <li>Hourly rate · Labor · $65/hr (uses the service’s typical labor hours when the customer doesn’t say)</li>
            <li>Markup · Material markup · 25% (applied to lines named materials/supplies/parts)</li>
            <li>Add-on · Gate installation · $250 (added when the message mentions a gate)</li>
            <li>Fee · Permit fee · $150</li>
            <li>Minimum charge · $500</li>
          </ul>
        </details>
      </div>
      {services.length === 0 && <p className="card p-6 text-sm text-slate-500">Add a service first on the <Link href="/settings/services" className="text-brand-700 underline">Services tab</Link>.</p>}
      {services.map((s) => <ServiceCard key={s.id} service={s} />)}
    </div>
  );
}
