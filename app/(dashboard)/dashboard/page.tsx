import type { Metadata } from "next";
import Link from "next/link";
import { requireBusiness } from "@/lib/auth/current";
import { getDashboardStats } from "@/services/dashboard-service";
import { listServices } from "@/services/business-service";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatsCard } from "@/components/common/StatsCard";
import { LeadCard } from "@/components/dashboard/LeadCard";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDateTime, formatMoney, humanize, timeAgo } from "@/lib/utils/format";
import { env, features } from "@/lib/env";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { business } = await requireBusiness();
  const [stats, services] = await Promise.all([getDashboardStats(business.id), listServices(business.id)]);
  const rulesCount = services.reduce((n, s) => n + s.pricingRules.length, 0);
  const checklist = [
    { done: Boolean(business.phone || business.email), label: "Add business contact details", href: "/settings/profile" },
    { done: services.length > 0, label: "Add your services", href: "/settings/services" },
    { done: rulesCount > 0, label: "Add pricing rules", href: "/settings/pricing" },
    { done: stats.totalLeads > 0, label: "Add your first lead", href: "/dashboard/leads/new" },
    { done: stats.quoteSent + stats.booked > 0, label: "Send your first quote", href: "/dashboard/leads" },
  ];
  const remaining = checklist.filter((c) => !c.done);

  return (
    <div>
      <PageHeader title="Overview" description={`Here's what's happening at ${business.name}.`} actions={<Button href="/dashboard/leads/new">+ New lead</Button>} />

      {remaining.length > 0 && (
        <div className="card mb-6 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Getting started</h2>
            <span className="text-xs text-slate-500">{checklist.length - remaining.length} of {checklist.length} done</span>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${c.done ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 hover:bg-slate-50"}`}>
                  <span>{c.done ? "✓" : "○"}</span>{c.label}
                </Link>
              </li>
            ))}
          </ul>
          {!features.ai() && <p className="mt-3 text-xs text-slate-500">AI quote writing is off on this server (no Anthropic key). Quotes still work from your pricing rules.</p>}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatsCard label="Total leads" value={stats.totalLeads} />
        <StatsCard label="New" value={stats.newLeads} tone={stats.newLeads > 0 ? "warn" : "default"} hint="Waiting for a reply" />
        <StatsCard label="Quote sent" value={stats.quoteSent} />
        <StatsCard label="Booked / won" value={stats.booked} tone="good" />
        <StatsCard label="Lost" value={stats.lost} />
        <StatsCard label="Pipeline (30d)" value={formatMoney(stats.pipelineValue)} hint={`${stats.quotesSent30d} quotes sent`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent leads</h2>
            <Link href="/dashboard/leads" className="text-sm text-brand-700 hover:underline">View all</Link>
          </div>
          {stats.recentLeads.length === 0 ? (
            <div className="card p-8 text-center text-sm text-slate-500">No leads yet. <Link href="/dashboard/leads/new" className="text-brand-700 underline">Add one</Link> or share your intake form: <span className="font-mono text-xs">{env.appUrl}/intake/{business.intakeToken}</span></div>
          ) : (
            stats.recentLeads.map((l) => <LeadCard key={l.id} lead={l} />)
          )}
        </div>
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-semibold">Upcoming appointments</h2>
            {stats.upcoming.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Nothing scheduled.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {stats.upcoming.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2">
                    <Link href={`/dashboard/leads/${a.leadId}`} className="hover:underline">
                      <span className="font-medium">{a.lead.customerName}</span>
                      <span className="block text-xs text-slate-500">{humanize(a.appointmentType)} · {formatDateTime(a.scheduledAt)}</span>
                    </Link>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card p-5">
            <h2 className="font-semibold">Recent activity</h2>
            {stats.recentActivity.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Activity will show up here.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {stats.recentActivity.map((a) => (
                  <li key={a.id} className="flex justify-between gap-2">
                    <span className="text-slate-700">{humanize(a.entityType)} {a.action.replace(":", " → ").replace("_", " ")}{a.user ? <span className="text-slate-400"> · {a.user.name}</span> : <span className="text-slate-400"> · customer</span>}</span>
                    <span className="shrink-0 text-xs text-slate-400">{timeAgo(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
