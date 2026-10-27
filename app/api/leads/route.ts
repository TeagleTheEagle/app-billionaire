import type { LeadStatus } from "@prisma/client";
import { requireApiBusiness } from "@/lib/auth/current";
import { handler, json, parseBody } from "@/lib/utils/api";
import { createLead, leadSchema, listLeads } from "@/services/lead-service";

export const GET = handler(async (req) => {
  const { business } = await requireApiBusiness();
  const url = new URL(req.url);
  const leads = await listLeads(business.id, {
    status: (url.searchParams.get("status") as LeadStatus | "all" | null) ?? undefined,
    source: url.searchParams.get("source") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    from: url.searchParams.get("from") ? new Date(url.searchParams.get("from")!) : undefined,
    to: url.searchParams.get("to") ? new Date(url.searchParams.get("to")!) : undefined,
  });
  return json({ leads });
});

export const POST = handler(async (req) => {
  const { user, business } = await requireApiBusiness();
  const input = await parseBody(req, leadSchema);
  const lead = await createLead(business.id, user.id, { ...input, source: input.source ?? "manual" });
  return json({ lead }, { status: 201 });
});
