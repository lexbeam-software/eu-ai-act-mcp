import { z } from "zod";
export const faqInputSchema = z.object({
    question: z.string().describe("User question about the EU AI Act"),
});
export const faqOutputSchema = z.object({
    question: z.string(),
    answer: z.string(),
    confidence: z.enum(["high", "medium", "low"]),
    article_references: z.array(z.string()),
    /** Optional deep-dive link on lexbeam.com for the matched FAQ entry. */
    lexbeam_url: z.string().optional(),
});
//# sourceMappingURL=faq.js.map