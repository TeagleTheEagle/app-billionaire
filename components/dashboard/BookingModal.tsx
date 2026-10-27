"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { api } from "@/lib/client/api";

const types = [
  ["consultation", "Consultation"],
  ["quote_review", "Quote review"],
  ["site_walk", "Site walk"],
  ["installation", "Installation / job"],
  ["callback", "Callback"],
] as const;

function defaultDate() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(Math.max(9, d.getHours()))}:00`;
}

export function BookingModal({ open, onClose, leadId, onBooked }: { open: boolean; onClose: () => void; leadId: string; onBooked: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [when, setWhen] = useState(defaultDate);
  const [type, setType] = useState<(typeof types)[number][0]>("consultation");
  const [notes, setNotes] = useState("");
  const [contactMethod, setContactMethod] = useState("text");
  const [sendConfirmation, setSendConfirmation] = useState(true);

  async function book() {
    setLoading(true);
    try {
      await api(`/api/leads/${leadId}/booking`, { method: "POST", body: { scheduledAt: new Date(when).toISOString(), appointmentType: type, notes, contactMethod, sendConfirmation } });
      toast("Appointment booked");
      onBooked();
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Booking failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Book an appointment" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={loading} onClick={book}>Book</Button></>}>
      <div className="space-y-4">
        <FormField label="Appointment type" htmlFor="apptType">
          <select id="apptType" className="input" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            {types.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </FormField>
        <FormField label="Date and time" htmlFor="when">
          <input id="when" type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} />
        </FormField>
        <FormField label="Contact method" htmlFor="contact">
          <select id="contact" className="input" value={contactMethod} onChange={(e) => setContactMethod(e.target.value)}>
            <option value="text">Text</option>
            <option value="call">Call</option>
            <option value="email">Email</option>
          </select>
        </FormField>
        <FormField label="Notes" htmlFor="notes">
          <textarea id="notes" className="input min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate code, parking, what to bring…" />
        </FormField>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={sendConfirmation} onChange={(e) => setSendConfirmation(e.target.checked)} />
          Send the customer a confirmation message
        </label>
      </div>
    </Modal>
  );
}
