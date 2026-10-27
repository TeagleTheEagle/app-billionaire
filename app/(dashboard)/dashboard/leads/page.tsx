import type { Metadata } from "next";
import { Suspense } from "react";
import type { LeadStatus } from "@prisma/client";
import { requireBusiness } from "@/lib/auth/current";
import { listLeads } from "@/services/lead-service";
import { serialize } from "@/lib/utils/serialize";
import { env } from "@/lib/env";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { LeadList } from "@/components/dashboard/LeadList";
import { Button } from "@/components/common/Button";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { business } = await requireBusiness();
  const sp = await searchParams;
  const leads = await listLeads(business.id, {
    status: (sp.status as LeadStatus | "all" | undefined) ?? "all",
    source: sp.source,
    q: sp.q,
    from: sp.from ? new Date(sp.from) : undefined,
    to: sp.to ? new Date(sp.to + "T23:59:59") : undefined,
  });
  return (
    <div>
      <PageHeader
        title="Leads"
        description={`${leads.length} lead${leads.length === 1 ? "" : "s"} · intake form: ${env.appUrl}/intake/${business.intakeToken}`}
        actions={<><Button href={`/intake/${business.intakeToken}`} variant="secondary">Preview intake form</Button><Button href="/dashboard/leads/new">+ New lead</Button></>}
      />
      <Suspense><LeadList leads={serialize(leads)} /></Suspense>
    </div>
  );
}
