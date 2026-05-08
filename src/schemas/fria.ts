import { z } from "zod";

export const friaTriggerInputSchema = z.object({
  is_high_risk: z
    .boolean()
    .optional()
    .describe("Whether the AI system has already been classified as high-risk."),
  annex_iii_number: z
    .number()
    .int()
    .min(1)
    .max(8)
    .optional()
    .describe("Annex III category number, if known."),
  deployer_type: z
    .enum(["public_body", "private_public_service", "private_creditworthiness", "private_essential_service", "other_private", "unknown"])
    .default("unknown")
    .describe("Type of deployer relevant to Art. 27 FRIA scope."),
  use_case: z.string().optional().describe("Short use-case description for traceability."),
  affects_natural_persons: z
    .boolean()
    .optional()
    .describe("Whether deployment affects natural persons or decisions about them."),
  already_has_dpia: z
    .boolean()
    .optional()
    .describe("Whether a GDPR/LED DPIA already exists. A DPIA does not automatically replace FRIA."),
});

export const friaTriggerOutputSchema = z.object({
  fria_required: z.enum(["yes", "likely", "no", "insufficient_information"]),
  confidence: z.enum(["high", "medium", "low"]),
  reasoning: z.string(),
  trigger_factors: z.array(z.string()),
  missing_information: z.array(z.string()),
  required_actions: z.array(z.string()),
  notification_note: z.string(),
  dpia_interaction: z.string(),
  deadline: z.object({
    current_law_date: z.string(),
    provisional_date_if_adopted: z.string().nullable(),
    binding_status: z.enum(["current_law", "provisional_if_adopted"]),
    status_note: z.string(),
  }),
  relevant_articles: z.array(z.string()),
});

export type FriaTriggerInput = z.infer<typeof friaTriggerInputSchema>;
export type FriaTriggerOutput = z.infer<typeof friaTriggerOutputSchema>;
