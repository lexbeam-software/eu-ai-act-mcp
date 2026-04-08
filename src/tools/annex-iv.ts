import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  annexIvInputSchema,
  annexIvOutputSchema,
  type AnnexIvInput,
  type AnnexIvOutput,
} from "../schemas/annex-iv.js";
import { annexIVItems } from "../knowledge/annex-iv.js";

function toChecklistMarkdown(): string {
  const lines: string[] = ["# Annex IV — Technical Documentation Checklist", ""];
  for (const item of annexIVItems) {
    lines.push(`## ${item.number}. ${item.title}`);
    lines.push("");
    lines.push(item.description);
    lines.push("");
    for (const sub of item.sub_items) {
      lines.push(`- [ ] ${sub}`);
    }
    lines.push("");
    lines.push(`_Related: ${item.related_articles.join(", ")}_`);
    lines.push("");
  }
  return lines.join("\n");
}

export function registerAnnexIvTool(server: McpServer): void {
  server.registerTool(
    "euaiact_annex_iv_checklist",
    {
      title: "Annex IV Technical Documentation Checklist",
      description:
        "Return the full Annex IV technical documentation requirements that a provider of a high-risk AI system must prepare under Art. 11 before placing the system on the market. Nine items cover: general description, detailed elements and development process, monitoring/functioning/control, performance metrics appropriateness, risk management system, lifecycle changes, harmonised standards applied, EU declaration of conformity, and post-market monitoring plan. Use `format: \"checklist\"` to also receive a markdown checklist suitable for audit prep. SMEs may provide the information in a simplified manner.",
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: annexIvInputSchema,
      outputSchema: annexIvOutputSchema,
    },
    async (input: AnnexIvInput): Promise<{ content: any[]; structuredContent: AnnexIvOutput }> => {
      const items = annexIVItems.map((i) => ({
        number: i.number,
        title: i.title,
        description: i.description,
        sub_items: i.sub_items,
        related_articles: i.related_articles,
      }));

      const output: AnnexIvOutput = {
        items,
        total_items: items.length,
        relevant_articles: ["Art. 11", "Annex IV"],
        ...(input.format === "checklist" ? { checklist_markdown: toChecklistMarkdown() } : {}),
        ...(input.sme_simplified
          ? {
              sme_note:
                "Art. 11(1) second subparagraph: SMEs, including start-ups, may provide the elements of the technical documentation specified in Annex IV in a simplified manner. The Commission will establish a simplified technical documentation form targeted at the needs of small and micro enterprises, which SMEs may choose to use.",
            }
          : {}),
      };

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  );
}
