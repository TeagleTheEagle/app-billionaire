import { requireApiBusiness, requireApiUser } from "@/lib/auth/current";
import { prisma } from "@/lib/db";
import { handler, HttpError, json, parseBody } from "@/lib/utils/api";
import { businessSchema, createBusiness, updateBusiness } from "@/services/business-service";

export const GET = handler(async () => {
  const { business } = await requireApiBusiness();
  return json({ business });
});

export const POST = handler(async (req) => {
  const user = await requireApiUser();
  if (user.business) throw new HttpError("You already have a business profile", 409);
  const input = await parseBody(req, businessSchema);
  const business = await createBusiness(user.id, input);
  return json({ business }, { status: 201 });
});

export const PUT = handler(async (req) => {
  const { user, business } = await requireApiBusiness();
  const input = await parseBody(req, businessSchema.partial());
  const updated = await updateBusiness(business.id, user.id, input);
  const withSettings = await prisma.business.findUnique({ where: { id: updated.id }, include: { settings: true } });
  return json({ business: withSettings });
});
