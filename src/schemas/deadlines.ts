import { z } from "zod";

export const deadlinesInputSchema = z.object({
  area: z.string().optional().describe("Optional filter by compliance area (e.g. 'GPAI', 'high-risk', 'prohibited')"),
  only_upcoming: z
    .boolean()
    .optional()
    .describe("If true, return only milestones that have not yet come into effect."),
});

export const deadlinesOutputSchema = z.object({
  milestones: z.array(z.object({
    date: z.string(),
    current_law_date: z.string(),
    provisional_date_if_adopted: z.string().nullable(),
    binding_status: z.enum(["current_law", "provisional_if_adopted"]),
    last_verified_at: z.string(),
    name: z.string(),
    description: z.string(),
    status: z.enum(["in_effect", "upcoming", "proposal_only"]),
    articles: z.array(z.string()),
    key_obligations: z.array(z.string()),
    days_remaining: z.number(),
    is_past: z.boolean(),
  })),
  next_milestone: z
    .object({
      date: z.string(),
      name: z.string(),
      days_remaining: z.number(),
    })
    .nullable(),
  digital_omnibus: z.object({
    name: z.string(),
    status: z.string(),
    proposal_date: z.string(),
    provisional_agreement_date: z.string(),
    last_verified_at: z.string(),
    description: z.string(),
    key_changes: z.array(z.string()),
    impact_on_ai_act: z.string(),
    sources: z.array(z.object({
      name: z.string(),
      date: z.string(),
      url: z.string(),
    })),
  }),
  knowledge_version: z.string(),
  last_content_update: z.string(),
});

export type DeadlinesInput = z.infer<typeof deadlinesInputSchema>;
export type DeadlinesOutput = z.infer<typeof deadlinesOutputSchema>;
