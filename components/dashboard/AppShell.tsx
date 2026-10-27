import { SidebarNavigation } from "@/components/dashboard/SidebarNavigation";
import { TopBar } from "@/components/dashboard/TopBar";
import { ToastProvider } from "@/components/common/Toast";

export function AppShell({ children, user, business, newLeads }: { children: React.ReactNode; user: { name: string; email: string }; business: { name: string }; newLeads: number }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <SidebarNavigation businessName={business.name} newLeads={newLeads} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar user={user} newLeads={newLeads} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
