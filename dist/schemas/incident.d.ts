import { z } from "zod";
export declare const incidentTriageInputSchema: z.ZodObject<{
    high_risk_system: z.ZodOptional<z.ZodBoolean>;
    role: z.ZodDefault<z.ZodEnum<["provider", "deployer", "unknown"]>>;
    death: z.ZodOptional<z.ZodBoolean>;
    serious_harm_to_health: z.ZodOptional<z.ZodBoolean>;
    serious_property_or_environment_damage: z.ZodOptional<z.ZodBoolean>;
    fundamental_rights_breach: z.ZodOptional<z.ZodBoolean>;
    widespread_infringement: z.ZodOptional<z.ZodBoolean>;
    causal_link_established_or_likely: z.ZodOptional<z.ZodBoolean>;
    aware_date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    role: "provider" | "deployer" | "unknown";
    high_risk_system?: boolean | undefined;
    death?: boolean | undefined;
    serious_harm_to_health?: boolean | undefined;
    serious_property_or_environment_damage?: boolean | undefined;
    fundamental_rights_breach?: boolean | undefined;
    widespread_infringement?: boolean | undefined;
    causal_link_established_or_likely?: boolean | undefined;
    aware_date?: string | undefined;
}, {
    role?: "provider" | "deployer" | "unknown" | undefined;
    high_risk_system?: boolean | undefined;
    death?: boolean | undefined;
    serious_harm_to_health?: boolean | undefined;
    serious_property_or_environment_damage?: boolean | undefined;
    fundamental_rights_breach?: boolean | undefined;
    widespread_infringement?: boolean | undefined;
    causal_link_established_or_likely?: boolean | undefined;
    aware_date?: string | undefined;
}>;
export declare const incidentTriageOutputSchema: z.ZodObject<{
    reportable: z.ZodEnum<["yes", "likely", "no", "insufficient_information"]>;
    deadline_bucket: z.ZodEnum<["2_days", "10_days", "15_days", "no_ai_act_report", "insufficient_information"]>;
    outer_limit: z.ZodNullable<z.ZodString>;
    clock_start: z.ZodString;
    reasoning: z.ZodString;
    immediate_actions: z.ZodArray<z.ZodString, "many">;
    missing_information: z.ZodArray<z.ZodString, "many">;
    role_note: z.ZodString;
    relevant_articles: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    relevant_articles: string[];
    reasoning: string;
    missing_information: string[];
    reportable: "insufficient_information" | "yes" | "likely" | "no";
    deadline_bucket: "insufficient_information" | "2_days" | "10_days" | "15_days" | "no_ai_act_report";
    outer_limit: string | null;
    clock_start: string;
    immediate_actions: string[];
    role_note: string;
}, {
    relevant_articles: string[];
    reasoning: string;
    missing_information: string[];
    reportable: "insufficient_information" | "yes" | "likely" | "no";
    deadline_bucket: "insufficient_information" | "2_days" | "10_days" | "15_days" | "no_ai_act_report";
    outer_limit: string | null;
    clock_start: string;
    immediate_actions: string[];
    role_note: string;
}>;
export type IncidentTriageInput = z.infer<typeof incidentTriageInputSchema>;
export type IncidentTriageOutput = z.infer<typeof incidentTriageOutputSchema>;
//# sourceMappingURL=incident.d.ts.map