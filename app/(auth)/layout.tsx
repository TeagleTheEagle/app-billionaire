import { Logo } from "@/components/common/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <Logo size={40} className="mb-6" />
      {children}
    </div>
  );
}
