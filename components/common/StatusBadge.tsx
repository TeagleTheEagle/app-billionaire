import { cn } from "@/lib/utils/cn";
import { humanize } from "@/lib/utils/format";

const tones: Record<string, string> = {
  new: "bg-sky-100 text-sky-800",
  contacted: "bg-indigo-100 text-indigo-800",
  quote_created: "bg-amber-100 text-amber-800",
  quote_sent: "bg-violet-100 text-violet-800",
  booked: "bg-emerald-100 text-emerald-800",
  won: "bg-emerald-200 text-emerald-900",
  lost: "bg-red-100 text-red-800",
  archived: "bg-slate-200 text-slate-700",
  draft: "bg-amber-100 text-amber-800",
  approved: "bg-sky-100 text-sky-800",
  sent: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-slate-200 text-slate-700",
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-emerald-200 text-emerald-900",
  canceled: "bg-red-100 text-red-800",
  simulated: "bg-slate-200 text-slate-700",
  failed: "bg-red-100 text-red-800",
  queued: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  trialing: "bg-sky-100 text-sky-800",
  past_due: "bg-red-100 text-red-800",
  none: "bg-slate-200 text-slate-700",
  high: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-red-100 text-red-800",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", tones[status] ?? "bg-slate-100 text-slate-700", className)}>
      {humanize(status)}
    </span>
  );
}
