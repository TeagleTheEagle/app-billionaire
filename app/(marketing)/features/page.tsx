import type { Metadata } from "next";
import { Button } from "@/components/common/Button";

export const metadata: Metadata = { title: "Features" };

const groups = [
  { title: "Lead intake", items: ["Hosted web form you can link from your site or Google profile", "Paste texts, emails, or voicemail transcripts", "API endpoint for Zapier, Make, or your own site", "Urgency and budget captured on every lead"] },
  { title: "AI quote generation", items: ["Reads the message and matches it to your service catalog", "Prices from your rules: hourly, per unit, flat, minimums, add-ons, fees", "States assumptions when details are missing", "Falls back to a range and 'subject to site visit' when unsure"] },
  { title: "Approval workflow", items: ["Every quote is a draft until you approve it", "Edit line items, tax, assumptions, and terms inline", "Reject and regenerate in one click", "Internal notes stay private"] },
  { title: "Customer messaging", items: ["AI-written SMS and email, editable before sending", "Branded quote page with a booking link", "Resend any message from the lead timeline", "Booking confirmations sent automatically"] },
  { title: "Booking", items: ["Customers pick a time from the quote page", "Book consultations, site walks, installs, or callbacks yourself", "Lead moves to Booked automatically", "Calendar view of upcoming appointments"] },
  { title: "Pipeline dashboard", items: ["New, contacted, quoted, booked, won, lost at a glance", "Pipeline value from sent quotes", "Filter by status, source, and date", "Activity log of every action"] },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">Everything between “got a lead” and “got the job”.</h1>
      <p className="mt-3 max-w-2xl text-slate-600">Fable is deliberately narrow. It does one workflow extremely well: inquiry → quote → approval → message → booking.</p>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <div key={g.title} className="card p-6">
            <h2 className="font-semibold">{g.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">{g.items.map((i) => <li key={i}>✓ {i}</li>)}</ul>
          </div>
        ))}
      </div>
      <div className="mt-12"><Button href="/signup" size="lg">Start free</Button></div>
    </div>
  );
}
