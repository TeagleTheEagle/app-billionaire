"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { api } from "@/lib/client/api";

type Drafts = { sms: string; emailSubject: string; emailBody: string; bookingUrl: string };

/** Mounted only while open, so state initializes fresh for each send. */
export function MessageComposer({ onClose, leadId, quoteId, hasPhone, hasEmail, onSent }: { onClose: () => void; leadId: string; quoteId?: string | null; hasPhone: boolean; hasEmail: boolean; onSent: () => void }) {
  const { toast } = useToast();
  const [channel, setChannel] = useState<"sms" | "email">(hasPhone ? "sms" : "email");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [drafts, setDrafts] = useState<Drafts | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!quoteId) return;
    let cancelled = false;
    api<Drafts>(`/api/quotes/${quoteId}/send`)
      .then((d) => {
        if (cancelled) return;
        setDrafts(d);
        setSubject(d.emailSubject);
        setContent(hasPhone ? d.sms : d.emailBody);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [quoteId, hasPhone]);

  function pickChannel(next: "sms" | "email") {
    setChannel(next);
    if (drafts) setContent(next === "sms" ? drafts.sms : drafts.emailBody);
  }

  async function send() {
    setLoading(true);
    try {
      if (quoteId) await api(`/api/quotes/${quoteId}/send`, { method: "POST", body: { channel, content, subject } });
      else await api(`/api/leads/${leadId}/message`, { method: "POST", body: { channel, content, subject, messageType: "follow_up" } });
      toast(`${channel === "sms" ? "Text" : "Email"} sent`);
      onSent();
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Send failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={quoteId ? "Send quote to customer" : "Send a message"} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={loading} onClick={send} disabled={!content.trim()}>Send {channel === "sms" ? "text" : "email"}</Button></>}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <button className={`rounded-lg border px-3 py-1.5 text-sm ${channel === "sms" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-slate-300"} disabled:opacity-40`} disabled={!hasPhone} onClick={() => pickChannel("sms")}>SMS</button>
          <button className={`rounded-lg border px-3 py-1.5 text-sm ${channel === "email" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-slate-300"} disabled:opacity-40`} disabled={!hasEmail} onClick={() => pickChannel("email")}>Email</button>
          {!hasPhone && !hasEmail && <p className="text-sm text-red-600">Add a phone or email to this lead first.</p>}
        </div>
        {channel === "email" && (
          <FormField label="Subject" htmlFor="subject">
            <input id="subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </FormField>
        )}
        <FormField label="Message" htmlFor="content" help={channel === "sms" ? `${content.length} characters` : undefined}>
          <textarea id="content" className="input min-h-40" value={content} onChange={(e) => setContent(e.target.value)} />
        </FormField>
        {drafts && <p className="text-xs text-slate-500">Booking link: <span className="font-mono">{drafts.bookingUrl}</span></p>}
      </div>
    </Modal>
  );
}
