import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { IntakeForm } from "@/components/public/IntakeForm";

export const metadata: Metadata = { title: "Request an estimate" };

export default async function IntakePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const business = await prisma.business.findUnique({ where: { intakeToken: token }, include: { settings: true, services: { where: { active: true }, orderBy: { name: "asc" } } } });
  if (!business) notFound();
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white" style={{ background: business.settings?.brandPrimaryColor ?? "#0f766e" }}>{business.name[0]}</span>
          <h1 className="mt-3 text-2xl font-semibold">Request an estimate from {business.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{business.serviceArea ? `Serving ${business.serviceArea}. ` : ""}We reply fast with a real number.</p>
        </header>
        <IntakeForm token={token} businessName={business.name} color={business.settings?.brandPrimaryColor ?? "#0f766e"} services={business.services.map((s) => s.name)} />
        <p className="text-center text-xs text-slate-400">Powered by Fable 5.1</p>
      </div>
    </div>
  );
}
