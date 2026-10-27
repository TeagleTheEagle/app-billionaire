import { z } from "zod";

export const QuoteOutputSchema = z.object({
  serviceType: z.string().describe("Short name of the service being quoted"),
  lineItems: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().nullable(),
        quantity: z.number(),
        unitPrice: z.number(),
        total: z.number(),
      }),
    )
    .describe("Itemized breakdown. Totals must sum to subtotal."),
  subtotal: z.number(),
  tax: z.number(),
  total: z.number(),
  priceLow: z.number().nullable().describe("Low end of a range when exact pricing is not possible, else null"),
  priceHigh: z.number().nullable().describe("High end of a range when exact pricing is not possible, else null"),
  confidence: z.enum(["high", "medium", "low"]),
  assumptions: z.array(z.string()).describe("Plain-language assumptions the estimate depends on"),
  terms: z.string(),
  customerMessage: z.string().describe("SMS-length customer message (under 320 characters) with a clear call to action"),
  emailSubject: z.string(),
  emailBody: z.string().describe("Friendly plain-text email with the estimate summary and a call to action"),
  internalNotes: z.string().describe("Private notes for the business owner: risks, missing info, upsell ideas"),
});

export type QuoteOutput = z.infer<typeof QuoteOutputSchema>;
