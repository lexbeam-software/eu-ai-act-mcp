import { z } from "zod";

export const articleInputSchema = z.object({
  article: z
    .string()
    .describe("Article number (e.g. '5', '6', '50', 'Art. 99'). Case-insensitive; 'Art.' prefix optional."),
});

export const articleOutputSchema = z.object({
  available: z.boolean(),
  article: z.object({
    number: z.string(),
    title: z.string(),
    summary: z.string(),
    related_annexes: z.array(z.string()),
  }).nullable(),
  eurlex_url: z.string(),
  note: z.string().optional(),
});

export type ArticleInput = z.infer<typeof articleInputSchema>;
export type ArticleOutput = z.infer<typeof articleOutputSchema>;
