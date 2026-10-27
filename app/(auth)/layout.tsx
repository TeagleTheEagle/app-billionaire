import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <Link href="/" className="mb-6 flex items-center gap-2 font-semibold">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white">F</span>
        Fable 5.1
      </Link>
      {children}
    </div>
  );
}
