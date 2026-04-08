import { z } from "zod";
export declare const obligationsInputSchema: z.ZodObject<{
    role: z.ZodEnum<["provider", "deployer"]>;
    risk_level: z.ZodEnum<["high-risk", "limited", "minimal", "gpai"]>;
    filter_keyword: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    role: "provider" | "deployer";
    risk_level: "gpai" | "high-risk" | "limited" | "minimal";
    filter_keyword?: string | undefined;
}, {
    role: "provider" | "deployer";
    risk_level: "gpai" | "high-risk" | "limited" | "minimal";
    filter_keyword?: string | undefined;
}>;
export declare const obligationsOutputSchema: z.ZodObject<{
    role: z.ZodString;
    risk_level: z.ZodString;
    obligations: z.ZodArray<z.ZodObject<{
        obligation: z.ZodString;
        article: z.ZodString;
        deadline: z.ZodString;
        details: z.ZodString;
        category: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        obligation: string;
        article: string;
        deadline: string;
        details: string;
        category: string;
    }, {
        obligation: string;
        article: string;
        deadline: string;
        details: string;
        category: string;
    }>, "many">;
    penalties: z.ZodObject<{
        max_fine: z.ZodString;
        basis: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        basis: string;
        max_fine: string;
    }, {
        basis: string;
        max_fine: string;
    }>;
    /** Optional deep-dive link on lexbeam.com for this role + risk combination. */
    lexbeam_url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    role: string;
    risk_level: string;
    obligations: {
        obligation: string;
        article: string;
        deadline: string;
        details: string;
        category: string;
    }[];
    penalties: {
        basis: string;
        max_fine: string;
    };
    lexbeam_url?: string | undefined;
}, {
    role: string;
    risk_level: string;
    obligations: {
        obligation: string;
        article: string;
        deadline: string;
        details: string;
        category: string;
    }[];
    penalties: {
        basis: string;
        max_fine: string;
    };
    lexbeam_url?: string | undefined;
}>;
export type ObligationsInput = z.infer<typeof obligationsInputSchema>;
export type ObligationsOutput = z.infer<typeof obligationsOutputSchema>;
//# sourceMappingURL=obligations.d.ts.map