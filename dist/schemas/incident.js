import { z } from "zod";
export const incidentTriageInputSchema = z.object({
    high_risk_system: z
        .boolean()
        .optional()
        .describe("Whether the incident involves a high-risk AI system."),
    role: z.enum(["provider", "deployer", "unknown"]).default("unknown"),
    death: z.boolean().optional().describe("Incident indicates risk of, or resulted in, death of a person."),
    serious_harm_to_health: z.boolean().optional().describe("Incident caused or is likely to cause serious harm to health."),
    serious_property_or_environment_damage: z.boolean().optional().describe("Incident caused serious and irreversible disruption to critical infrastructure, property, or environment."),
    fundamental_rights_breach: z.boolean().optional().describe("Incident caused or is likely to cause a serious breach of obligations under Union law intended to protect fundamental rights."),
    widespread_infringement: z.boolean().optional().describe("Incident is widespread or affects a large number of persons."),
    causal_link_established_or_likely: z.boolean().optional().describe("A causal link or reasonable likelihood between the AI system and incident is established."),
    aware_date: z.string().optional().describe("Date the provider/deployer became aware, ISO YYYY-MM-DD if known."),
});
export const incidentTriageOutputSchema = z.object({
    reportable: z.enum(["yes", "likely", "no", "insufficient_information"]),
    deadline_bucket: z.enum(["2_days", "10_days", "15_days", "no_ai_act_report", "insufficient_information"]),
    outer_limit: z.string().nullable(),
    clock_start: z.string(),
    reasoning: z.string(),
    immediate_actions: z.array(z.string()),
    missing_information: z.array(z.string()),
    role_note: z.string(),
    relevant_articles: z.array(z.string()),
});
//# sourceMappingURL=incident.js.map