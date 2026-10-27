import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQ" };

const faqs = [
  ["Will the AI send prices I didn't approve?", "No. Every quote starts as a draft. Nothing reaches a customer until you approve it, and you can edit any line item or the message first."],
  ["Where do the prices come from?", "From your service catalog and pricing rules: hourly rates, per-unit prices, minimums, add-ons, fees, and surcharges. The AI is told those rules are the source of truth."],
  ["What if the customer didn't give enough detail?", "The quote lists the assumptions it made and, when it can't be confident, gives a range with 'subject to site visit' wording."],
  ["How do leads get in?", "Add them manually, share your hosted intake form link, or post to the API from a site form or Zapier."],
  ["Do I need my own phone number for texts?", "SMS goes through your own Twilio account so replies come to a number you control. Email works out of the box."],
  ["Can my team use it?", "The Growth plan includes team roles. Starter and Pro are single-owner accounts."],
  ["Is there a contract?", "No. Monthly billing through Stripe, cancel anytime from the billing page."],
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">Questions, answered.</h1>
      <dl className="mt-10 divide-y divide-slate-200">
        {faqs.map(([q, a]) => (
          <div key={q} className="py-5">
            <dt className="font-semibold">{q}</dt>
            <dd className="mt-1 text-slate-600">{a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
