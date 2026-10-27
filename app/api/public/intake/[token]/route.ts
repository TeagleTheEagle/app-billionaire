import { prisma } from "@/lib/db";
import { handler, HttpError, json, parseBody } from "@/lib/utils/api";
import { createLead, leadSchema } from "@/services/lead-service";

type Ctx = { params: Promise<{ token: string }> };

const intakeSchema = leadSchema.pick({ customerName: true, customerEmail: true, customerPhone: true, serviceRequested: true, location: true, inquiryText: true, urgency: true, budgetEstimate: true });

/** Public lead intake: used by the hosted web form and by API integrations (source=api). */
export const POST = handler<Ctx>(async (req, ctx) => {
  const { token } = await ctx.params;
  const business = await prisma.business.findUnique({ where: { intakeToken: token } });
  if (!business) throw new HttpError("Unknown intake link", 404);
  const input = await parseBody(req, intakeSchema);
  if (!input.customerEmail && !input.customerPhone) throw new HttpError("Provide a phone number or email so we can reply", 422);
  const source = req.headers.get("x-lead-source") === "api" ? "api" : "web_form";
  const lead = await createLead(business.id, null, { ...input, source });
  return json({ ok: true, leadId: lead.id }, { status: 201 });
});
