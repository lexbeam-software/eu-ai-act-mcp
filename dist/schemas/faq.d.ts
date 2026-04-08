import { z } from "zod";
export declare const faqInputSchema: z.ZodObject<{
    question: z.ZodString;
}, "strip", z.ZodTypeAny, {
    question: string;
}, {
    question: string;
}>;
export declare const faqOutputSchema: z.ZodObject<{
    question: z.ZodString;
    answer: z.ZodString;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
    article_references: z.ZodArray<z.ZodString, "many">;
    /** Optional deep-dive link on lexbeam.com for the matched FAQ entry. */
    lexbeam_url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    confidence: "high" | "medium" | "low";
    question: string;
    answer: string;
    article_references: string[];
    lexbeam_url?: string | undefined;
}, {
    confidence: "high" | "medium" | "low";
    question: string;
    answer: string;
    article_references: string[];
    lexbeam_url?: string | undefined;
}>;
export type FaqInput = z.infer<typeof faqInputSchema>;
export type FaqOutput = z.infer<typeof faqOutputSchema>;
//# sourceMappingURL=faq.d.ts.map