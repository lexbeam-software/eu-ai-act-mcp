import { z } from "zod";
export declare const deadlinesInputSchema: z.ZodObject<{
    area: z.ZodOptional<z.ZodString>;
    only_upcoming: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    area?: string | undefined;
    only_upcoming?: boolean | undefined;
}, {
    area?: string | undefined;
    only_upcoming?: boolean | undefined;
}>;
export declare const deadlinesOutputSchema: z.ZodObject<{
    milestones: z.ZodArray<z.ZodObject<{
        date: z.ZodString;
        current_law_date: z.ZodString;
        provisional_date_if_adopted: z.ZodNullable<z.ZodString>;
        binding_status: z.ZodEnum<["current_law", "provisional_if_adopted"]>;
        last_verified_at: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        status: z.ZodEnum<["in_effect", "upcoming", "proposal_only"]>;
        articles: z.ZodArray<z.ZodString, "many">;
        key_obligations: z.ZodArray<z.ZodString, "many">;
        days_remaining: z.ZodNumber;
        is_past: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        status: "in_effect" | "upcoming" | "proposal_only";
        description: string;
        name: string;
        date: string;
        current_law_date: string;
        provisional_date_if_adopted: string | null;
        binding_status: "current_law" | "provisional_if_adopted";
        last_verified_at: string;
        articles: string[];
        key_obligations: string[];
        days_remaining: number;
        is_past: boolean;
    }, {
        status: "in_effect" | "upcoming" | "proposal_only";
        description: string;
        name: string;
        date: string;
        current_law_date: string;
        provisional_date_if_adopted: string | null;
        binding_status: "current_law" | "provisional_if_adopted";
        last_verified_at: string;
        articles: string[];
        key_obligations: string[];
        days_remaining: number;
        is_past: boolean;
    }>, "many">;
    next_milestone: z.ZodNullable<z.ZodObject<{
        date: z.ZodString;
        name: z.ZodString;
        days_remaining: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        date: string;
        days_remaining: number;
    }, {
        name: string;
        date: string;
        days_remaining: number;
    }>>;
    digital_omnibus: z.ZodObject<{
        name: z.ZodString;
        status: z.ZodString;
        proposal_date: z.ZodString;
        provisional_agreement_date: z.ZodString;
        last_verified_at: z.ZodString;
        description: z.ZodString;
        key_changes: z.ZodArray<z.ZodString, "many">;
        impact_on_ai_act: z.ZodString;
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
        status: string;
        description: string;
        name: string;
        last_verified_at: string;
        proposal_date: string;
        provisional_agreement_date: string;
        key_changes: string[];
        impact_on_ai_act: string;
        sources: {
            name: string;
            date: string;
            url: string;
        }[];
    }, {
        status: string;
        description: string;
        name: string;
        last_verified_at: string;
        proposal_date: string;
        provisional_agreement_date: string;
        key_changes: string[];
        impact_on_ai_act: string;
        sources: {
            name: string;
            date: string;
            url: string;
        }[];
    }>;
    knowledge_version: z.ZodString;
    last_content_update: z.ZodString;
}, "strip", z.ZodTypeAny, {
    milestones: {
        status: "in_effect" | "upcoming" | "proposal_only";
        description: string;
        name: string;
        date: string;
        current_law_date: string;
        provisional_date_if_adopted: string | null;
        binding_status: "current_law" | "provisional_if_adopted";
        last_verified_at: string;
        articles: string[];
        key_obligations: string[];
        days_remaining: number;
        is_past: boolean;
    }[];
    next_milestone: {
        name: string;
        date: string;
        days_remaining: number;
    } | null;
    digital_omnibus: {
        status: string;
        description: string;
        name: string;
        last_verified_at: string;
        proposal_date: string;
        provisional_agreement_date: string;
        key_changes: string[];
        impact_on_ai_act: string;
        sources: {
            name: string;
            date: string;
            url: string;
        }[];
    };
    knowledge_version: string;
    last_content_update: string;
}, {
    milestones: {
        status: "in_effect" | "upcoming" | "proposal_only";
        description: string;
        name: string;
        date: string;
        current_law_date: string;
        provisional_date_if_adopted: string | null;
        binding_status: "current_law" | "provisional_if_adopted";
        last_verified_at: string;
        articles: string[];
        key_obligations: string[];
        days_remaining: number;
        is_past: boolean;
    }[];
    next_milestone: {
        name: string;
        date: string;
        days_remaining: number;
    } | null;
    digital_omnibus: {
        status: string;
        description: string;
        name: string;
        last_verified_at: string;
        proposal_date: string;
        provisional_agreement_date: string;
        key_changes: string[];
        impact_on_ai_act: string;
        sources: {
            name: string;
            date: string;
            url: string;
        }[];
    };
    knowledge_version: string;
    last_content_update: string;
}>;
export type DeadlinesInput = z.infer<typeof deadlinesInputSchema>;
export type DeadlinesOutput = z.infer<typeof deadlinesOutputSchema>;
//# sourceMappingURL=deadlines.d.ts.map