import { requireApiBusiness } from "@/lib/auth/current";
import { handler, json } from "@/lib/utils/api";
import { listServices } from "@/services/business-service";

export const GET = handler(async () => {
  const { business } = await requireApiBusiness();
  const services = await listServices(business.id);
  return json({ services, rules: services.flatMap((s) => s.pricingRules.map((r) => ({ ...r, serviceName: s.name }))) });
});
