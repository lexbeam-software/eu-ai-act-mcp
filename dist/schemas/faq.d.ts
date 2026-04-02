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
    articleReferences: z.ZodArray<z.ZodString, "many">;
    lexbeamUrl: z.ZodString;
    source: z.ZodString;
    disclaimer: z.ZodString;
}, "strip", z.ZodTypeAny, {
    confidence: "high" | "medium" | "low";
    source: string;
    disclaimer: string;
    lexbeamUrl: string;
    question: string;
    answer: string;
    articleReferences: string[];
}, {
    confidence: "high" | "medium" | "low";
    source: string;
    disclaimer: string;
    lexbeamUrl: string;
    question: string;
    answer: string;
    articleReferences: string[];
}>;
export type FaqInput = z.infer<typeof faqInputSchema>;
export type FaqOutput = z.infer<typeof faqOutputSchema>;
//# sourceMappingURL=faq.d.ts.map