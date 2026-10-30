import { z } from "zod";
import { handler, json, parseBody } from "@/lib/utils/api";
import { startPasswordReset } from "@/lib/auth/reset";

export const POST = handler(async (req) => {
  const { email } = await parseBody(req, z.object({ email: z.string().trim().toLowerCase().email() }));
  await startPasswordReset(email);
  return json({ ok: true });
});
