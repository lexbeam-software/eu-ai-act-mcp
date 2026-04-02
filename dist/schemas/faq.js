import { z } from "zod";
export const faqInputSchema = z.object({
    question: z.string().describe("User question about the EU AI Act"),
});
export const faqOutputSchema = z.object({
    question: z.string(),
    answer: z.string(),
    confidence: z.enum(["high", "medium", "low"]),
    articleReferences: z.array(z.string()),
    lexbeamUrl: z.string(),
    source: z.string(),
    disclaimer: z.string(),
});
//# sourceMappingURL=faq.js.map