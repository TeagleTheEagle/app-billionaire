import type { Metadata } from "next";
import { requireBusiness } from "@/lib/auth/current";
import { listServices } from "@/services/business-service";
import { serialize } from "@/lib/utils/serialize";
import { ServiceCard } from "@/components/dashboard/ServiceCard";
import { ServicesManager } from "@/components/dashboard/ServicesManager";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesSettingsPage() {
  const { business } = await requireBusiness();
  const services = serialize(await listServices(business.id));
  return (
    <div className="space-y-4">
      <ServicesManager />
      {services.length === 0 && <p className="card p-6 text-sm text-slate-500">No services yet. Add the jobs you quote most often.</p>}
      {services.map((s) => <ServiceCard key={s.id} service={s} showRules={false} />)}
    </div>
  );
}
