import { env } from "@/lib/env";

export type PlanKey = "starter" | "pro" | "growth";

export const PLANS: Record<PlanKey, { name: string; price: number; quotesPerMonth: number | null; blurb: string; features: string[] }> = {
  starter: {
    name: "Starter",
    price: 49,
    quotesPerMonth: 50,
    blurb: "For owner-operators who want to stop typing quotes.",
    features: ["50 AI quotes / month", "Lead pipeline", "SMS + email follow-ups", "Customer booking page"],
  },
  pro: {
    name: "Pro",
    price: 149,
    quotesPerMonth: 300,
    blurb: "For growing crews handling leads every day.",
    features: ["300 AI quotes / month", "Everything in Starter", "Web intake form + API leads", "Branded quotes", "Priority support"],
  },
  growth: {
    name: "Growth",
    price: 399,
    quotesPerMonth: null,
    blurb: "For multi-crew companies with serious lead volume.",
    features: ["Unlimited AI quotes", "Everything in Pro", "Team roles", "Activity audit log", "Onboarding call"],
  },
};

export function priceIdFor(plan: PlanKey) {
  return env.stripePrices[plan];
}

export function planFromPriceId(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) return null;
  for (const key of Object.keys(env.stripePrices) as PlanKey[]) {
    if (env.stripePrices[key] === priceId) return key;
  }
  return null;
}
