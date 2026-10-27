import { requireApiBusiness } from "@/lib/auth/current";
import { handler, json, parseBody } from "@/lib/utils/api";
import { sendMessage, sendMessageSchema } from "@/services/message-service";

export const POST = handler(async (req) => {
  const { user, business } = await requireApiBusiness();
  const input = await parseBody(req, sendMessageSchema);
  return json({ message: await sendMessage(business.id, user.id, input) }, { status: 201 });
});
