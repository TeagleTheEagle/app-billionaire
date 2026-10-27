import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/auth/current";
import { getLead } from "@/services/lead-service";
import { quotaFor } from "@/services/billing-service";
import { serialize } from "@/lib/utils/serialize";
import { env, features } from "@/lib/env";
import { LeadDetailPanel } from "@/components/dashboard/LeadDetailPanel";
import type { LeadDetailDTO } from "@/types/lead";

export const metadata: Metadata = { title: "Lead" };

export default async function LeadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { business } = await requireBusiness();
  const { leadId } = await params;
  const lead = await getLead(business.id, leadId);
  if (!lead) notFound();
  return <LeadDetailPanel lead={serialize(lead) as unknown as LeadDetailDTO} appUrl={env.appUrl} aiEnabled={features.ai()} quota={quotaFor(business.subscription)} />;
}
