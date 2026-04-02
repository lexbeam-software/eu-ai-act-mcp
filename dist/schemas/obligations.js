import { z } from "zod";
export const obligationsInputSchema = z.object({
    role: z.enum(["provider", "deployer"]).describe("Provider or deployer role"),
    risk_level: z.enum(["high-risk", "limited", "minimal"]).describe("AI system risk level"),
    filter_keyword: z.string().optional().describe("Optional keyword filter for obligations"),
});
export const obligationsOutputSchema = z.object({
    role: z.string(),
    riskLevel: z.string(),
    obligations: z.array(z.object({
        category: z.string(),
        description: z.string(),
        article: z.string(),
        deadline: z.string().nullable(),
    })),
    penalties: z.object({
        maxFine: z.string(),
        basis: z.string(),
    }),
    lexbeamUrl: z.string(),
    source: z.string(),
    disclaimer: z.string().optional(),
});
//# sourceMappingURL=obligations.js.map