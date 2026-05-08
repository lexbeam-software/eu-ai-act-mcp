import { z } from "zod";
export declare const friaTriggerInputSchema: z.ZodObject<{
    is_high_risk: z.ZodOptional<z.ZodBoolean>;
    annex_iii_number: z.ZodOptional<z.ZodNumber>;
    deployer_type: z.ZodDefault<z.ZodEnum<["public_body", "private_public_service", "private_creditworthiness", "private_essential_service", "other_private", "unknown"]>>;
    use_case: z.ZodOptional<z.ZodString>;
    affects_natural_persons: z.ZodOptional<z.ZodBoolean>;
    already_has_dpia: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    deployer_type: "unknown" | "public_body" | "private_public_service" | "private_creditworthiness" | "private_essential_service" | "other_private";
    use_case?: string | undefined;
    annex_iii_number?: number | undefined;
    is_high_risk?: boolean | undefined;
    affects_natural_persons?: boolean | undefined;
    already_has_dpia?: boolean | undefined;
}, {
    use_case?: string | undefined;
    annex_iii_number?: number | undefined;
    is_high_risk?: boolean | undefined;
    deployer_type?: "unknown" | "public_body" | "private_public_service" | "private_creditworthiness" | "private_essential_service" | "other_private" | undefined;
    affects_natural_persons?: boolean | undefined;
    already_has_dpia?: boolean | undefined;
}>;
export declare const friaTriggerOutputSchema: z.ZodObject<{
    fria_required: z.ZodEnum<["yes", "likely", "no", "insufficient_information"]>;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
    reasoning: z.ZodString;
    trigger_factors: z.ZodArray<z.ZodString, "many">;
    missing_information: z.ZodArray<z.ZodString, "many">;
    required_actions: z.ZodArray<z.ZodString, "many">;
    notification_note: z.ZodString;
    dpia_interaction: z.ZodString;
    deadline: z.ZodObject<{
        current_law_date: z.ZodString;
        provisional_date_if_adopted: z.ZodNullable<z.ZodString>;
        binding_status: z.ZodEnum<["current_law", "provisional_if_adopted"]>;
        status_note: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        current_law_date: string;
        provisional_date_if_adopted: string | null;
        binding_status: "current_law" | "provisional_if_adopted";
        status_note: string;
    }, {
        current_law_date: string;
        provisional_date_if_adopted: string | null;
        binding_status: "current_law" | "provisional_if_adopted";
        status_note: string;
    }>;
    relevant_articles: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    confidence: "high" | "medium" | "low";
    relevant_articles: string[];
    deadline: {
        current_law_date: string;
        provisional_date_if_adopted: string | null;
        binding_status: "current_law" | "provisional_if_adopted";
        status_note: string;
    };
    reasoning: string;
    fria_required: "insufficient_information" | "yes" | "likely" | "no";
    trigger_factors: string[];
    missing_information: string[];
    required_actions: string[];
    notification_note: string;
    dpia_interaction: string;
}, {
    confidence: "high" | "medium" | "low";
    relevant_articles: string[];
    deadline: {
        current_law_date: string;
        provisional_date_if_adopted: string | null;
        binding_status: "current_law" | "provisional_if_adopted";
        status_note: string;
    };
    reasoning: string;
    fria_required: "insufficient_information" | "yes" | "likely" | "no";
    trigger_factors: string[];
    missing_information: string[];
    required_actions: string[];
    notification_note: string;
    dpia_interaction: string;
}>;
export type FriaTriggerInput = z.infer<typeof friaTriggerInputSchema>;
export type FriaTriggerOutput = z.infer<typeof friaTriggerOutputSchema>;
//# sourceMappingURL=fria.d.ts.map