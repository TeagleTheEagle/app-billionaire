import { requireApiBusiness } from "@/lib/auth/current";
import { handler, json } from "@/lib/utils/api";
import { listMessages } from "@/services/message-service";

export const GET = handler(async (req) => {
  const { business } = await requireApiBusiness();
  const leadId = new URL(req.url).searchParams.get("leadId") ?? undefined;
  return json({ messages: await listMessages(business.id, leadId) });
});
