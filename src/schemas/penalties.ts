import { z } from "zod";

export const penaltiesInputSchema = z.object({
  violation_type: z.enum(["prohibited", "high_risk", "gpai", "false_info"]).describe("Type of AI Act violation: 'prohibited' (Art. 5), 'high_risk' (Art. 99(4) operator/notified-body/transparency obligations), 'gpai' (Art. 101 general-purpose AI model provider infringements), or 'false_info' (Art. 99(5) misleading notified bodies or national competent authorities; GPAI-provider false information falls under Art. 101)"),
  annual_turnover_eur: z
    .number()
    .finite()
    .nonnegative()
    .describe("Global annual turnover in EUR (a non-negative, finite number)"),
  is_sme: z.boolean().optional().default(false).describe("Whether the entity is an SME or startup (eligible for lower fines under Art. 99(6), covering paragraphs 3, 4 and 5)"),
  is_smc: z.boolean().optional().default(false).describe("Whether the entity is a small mid-cap (SMC): Art. 99(6a) applies the lower-of rule ONLY to the Art. 99(4) and 99(5) tiers, not to Art. 99(3) prohibited-practice fines and not to Art. 101"),
}).strict();

export const penaltiesOutputSchema = z.object({
  violation_type: z.string(),
  is_sme: z.boolean(),
  is_smc: z.boolean(),
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
