import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/auth/current";
import { getLead } from "@/services/lead-service";
import { listServices } from "@/services/business-service";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { LeadForm } from "@/components/forms/LeadForm";
import { serialize } from "@/lib/utils/serialize";

export const metadata: Metadata = { title: "Edit lead" };

export default async function EditLeadPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { business } = await requireBusiness();
  const { leadId } = await params;
  const [lead, services] = await Promise.all([getLead(business.id, leadId), listServices(business.id)]);
  if (!lead) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Edit ${lead.customerName}`} />
      <LeadForm leadId={lead.id} initial={serialize(lead) as unknown as Record<string, unknown>} services={services.map((s) => ({ id: s.id, name: s.name }))} />
    </div>
  );
}
