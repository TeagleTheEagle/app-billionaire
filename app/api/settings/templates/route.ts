import { requireApiBusiness } from "@/lib/auth/current";
import { handler, json, parseBody } from "@/lib/utils/api";
import { settingsSchema, updateSettings } from "@/services/business-service";

const templateSchema = settingsSchema.pick({ defaultFollowUpText: true, defaultFollowUpEmail: true, defaultQuoteTerms: true, tone: true });

export const POST = handler(async (req) => {
  const { business } = await requireApiBusiness();
  const input = await parseBody(req, templateSchema);
  return json({ settings: await updateSettings(business.id, input) });
});
