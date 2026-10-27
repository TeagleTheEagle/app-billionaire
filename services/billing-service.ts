import type { Subscription } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env, features } from "@/lib/env";
import { HttpError } from "@/lib/utils/api";
import { PLANS, planFromPriceId, priceIdFor, type PlanKey } from "@/lib/stripe/plans";
import { stripe } from "@/lib/stripe/client";
import { logActivity } from "@/lib/activity";

export function isPaid(sub: Subscription | null | undefined) {
  return Boolean(sub && (sub.status === "active" || sub.status === "trialing") && sub.planName !== "trial");
}

export function quotaFor(sub: Subscription | null | undefined) {
  if (!sub || !isPaid(sub)) return { limit: env.trialQuoteLimit, used: sub?.trialQuotesUsed ?? 0, plan: "trial" as const };
  const plan = PLANS[sub.planName as PlanKey];
  return { limit: plan?.quotesPerMonth ?? null, used: sub.trialQuotesUsed, plan: sub.planName };
}

export async function assertCanGenerateQuote(sub: Subscription | null | undefined) {
  const { limit, used, plan } = quotaFor(sub);
  if (limit !== null && used >= limit) {
    throw new HttpError(
      plan === "trial"
        ? `You've used all ${limit} free quotes. Choose a plan in Settings → Billing to keep quoting.`
        : `You've hit the ${limit} quotes included in your ${plan} plan this period. Upgrade to keep quoting.`,
      402,
    );
  }
}

export async function recordQuoteUsage(businessId: string) {
  await prisma.subscription.upsert({
    where: { businessId },
    update: { trialQuotesUsed: { increment: 1 } },
    create: { businessId, trialQuotesUsed: 1 },
  });
}

export async function createCheckoutSession(businessId: string, userId: string, plan: PlanKey) {
  if (!features.stripe()) throw new HttpError("Billing is not configured on this server yet", 503);
  const priceId = priceIdFor(plan);
  if (!priceId) throw new HttpError(`No Stripe price configured for the ${plan} plan`, 503);
  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId }, include: { subscription: true, owner: true } });
  const client = stripe();

  let customerId = business.subscription?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await client.customers.create({ email: business.owner.email, name: business.name, metadata: { businessId } });
    customerId = customer.id;
    await prisma.subscription.upsert({ where: { businessId }, update: { stripeCustomerId: customerId }, create: { businessId, stripeCustomerId: customerId } });
  }

  const session = await client.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.appUrl}/settings/billing?checkout=success`,
    cancel_url: `${env.appUrl}/settings/billing?checkout=canceled`,
    metadata: { businessId, plan },
    subscription_data: { metadata: { businessId, plan } },
    allow_promotion_codes: true,
  });
  await logActivity({ businessId, userId, entityType: "subscription", entityId: businessId, action: "checkout_started", metadata: { plan } });
  return session.url!;
}

export async function createPortalSession(businessId: string) {
  if (!features.stripe()) throw new HttpError("Billing is not configured on this server yet", 503);
  const sub = await prisma.subscription.findUnique({ where: { businessId } });
  if (!sub?.stripeCustomerId) throw new HttpError("No billing account yet", 404);
  const session = await stripe().billingPortal.sessions.create({ customer: sub.stripeCustomerId, return_url: `${env.appUrl}/settings/billing` });
  return session.url;
}

/** Apply a Stripe subscription object to our Subscription row. */
export async function syncSubscriptionFromStripe(subscriptionId: string) {
  const client = stripe();
  const s = await client.subscriptions.retrieve(subscriptionId);
  const customerId = typeof s.customer === "string" ? s.customer : s.customer.id;
  const businessId = s.metadata.businessId ?? (await prisma.subscription.findFirst({ where: { stripeCustomerId: customerId } }))?.businessId;
  if (!businessId) {
    console.warn("[stripe] subscription without a businessId", subscriptionId);
    return;
  }
  const priceId = s.items.data[0]?.price.id ?? null;
  const plan = planFromPriceId(priceId) ?? (s.metadata.plan as PlanKey | undefined) ?? "starter";
  const statusMap: Record<string, Subscription["status"]> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    incomplete: "incomplete",
    incomplete_expired: "canceled",
    paused: "canceled",
  };
  const periodEnd = s.items.data[0]?.current_period_end;
  await prisma.subscription.upsert({
    where: { businessId },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: s.id,
      planName: s.status === "canceled" ? "trial" : plan,
      status: statusMap[s.status] ?? "none",
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      trialQuotesUsed: 0,
    },
    create: {
      businessId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: s.id,
      planName: plan,
      status: statusMap[s.status] ?? "none",
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });
  await prisma.business.update({ where: { id: businessId }, data: { status: "active" } });
  await logActivity({ businessId, entityType: "subscription", entityId: businessId, action: `stripe:${s.status}`, metadata: { plan } });
}
