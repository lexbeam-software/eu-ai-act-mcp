import { z } from "zod";

export const art6ExceptionInputSchema = z.object({
  annex_iii_number: z
    .number()
    .int()
    .min(1)
    .max(8)
    .optional()
    .describe("Annex III category number (1-8). Provide if known — helps the response reference the right rules."),
  performs_profiling: z
    .boolean()
    .describe(
      "Does the system perform profiling of natural persons? If true, Art. 6(3) exception is UNAVAILABLE regardless of other conditions (Art. 6(3) second subparagraph).",
    ),
  narrow_procedural_task: z
    .boolean()
    .optional()
    .describe("Art. 6(3)(a): intended to perform a narrow procedural task (e.g. transform unstructured to structured data, classify documents, detect duplicates)."),
  improves_prior_human_activity: z
    .boolean()
    .optional()
    .describe("Art. 6(3)(b): intended to improve the result of a previously completed human activity (e.g. improve drafting style)."),
  detects_patterns_without_replacing_human_review: z
    .boolean()
    .optional()
    .describe("Art. 6(3)(c): intended to detect decision-making patterns or deviations, not replace/influence human assessment without proper review."),
  preparatory_task: z
    .boolean()
    .optional()
    .describe("Art. 6(3)(d): intended to perform a preparatory task for an assessment relevant to an Annex III use case."),
  documented_assessment: z
    .boolean()
    .optional()
    .describe("Has the provider documented the Art. 6(3) exception assessment? Required by Art. 6(4) regardless of which condition applies."),
});

export const art6ExceptionConditionSchema = z.object({
  condition: z.string(),
  article: z.string(),
  applies: z.boolean(),
});

export const art6ExceptionOutputSchema = z.object({
  exception_available: z.boolean(),
  reasoning: z.string(),
  conditions_evaluated: z.array(art6ExceptionConditionSchema),
  profiling_blocks_exception: z.boolean(),
  documentation_reminder: z.string(),
  registration_duty: z.string(),
  relevant_articles: z.array(z.string()),
});

export type Art6ExceptionInput = z.infer<typeof art6ExceptionInputSchema>;
export type Art6ExceptionOutput = z.infer<typeof art6ExceptionOutputSchema>;
