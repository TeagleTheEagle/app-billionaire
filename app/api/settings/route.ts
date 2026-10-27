import { requireApiBusiness } from "@/lib/auth/current";
import { prisma } from "@/lib/db";
import { handler, json, parseBody } from "@/lib/utils/api";
import { settingsSchema, updateSettings } from "@/services/business-service";

export const GET = handler(async () => {
  const { business } = await requireApiBusiness();
  const settings = await prisma.businessSettings.upsert({ where: { businessId: business.id }, update: {}, create: { businessId: business.id } });
  return json({ settings });
});

export const PUT = handler(async (req) => {
  const { business } = await requireApiBusiness();
  const input = await parseBody(req, settingsSchema);
  return json({ settings: await updateSettings(business.id, input) });
});
