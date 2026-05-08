import { z } from "zod";
export declare const legalStatusInputSchema: z.ZodObject<{
    area: z.ZodOptional<z.ZodDefault<z.ZodEnum<["all", "annex_iii", "annex_i", "article_50", "gpai", "prohibited_practices"]>>>;
}, "strip", z.ZodTypeAny, {
    area?: "gpai" | "all" | "annex_iii" | "annex_i" | "article_50" | "prohibited_practices" | undefined;
}, {
    area?: "gpai" | "all" | "annex_iii" | "annex_i" | "article_50" | "prohibited_practices" | undefined;
}>;
export declare const legalStatusOutputSchema: z.ZodObject<{
    as_of: z.ZodString;
    knowledge_version: z.ZodString;
    current_law_remains_authoritative: z.ZodBoolean;
    formal_adoption_status: z.ZodString;
    adoption_steps_remaining: z.ZodArray<z.ZodString, "many">;
    communication_guardrails: z.ZodArray<z.ZodString, "many">;
    items: z.ZodArray<z.ZodObject<{
        area: z.ZodString;
        current_law_date: z.ZodNullable<z.ZodString>;
        provisional_date_if_adopted: z.ZodNullable<z.ZodString>;
        binding_status: z.ZodEnum<["current_law", "in_effect", "provisional_if_adopted"]>;
        status_note: z.ZodString;
        relevant_articles: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        relevant_articles: string[];
        area: string;
        current_law_date: string | null;
        provisional_date_if_adopted: string | null;
        binding_status: "current_law" | "provisional_if_adopted" | "in_effect";
        status_note: string;
    }, {
        relevant_articles: string[];
        area: string;
        current_law_date: string | null;
        provisional_date_if_adopted: string | null;
        binding_status: "current_law" | "provisional_if_adopted" | "in_effect";
        status_note: string;
    }>, "many">;
    sources: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        date: z.ZodString;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        date: string;
        url: string;
    }, {
        name: string;
        date: string;
        url: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    sources: {
        name: string;
        date: string;
        url: string;
    }[];
    knowledge_version: string;
    items: {
        relevant_articles: string[];
        area: string;
        current_law_date: string | null;
        provisional_date_if_adopted: string | null;
        binding_status: "current_law" | "provisional_if_adopted" | "in_effect";
        status_note: string;
    }[];
    as_of: string;
    current_law_remains_authoritative: boolean;
    formal_adoption_status: string;
    adoption_steps_remaining: string[];
    communication_guardrails: string[];
}, {
    sources: {
        name: string;
        date: string;
        url: string;
    }[];
    knowledge_version: string;
    items: {
        relevant_articles: string[];
        area: string;
        current_law_date: string | null;
        provisional_date_if_adopted: string | null;
        binding_status: "current_law" | "provisional_if_adopted" | "in_effect";
        status_note: string;
    }[];
    as_of: string;
    current_law_remains_authoritative: boolean;
    formal_adoption_status: string;
    adoption_steps_remaining: string[];
    communication_guardrails: string[];
}>;
export type LegalStatusInput = z.infer<typeof legalStatusInputSchema>;
export type LegalStatusOutput = z.infer<typeof legalStatusOutputSchema>;
//# sourceMappingURL=legal-status.d.ts.map