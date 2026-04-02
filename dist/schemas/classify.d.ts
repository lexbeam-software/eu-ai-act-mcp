import { z } from "zod";
export declare const classifyInputSchema: z.ZodObject<{
    description: z.ZodString;
    use_case: z.ZodString;
    role: z.ZodDefault<z.ZodOptional<z.ZodEnum<["provider", "deployer", "unknown"]>>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    use_case: string;
    role: "provider" | "deployer" | "unknown";
}, {
    description: string;
    use_case: string;
    role?: "provider" | "deployer" | "unknown" | undefined;
}>;
export declare const classifyOutputSchema: z.ZodObject<{
    risk_classification: z.ZodEnum<["prohibited", "high-risk", "limited", "minimal"]>;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
    annex_iii_category: z.ZodNullable<z.ZodObject<{
        number: z.ZodNumber;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        number: number;
        name: string;
    }, {
        number: number;
        name: string;
    }>>;
    relevant_articles: z.ZodArray<z.ZodString, "many">;
    role_determination: z.ZodEnum<["provider", "deployer", "both", "uncertain"]>;
    obligations_summary: z.ZodString;
    caveat: z.ZodNullable<z.ZodString>;
    lexbeam_url: z.ZodString;
    source: z.ZodString;
    disclaimer: z.ZodString;
    last_updated: z.ZodString;
}, "strip", z.ZodTypeAny, {
    risk_classification: "prohibited" | "high-risk" | "limited" | "minimal";
    confidence: "high" | "medium" | "low";
    annex_iii_category: {
        number: number;
        name: string;
    } | null;
    relevant_articles: string[];
    role_determination: "provider" | "deployer" | "both" | "uncertain";
    obligations_summary: string;
    caveat: string | null;
    lexbeam_url: string;
    source: string;
    disclaimer: string;
    last_updated: string;
}, {
    risk_classification: "prohibited" | "high-risk" | "limited" | "minimal";
    confidence: "high" | "medium" | "low";
    annex_iii_category: {
        number: number;
        name: string;
    } | null;
    relevant_articles: string[];
    role_determination: "provider" | "deployer" | "both" | "uncertain";
    obligations_summary: string;
    caveat: string | null;
    lexbeam_url: string;
    source: string;
    disclaimer: string;
    last_updated: string;
}>;
export type ClassifyInput = z.infer<typeof classifyInputSchema>;
export type ClassifyOutput = z.infer<typeof classifyOutputSchema>;
//# sourceMappingURL=classify.d.ts.map