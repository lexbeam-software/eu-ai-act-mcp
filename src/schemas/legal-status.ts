import { z } from "zod";

export const legalStatusInputSchema = z.object({
  area: z
    .enum(["all", "annex_iii", "annex_i", "article_50", "gpai", "prohibited_practices"])
    .default("all")
    .optional()
    .describe("Optional area filter for the legal-status card."),
});

const sourceSchema = z.object({
  name: z.string(),
  date: z.string(),
  url: z.string(),
});

const statusItemSchema = z.object({
  area: z.string(),
  current_law_date: z.string().nullable(),
  provisional_date_if_adopted: z.string().nullable(),
  binding_status: z.enum(["current_law", "in_effect", "provisional_if_adopted"]),
  status_note: z.string(),
  relevant_articles: z.array(z.string()),
});

export const legalStatusOutputSchema = z.object({
  as_of: z.string(),
  knowledge_version: z.string(),
  current_law_remains_authoritative: z.boolean(),
  formal_adoption_status: z.string(),
  adoption_steps_remaining: z.array(z.string()),
  communication_guardrails: z.array(z.string()),
  items: z.array(statusItemSchema),
  sources: z.array(sourceSchema),
});

export type LegalStatusInput = z.infer<typeof legalStatusInputSchema>;
export type LegalStatusOutput = z.infer<typeof legalStatusOutputSchema>;
