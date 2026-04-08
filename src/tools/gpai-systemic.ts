import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  gpaiSystemicInputSchema,
  gpaiSystemicOutputSchema,
  type GpaiSystemicInput,
  type GpaiSystemicOutput,
} from "../schemas/gpai-systemic.js";
import { providerGPAIObligations } from "../knowledge/obligations.js";

const FLOPS_THRESHOLD = 1e25;

export function registerGpaiSystemicTool(server: McpServer): void {
  server.registerTool(
    "euaiact_check_gpai_systemic_risk",
    {
      title: "Check GPAI Model Systemic Risk Classification",
      description:
        "Determine whether a general-purpose AI model qualifies as a GPAI model with systemic risk under Art. 51. A model is presumed to have high-impact capabilities when cumulative training compute exceeds 10^25 FLOPs (Art. 51(2)). The Commission may also designate models with equivalent capabilities or impact under Art. 51(1)(b). Returns baseline GPAI obligations under Art. 53 plus systemic-risk-only obligations under Art. 55, and the Art. 52 notification duty.",
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: gpaiSystemicInputSchema,
      outputSchema: gpaiSystemicOutputSchema,
    },
    async (input: GpaiSystemicInput): Promise<{ content: any[]; structuredContent: GpaiSystemicOutput }> => {
      const crossesFlops = typeof input.training_flops === "number" && input.training_flops > FLOPS_THRESHOLD;
      const designated = input.commission_designated === true;
      const isSystemic = crossesFlops || designated;

      const designation: GpaiSystemicOutput["systemic_risk_designation"] = designated
        ? "commission_designated"
        : crossesFlops
          ? "threshold_met"
          : "none";

      const baseline = providerGPAIObligations.filter((o) => o.article.startsWith("Art. 53"));
      const systemic = providerGPAIObligations.filter((o) => o.article.startsWith("Art. 55"));

      const notification = crossesFlops
        ? "Art. 52(1): Providers must notify the Commission without delay and in any event within two weeks of when the model meets — or it becomes known that it will meet — the systemic-risk threshold. The provider may present arguments that the model does not present systemic risks; the Commission assesses the arguments."
        : "No notification duty under Art. 52 on the basis of the current inputs. Re-evaluate when training compute approaches 10^25 FLOPs or Commission designation criteria may apply.";

      const output: GpaiSystemicOutput = {
        model_name: input.model_name ?? null,
        crosses_flops_threshold: crossesFlops,
        flops_threshold: FLOPS_THRESHOLD,
        systemic_risk_designation: designation,
        is_gpai_with_systemic_risk: isSystemic,
        baseline_obligations_art_53: baseline.map((o) => ({
          obligation: o.obligation,
          article: o.article,
          deadline: o.deadline,
          details: o.details,
          category: o.category,
        })),
        systemic_risk_obligations_art_55: isSystemic
          ? systemic.map((o) => ({
              obligation: o.obligation,
              article: o.article,
              deadline: o.deadline,
              details: o.details,
              category: o.category,
            }))
          : [],
        notification_duty: notification,
        relevant_articles: ["Art. 51", "Art. 52", "Art. 53", "Art. 55", "Art. 56"],
      };

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  );
}
