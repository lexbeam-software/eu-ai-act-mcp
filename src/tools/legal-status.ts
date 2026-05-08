import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  legalStatusInputSchema,
  legalStatusOutputSchema,
  type LegalStatusInput,
  type LegalStatusOutput,
} from "../schemas/legal-status.js";
import {
  KNOWLEDGE_VERSION,
  LAST_OMNIBUS_VERIFICATION,
  digitalOmnibus,
  omnibusSources,
} from "../knowledge/deadlines.js";

function allStatusItems(): LegalStatusOutput["items"] {
  return [
    {
      area: "Annex III high-risk AI systems",
      current_law_date: "2026-08-02",
      provisional_date_if_adopted: "2027-12-02",
      binding_status: "current_law",
      status_note:
        "Current law still applies from 2 August 2026. The 7 May 2026 provisional agreement would shift Annex III high-risk obligations to 2 December 2027 if formally adopted.",
      relevant_articles: ["Art. 6(2)", "Art. 9-17", "Art. 26", "Art. 27", "Art. 43", "Art. 49", "Art. 72", "Art. 73", "Art. 113"],
    },
    {
      area: "Annex I regulated-product high-risk AI systems",
      current_law_date: "2027-08-02",
      provisional_date_if_adopted: "2028-08-02",
      binding_status: "current_law",
      status_note:
        "Current law still applies from 2 August 2027. The provisional agreement would shift Annex I high-risk obligations to 2 August 2028 if formally adopted.",
      relevant_articles: ["Art. 6(1)", "Art. 113", "Annex I"],
    },
    {
      area: "Article 50 transparency, GenAI watermarking and output detection",
      current_law_date: "2026-08-02",
      provisional_date_if_adopted: "2026-12-02",
      binding_status: "current_law",
      status_note:
        "Current law still applies from 2 August 2026. The provisional agreement would shift Article 50(2) watermarking/output-detection timing to 2 December 2026 if formally adopted.",
      relevant_articles: ["Art. 50", "Art. 113"],
    },
    {
      area: "GPAI obligations and AI Office enforcement",
      current_law_date: "2025-08-02",
      provisional_date_if_adopted: null,
      binding_status: "in_effect",
      status_note:
        "GPAI obligations have applied since 2 August 2025. AI Office enforcement powers and fines start 2 August 2026. These GPAI dates are unchanged in the provisional agreement.",
      relevant_articles: ["Art. 51", "Art. 52", "Art. 53", "Art. 55", "Art. 56", "Art. 101", "Art. 113"],
    },
    {
      area: "Prohibited practices",
      current_law_date: "2025-02-02",
      provisional_date_if_adopted: "2026-12-02",
      binding_status: "in_effect",
      status_note:
        "Article 5 prohibited practices are already in effect. The provisional agreement would add AI systems for non-consensual sexual/intimate content and CSAM, with compliance by 2 December 2026 if adopted.",
      relevant_articles: ["Art. 5", "Art. 113"],
    },
  ];
}

function matchesArea(item: LegalStatusOutput["items"][number], area: NonNullable<LegalStatusInput["area"]>): boolean {
  if (area === "all") return true;
  const haystack = item.area.toLowerCase();
  return (
    (area === "annex_iii" && haystack.includes("annex iii")) ||
    (area === "annex_i" && haystack.includes("annex i regulated")) ||
    (area === "article_50" && haystack.includes("article 50")) ||
    (area === "gpai" && haystack.includes("gpai")) ||
    (area === "prohibited_practices" && haystack.includes("prohibited"))
  );
}

export function registerLegalStatusTool(server: McpServer): void {
  server.registerTool(
    "euaiact_get_legal_status",
    {
      title: "Get EU AI Act Legal Status Card",
      description:
        "Return the current legal-status card for time-sensitive EU AI Act dates and Digital Omnibus amendments. Use this before giving advice about whether a deadline has legally changed. It separates current law from provisional dates, lists adoption steps still remaining, includes last-verified metadata, and gives communication guardrails.",
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: legalStatusInputSchema,
      outputSchema: legalStatusOutputSchema,
    },
    async (input: LegalStatusInput): Promise<{ content: any[]; structuredContent: LegalStatusOutput }> => {
      const area = input.area ?? "all";
      const output: LegalStatusOutput = {
        as_of: LAST_OMNIBUS_VERIFICATION,
        knowledge_version: KNOWLEDGE_VERSION,
        current_law_remains_authoritative: true,
        formal_adoption_status:
          `${digitalOmnibus.status}: provisional political agreement reached on ${digitalOmnibus.provisionalAgreementDate}; not formally adopted or published in the Official Journal as of ${digitalOmnibus.lastVerifiedAt}.`,
        adoption_steps_remaining: [
          "Council endorsement",
          "European Parliament endorsement / position",
          "Legal-linguistic revision",
          "Formal adoption by the co-legislators",
          "Publication in the Official Journal",
          "Entry into force of the amending regulation",
        ],
        communication_guardrails: [
          "Do not say the EU AI Act has already been amended unless a formally adopted amending regulation has been published.",
          "Say the provisional agreement would shift dates if adopted; do not present provisional dates as binding law.",
          "Plan against current-law dates while using provisional dates for scenario planning.",
          "Cite official sources and last verification date when advising on deadlines.",
        ],
        items: allStatusItems().filter((item) => matchesArea(item, area)),
        sources: omnibusSources,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  );
}
