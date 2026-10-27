import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Fable 5.1 — AI quotes and booking for local service businesses", template: "%s · Fable 5.1" },
  description: "Turn customer inquiries into accurate estimates, follow-up messages, and booked appointments automatically.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
