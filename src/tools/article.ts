import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  articleInputSchema,
  articleOutputSchema,
  type ArticleInput,
  type ArticleOutput,
} from "../schemas/article.js";
import { articles, findArticle, EURLEX_BASE_URL } from "../knowledge/articles.js";

export function registerArticleTool(server: McpServer): void {
  server.registerTool(
    "euaiact_get_article",
    {
      title: "Get EU AI Act Article Text",
      description:
        "Retrieve an operational summary of a specific article of the EU AI Act (Regulation 2024/1689), plus a stable EUR-Lex URL to the canonical text. Supports a subset of the most-cited articles (Art. 3, 4, 5, 6, 9-17, 26, 27, 43, 47, 49, 50, 51, 53, 55, 72, 73, 99, 100, 113). For articles outside this subset the tool returns the EUR-Lex base URL. Use this tool to ground citations and quote article text with a link.",
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: articleInputSchema,
      outputSchema: articleOutputSchema,
    },
    async (input: ArticleInput): Promise<{ content: any[]; structuredContent: ArticleOutput }> => {
      const entry = findArticle(input.article);
      if (!entry) {
        const output: ArticleOutput = {
          available: false,
          article: null,
          eurlex_url: EURLEX_BASE_URL,
          note: `Article "${input.article}" is not in the operational summary corpus. Follow the EUR-Lex URL for the canonical text. Supported articles: ${articles.map((a) => a.number).join(", ")}.`,
        };
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }
      const output: ArticleOutput = {
        available: true,
        article: {
          number: entry.number,
          title: entry.title,
          summary: entry.summary,
          related_annexes: entry.related_annexes,
        },
        eurlex_url: entry.eurlex_url,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  );
}
