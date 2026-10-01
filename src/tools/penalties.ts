import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { penaltiesInputSchema, penaltiesOutputSchema, type PenaltiesInput, type PenaltiesOutput } from "../schemas/penalties.js";
import { calculateMaxFine, getPenaltyTier } from "../knowledge/penalties.js";

/**
 * Rewrites the tier description to the lower-of wording when a protection rule
 * applies. Fixes a v1.0.1 bug where `tier.description` (baked into the knowledge
 * base) always said "whichever is higher" - contradicting `max_fine.explanation`
 * on the same response.
 */
function descriptionForLowerRule(base: string, ruleCite: string): string {
  return base.replace(/whichever is higher/i, `whichever is lower (${ruleCite})`);
}

/** Art. 99(6a) covers ONLY paragraphs 4 and 5: high_risk (99(4)) and false_info (99(5)). */
function smcLowerApplies(violationType: string): boolean {
  return violationType === "high_risk" || violationType === "false_info";
}

export function registerPenaltiesTool(server: McpServer): void {
  server.registerTool("euaiact_calculate_penalty", {
    title: "Calculate EU AI Act Penalties",
    description: "Calculates the maximum possible fine for an EU AI Act violation based on violation type, global annual turnover, SME status and SMC (small mid-cap) status. Implements the Art. 99 penalty framework including the SME/startup lower-of rule (Art. 99(6), tiers 99(3)-(5)) and the narrower SMC rule (Art. 99(6a), tiers 99(4)-(5) only; no SMC cap on Art. 5 fines and none under Art. 101). Returns a comparative block so the agent can show the SME reduction to the user.",
    annotations: {
      title: "Calculate EU AI Act Penalties",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: penaltiesInputSchema,
    outputSchema: penaltiesOutputSchema,
  }, async (input: PenaltiesInput): Promise<{ content: any[], structuredContent: PenaltiesOutput }> => {
    const tier = getPenaltyTier(input.violation_type);
    const smeLowerApplies = tier.smeLowerApplies !== false;
    // Which lower-of rule applies, in precedence order: SME (Art. 99(6), tiers
    // 99(3)-(5)) before SMC (Art. 99(6a), tiers 99(4)-(5) only). Art. 101 has neither.
    const smeRule = input.is_sme && smeLowerApplies;
    const smcRule = !smeRule && input.is_smc && smcLowerApplies(input.violation_type);
    const applyLower = smeRule || smcRule;
    const calculation = calculateMaxFine(input.violation_type, input.annual_turnover_eur, applyLower);
    const calculationNonSme = calculateMaxFine(input.violation_type, input.annual_turnover_eur, false);
    const calculationSme = calculateMaxFine(input.violation_type, input.annual_turnover_eur, smeLowerApplies);

    const rule = smeRule
      ? "LOWER (SME/startup protection under Art. 99(6))"
      : smcRule
        ? "LOWER (small mid-cap rule under Art. 99(6a), covering the Art. 99(4) and 99(5) tiers only)"
        : input.is_smc && input.violation_type === "prohibited"
          ? "HIGHER (Art. 99(6a) covers only the Art. 99(4) and 99(5) tiers; there is no SMC cap for Art. 5 prohibited-practice fines)"
          : (input.is_sme || input.is_smc) && input.violation_type === "gpai"
            ? "HIGHER (Art. 101 has no Art. 99(6) or 99(6a) lower-cap rule)"
            : "HIGHER";
    const explanation = `For ${tier.name} violations (${tier.article}): up to EUR ${tier.maxFineEUR.toLocaleString()} or ${tier.globalTurnoverPercentage}% of global annual turnover, whichever is ${rule}.`;

    const tierDescription = applyLower
      ? descriptionForLowerRule(tier.description, smeRule ? "Art. 99(6) SME/startup protection" : "Art. 99(6a) small mid-cap rule")
      : tier.description;

    const output: PenaltiesOutput = {
      violation_type: input.violation_type,
      is_sme: input.is_sme,
      is_smc: input.is_smc,
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
