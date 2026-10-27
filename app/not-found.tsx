import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-5xl">🤷</p>
      <h1 className="text-xl font-semibold">That page doesn’t exist</h1>
      <p className="text-sm text-slate-500">The link may have expired or been typed wrong.</p>
      <Link href="/" className="text-sm font-medium text-brand-700 hover:underline">Back home</Link>
    </div>
  );
}
