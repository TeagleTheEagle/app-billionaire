export function Avatar({ name, size = 8 }: { name: string; size?: 8 | 10 }) {
  const initials = name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <span className={`inline-flex h-${size} w-${size} shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800`} aria-hidden>
      {initials || "?"}
    </span>
  );
}
