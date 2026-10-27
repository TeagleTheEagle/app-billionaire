"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Td } from "@/components/common/Table";
import { useToast } from "@/components/common/Toast";
import { api } from "@/lib/client/api";
import { formatDateTime, humanize } from "@/lib/utils/format";

type Appt = { id: string; leadId: string; scheduledAt: string; durationMinutes: number; appointmentType: string; notes: string | null; status: string; lead: { customerName: string; customerPhone: string | null; location: string | null } };

export function AppointmentRow({ appointment: a }: { appointment: Appt }) {
  const router = useRouter();
  const { toast } = useToast();
  async function setStatus(status: string) {
    try {
      await api(`/api/appointments/${a.id}`, { method: "PUT", body: { status } });
      toast("Appointment updated", "info");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Update failed", "error");
    }
  }
  return (
    <tr className="hover:bg-slate-50">
      <Td><span className="font-medium text-slate-900">{formatDateTime(a.scheduledAt)}</span><span className="block text-xs text-slate-400">{a.durationMinutes} min</span></Td>
      <Td><Link href={`/dashboard/leads/${a.leadId}`} className="font-medium hover:underline">{a.lead.customerName}</Link>{a.lead.customerPhone && <span className="block text-xs text-slate-500">{a.lead.customerPhone}</span>}</Td>
      <Td>{humanize(a.appointmentType)}{a.lead.location && <span className="block text-xs text-slate-500">{a.lead.location}</span>}</Td>
      <Td>{a.notes ?? <span className="text-slate-400">—</span>}</Td>
      <Td><StatusBadge status={a.status} /></Td>
      <Td>
        <select className="input w-auto py-1 text-xs" value={a.status} onChange={(e) => setStatus(e.target.value)} aria-label="Change status">
          {["pending", "confirmed", "completed", "canceled"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Td>
    </tr>
  );
}
