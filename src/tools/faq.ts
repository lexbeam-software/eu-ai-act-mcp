import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { faqInputSchema, faqOutputSchema, type FaqInput, type FaqOutput } from "../schemas/faq.js";
import { findFaqMatch } from "../utils/faq-matching.js";

export function registerFaqTool(server: McpServer): void {
  server.registerTool("euaiact_answer_question", {
    title: "EU AI Act FAQ",
    description: "Search frequently asked questions about the EU AI Act and get best-match answers with article references. Covers classification, deadlines, roles, governance, documentation, risk assessment, penalties, GPAI systemic risk, FRIA, transparency, and sector-specific guidance.",
    annotations: {
      title: "EU AI Act FAQ",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: faqInputSchema,
    outputSchema: faqOutputSchema,
  }, async (input: FaqInput): Promise<{ content: any[], structuredContent: FaqOutput }> => {
    const match = findFaqMatch(input.question);

    // Abstain below the match threshold instead of serving the least-bad entry:
    // a wrong answer to a different question is worse than no answer.
    if (!match.item || match.score < 0.34) {
      const output: FaqOutput = {
        question: input.question,
        match_status: "no_match",
        candidate_question: match.item?.question,
        answer:
          "No sufficiently matching FAQ found. Try euaiact_check_deadlines for dates, euaiact_classify_system for risk classification, euaiact_get_obligations for duties, or euaiact_get_article for a specific article. Consult the regulation text for anything else.",
        confidence: "low",
        article_references: [],
      };
      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }

    const output: FaqOutput = {
      // The caller's question is echoed verbatim; the matched entry is named
      // separately so a substitution can never be silent.
      question: input.question,
      match_status: "matched",
      matched_question: match.item.question,
      answer: match.item.answer,
      confidence: match.confidence,
      article_references: match.item.articleReferences,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
      structuredContent: output,
    };
  });
}
