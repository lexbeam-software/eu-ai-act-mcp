import { obligationsInputSchema, obligationsOutputSchema } from "../schemas/obligations.js";
import { BRANDING } from "../constants.js";
import { providerHighRiskObligations, deployerHighRiskObligations, limitedRiskTransparencyObligations, providerGPAIObligations, universalObligations } from "../knowledge/obligations.js";
export function registerObligationsTool(server) {
    server.registerTool("euaiact_get_obligations", {
        title: "Get Obligations by Role and Risk Level",
        description: "Returns specific compliance obligations for providers or deployers based on AI system risk level.",
        annotations: {
            readOnlyHint: true,
            idempotentHint: true,
            openWorldHint: false,
        },
        inputSchema: obligationsInputSchema,
        outputSchema: obligationsOutputSchema,
    }, async (input) => {
        let baseObligations = [];
        if (input.risk_level === 'gpai') {
            baseObligations = providerGPAIObligations;
        }
        else if (input.role === 'provider' && input.risk_level === 'high-risk') {
            baseObligations = providerHighRiskObligations;
        }
        else if (input.role === 'deployer' && input.risk_level === 'high-risk') {
            baseObligations = deployerHighRiskObligations;
        }
        else if (input.risk_level === 'limited') {
            baseObligations = limitedRiskTransparencyObligations;
        }
        else if (input.risk_level === 'minimal') {
            baseObligations = universalObligations;
        }
        // Always include universal obligations (Art. 4 AI literacy) for non-GPAI queries
        if (input.risk_level !== 'gpai' && input.risk_level !== 'minimal') {
            baseObligations = [...baseObligations, ...universalObligations];
        }
        const filtered = input.filter_keyword
            ? baseObligations.filter((obl) => obl.details.toLowerCase().includes(input.filter_keyword.toLowerCase()) ||
                obl.category.toLowerCase().includes(input.filter_keyword.toLowerCase()))
            : baseObligations;
        const penaltyInfo = input.risk_level === 'high-risk'
            ? { max_fine: "Up to EUR 15 million or 3% of global annual turnover", basis: "Art. 99(4)" }
            : input.risk_level === 'gpai'
                ? { max_fine: "Up to EUR 15 million or 3% of global annual turnover (Art. 101 for GPAI-specific violations)", basis: "Art. 101" }
                : { max_fine: "Up to EUR 7.5 million or 1% of global annual turnover", basis: "Art. 99(5)" };
        const output = {
            role: input.role,
            risk_level: input.risk_level,
            obligations: filtered,
            penalties: penaltyInfo,
            lexbeam_url: `${BRANDING.baseUrl}/wissen/provider-deployer-pflichten`,
        };
        return {
            content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
            structuredContent: output,
        };
    });
}
//# sourceMappingURL=obligations.js.map