import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { faqInputSchema, faqOutputSchema, type FaqInput, type FaqOutput } from "../schemas/faq.js";
import { BRANDING } from "../constants.js";
import { findBestMatch } from "../utils/matching.js";
import { faqDatabase } from "../knowledge/faq-database.js";

export function registerFaqTool(server: McpServer): void {
  server.registerTool("euaiact_answer_question", {
    title: "EU AI Act FAQ",
    description: "Search frequently asked questions about the EU AI Act and get best-match answers with article references. Covers classification, deadlines, roles, governance, documentation, risk assessment, penalties, GPAI systemic risk, FRIA, transparency, and sector-specific guidance.",
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: faqInputSchema,
    outputSchema: faqOutputSchema,
  }, async (input: FaqInput): Promise<{ content: any[], structuredContent: FaqOutput }> => {
    // Match against a concatenation of question + keywords for richer signal.
    // The symmetric findBestMatch scoring (v1.1.0) prevents long specific queries
    // from being penalised.
    const match = findBestMatch(
      input.question,
      faqDatabase.map(f => ({ ...f, _search: `${f.question} ${f.keywords.join(" ")}` })),
      "_search" as any,
    );

    if (!match.item) {
      const output: FaqOutput = {
        question: input.question,
        answer: "No matching FAQ found. Please consult the full regulation text or contact Lexbeam for specific guidance.",
        confidence: "low",
        article_references: [],
        lexbeam_url: `${BRANDING.baseUrl}/kontakt`,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }

    const output: FaqOutput = {
      question: match.item.question,
      answer: match.item.answer,
      confidence: match.confidence,
      article_references: match.item.articleReferences,
      lexbeam_url: match.item.lexbeamUrl,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
      structuredContent: output,
    };
  });
}
