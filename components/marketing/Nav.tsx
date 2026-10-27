import Link from "next/link";
import { Button } from "@/components/common/Button";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white">F</span>
          Fable 5.1
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
          <Link href="/features" className="hover:text-slate-900">Features</Link>
          <Link href="/pricing" className="hover:text-slate-900">Pricing</Link>
          <Link href="/demo" className="hover:text-slate-900">Demo</Link>
          <Link href="/faq" className="hover:text-slate-900">FAQ</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button href="/login" variant="ghost" size="sm">Log in</Button>
          <Button href="/signup" size="sm">Start free</Button>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} Fable 5.1 · AI quotes and booking for local service businesses</p>
        <div className="flex gap-4">
          <Link href="/features">Features</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/login">Log in</Link>
        </div>
      </div>
    </footer>
  );
}
