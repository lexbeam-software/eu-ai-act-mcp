import { z } from "zod";

export const gpaiSystemicInputSchema = z.object({
  training_flops: z
    .number()
    .optional()
    .describe("Cumulative training compute in FLOPs (e.g. 2e25). Art. 51(2) presumes systemic risk when > 1e25."),
  commission_designated: z
    .boolean()
    .optional()
    .describe("Whether the Commission has formally designated the model as GPAI with systemic risk under Art. 51(1)(b)."),
  model_name: z.string().optional().describe("Optional model name for traceability in the response."),
});

export const obligationRefSchema = z.object({
  obligation: z.string(),
  article: z.string(),
  deadline: z.string(),
  details: z.string(),
  category: z.string(),
});

export const gpaiSystemicOutputSchema = z.object({
  model_name: z.string().nullable(),
  crosses_flops_threshold: z.boolean(),
  flops_threshold: z.number(),
  systemic_risk_designation: z.enum(["threshold_met", "commission_designated", "none"]),
  is_gpai_with_systemic_risk: z.boolean(),
  baseline_obligations_art_53: z.array(obligationRefSchema),
  systemic_risk_obligations_art_55: z.array(obligationRefSchema),
  notification_duty: z.string(),
  relevant_articles: z.array(z.string()),
});

export type GpaiSystemicInput = z.infer<typeof gpaiSystemicInputSchema>;
export type GpaiSystemicOutput = z.infer<typeof gpaiSystemicOutputSchema>;
