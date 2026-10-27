import type { Metadata } from "next";
import { requireBusiness } from "@/lib/auth/current";
import { listServices } from "@/services/business-service";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { LeadForm } from "@/components/forms/LeadForm";

export const metadata: Metadata = { title: "New lead" };

export default async function NewLeadPage() {
  const { business } = await requireBusiness();
  const services = await listServices(business.id);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New lead" description="Paste what the customer sent you. The more detail, the better the quote." />
      <LeadForm services={services.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name }))} />
    </div>
  );
}
