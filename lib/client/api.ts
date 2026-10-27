"use client";

export class ApiError extends Error {
  status: number;
  issues?: Array<{ path: string; message: string }>;
  constructor(message: string, status: number, issues?: Array<{ path: string; message: string }>) {
    super(message);
    this.status = status;
    this.issues = issues;
  }
}

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers: init.body ? { "Content-Type": "application/json" } : undefined,
    body: init.body ? JSON.stringify(init.body) : undefined,
    credentials: "same-origin",
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; issues?: Array<{ path: string; message: string }> } & T;
  if (!res.ok) {
    const msg = data.issues?.length ? data.issues.map((i) => `${i.path ? i.path + ": " : ""}${i.message}`).join(", ") : (data.error ?? `Request failed (${res.status})`);
    throw new ApiError(msg, res.status, data.issues);
  }
  return data;
}
