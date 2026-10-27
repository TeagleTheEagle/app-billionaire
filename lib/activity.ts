import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function logActivity(input: {
  businessId: string;
  userId?: string | null;
  entityType: "lead" | "quote" | "message" | "appointment" | "business" | "service" | "subscription";
  entityId: string;
  action: string;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        businessId: input.businessId,
        userId: input.userId ?? null,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        metadataJson: input.metadata ?? undefined,
      },
    });
  } catch (err) {
    console.error("[activity] failed to log", err);
  }
}
