import { requireBusiness } from "@/lib/auth/current";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/dashboard/AppShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, business } = await requireBusiness();
  const newLeads = await prisma.lead.count({ where: { businessId: business.id, status: "new" } });
  return (
    <AppShell user={{ name: user.name, email: user.email }} business={{ name: business.name }} newLeads={newLeads}>
      {children}
    </AppShell>
  );
}
