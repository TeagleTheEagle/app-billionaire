import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetForms";

export const metadata: Metadata = { title: "New password" };

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordForm /></Suspense>;
}
