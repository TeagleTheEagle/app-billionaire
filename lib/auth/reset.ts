import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/messaging/email";

const TOKEN_TTL_MS = 60 * 60 * 1000;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Always resolves; never reveals whether the email exists. */
export async function startPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MS) } });
  const link = `${env.appUrl}/reset-password?token=${token}`;
  const result = await sendEmail(
    user.email,
    "Reset your Fable password",
    `Hi ${user.name.split(" ")[0]},\n\nSomeone asked to reset the password for this account. If that was you, open this link within the next hour:\n\n${link}\n\nIf it wasn't you, ignore this email and nothing changes.\n\nFable`,
  );
  if (result.status === "simulated") console.info(`[reset:simulated] ${link}`);
  if (result.status === "failed") console.error("[reset] email failed", result.error);
}

export async function consumeResetToken(token: string) {
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  await prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
  return row.user;
}
