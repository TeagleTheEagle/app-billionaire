"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/common/Button";
import { LeadCard, type LeadRow } from "@/components/dashboard/LeadCard";

const statuses = ["all", "new", "contacted", "quote_created", "quote_sent", "booked", "won", "lost", "archived"];
const sources = ["all", "web_form", "manual", "api", "phone", "referral", "other"];

export function LeadList({ leads }: { leads: LeadRow[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    router.push(`/dashboard/leads?${next.toString()}`);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          defaultValue={params.get("q") ?? ""}
          placeholder="Search name, job, or address"
          className="input max-w-xs"
          onKeyDown={(e) => e.key === "Enter" && set("q", (e.target as HTMLInputElement).value)}
        />
        <select className="input w-auto" value={params.get("status") ?? "all"} onChange={(e) => set("status", e.target.value)} aria-label="Filter by status">
          {statuses.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All statuses" : s.replace("_", " ")}</option>
          ))}
        </select>
        <select className="input w-auto" value={params.get("source") ?? "all"} onChange={(e) => set("source", e.target.value)} aria-label="Filter by source">
          {sources.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All sources" : s.replace("_", " ")}</option>
          ))}
        </select>
        <input type="date" className="input w-auto" defaultValue={params.get("from") ?? ""} onChange={(e) => set("from", e.target.value)} aria-label="From date" />
        <input type="date" className="input w-auto" defaultValue={params.get("to") ?? ""} onChange={(e) => set("to", e.target.value)} aria-label="To date" />
      </div>
      {leads.length === 0 ? (
        <EmptyState title="No leads match" description="Add a lead manually, share your intake form, or adjust the filters." action={<Button href="/dashboard/leads/new">Add a lead</Button>} icon="👤" />
      ) : (
        <div className="grid gap-3">{leads.map((l) => <LeadCard key={l.id} lead={l} />)}</div>
      )}
    </div>
  );
}
