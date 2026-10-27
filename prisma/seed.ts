import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@fable.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Seed already applied (demo@fable.local exists). Skipping.");
    return;
  }
  const user = await prisma.user.create({ data: { name: "Dana Rivera", email, passwordHash: await bcrypt.hash("password123", 12) } });
  const business = await prisma.business.create({
    data: {
      ownerUserId: user.id, name: "Hill Country Fence & Yard", phone: "+1 512 555 0142", email: "hello@hillcountryfence.example", city: "Austin", state: "TX", timezone: "America/Chicago",
      serviceArea: "Austin metro, within 40 miles", status: "active",
      settings: { create: { tone: "friendly, confident, plain-spoken", taxRatePercent: 0 } },
      subscription: { create: {} },
    },
  });
  const fence = await prisma.service.create({
    data: {
      businessId: business.id, name: "Fence installation", category: "Landscaping", description: "Wood privacy fence install and full replacement, including tear-out of the old fence", pricingType: "per_unit", basePrice: 14, unitLabel: "ft", laborHoursEstimate: 12, minimumCharge: 500,
      pricingRules: { create: [
        { ruleType: "per_unit", label: "Materials", value: 14, unit: "ft" },
        { ruleType: "hourly_rate", label: "Labor", value: 65 },
        { ruleType: "markup_percent", label: "Material markup", value: 25 },
        { ruleType: "add_on", label: "Gate installation", value: 250, note: "per gate" },
        { ruleType: "fee", label: "Permit fee", value: 150 },
        { ruleType: "minimum_charge", label: "Minimum job", value: 500 },
      ] },
    },
  });
  const lawn = await prisma.service.create({
    data: {
      businessId: business.id, name: "Lawn mowing", category: "Landscaping", description: "Weekly or biweekly mowing, edging and trimming", pricingType: "flat", basePrice: 35, laborHoursEstimate: 1,
      pricingRules: { create: [
        { ruleType: "base_rate", label: "Weekly mowing", value: 35 },
        { ruleType: "add_on", label: "Edging", value: 10 },
        { ruleType: "add_on", label: "Trimming", value: 15 },
      ] },
    },
  });
  await prisma.service.create({
    data: {
      businessId: business.id, name: "Drain cleaning", category: "Plumbing", description: "Clogged sinks, tubs, and main line drain cleaning", pricingType: "hourly", basePrice: 120, laborHoursEstimate: 1.5, minimumCharge: 180,
      pricingRules: { create: [
        { ruleType: "fee", label: "Service call", value: 95 },
        { ruleType: "hourly_rate", label: "Labor", value: 120 },
        { ruleType: "minimum_charge", label: "Minimum", value: 180 },
        { ruleType: "surcharge_percent", label: "After-hours", value: 20 },
      ] },
    },
  });
  await prisma.service.create({
    data: { businessId: business.id, name: "Patio installation", category: "Landscaping", description: "Paver and flagstone patios", pricingType: "range", minPrice: 4500, maxPrice: 12000, laborHoursEstimate: 40 },
  });

  await prisma.lead.createMany({
    data: [
      { businessId: business.id, customerName: "Marcus Lee", customerPhone: "+1 512 555 0199", customerEmail: "marcus@example.com", serviceRequested: "Fence replacement", serviceId: fence.id, location: "Round Rock, TX", inquiryText: "Need a fence replaced around the backyard, about 150 ft, with one gate. We just need a rough estimate. Thanks.", source: "web_form", urgency: "normal" },
      { businessId: business.id, customerName: "Priya Natarajan", customerPhone: "+1 512 555 0177", serviceRequested: "Lawn service", serviceId: lawn.id, location: "Cedar Park, TX", inquiryText: "Looking for weekly mowing with edging for a quarter-acre lot. Can you start next week?", source: "phone", urgency: "high" },
      { businessId: business.id, customerName: "Tom Alvarez", customerEmail: "tom.alvarez@example.com", serviceRequested: "Kitchen sink clogged", location: "Austin, TX", inquiryText: "Kitchen sink is completely backed up tonight, water won't drain at all. Can someone come out after hours?", source: "manual", urgency: "emergency" },
      { businessId: business.id, customerName: "Grace Okafor", customerPhone: "+1 512 555 0133", customerEmail: "grace@example.com", serviceRequested: "Backyard patio", location: "Pflugerville, TX", inquiryText: "Thinking about a paver patio, roughly 300 sq ft, with a small seating wall. What would that run?", source: "referral", urgency: "low", budgetEstimate: 8000 },
    ],
  });
  console.log("Seeded demo account: demo@fable.local / password123");
}

main().finally(() => prisma.$disconnect());
