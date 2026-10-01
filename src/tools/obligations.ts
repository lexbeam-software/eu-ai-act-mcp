import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { obligationsInputSchema, obligationsOutputSchema, type ObligationsInput, type ObligationsOutput } from "../schemas/obligations.js";
import {
  providerHighRiskObligations,
  deployerHighRiskObligations,
  providerLimitedRiskTransparencyObligations,
  deployerLimitedRiskTransparencyObligations,
  providerGPAIObligations,
  universalObligations,
} from "../knowledge/obligations.js";
import { getOperativeHighRiskDates } from "../knowledge/deadlines.js";

/**
 * The general high-risk application date as authored in the static obligation
 * data. Obligations carrying this date follow Chapter III Sections 1 to 3 and
 * therefore move with the Omnibus deferral; obligations with their own anchor
 * (Art. 4 AI literacy, GPAI transitions) must not be remapped.
 */
const AUTHORED_HIGH_RISK_DEADLINE = "2026-08-02";

export function registerObligationsTool(server: McpServer): void {
  server.registerTool("euaiact_get_obligations", {
    title: "Get Obligations by Role and Risk Level",
    description: "Returns specific compliance obligations for providers or deployers based on AI system risk level.",
    annotations: {
      title: "Get Obligations by Role and Risk Level",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: obligationsInputSchema,
    outputSchema: obligationsOutputSchema,
  }, async (input: ObligationsInput): Promise<{ content: any[], structuredContent: ObligationsOutput }> => {
    let baseObligations: any[] = [];
    if (input.risk_level === 'gpai') {
      baseObligations = input.role === 'provider' ? providerGPAIObligations : [];
    } else if (input.role === 'provider' && input.risk_level === 'high-risk') {
      baseObligations = providerHighRiskObligations;
    } else if (input.role === 'deployer' && input.risk_level === 'high-risk') {
      baseObligations = deployerHighRiskObligations;
    } else if (input.risk_level === 'limited') {
      baseObligations = input.role === 'provider'
        ? providerLimitedRiskTransparencyObligations
        : deployerLimitedRiskTransparencyObligations;
    } else if (input.risk_level === 'minimal') {
      baseObligations = universalObligations;
    }

    // Always include universal obligations (Art. 4 AI literacy) for non-GPAI queries
    if (input.risk_level !== 'gpai' && input.risk_level !== 'minimal') {
      baseObligations = [...baseObligations, ...universalObligations];
    }

    if (input.role === 'provider' && input.risk_level === 'high-risk') {
      const source = input.high_risk_source ?? 'unknown';
      const annexPoint = input.annex_iii_point;
      if (source === 'annex_i' || annexPoint === 2) {
        baseObligations = baseObligations.filter((obl: any) => obl.article !== 'Art. 49');
      }
    }

    // Chapter III Sections 1 to 3 move with the Omnibus deferral. Derive those
    // deadlines from the same operative-date source the deadlines tool uses, so
    // the two tools can never state different law for the same system.
    if (input.risk_level === 'high-risk') {
      const operative = getOperativeHighRiskDates();
      const isAnnexI = (input.high_risk_source ?? 'unknown') === 'annex_i';
      const operativeDeadline = isAnnexI ? operative.annexIHighRisk : operative.annexIiiHighRisk;
      const sourceLabel = isAnnexI
        ? "Art. 6(1) and Annex I"
        : (input.high_risk_source ?? 'unknown') === 'annex_iii'
          ? "Art. 6(2) and Annex III"
          : "Art. 6(2) and Annex III (assumed: no high_risk_source given; this is the earlier of the two dates)";
      if (operativeDeadline !== AUTHORED_HIGH_RISK_DEADLINE) {
        // Art. 113(3)(c) as amended defers Chapter III Sections 1-3 only.
        // Arts. 43/47/49 (Section 5) and Arts. 72/73/86 (Chapter IX) formally
        // apply since 2 August 2026 under Art. 113 second paragraph; their
        // PRACTICAL date moves because the Art. 6 classification that gives
        // them an addressee is what point (c) defers. The citation must say
        // which mechanism carries the date, or a reader checking the pinpoint
        // finds it does not support the claim.
        const downstreamTriggered = new Set(["Art. 43", "Art. 47", "Art. 49", "Art. 72", "Art. 73", "Art. 86"]);
        const pointCite = isAnnexI ? "Art. 113(3)(c)(ii)" : "Art. 113(3)(c)(i)";
        const classificationArt = isAnnexI ? "Art. 6(1)" : "Art. 6(2)";
        baseObligations = baseObligations.map((obl: any) =>
          obl.deadline === AUTHORED_HIGH_RISK_DEADLINE
            ? {
                ...obl,
                deadline: operativeDeadline,
                details: downstreamTriggered.has(obl.article)
                  ? `${obl.details} Practical compliance date ${operativeDeadline} for ${sourceLabel}: this article formally applies since 2 August 2026 (Art. 113, second paragraph), and is triggered by the ${classificationArt} classification, which applies from ${operativeDeadline} under ${pointCite} as amended by the Digital Omnibus on AI.${
                      obl.article === "Art. 49"
                        ? " Independently of that trigger, Art. 5(2) has conditioned permitted real-time remote biometric identification on Art. 27 and Art. 49 registration since 2 February 2025, so Art. 49 is not wholly dormant before that date."
                        : ""
                    }`
                  : `${obl.details} Application date ${operativeDeadline} for ${sourceLabel}, per ${pointCite} as amended by the Digital Omnibus on AI.`,
              }
            : obl,
        );
      }
    }

    if (input.role === 'provider' && input.risk_level === 'gpai' && input.gpai_model_placed_on_market_before_2025_08_02) {
      baseObligations = baseObligations.map((obl: any) => ({
        ...obl,
        deadline: '2027-08-02',
        details: `${obl.details} Art. 111(3) transition applied: this response assumes the GPAI model was placed on the market before 2 August 2025.`,
      }));
    }

    const filtered = input.filter_keyword
      ? baseObligations.filter((obl: any) => 
          obl.details.toLowerCase().includes(input.filter_keyword!.toLowerCase()) ||
          obl.category.toLowerCase().includes(input.filter_keyword!.toLowerCase())
        )
      : baseObligations;

    const penaltyInfo = input.risk_level === 'high-risk' || input.risk_level === 'limited'
      ? { max_fine: "Up to EUR 15 million or 3% of global annual turnover", basis: "Art. 99(4)" }
      : input.risk_level === 'gpai'
      ? input.role === 'provider'
        ? { max_fine: "Up to EUR 15 million or 3% of global annual turnover for GPAI provider infringements", basis: "Art. 101" }
        : { max_fine: "No GPAI model-provider fine returned for deployer role; classify the downstream AI system separately if applicable", basis: "Art. 101 applies to providers of general-purpose AI models" }
      : { max_fine: "No specific risk-level penalty tier returned; penalties depend on the infringed obligation and Member State rules under Art. 99", basis: "Art. 99" };

    const output: ObligationsOutput = {
      role: input.role,
      risk_level: input.risk_level,
      obligations: filtered,
      penalties: penaltyInfo,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
      structuredContent: output,
    };
  });
}
