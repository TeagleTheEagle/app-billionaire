import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ResetForms";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
