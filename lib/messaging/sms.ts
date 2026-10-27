import { env, features } from "@/lib/env";

export type SendResult = { status: "sent" | "simulated" | "failed"; providerId?: string; error?: string };

export async function sendSms(to: string, body: string): Promise<SendResult> {
  if (!features.sms()) {
    console.info(`[sms:simulated] to=${to} body=${body.slice(0, 80)}…`);
    return { status: "simulated" };
  }
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.twilio.sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${env.twilio.sid}:${env.twilio.token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: env.twilio.from, Body: body }),
    });
    const data = (await res.json()) as { sid?: string; message?: string };
    if (!res.ok) return { status: "failed", error: data.message ?? `Twilio error ${res.status}` };
    return { status: "sent", providerId: data.sid };
  } catch (err) {
    return { status: "failed", error: err instanceof Error ? err.message : "SMS send failed" };
  }
}
