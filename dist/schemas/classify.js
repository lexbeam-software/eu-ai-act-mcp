import { z } from "zod";
export const classifyInputSchema = z.object({
    description: z.string().describe("Description of the AI system and its functionalities"),
    use_case: z.string().describe("Specific context where the system is deployed"),
    role: z.enum(["provider", "deployer", "unknown"]).optional().default("unknown"),
});
export const classifyOutputSchema = z.object({
    risk_classification: z.enum(["prohibited", "high-risk", "limited", "minimal"]),
    confidence: z.enum(["high", "medium", "low"]),
    annex_iii_category: z.object({
        number: z.number(),
        name: z.string(),
    }).nullable(),
    relevant_articles: z.array(z.string()),
    role_determination: z.enum(["provider", "deployer", "both", "uncertain"]),
    obligations_summary: z.string(),
    caveat: z.string().nullable(),
    lexbeam_url: z.string(),
    source: z.string(),
    disclaimer: z.string(),
    last_updated: z.string(),
});
//# sourceMappingURL=classify.js.map