import { env, features } from "@/lib/env";
import type { SendResult } from "@/lib/messaging/sms";

export async function sendEmail(to: string, subject: string, text: string): Promise<SendResult> {
  if (!features.email()) {
    console.info(`[email:simulated] to=${to} subject=${subject}`);
    return { status: "simulated" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.emailFrom, to: [to], subject, text }),
    });
    const data = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) return { status: "failed", error: data.message ?? `Resend error ${res.status}` };
    return { status: "sent", providerId: data.id };
  } catch (err) {
    return { status: "failed", error: err instanceof Error ? err.message : "Email send failed" };
  }
}
