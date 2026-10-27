/**
 * One-time Stripe setup: creates the Fable product and the three monthly prices,
 * then prints the env vars to paste into Vercel. Safe to re-run: existing prices
 * (matched by lookup_key) are reused.
 *
 *   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Set STRIPE_SECRET_KEY first (use your test key to start).");
  process.exit(1);
}
const stripe = new Stripe(key);

const PLANS = [
  { env: "STRIPE_PRICE_STARTER", lookup: "fable_starter_monthly", name: "Fable Starter", amount: 4900, description: "50 AI quotes per month" },
  { env: "STRIPE_PRICE_PRO", lookup: "fable_pro_monthly", name: "Fable Pro", amount: 14900, description: "300 AI quotes per month, web intake form and API leads" },
  { env: "STRIPE_PRICE_GROWTH", lookup: "fable_growth_monthly", name: "Fable Growth", amount: 39900, description: "Unlimited AI quotes, team roles, audit log" },
];

async function main() {
  const out: string[] = [];
  for (const plan of PLANS) {
    const existing = await stripe.prices.list({ lookup_keys: [plan.lookup], active: true, limit: 1 });
    let price = existing.data[0];
    if (!price) {
      const product = await stripe.products.create({ name: plan.name, description: plan.description, metadata: { app: "fable" } });
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.amount,
        currency: "usd",
        recurring: { interval: "month" },
        lookup_key: plan.lookup,
        metadata: { app: "fable" },
      });
      console.log(`created ${plan.name} -> ${price.id}`);
    } else {
      console.log(`reusing ${plan.name} -> ${price.id}`);
    }
    out.push(`${plan.env}=${price.id}`);
  }
  console.log("\nAdd these to your environment:\n");
  console.log(out.join("\n"));
  console.log(`\nThen create a webhook at https://dashboard.stripe.com/webhooks pointing to\n  https://<your-domain>/api/billing/webhook\nwith events: checkout.session.completed, customer.subscription.created,\ncustomer.subscription.updated, customer.subscription.deleted, invoice.payment_failed\nand set STRIPE_WEBHOOK_SECRET to its signing secret.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
