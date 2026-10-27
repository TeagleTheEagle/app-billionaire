"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { LogoMark } from "@/components/common/Logo";

const nav = [
  { href: "/dashboard", label: "Overview", icon: "▦" },
  { href: "/dashboard/leads", label: "Leads", icon: "👤" },
  { href: "/dashboard/quotes", label: "Quotes", icon: "🧾" },
  { href: "/dashboard/appointments", label: "Appointments", icon: "📅" },
];
const settings = [
  { href: "/settings/profile", label: "Business profile" },
  { href: "/settings/services", label: "Services" },
  { href: "/settings/pricing", label: "Pricing rules" },
  { href: "/settings/templates", label: "Templates" },
  { href: "/settings/notifications", label: "Notifications" },
  { href: "/settings/billing", label: "Billing" },
];

export function SidebarNavigation({ businessName, newLeads }: { businessName: string; newLeads: number }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
        <LogoMark size={32} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{businessName}</p>
          <p className="text-[11px] font-semibold tracking-tight text-brand-900">Fable</p>
        </div>
      </div>
      <nav className="flex-1 space-y-6 px-3 py-4">
        <ul className="space-y-1">
          {nav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={cn("flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium", active(item.href) ? "bg-brand-50 text-brand-800" : "text-slate-700 hover:bg-slate-100")}>
                <span className="flex items-center gap-2">
                  <span className="w-5 text-center" aria-hidden>{item.icon}</span>
                  {item.label}
                </span>
                {item.label === "Leads" && newLeads > 0 && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-800">{newLeads}</span>}
              </Link>
            </li>
          ))}
        </ul>
        <div>
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Settings</p>
          <ul className="space-y-0.5">
            {settings.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={cn("block rounded-lg px-3 py-1.5 text-sm", active(item.href) ? "bg-brand-50 font-medium text-brand-800" : "text-slate-600 hover:bg-slate-100")}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <div className="border-t border-slate-200 p-3">
        <Link href="/dashboard/leads/new" className="flex h-10 items-center justify-center rounded-lg bg-brand-700 text-sm font-medium text-white hover:bg-brand-800">
          + New lead
        </Link>
      </div>
    </aside>
  );
}
