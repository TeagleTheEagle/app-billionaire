import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { consumeResetToken } from "@/lib/auth/reset";
import { createSession } from "@/lib/auth/session";
import { handler, HttpError, json, parseBody } from "@/lib/utils/api";

const schema = z.object({ token: z.string().min(10), password: z.string().min(8, "Password must be at least 8 characters").max(200) });

export const POST = handler(async (req) => {
  const { token, password } = await parseBody(req, schema);
  const user = await consumeResetToken(token);
  if (!user) throw new HttpError("That reset link is invalid or has expired. Request a new one.", 400);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
  await prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
  await createSession({ sub: user.id, email: user.email });
  const hasBusiness = await prisma.business.count({ where: { ownerUserId: user.id } });
  return json({ ok: true, next: hasBusiness ? "/dashboard" : "/onboarding" });
});
