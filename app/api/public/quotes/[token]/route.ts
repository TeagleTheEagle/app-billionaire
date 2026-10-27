import { prisma } from "@/lib/db";
import { handler, HttpError, json } from "@/lib/utils/api";

type Ctx = { params: Promise<{ token: string }> };

export const GET = handler<Ctx>(async (_req, ctx) => {
  const { token } = await ctx.params;
  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    include: { lead: { select: { customerName: true, status: true } }, business: { select: { name: true, phone: true, email: true, settings: { select: { brandPrimaryColor: true, logoUrl: true } } } } },
  });
  if (!quote || quote.status === "draft" || quote.status === "rejected") throw new HttpError("Quote not available", 404);
  return json({ quote });
});
