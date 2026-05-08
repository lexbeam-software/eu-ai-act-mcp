import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  incidentTriageInputSchema,
  incidentTriageOutputSchema,
  type IncidentTriageInput,
  type IncidentTriageOutput,
} from "../schemas/incident.js";

function addDays(date: string, days: number): string | null {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export function registerIncidentTriageTool(server: McpServer): void {
  server.registerTool(
    "euaiact_triage_serious_incident",
    {
      title: "Triage EU AI Act Serious Incident Reporting",
      description:
        "Triage whether an AI incident involving a high-risk AI system is reportable under Art. 73 and identify the likely 2-day, 10-day, or 15-day outer reporting bucket. Returns immediate actions, missing facts, clock-start guidance, and role notes for providers/deployers.",
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: incidentTriageInputSchema,
      outputSchema: incidentTriageOutputSchema,
    },
    async (input: IncidentTriageInput): Promise<{ content: any[]; structuredContent: IncidentTriageOutput }> => {
      const missing: string[] = [];
      if (input.high_risk_system === undefined) missing.push("Confirm whether the incident involves a high-risk AI system.");
      if (input.causal_link_established_or_likely === undefined) missing.push("Assess whether a causal link or reasonable likelihood exists between the AI system and the incident.");
      if (!input.aware_date) missing.push("Record the date when the provider/deployer became aware of the incident.");

      const highRisk = input.high_risk_system === true;
      const notHighRisk = input.high_risk_system === false;
      const causal = input.causal_link_established_or_likely === true;
      const serious =
        input.death ||
        input.serious_harm_to_health ||
        input.serious_property_or_environment_damage ||
        input.fundamental_rights_breach ||
        input.widespread_infringement;

      let reportable: IncidentTriageOutput["reportable"] = "insufficient_information";
      let bucket: IncidentTriageOutput["deadline_bucket"] = "insufficient_information";
      let days: number | null = null;
      let reasoning = "Insufficient information to determine Art. 73 reportability.";

      if (notHighRisk) {
        reportable = "no";
        bucket = "no_ai_act_report";
        reasoning = "Art. 73 serious-incident reporting is tied to high-risk AI systems. Other regimes may still apply.";
      } else if (highRisk && serious && causal) {
        reportable = "yes";
        if (input.fundamental_rights_breach || input.widespread_infringement) {
          bucket = "2_days";
          days = 2;
          reasoning = "Likely Art. 73(3) accelerated reporting bucket: widespread infringement or serious fundamental-rights breach.";
        } else if (input.death) {
          bucket = "10_days";
          days = 10;
          reasoning = "Likely Art. 73(4) fatality bucket: report immediately and no later than 10 days after awareness.";
        } else {
          bucket = "15_days";
          days = 15;
          reasoning = "Likely Art. 73(2) standard serious-incident bucket: report immediately and no later than 15 days after awareness.";
        }
      } else if (highRisk && serious) {
        reportable = "likely";
        bucket = "insufficient_information";
        reasoning = "A serious harm signal exists for a high-risk system, but the causal-link assessment is not yet confirmed.";
      }

      const output: IncidentTriageOutput = {
        reportable,
        deadline_bucket: bucket,
        outer_limit: input.aware_date && days ? addDays(input.aware_date, days) : null,
        clock_start:
          "Report without undue delay after establishing a causal link or reasonable likelihood. Track the awareness date and the causal-link determination separately.",
        reasoning,
        immediate_actions: [
          "Preserve logs, prompts, outputs, model/system version, user actions, and relevant audit trails.",
          "Stabilise or suspend the affected deployment if needed to prevent further harm.",
          "Notify provider/deployer counterparties and assign one incident owner.",
          "Check parallel GDPR, NIS2, MDR/product-safety, labour, and sector notification clocks.",
        ],
        missing_information: missing,
        role_note:
          input.role === "provider"
            ? "Provider should prepare the Art. 73 notification to the competent market surveillance authority where the incident occurred."
            : input.role === "deployer"
              ? "Deployer should immediately inform the provider and support evidence collection; direct authority duties may also arise depending on facts and national/sector rules."
              : "Clarify whether the organisation is provider, deployer, or both; reporting ownership depends on role and contract structure.",
        relevant_articles: ["Art. 3(49)", "Art. 26(5)", "Art. 72", "Art. 73"],
      };

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  );
}
