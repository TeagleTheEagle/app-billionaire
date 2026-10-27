import { requireApiBusiness } from "@/lib/auth/current";
import { prisma } from "@/lib/db";
import { features } from "@/lib/env";
import { handler, json } from "@/lib/utils/api";
import { quotaFor } from "@/services/billing-service";
import { PLANS } from "@/lib/stripe/plans";

export const GET = handler(async () => {
  const { business } = await requireApiBusiness();
  const subscription = await prisma.subscription.findUnique({ where: { businessId: business.id } });
  return json({ subscription, quota: quotaFor(subscription), plans: PLANS, billingEnabled: features.stripe() });
});
