import { z } from "zod";
import { requireApiBusiness } from "@/lib/auth/current";
import { handler, json, parseBody } from "@/lib/utils/api";
import { createCheckoutSession } from "@/services/billing-service";

export const POST = handler(async (req) => {
  const { user, business } = await requireApiBusiness();
  const { plan } = await parseBody(req, z.object({ plan: z.enum(["starter", "pro", "growth"]) }));
  const url = await createCheckoutSession(business.id, user.id, plan);
  return json({ url });
});
