import { z } from "zod";

export const faqInputSchema = z.object({
  question: z.string().describe("User question about the EU AI Act"),
});

export const faqOutputSchema = z.object({
  /** Always the caller's own question, echoed verbatim. */
  question: z.string(),
  /** The FAQ entry the answer comes from, so a substitution is visible to the caller. */
  matched_question: z.string().optional(),
  answer: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  article_references: z.array(z.string()),
  /** Optional deep-dive link on lexbeam.com for the matched FAQ entry. */
});

export type FaqInput = z.infer<typeof faqInputSchema>;
export type FaqOutput = z.infer<typeof faqOutputSchema>;
