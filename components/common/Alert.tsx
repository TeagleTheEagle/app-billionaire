export function Alert({ tone = "info", title, children }: { tone?: "info" | "warn" | "error" | "success"; title?: string; children: React.ReactNode }) {
  const cls = { info: "border-sky-200 bg-sky-50 text-sky-900", warn: "border-amber-200 bg-amber-50 text-amber-900", error: "border-red-200 bg-red-50 text-red-900", success: "border-emerald-200 bg-emerald-50 text-emerald-900" }[tone];
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${cls}`}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-0.5" : ""}>{children}</div>
    </div>
  );
}
