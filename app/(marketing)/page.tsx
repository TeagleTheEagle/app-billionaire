import Link from "next/link";
import { Button } from "@/components/common/Button";

const steps = [
  { n: "1", title: "Lead comes in", body: "From your web form, a text, a call, or an email. Paste it in or let it arrive automatically." },
  { n: "2", title: "AI drafts the quote", body: "Using your services and pricing rules, not guesses. Missing details become stated assumptions." },
  { n: "3", title: "You approve in seconds", body: "Edit a line item, tweak the message, hit approve. Nothing goes out without you." },
  { n: "4", title: "Customer books", body: "They get a text or email with the estimate and a link to pick a time. You see it on your calendar." },
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6">
        <div className="max-w-3xl">
          <p className="mb-3 inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">Built for plumbers, landscapers, cleaners, electricians, and every trade in between</p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Reply to every lead with a real quote in under a minute.</h1>
          <p className="mt-5 text-lg text-slate-600">Fable 5.1 reads the customer’s message, builds an estimate from your own pricing, writes the follow-up, and books the job. You stay in control of every number that goes out.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/signup" size="lg">Start free, no card needed</Button>
            <Button href="/demo" size="lg" variant="secondary">See a 2-minute demo</Button>
          </div>
          <p className="mt-3 text-sm text-slate-500">10 free AI quotes. Set up in about 10 minutes.</p>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="card p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">{s.n}</span>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">The lead you answer first is the lead you win.</h2>
            <p className="mt-4 text-slate-600">Most local service businesses lose jobs to whoever quotes first. Fable 5.1 makes that you, without hiring an office manager or typing the same estimate for the hundredth time.</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li>✓ Quotes are built from <strong>your</strong> rates, minimums, add-ons, and fees</li>
              <li>✓ Every estimate is a draft until you approve it</li>
              <li>✓ Customers get a clean quote page with one-tap booking</li>
              <li>✓ One pipeline view: new, quoted, booked, won</li>
            </ul>
            <Link href="/features" className="mt-6 inline-block text-sm font-medium text-brand-700 hover:underline">All features →</Link>
          </div>
          <div className="card p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Example</p>
            <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">“Need a fence replaced around the backyard, about 150 ft. Just need a rough estimate. Thanks.”</p>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span>Materials (150 ft × $14)</span><span>$2,100</span></div>
              <div className="flex justify-between"><span>Labor (12 hr × $65)</span><span>$780</span></div>
              <div className="flex justify-between"><span>Permit fee</span><span>$150</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold"><span>Estimate</span><span>$3,030</span></div>
            </div>
            <p className="mt-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-900">“Thanks for reaching out! For a standard 150 ft fence replacement we’re estimating about $3,030. Want us to come confirm measurements? Book a quick visit here: …”</p>
          </div>
        </div>
      </section>

      <section className="bg-brand-800 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-14 text-center sm:px-6">
          <h2 className="text-3xl font-bold">Stop losing jobs to slow replies.</h2>
          <p className="max-w-xl text-brand-100">Add your services, set your prices, and send your first AI quote today.</p>
          <Button href="/signup" variant="accent" size="lg">Create your free account</Button>
        </div>
      </section>
    </>
  );
}
