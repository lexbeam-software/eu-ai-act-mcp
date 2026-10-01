import { z } from "zod";

export const faqInputSchema = z.object({
  question: z.string().describe("User question about the EU AI Act"),
}).strict();

export const faqOutputSchema = z.object({
  /** Always the caller's own question, echoed verbatim. */
  question: z.string(),
  match_status: z.enum(["matched", "no_match"]).describe("Whether a FAQ answer was accepted. A candidate below the threshold is not a match."),
  /** The accepted FAQ entry the answer comes from; absent on abstention. */
  matched_question: z.string().optional(),
  candidate_question: z.string().optional().describe("Unaccepted closest candidate on abstention, for query refinement only."),
  answer: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  article_references: z.array(z.string()),
  /** Optional deep-dive link on lexbeam.com for the matched FAQ entry. */
});

export type FaqInput = z.infer<typeof faqInputSchema>;
export type FaqOutput = z.infer<typeof faqOutputSchema>;
