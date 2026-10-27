import { prisma } from "@/lib/db";

export async function getDashboardStats(businessId: string) {
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [total, byStatus, sentQuotes, wonQuotes, recentActivity, upcoming, recentLeads] = await Promise.all([
    prisma.lead.count({ where: { businessId } }),
    prisma.lead.groupBy({ by: ["status"], where: { businessId }, _count: { _all: true } }),
    prisma.quote.aggregate({ where: { businessId, status: "sent", createdAt: { gte: since30 } }, _sum: { totalPrice: true }, _count: { _all: true } }),
    prisma.quote.aggregate({ where: { businessId, lead: { status: { in: ["booked", "won"] } }, status: "sent" }, _sum: { totalPrice: true } }),
    prisma.activityLog.findMany({ where: { businessId }, orderBy: { createdAt: "desc" }, take: 12, include: { user: { select: { name: true } } } }),
    prisma.appointment.findMany({ where: { businessId, scheduledAt: { gte: new Date() }, status: { in: ["pending", "confirmed"] } }, orderBy: { scheduledAt: "asc" }, take: 5, include: { lead: true } }),
    prisma.lead.findMany({ where: { businessId }, orderBy: { createdAt: "desc" }, take: 6, include: { quotes: { orderBy: { createdAt: "desc" }, take: 1 } } }),
  ]);
  const count = (s: string) => byStatus.find((b) => b.status === s)?._count._all ?? 0;
  return {
    totalLeads: total,
    newLeads: count("new"),
    quoteSent: count("quote_sent"),
    booked: count("booked") + count("won"),
    lost: count("lost"),
    pipelineValue: sentQuotes._sum.totalPrice ?? 0,
    quotesSent30d: sentQuotes._count._all,
    bookedRevenue: wonQuotes._sum.totalPrice ?? 0,
    recentActivity,
    upcoming,
    recentLeads,
  };
}
