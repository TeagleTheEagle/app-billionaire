"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/common/Avatar";
import { api } from "@/lib/client/api";

export function TopBar({ user, newLeads }: { user: { name: string; email: string }; newLeads: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  async function logout() {
    await api("/api/auth/logout", { method: "POST", body: {} });
    router.push("/login");
    router.refresh();
  }
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3 md:hidden">
        <Link href="/dashboard" className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white">F</Link>
        <nav className="flex gap-3 text-sm font-medium text-slate-700">
          <Link href="/dashboard/leads">Leads</Link>
          <Link href="/dashboard/quotes">Quotes</Link>
          <Link href="/dashboard/appointments">Calendar</Link>
          <Link href="/settings/profile">Settings</Link>
        </nav>
      </div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-3">
        <Link href="/dashboard/leads?status=new" className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100" aria-label={`${newLeads} new leads`}>
          🔔
          {newLeads > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{newLeads}</span>}
        </Link>
        <div className="relative">
          <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-slate-100">
            <Avatar name={user.name} />
            <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg" onMouseLeave={() => setOpen(false)}>
              <p className="truncate px-3 py-2 text-xs text-slate-500">{user.email}</p>
              <Link href="/settings/profile" className="block px-3 py-2 text-sm hover:bg-slate-50">Settings</Link>
              <button onClick={logout} className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-slate-50">Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
