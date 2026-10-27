import type Stripe from "stripe";
import { env, features } from "@/lib/env";
import { stripe } from "@/lib/stripe/client";
import { syncSubscriptionFromStripe } from "@/services/billing-service";

export async function POST(req: Request) {
  if (!features.stripe() || !env.stripeWebhookSecret) {
    return new Response("Billing not configured", { status: 503 });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), signature, env.stripeWebhookSecret);
  } catch (err) {
    console.error("[stripe] webhook signature failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && session.subscription) {
          await syncSubscriptionFromStripe(typeof session.subscription === "string" ? session.subscription : session.subscription.id);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscriptionFromStripe(event.data.object.id);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subId = invoice.parent?.subscription_details?.subscription;
        if (subId) await syncSubscriptionFromStripe(typeof subId === "string" ? subId : subId.id);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe] webhook handler failed", event.type, err);
    return new Response("Handler error", { status: 500 });
  }
  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
}
