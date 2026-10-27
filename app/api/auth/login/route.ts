import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { handler, HttpError, json, parseBody } from "@/lib/utils/api";

const schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

export const POST = handler(async (req) => {
  const input = await parseBody(req, schema);
  const user = await prisma.user.findUnique({ where: { email: input.email }, include: { businesses: { take: 1 } } });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new HttpError("Incorrect email or password", 401);
  }
  await createSession({ sub: user.id, email: user.email });
  return json({ user: { id: user.id, name: user.name, email: user.email }, next: user.businesses.length ? "/dashboard" : "/onboarding" });
});
