import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  assessSystemResponseSchema,
  systemProfileSchema,
  type AssessSystemResponse,
  type SystemProfile,
} from "../decision-contract/index.js";
import { assessSystem } from "../decision-contract/assess-system.js";

const ISSUES_URL = "https://github.com/lexbeam-software/eu-ai-act-mcp/issues";

/**
 * An unexpected exception is a defect in this server, never a finding about the
 * caller's system. Say so in words an agent can relay instead of surfacing a bare
 * runtime message, and keep the original message for the bug report.
 */
function internalFailure(error: unknown): Error {
  const detail = error instanceof Error ? error.message : String(error);
  return new Error(
    "euaiact_assess_system could not complete this assessment because of an internal server error. " +
      "This is a defect in the server, not a finding about the described system: no legal classification, " +
      "impact or readiness result was produced, and none should be inferred. " +
      `Please report the input at ${ISSUES_URL}. Detail: ${detail}`,
  );
}

export function registerAssessSystemTool(server: McpServer): void {
  server.registerTool(
    "euaiact_assess_system",
    {
      title: "Assess an AI System Under the EU AI Act",
      description:
        "Assess one normalized EU AI Act system profile against the pinned sealed corpus. Returns separate legal-classification, impact, and implementation-readiness blocks with field-level facts, decisive missing facts, complete finding provenance, warnings, and recommended atomic follow-up calls. Sparse inputs fail closed. Impact never changes legal classification, and classification never implies implementation readiness. " +
        "HOW TO BUILD THE PROFILE: every fact is an object {fact_id, value, origin, verification, evidence_reference_ids}. For a fact the user told you, use origin \"explicit_structured_input\", verification \"caller_asserted\", evidence_reference_ids [] and any unique lowercase fact_id such as \"identity.system_name\". A useful minimum is identity.system_name, intended_use.intended_purpose (intended_use also needs reasonably_foreseeable_uses, which may be []), role_facts.roles, geography with jurisdictions, affected_person_groups and one of used_in_eu, placed_on_eu_market or output_used_in_eu, and decision_context.decision_consequence. Set annex_iii.domain and annex_iii.annex_iii_point only when the system itself performs a use Annex III lists for that area, never because it operates in that sector. Supply only facts you were given: a missing decisive fact comes back in missing_facts with the question to ask.",
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: systemProfileSchema,
      outputSchema: assessSystemResponseSchema,
    },
    async (
      input: SystemProfile,
    ): Promise<{ content: any[]; structuredContent: AssessSystemResponse }> => {
      let output: AssessSystemResponse;
      try {
        output = await assessSystem(input);
      } catch (error) {
        throw internalFailure(error);
      }
      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  );
}
