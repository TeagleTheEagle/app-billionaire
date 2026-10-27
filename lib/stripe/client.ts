import Stripe from "stripe";
import { env } from "@/lib/env";

let stripeSingleton: Stripe | null = null;

export function stripe(): Stripe {
  if (!env.stripeSecretKey) throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing)");
  if (!stripeSingleton) stripeSingleton = new Stripe(env.stripeSecretKey);
  return stripeSingleton;
}
