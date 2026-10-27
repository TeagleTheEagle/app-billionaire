import { requireApiBusiness } from "@/lib/auth/current";
import { handler, json } from "@/lib/utils/api";
import { createPortalSession } from "@/services/billing-service";

export const POST = handler(async () => {
  const { business } = await requireApiBusiness();
  return json({ url: await createPortalSession(business.id) });
});
