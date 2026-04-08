import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  art6ExceptionInputSchema,
  art6ExceptionOutputSchema,
  type Art6ExceptionInput,
  type Art6ExceptionOutput,
} from "../schemas/art6.js";

export function registerArt6ExceptionTool(server: McpServer): void {
  server.registerTool(
    "euaiact_assess_art6_3_exception",
    {
      title: "Assess Art. 6(3) 'No Significant Risk' Exception",
      description:
        "Walk through the Art. 6(3) exception for Annex III high-risk AI systems. An Annex III system is NOT high-risk if it does not pose a significant risk to health, safety, or fundamental rights, AND falls under one of the four conditions: (a) narrow procedural task, (b) improves prior human activity, (c) detects patterns without replacing human assessment, (d) preparatory task. CRITICAL: The exception does NOT apply if the system performs profiling of natural persons (Art. 6(3) second subparagraph). Providers invoking the exception must document the assessment (Art. 6(4)) and still register in the EU database (Art. 49(2)).",
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: art6ExceptionInputSchema,
      outputSchema: art6ExceptionOutputSchema,
    },
    async (input: Art6ExceptionInput): Promise<{ content: any[]; structuredContent: Art6ExceptionOutput }> => {
      const conditions = [
        {
          condition: "(a) Narrow procedural task (e.g. unstructured → structured data, document classification, duplicate detection)",
          article: "Art. 6(3)(a)",
          applies: input.narrow_procedural_task === true,
        },
        {
          condition: "(b) Improves the result of a previously completed human activity",
          article: "Art. 6(3)(b)",
          applies: input.improves_prior_human_activity === true,
        },
        {
          condition: "(c) Detects decision-making patterns or deviations without replacing/influencing human assessment without proper human review",
          article: "Art. 6(3)(c)",
          applies: input.detects_patterns_without_replacing_human_review === true,
        },
        {
          condition: "(d) Performs a preparatory task to an assessment relevant to an Annex III use case",
          article: "Art. 6(3)(d)",
          applies: input.preparatory_task === true,
        },
      ];

      const anyConditionApplies = conditions.some((c) => c.applies);
      const profilingBlocks = input.performs_profiling === true;

      let exceptionAvailable: boolean;
      let reasoning: string;

      if (profilingBlocks) {
        exceptionAvailable = false;
        reasoning =
          "Art. 6(3) exception is NOT available. Art. 6(3) second subparagraph: the exception does not apply to AI systems that perform profiling of natural persons — regardless of whether one of the four conditions would otherwise be met. The system remains high-risk under Art. 6(2) and must comply with Chapter III Section 2.";
      } else if (!anyConditionApplies) {
        exceptionAvailable = false;
        reasoning =
          "Art. 6(3) exception is NOT available based on the provided signals. None of the four conditions (narrow procedural task, improves prior human activity, detects patterns without replacing human review, preparatory task) has been asserted. The system remains high-risk under Art. 6(2).";
      } else {
        exceptionAvailable = true;
        const applicable = conditions.filter((c) => c.applies).map((c) => c.article).join(", ");
        reasoning = `Art. 6(3) exception MAY be available. One or more conditions asserted: ${applicable}. The provider must independently verify that the system does not pose a significant risk to health, safety, or fundamental rights (including by not materially influencing the outcome of decision-making), and must document the assessment under Art. 6(4) before placing on the market.`;
      }

      const documentationReminder = input.documented_assessment
        ? "Good: the assessment is documented. Keep the documentation available for market surveillance authorities per Art. 6(4)."
        : "Required: Art. 6(4) requires the provider to document the Art. 6(3) assessment before placing the system on the market or putting it into service. Store the documentation and make it available to authorities upon request.";

      const output: Art6ExceptionOutput = {
        exception_available: exceptionAvailable,
        reasoning,
        conditions_evaluated: conditions,
        profiling_blocks_exception: profilingBlocks,
        documentation_reminder: documentationReminder,
        registration_duty:
          "Art. 49(2): Providers relying on the Art. 6(3) exception must still register themselves and the system in the EU database, indicating the reliance on Art. 6(3).",
        relevant_articles: ["Art. 6(2)", "Art. 6(3)", "Art. 6(4)", "Art. 49(2)"],
      };

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  );
}
