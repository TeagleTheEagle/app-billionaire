"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { api } from "@/lib/client/api";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await api<{ next: string }>(`/api/auth/${mode}`, { body: Object.fromEntries(fd.entries()) });
      const next = params.get("next");
      router.push(next && next.startsWith("/") ? next : res.next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-6">
      <div>
        <h1 className="text-xl font-semibold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-slate-500">{mode === "login" ? "Sign in to your Fable 5.1 workspace." : "10 free AI quotes. No card required."}</p>
      </div>
      {mode === "signup" && (
        <FormField label="Your name" htmlFor="name" required><input id="name" name="name" className="input" required autoComplete="name" /></FormField>
      )}
      <FormField label="Email" htmlFor="email" required><input id="email" name="email" type="email" className="input" required autoComplete="email" /></FormField>
      <FormField label="Password" htmlFor="password" required help={mode === "signup" ? "At least 8 characters" : undefined}>
        <input id="password" name="password" type="password" className="input" required minLength={mode === "signup" ? 8 : 1} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
      </FormField>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" loading={loading}>{mode === "login" ? "Sign in" : "Create account"}</Button>
      <p className="text-center text-sm text-slate-500">
        {mode === "login" ? (
          <>New here? <Link href="/signup" className="font-medium text-brand-700 hover:underline">Create an account</Link></>
        ) : (
          <>Already have an account? <Link href="/login" className="font-medium text-brand-700 hover:underline">Sign in</Link></>
        )}
      </p>
    </form>
  );
}
