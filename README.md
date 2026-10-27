# Fable

AI-powered lead-to-booking system for local service businesses. It turns customer inquiries into professional estimates, follow-up texts/emails, and booked appointments while keeping the business in control. Built for small service companies that want to quote faster and win more jobs.

The product spec lives in [`FABLE_BLUEPRINT.md`](./FABLE_BLUEPRINT.md). This repo implements its MVP scope end to end:

- Signup/login, business profile, onboarding wizard
- Service catalog with pricing rules (hourly, per-unit, flat, range, minimums, add-ons, fees, markups, surcharges)
- Lead intake: manual, hosted web form, and a JSON API
- Quote generation from pricing rules, refined and written up by Claude when an API key is set
- Draft → approve → send workflow with inline editing
- SMS (Twilio) and email (Resend) delivery, simulated when keys are absent
- Public quote page with customer self-booking
- Appointments, lead pipeline dashboard, activity log
- Stripe subscriptions with a free-quote trial and plan quotas

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Postgres · Prisma 6 · Anthropic SDK · Stripe · Twilio · Resend

## Run it locally

```bash
cp .env.example .env        # fill in DATABASE_URL at minimum
npm install
npx prisma migrate dev      # creates the schema
npm run db:seed             # optional demo business: demo@fable.local / password123
npm run dev                 # http://localhost:3000
```

Everything optional degrades gracefully:

| Env var | When missing |
| --- | --- |
| `ANTHROPIC_API_KEY` | Quotes are computed purely from pricing rules and templates |
| `STRIPE_SECRET_KEY` + price IDs | Billing page shows plans but checkout is disabled; trial quota still applies |
| `TWILIO_*` | SMS sends are logged and stored as `simulated` |
| `RESEND_API_KEY` | Email sends are logged and stored as `simulated` |

## How quoting works

1. `lib/pricing/engine.ts` matches the lead to a service, pulls quantities out of the message ("150 ft", "3 rooms"), and applies the service's pricing rules deterministically. This is the source of truth.
2. If an Anthropic key is present, `lib/ai/quote.ts` sends the business context, catalog, lead, and that baseline to Claude with a strict JSON schema. The model may refine the estimate, state assumptions, give a range when unsure, and writes the SMS and email.
3. The result is stored as a **draft**. Nothing reaches the customer until the owner approves it.

## Project layout

```
app/              routes: (marketing), (auth), (dashboard), api/, q/[token], intake/[token]
components/       common UI, dashboard widgets, forms, public pages
lib/              db, auth, env, ai, pricing engine, messaging, stripe, utils
services/         business logic shared by API routes and server components
prisma/           schema, migrations, seed
proxy.ts          auth redirects for /dashboard, /settings, /onboarding
```

## Scripts

```bash
npm run dev          # dev server
npm run build        # prisma generate + next build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run db:migrate   # prisma migrate dev
npm run db:seed      # seed demo data
```

## Stripe setup

Create three recurring prices in Stripe (Starter $49, Pro $149, Growth $399) and put their IDs in `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_GROWTH`. Point a webhook at `/api/billing/webhook` for `checkout.session.completed`, `customer.subscription.*`, and `invoice.payment_failed`, and set `STRIPE_WEBHOOK_SECRET`.

## Lead intake API

Each business has an intake link shown on Settings → Profile. POST JSON to the same path to create leads from your own site or Zapier:

```bash
curl -X POST https://your-host/api/public/intake/<token> \
  -H 'Content-Type: application/json' -H 'x-lead-source: api' \
  -d '{"customerName":"Jane","customerPhone":"+15125550100","inquiryText":"Need 150 ft of fence with a gate"}'
```
