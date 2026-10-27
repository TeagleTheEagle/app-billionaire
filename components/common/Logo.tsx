import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/** Fable mark: a speech bubble with an approved check. Navy tile, white bubble, amber check. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Fable" className={cn("shrink-0", className)}>
      <rect width="64" height="64" rx="15" fill="#1b2559" />
      <path d="M21 15h22a9 9 0 0 1 9 9v13a9 9 0 0 1-9 9H29.5L20 54v-8.2A9 9 0 0 1 12 37V24a9 9 0 0 1 9-9z" fill="#ffffff" />
      <path d="M23.5 31.5l6.5 6.5 11.5-12.5" fill="none" stroke="#f4a61d" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ className, light }: { className?: string; light?: boolean }) {
  return <span className={cn("text-[1.15rem] font-bold tracking-tight", light ? "text-white" : "text-brand-900", className)}>Fable</span>;
}

export function Logo({ size = 32, href = "/", light, className, wordmark = true }: { size?: number; href?: string | null; light?: boolean; className?: string; wordmark?: boolean }) {
  const inner = (
    <>
      <LogoMark size={size} />
      {wordmark && <Wordmark light={light} />}
    </>
  );
  const classes = cn("inline-flex items-center gap-2.5", className);
  return href ? <Link href={href} className={classes}>{inner}</Link> : <span className={classes}>{inner}</span>;
}
