import { z } from "zod";

export const penaltiesInputSchema = z.object({
  violation_type: z.enum(["prohibited", "high_risk", "false_info"]).describe("Type of AI Act violation: 'prohibited' (Art. 5), 'high_risk' (Annex III obligations), or 'false_info' (misleading regulators)"),
  annual_turnover_eur: z.number().describe("Global annual turnover in EUR"),
  is_sme: z.boolean().optional().default(false).describe("Whether the entity is an SME or startup (eligible for lower fines under Art. 99(6))"),
});

export const penaltiesOutputSchema = z.object({
  violation_type: z.string(),
  is_sme: z.boolean(),
  annual_turnover_eur: z.number(),
  max_fine: z.object({
    fixed_cap_eur: z.number(),
    turnover_based_eur: z.number(),
    applicable_fine_eur: z.number(),
    explanation: z.string(),
  }),
  tier_details: z.object({
    name: z.string(),
    article: z.string(),
    description: z.string(),
  }),
  comparative: z
    .object({
      non_sme_applicable_fine_eur: z.number(),
      sme_applicable_fine_eur: z.number(),
      reduction_eur: z.number(),
    })
    .optional(),
});

export type PenaltiesInput = z.infer<typeof penaltiesInputSchema>;
export type PenaltiesOutput = z.infer<typeof penaltiesOutputSchema>;
