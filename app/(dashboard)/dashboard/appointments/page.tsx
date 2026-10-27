import type { Metadata } from "next";
import Link from "next/link";
import { requireBusiness } from "@/lib/auth/current";
import { listAppointments } from "@/services/booking-service";
import { serialize } from "@/lib/utils/serialize";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Table, Th } from "@/components/common/Table";
import { AppointmentRow } from "@/components/dashboard/AppointmentRow";

export const metadata: Metadata = { title: "Appointments" };

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { business } = await requireBusiness();
  const { view = "upcoming" } = await searchParams;
  const now = new Date();
  const appointments = await listAppointments(business.id, view === "past" ? { to: now } : view === "all" ? {} : { from: now });
  const rows = view === "past" ? [...appointments].reverse() : appointments;
  return (
    <div>
      <PageHeader title="Appointments" description="Consultations, site walks, and jobs on the calendar." />
      <div className="mb-4 flex gap-2">
        {["upcoming", "past", "all"].map((v) => (
          <Link key={v} href={`/dashboard/appointments?view=${v}`} className={`rounded-full px-3 py-1 text-sm capitalize ${view === v ? "bg-brand-700 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}>{v}</Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No appointments" description="Book one from a lead, or let customers self-book from their quote page." icon="📅" />
      ) : (
        <Table>
          <thead><tr><Th>When</Th><Th>Customer</Th><Th>Type</Th><Th>Notes</Th><Th>Status</Th><Th>Update</Th></tr></thead>
          <tbody className="divide-y divide-slate-100">{rows.map((a) => <AppointmentRow key={a.id} appointment={serialize(a)} />)}</tbody>
        </Table>
      )}
    </div>
  );
}
