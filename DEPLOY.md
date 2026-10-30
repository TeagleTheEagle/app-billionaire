# Deploying Fable

About 20 minutes. You need a GitHub account (you have one), a Vercel account, and a Postgres database. Everything below has a free tier.

## 1. Database (Neon)

1. Sign up at https://neon.tech and create a project called `fable`.
2. Copy the connection string. It looks like `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`.

Supabase, Railway, or any Postgres 14+ works the same way.

## 2. Host (Vercel)

1. Sign up at https://vercel.com with GitHub and click **Add New → Project**.
2. Import `TeagleTheEagle/app-billionaire`. Vercel detects Next.js and reads `vercel.json`, which runs database migrations before each build.
3. Before the first deploy, open **Environment Variables** and add:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | the Neon connection string |
| `AUTH_SECRET` | a long random string. Run `openssl rand -base64 48` or mash the keyboard for 40+ characters |
| `NEXT_PUBLIC_APP_URL` | your Vercel URL, e.g. `https://fable.vercel.app`, no trailing slash |

4. Click **Deploy**. When it finishes, open the URL, sign up, and run through onboarding.

Also add `CRON_SECRET` (any long random string). Vercel uses it to call the daily follow-up job at `/api/cron/follow-ups`, defined in `vercel.json`.

Set `NEXT_PUBLIC_APP_URL` again once you attach a custom domain. It is used in the booking links sent to customers.

## 3. Turn on AI quotes

1. Create a key at https://console.anthropic.com → API Keys.
2. In Vercel, add `ANTHROPIC_API_KEY`. Optionally set `ANTHROPIC_MODEL` (defaults to `claude-opus-5-5`).
3. Redeploy. Quotes now come back AI-written with assumptions and ready-to-send messages. Without the key, quotes are computed purely from pricing rules and templates.

## 4. Turn on email (Resend)

1. Sign up at https://resend.com, verify your sending domain, and create an API key.
2. Add `RESEND_API_KEY` and `EMAIL_FROM` (e.g. `Fable <quotes@yourdomain.com>`).

Until this is set, emails are stored as `simulated` and shown in the lead timeline, so you can test the flow safely.

## 5. Turn on SMS (Twilio)

1. Sign up at https://twilio.com, buy a number, and note the Account SID and Auth Token.
2. Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` (E.164 format, e.g. `+15125550100`).

US numbers need A2P 10DLC registration before carriers deliver business texts. Start that early; it takes days.

## 6. Turn on billing (Stripe)

1. Get your secret key from https://dashboard.stripe.com/apikeys (start with the test key).
2. Run the setup script locally. It creates the three plans and prints the price IDs:

```bash
STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts
```

3. Add `STRIPE_SECRET_KEY`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_GROWTH` to Vercel.
4. In Stripe → Developers → Webhooks, add an endpoint for `https://<your-domain>/api/billing/webhook` with events `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Redeploy. The Billing page now lets owners subscribe. Repeat with live keys when you're ready to charge.

`TRIAL_QUOTE_LIMIT` (default 10) controls how many free quotes a new business gets.

## Checking a deploy

- `/` loads the marketing site.
- Sign up, finish onboarding, add a service with one or two pricing rules.
- Add a lead with a message like "Need 150 ft of fence with a gate" and generate a quote.
- Approve it, send by email, open the booking link from the lead timeline, and book a time.
- The lead should now read **Booked** on the dashboard.

## Local development

See `README.md`. `npm run db:seed` creates a demo business (`demo@fable.local` / `password123`) with sample leads.
