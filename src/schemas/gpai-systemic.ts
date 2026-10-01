import { z } from "zod";

export const gpaiSystemicInputSchema = z.object({
  training_flops: z
    .number()
    .finite()
    .nonnegative()
    .optional()
    .describe("Cumulative training compute in FLOPs (e.g. 2e25). The adjudicated product boundary triggers the Art. 51(2) presumption at or above 1e25. Omit if unknown; the tool then abstains instead of answering."),
  commission_designated: z
    .boolean()
    .optional()
    .describe("Whether the Commission has formally designated the model as GPAI with systemic risk under Art. 51(1)(b)."),
  model_name: z.string().optional().describe("Optional model name for traceability in the response."),
}).strict();

export const obligationRefSchema = z.object({
  obligation: z.string(),
  article: z.string(),
  deadline: z.string(),
  details: z.string(),
  category: z.string(),
});

export const gpaiSystemicOutputSchema = z.object({
  model_name: z.string().nullable(),
  /** null = undetermined: no training compute was supplied and no designation stated. */
  crosses_flops_threshold: z.boolean().nullable(),
  flops_threshold: z.number(),
  systemic_risk_designation: z.enum(["threshold_met", "commission_designated", "none", "undetermined"]),
  /** null = undetermined; never a negative finding without inputs. */
  is_gpai_with_systemic_risk: z.boolean().nullable(),
  baseline_obligations_art_53: z.array(obligationRefSchema),
  systemic_risk_obligations_art_55: z.array(obligationRefSchema),
  notification_duty: z.string(),
  relevant_articles: z.array(z.string()),
});

export type GpaiSystemicInput = z.infer<typeof gpaiSystemicInputSchema>;
export type GpaiSystemicOutput = z.infer<typeof gpaiSystemicOutputSchema>;
