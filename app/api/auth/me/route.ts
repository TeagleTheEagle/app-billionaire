import { getCurrentUser } from "@/lib/auth/current";
import { handler, json } from "@/lib/utils/api";

export const GET = handler(async () => {
  const user = await getCurrentUser();
  if (!user) return json({ user: null });
  return json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, business: user.business ? { id: user.business.id, name: user.business.name } : null });
});
