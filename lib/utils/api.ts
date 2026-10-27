import { NextResponse } from "next/server";
import { ZodError, type ZodType, type output as ZodOutput } from "zod";
import { ApiAuthError } from "@/lib/auth/current";

export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorResponse(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
      { status: 422 },
    );
  }
  if (err instanceof ApiAuthError || err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[api] unhandled error", err);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}

/** Wrap a route handler so thrown errors become JSON responses. */
export function handler<Ctx>(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export async function parseBody<S extends ZodType>(req: Request, schema: S): Promise<ZodOutput<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError("Request body must be JSON", 400);
  }
  return schema.parse(raw) as ZodOutput<S>;
}

export async function routeParams<T extends Record<string, string>>(ctx: { params: Promise<T> }) {
  return ctx.params;
}
