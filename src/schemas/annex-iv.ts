import { z } from "zod";

export const annexIvInputSchema = z.object({
  format: z
    .enum(["json", "checklist"])
    .optional()
    .default("json")
    .describe("Output shape: 'json' returns structured items; 'checklist' adds a markdown checklist string."),
  sme_simplified: z
    .boolean()
    .optional()
    .describe("Indicate whether SME-simplified preparation is being used (Art. 11(1) second subparagraph)."),
});

export const annexIvItemSchema = z.object({
  number: z.number(),
  title: z.string(),
  description: z.string(),
  sub_items: z.array(z.string()),
  related_articles: z.array(z.string()),
});

export const annexIvOutputSchema = z.object({
  items: z.array(annexIvItemSchema),
  checklist_markdown: z.string().optional(),
  sme_note: z.string().optional(),
  total_items: z.number(),
  relevant_articles: z.array(z.string()),
});

export type AnnexIvInput = z.infer<typeof annexIvInputSchema>;
export type AnnexIvOutput = z.infer<typeof annexIvOutputSchema>;
