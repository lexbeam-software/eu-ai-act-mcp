import { z } from "zod";
export declare const obligationsInputSchema: z.ZodObject<{
    role: z.ZodEnum<["provider", "deployer"]>;
    risk_level: z.ZodEnum<["high-risk", "limited", "minimal"]>;
    filter_keyword: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    role: "provider" | "deployer";
    risk_level: "high-risk" | "limited" | "minimal";
    filter_keyword?: string | undefined;
}, {
    role: "provider" | "deployer";
    risk_level: "high-risk" | "limited" | "minimal";
    filter_keyword?: string | undefined;
}>;
export declare const obligationsOutputSchema: z.ZodObject<{
    role: z.ZodString;
    riskLevel: z.ZodString;
    obligations: z.ZodArray<z.ZodObject<{
        category: z.ZodString;
        description: z.ZodString;
        article: z.ZodString;
        deadline: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        category: string;
        article: string;
        deadline: string | null;
    }, {
        description: string;
        category: string;
        article: string;
        deadline: string | null;
    }>, "many">;
    penalties: z.ZodObject<{
        maxFine: z.ZodString;
        basis: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        maxFine: string;
        basis: string;
    }, {
        maxFine: string;
        basis: string;
    }>;
    lexbeamUrl: z.ZodString;
    source: z.ZodString;
    disclaimer: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    role: string;
    source: string;
    riskLevel: string;
    obligations: {
        description: string;
        category: string;
        article: string;
        deadline: string | null;
    }[];
    penalties: {
        maxFine: string;
        basis: string;
    };
    lexbeamUrl: string;
    disclaimer?: string | undefined;
}, {
    role: string;
    source: string;
    riskLevel: string;
    obligations: {
        description: string;
        category: string;
        article: string;
        deadline: string | null;
    }[];
    penalties: {
        maxFine: string;
        basis: string;
    };
    lexbeamUrl: string;
    disclaimer?: string | undefined;
}>;
export type ObligationsInput = z.infer<typeof obligationsInputSchema>;
export type ObligationsOutput = z.infer<typeof obligationsOutputSchema>;
//# sourceMappingURL=obligations.d.ts.map