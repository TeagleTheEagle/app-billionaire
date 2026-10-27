import { getSession, createSession } from "@/lib/auth/session";
import { handler, HttpError, json } from "@/lib/utils/api";

export const POST = handler(async () => {
  const session = await getSession();
  if (!session) throw new HttpError("Not signed in", 401);
  await createSession(session);
  return json({ ok: true });
});
