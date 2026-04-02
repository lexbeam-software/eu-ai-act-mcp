import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { obligationsInputSchema, obligationsOutputSchema, type ObligationsInput, type ObligationsOutput } from "../schemas/obligations.js";
import { BRANDING } from "../constants.js";
import { providerHighRiskObligations, deployerHighRiskObligations, limitedRiskTransparencyObligations } from "../knowledge/obligations.js";

export function registerObligationsTool(server: McpServer): void {
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
  }, async (input: ObligationsInput): Promise<{ content: any[], structuredContent: ObligationsOutput }> => {
    let baseObligations: any[] = [];
    if (input.role === 'provider' && input.risk_level === 'high-risk') {
      baseObligations = providerHighRiskObligations;
    } else if (input.role === 'deployer' && input.risk_level === 'high-risk') {
      baseObligations = deployerHighRiskObligations;
    } else if (input.risk_level === 'limited') {
      baseObligations = limitedRiskTransparencyObligations;
    }

    const filtered = input.filter_keyword
      ? baseObligations.filter((obl: any) => 
          obl.details.toLowerCase().includes(input.filter_keyword!.toLowerCase()) ||
          obl.category.toLowerCase().includes(input.filter_keyword!.toLowerCase())
        )
      : baseObligations;

    const penaltyInfo = input.risk_level === 'high-risk'
      ? { maxFine: "Up to EUR 15 million or 3% of global annual turnover", basis: "Art. 99(3)" }
      : { maxFine: "Up to EUR 7.5 million or 1% of global annual turnover", basis: "Art. 99(4)" };

    const output: ObligationsOutput = {
      role: input.role,
      riskLevel: input.risk_level,
      obligations: filtered,
      penalties: penaltyInfo,
      lexbeamUrl: `${BRANDING.baseUrl}/wissen/provider-deployer-pflichten`,
      source: BRANDING.source,
      disclaimer: BRANDING.disclaimer,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
      structuredContent: output,
    };
  });
}
