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
        articles: string[];
        key_obligations: string[];
        days_remaining: number;
        is_past: boolean;
    }, {
        status: "in_effect" | "upcoming" | "proposal_only";
        description: string;
        name: string;
        date: string;
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
        description: z.ZodString;
        key_changes: z.ZodArray<z.ZodString, "many">;
        impact_on_ai_act: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: string;
        description: string;
        name: string;
        proposal_date: string;
        key_changes: string[];
        impact_on_ai_act: string;
    }, {
        status: string;
        description: string;
        name: string;
        proposal_date: string;
        key_changes: string[];
        impact_on_ai_act: string;
    }>;
}, "strip", z.ZodTypeAny, {
    milestones: {
        status: "in_effect" | "upcoming" | "proposal_only";
        description: string;
        name: string;
        date: string;
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
        proposal_date: string;
        key_changes: string[];
        impact_on_ai_act: string;
    };
}, {
    milestones: {
        status: "in_effect" | "upcoming" | "proposal_only";
        description: string;
        name: string;
        date: string;
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
        proposal_date: string;
        key_changes: string[];
        impact_on_ai_act: string;
    };
}>;
export type DeadlinesInput = z.infer<typeof deadlinesInputSchema>;
export type DeadlinesOutput = z.infer<typeof deadlinesOutputSchema>;
//# sourceMappingURL=deadlines.d.ts.map