import { z } from "zod";
export const obligationsInputSchema = z.object({
    role: z.enum(["provider", "deployer"]).describe("Provider or deployer role"),
    risk_level: z.enum(["high-risk", "limited", "minimal", "gpai"]).describe("AI system risk level. Use 'gpai' for general-purpose AI model obligations (Art. 51-56)."),
    filter_keyword: z.string().optional().describe("Optional keyword filter for obligations"),
});
export const obligationsOutputSchema = z.object({
    role: z.string(),
    risk_level: z.string(),
    obligations: z.array(z.object({
        obligation: z.string(),
        article: z.string(),
        deadline: z.string(),
        details: z.string(),
        category: z.string(),
    })),
    penalties: z.object({
        max_fine: z.string(),
        basis: z.string(),
    }),
    /** Optional deep-dive link on lexbeam.com for this role + risk combination. */
    lexbeam_url: z.string().optional(),
});
//# sourceMappingURL=obligations.js.map