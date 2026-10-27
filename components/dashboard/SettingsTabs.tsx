"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  ["/settings/profile", "Profile"],
  ["/settings/services", "Services"],
  ["/settings/pricing", "Pricing"],
  ["/settings/templates", "Templates"],
  ["/settings/notifications", "Notifications"],
  ["/settings/billing", "Billing"],
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav className="mt-4 flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map(([href, label]) => (
        <Link key={href} href={href} className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${pathname.startsWith(href) ? "border-brand-700 text-brand-800" : "border-transparent text-slate-600 hover:text-slate-900"}`}>{label}</Link>
      ))}
    </nav>
  );
}
