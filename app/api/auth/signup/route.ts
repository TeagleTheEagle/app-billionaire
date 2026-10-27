import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { handler, HttpError, json, parseBody } from "@/lib/utils/api";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const POST = handler(async (req) => {
  const input = await parseBody(req, schema);
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new HttpError("An account with that email already exists", 409);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash: await hashPassword(input.password) },
  });
  await createSession({ sub: user.id, email: user.email });
  return json({ user: { id: user.id, name: user.name, email: user.email }, next: "/onboarding" }, { status: 201 });
});
