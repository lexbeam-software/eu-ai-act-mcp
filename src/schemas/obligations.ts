import { z } from "zod";

export const obligationsInputSchema = z.object({
  role: z.enum(["provider", "deployer"]).describe("Provider or deployer role"),
  risk_level: z.enum(["high-risk", "limited", "minimal", "gpai"]).describe("AI system risk level. Use 'gpai' for general-purpose AI model obligations (Art. 51-56)."),
  high_risk_source: z
    .enum(["annex_iii", "annex_i", "unknown"])
    .optional()
    .default("unknown")
    .describe("For high-risk systems, whether classification comes from Annex III/Art. 6(2), Annex I/Art. 6(1), or is unknown"),
  annex_iii_point: z
    .number()
    .int()
    .min(1)
    .max(8)
    .optional()
    .describe("If high_risk_source is annex_iii, the Annex III point number. Point 2 has special Art. 49/27 treatment."),
  gpai_model_placed_on_market_before_2025_08_02: z
    .boolean()
    .optional()
    .describe("For GPAI providers, whether the model was placed on the market before 2 August 2025, triggering the Art. 111(3) transition to 2 August 2027."),
  filter_keyword: z.string().optional().describe("Optional keyword filter for obligations"),
}).strict();

export const obligationsOutputSchema = z.object({
  role: z.string(),
  risk_level: z.string(),
  obligations: z.array(z.object({
    obligation: z.string(),
    article: z.string(),
    deadline: z.string(),
    details: z.string(),
    category: z.string(),
  })),
  penalties: z.object({
    max_fine: z.string(),
    basis: z.string(),
  }),
  /** Optional deep-dive link on lexbeam.com for this role + risk combination. */
});

export type ObligationsInput = z.infer<typeof obligationsInputSchema>;
export type ObligationsOutput = z.infer<typeof obligationsOutputSchema>;
