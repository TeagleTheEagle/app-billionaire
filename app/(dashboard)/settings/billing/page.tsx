import type { Metadata } from "next";
import { requireBusiness } from "@/lib/auth/current";
import { prisma } from "@/lib/db";
import { features } from "@/lib/env";
import { quotaFor } from "@/services/billing-service";
import { serialize } from "@/lib/utils/serialize";
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingSettingsPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const { business } = await requireBusiness();
  const { checkout } = await searchParams;
  const subscription = await prisma.subscription.findUnique({ where: { businessId: business.id } });
  return <SubscriptionCard subscription={serialize(subscription)} quota={quotaFor(subscription)} billingEnabled={features.stripe()} checkoutResult={checkout} />;
}
