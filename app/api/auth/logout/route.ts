import { clearSession } from "@/lib/auth/session";
import { handler, json } from "@/lib/utils/api";

export const POST = handler(async () => {
  await clearSession();
  return json({ ok: true });
});
