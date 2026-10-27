import { requireApiBusiness } from "@/lib/auth/current";
import { handler, json, parseBody } from "@/lib/utils/api";
import { sendMessage, sendMessageSchema } from "@/services/message-service";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handler<Ctx>(async (req, ctx) => {
  const { user, business } = await requireApiBusiness();
  const { id } = await ctx.params;
  const input = await parseBody(req, sendMessageSchema.omit({ leadId: true }));
  const message = await sendMessage(business.id, user.id, { ...input, leadId: id });
  return json({ message }, { status: 201 });
});
