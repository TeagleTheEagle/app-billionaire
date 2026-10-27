import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/current";
import { listServices } from "@/services/business-service";
import { OnboardingWizard } from "@/components/forms/OnboardingWizard";

export const metadata: Metadata = { title: "Get started" };

export default async function OnboardingPage() {
  const user = await requireUser();
  const services = user.business ? await listServices(user.business.id) : [];
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto mb-8 flex max-w-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white">F</span>Fable 5.1</Link>
        {user.business && <Link href="/dashboard" className="text-sm text-brand-700 hover:underline">Skip to dashboard →</Link>}
      </div>
      <OnboardingWizard hasBusiness={Boolean(user.business)} services={JSON.parse(JSON.stringify(services))} />
    </div>
  );
}
