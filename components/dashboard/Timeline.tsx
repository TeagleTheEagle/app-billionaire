import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDateTime, formatMoney } from "@/lib/utils/format";
import type { AppointmentDTO, MessageDTO, QuoteDTO } from "@/types/lead";

type Event = { at: string; kind: "message" | "quote" | "appointment"; title: string; body?: string; status: string };

export function Timeline({ quotes, messages, appointments, createdAt }: { quotes: QuoteDTO[]; messages: MessageDTO[]; appointments: AppointmentDTO[]; createdAt: string }) {
  const events: Event[] = [
    ...messages.map((m) => ({ at: m.createdAt, kind: "message" as const, title: `${m.channel === "sms" ? "Text" : "Email"} · ${m.messageType.replace("_", " ")}${m.recipient ? ` → ${m.recipient}` : ""}`, body: m.error ? `Failed: ${m.error}` : m.subject ? `${m.subject}\n${m.content}` : m.content, status: m.status })),
    ...quotes.map((q) => ({ at: q.createdAt, kind: "quote" as const, title: `Quote · ${q.serviceType} · ${formatMoney(q.totalPrice)}`, status: q.status })),
    ...appointments.map((a) => ({ at: a.createdAt, kind: "appointment" as const, title: `${a.appointmentType.replace("_", " ")} on ${formatDateTime(a.scheduledAt)}`, body: a.notes ?? undefined, status: a.status })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const icon = { message: "💬", quote: "🧾", appointment: "📅" };
  return (
    <ol className="space-y-4">
      {events.map((e, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-0.5 text-lg" aria-hidden>{icon[e.kind]}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-slate-800">{e.title}</p>
              <StatusBadge status={e.status} />
              <span className="text-xs text-slate-400">{formatDateTime(e.at)}</span>
            </div>
            {e.body && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{e.body}</p>}
          </div>
        </li>
      ))}
      <li className="flex gap-3">
        <span className="mt-0.5 text-lg" aria-hidden>👤</span>
        <div>
          <p className="text-sm font-medium text-slate-800">Lead created</p>
          <span className="text-xs text-slate-400">{formatDateTime(createdAt)}</span>
        </div>
      </li>
    </ol>
  );
}
