import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { penaltiesInputSchema, penaltiesOutputSchema, type PenaltiesInput, type PenaltiesOutput } from "../schemas/penalties.js";
import { calculateMaxFine, getPenaltyTier } from "../knowledge/penalties.js";

/**
 * Rewrites the tier description to match SME wording when applicable.
 * Fixes a v1.0.1 bug where `tier.description` (baked into the knowledge base)
 * always said "whichever is higher" — contradicting `max_fine.explanation`
 * on the same response when `is_sme === true`.
 */
function descriptionForSme(base: string): string {
  return base.replace(/whichever is higher/i, "whichever is lower (Art. 99(6) SME/startup protection)");
}

export function registerPenaltiesTool(server: McpServer): void {
  server.registerTool("euaiact_calculate_penalty", {
    title: "Calculate EU AI Act Penalties",
    description: "Calculates the maximum possible fine for an EU AI Act violation based on violation type, global annual turnover, and SME status. Implements the Art. 99 penalty framework including the SME/startup protection rule (Art. 99(6)). Returns a comparative block so the agent can show the SME reduction to the user.",
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: penaltiesInputSchema,
    outputSchema: penaltiesOutputSchema,
  }, async (input: PenaltiesInput): Promise<{ content: any[], structuredContent: PenaltiesOutput }> => {
    const tier = getPenaltyTier(input.violation_type);
    const calculation = calculateMaxFine(input.violation_type, input.annual_turnover_eur, input.is_sme);
    const calculationNonSme = calculateMaxFine(input.violation_type, input.annual_turnover_eur, false);
    const calculationSme = calculateMaxFine(input.violation_type, input.annual_turnover_eur, true);

    const rule = input.is_sme ? "LOWER (SME/startup protection under Art. 99(6))" : "HIGHER";
    const explanation = `For ${tier.name} violations (${tier.article}): up to EUR ${tier.maxFineEUR.toLocaleString()} or ${tier.globalTurnoverPercentage}% of global annual turnover, whichever is ${rule}.`;

    const tierDescription = input.is_sme ? descriptionForSme(tier.description) : tier.description;

    const output: PenaltiesOutput = {
      violation_type: input.violation_type,
      is_sme: input.is_sme,
      annual_turnover_eur: input.annual_turnover_eur,
      max_fine: {
        fixed_cap_eur: calculation.fixedCap,
        turnover_based_eur: calculation.turnoverBased,
        applicable_fine_eur: calculation.applicableFine,
        explanation,
      },
      tier_details: {
        name: tier.name,
        article: tier.article,
        description: tierDescription,
      },
      comparative: {
        non_sme_applicable_fine_eur: calculationNonSme.applicableFine,
        sme_applicable_fine_eur: calculationSme.applicableFine,
        reduction_eur: Math.max(0, calculationNonSme.applicableFine - calculationSme.applicableFine),
      },
    };

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
      structuredContent: output,
    };
  });
}
