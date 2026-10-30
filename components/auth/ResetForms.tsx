"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { api } from "@/lib/client/api";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api("/api/auth/forgot", { body: { email: new FormData(e.currentTarget).get("email") } });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }
  return (
    <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-6">
      <div>
        <h1 className="text-xl font-semibold">Reset your password</h1>
        <p className="mt-1 text-sm text-slate-500">Enter your email and we&apos;ll send a link that works for one hour.</p>
      </div>
      {done ? (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">If an account exists for that email, a reset link is on its way. Check your spam folder too.</p>
      ) : (
        <>
          <FormField label="Email" htmlFor="email" required><input id="email" name="email" type="email" className="input" required autoComplete="email" /></FormField>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>Send reset link</Button>
        </>
      )}
      <p className="text-center text-sm text-slate-500"><Link href="/login" className="font-medium text-brand-700 hover:underline">Back to sign in</Link></p>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("password") !== fd.get("confirm")) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ next: string }>("/api/auth/reset", { body: { token, password: fd.get("password") } });
      router.push(res.next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }
  if (!token) {
    return (
      <div className="card w-full max-w-md space-y-3 p-6 text-center">
        <h1 className="text-xl font-semibold">Missing reset link</h1>
        <p className="text-sm text-slate-500">Open the link from your email, or <Link href="/forgot-password" className="text-brand-700 hover:underline">request a new one</Link>.</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-6">
      <div>
        <h1 className="text-xl font-semibold">Choose a new password</h1>
        <p className="mt-1 text-sm text-slate-500">You&apos;ll be signed in right after.</p>
      </div>
      <FormField label="New password" htmlFor="password" required help="At least 8 characters"><input id="password" name="password" type="password" className="input" required minLength={8} autoComplete="new-password" /></FormField>
      <FormField label="Confirm password" htmlFor="confirm" required><input id="confirm" name="confirm" type="password" className="input" required minLength={8} autoComplete="new-password" /></FormField>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" loading={loading}>Set password and sign in</Button>
    </form>
  );
}
