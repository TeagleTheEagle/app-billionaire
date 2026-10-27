import { z } from "zod";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export const businessSchema = z.object({
  name: z.string().trim().min(2, "Business name is required").max(120),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().optional().nullable().or(z.literal("")),
  address: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  state: z.string().trim().max(40).optional().nullable(),
  country: z.string().trim().max(40).optional(),
  timezone: z.string().trim().max(60).optional(),
  serviceArea: z.string().trim().max(200).optional().nullable(),
  website: z.string().trim().max(200).optional().nullable(),
});

export const settingsSchema = z.object({
  brandPrimaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  brandSecondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoUrl: z.string().url().optional().nullable().or(z.literal("")),
  tone: z.string().trim().max(120).optional(),
  defaultQuoteTerms: z.string().trim().max(2000).optional(),
  defaultFollowUpText: z.string().trim().max(600).optional(),
  defaultFollowUpEmail: z.string().trim().max(5000).optional(),
  defaultBookingUrl: z.string().trim().max(300).optional().nullable().or(z.literal("")),
  autoSendQuotes: z.boolean().optional(),
  autoSendFollowUps: z.boolean().optional(),
  notifyNewLeadEmail: z.boolean().optional(),
  notifyBookingEmail: z.boolean().optional(),
  taxRatePercent: z.number().min(0).max(30).optional(),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).optional().nullable(),
  pricingType: z.enum(["flat", "hourly", "per_unit", "range", "quote_on_site"]).default("flat"),
  basePrice: z.number().min(0).optional().nullable(),
  minPrice: z.number().min(0).optional().nullable(),
  maxPrice: z.number().min(0).optional().nullable(),
  unitLabel: z.string().trim().max(30).optional().nullable(),
  laborHoursEstimate: z.number().min(0).max(500).optional().nullable(),
  minimumCharge: z.number().min(0).optional().nullable(),
  active: z.boolean().optional(),
});

export const pricingRuleSchema = z.object({
  serviceId: z.string().min(1),
  ruleType: z.enum(["base_rate", "hourly_rate", "per_unit", "minimum_charge", "add_on", "markup_percent", "surcharge_percent", "fee"]),
  label: z.string().trim().min(1).max(120),
  value: z.number().min(0),
  unit: z.string().trim().max(30).optional().nullable(),
  note: z.string().trim().max(300).optional().nullable(),
  active: z.boolean().optional(),
});

export async function createBusiness(userId: string, input: z.infer<typeof businessSchema>) {
  const business = await prisma.business.create({
    data: {
      ownerUserId: userId,
      ...clean(input),
      settings: { create: {} },
      subscription: { create: {} },
    },
    include: { settings: true, subscription: true },
  });
  await logActivity({ businessId: business.id, userId, entityType: "business", entityId: business.id, action: "created" });
  return business;
}

export async function updateBusiness(businessId: string, userId: string, input: Partial<z.infer<typeof businessSchema>>) {
  const business = await prisma.business.update({ where: { id: businessId }, data: clean(input) });
  await logActivity({ businessId, userId, entityType: "business", entityId: businessId, action: "updated" });
  return business;
}

export async function updateSettings(businessId: string, input: z.infer<typeof settingsSchema>) {
  const data = { ...input, logoUrl: input.logoUrl === "" ? null : input.logoUrl, defaultBookingUrl: input.defaultBookingUrl === "" ? null : input.defaultBookingUrl };
  return prisma.businessSettings.upsert({ where: { businessId }, update: data, create: { businessId, ...data } });
}

export async function listServices(businessId: string) {
  return prisma.service.findMany({ where: { businessId }, include: { pricingRules: { orderBy: { createdAt: "asc" } } }, orderBy: [{ category: "asc" }, { name: "asc" }] });
}

export async function createService(businessId: string, userId: string, input: z.infer<typeof serviceSchema>) {
  const service = await prisma.service.create({ data: { businessId, ...input }, include: { pricingRules: true } });
  await logActivity({ businessId, userId, entityType: "service", entityId: service.id, action: "created", metadata: { name: service.name } });
  return service;
}

export async function updateService(businessId: string, serviceId: string, input: Partial<z.infer<typeof serviceSchema>>) {
  const existing = await prisma.service.findFirst({ where: { id: serviceId, businessId } });
  if (!existing) return null;
  return prisma.service.update({ where: { id: serviceId }, data: input, include: { pricingRules: true } });
}

export async function deleteService(businessId: string, serviceId: string) {
  const existing = await prisma.service.findFirst({ where: { id: serviceId, businessId } });
  if (!existing) return false;
  await prisma.service.delete({ where: { id: serviceId } });
  return true;
}

export async function createPricingRule(businessId: string, input: z.infer<typeof pricingRuleSchema>) {
  const service = await prisma.service.findFirst({ where: { id: input.serviceId, businessId } });
  if (!service) return null;
  return prisma.pricingRule.create({ data: input });
}

export async function updatePricingRule(businessId: string, ruleId: string, input: Partial<Omit<z.infer<typeof pricingRuleSchema>, "serviceId">>) {
  const rule = await prisma.pricingRule.findFirst({ where: { id: ruleId, service: { businessId } } });
  if (!rule) return null;
  return prisma.pricingRule.update({ where: { id: ruleId }, data: input });
}

export async function deletePricingRule(businessId: string, ruleId: string) {
  const rule = await prisma.pricingRule.findFirst({ where: { id: ruleId, service: { businessId } } });
  if (!rule) return false;
  await prisma.pricingRule.delete({ where: { id: ruleId } });
  return true;
}

function clean<T extends Record<string, unknown>>(input: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) out[k] = v === "" ? null : v;
  return out as T;
}
