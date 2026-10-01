import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  annexIvInputSchema,
  annexIvOutputSchema,
  type AnnexIvInput,
  type AnnexIvOutput,
} from "../schemas/annex-iv.js";
import { annexIVItems } from "../knowledge/annex-iv.js";

const GUIDANCE_NOTE = "The nine titles and descriptions summarise Annex IV. `sub_items` are non-binding implementation prompts, are not verbatim Annex IV text, and do not create additional legal requirements. Under Article 11(1), SMEs, including start-ups, and SMCs may provide the Annex IV elements in a simplified manner only by using the Commission form referred to in that paragraph.";

function toChecklistMarkdown(): string {
  const lines: string[] = ["# Annex IV - Technical Documentation Checklist", "", `> ${GUIDANCE_NOTE}`, ""];
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
        GUIDANCE_NOTE,
      annotations: {
        title: "Annex IV Technical Documentation Checklist",
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
        guidance_note: GUIDANCE_NOTE,
        total_items: items.length,
        relevant_articles: ["Art. 11", "Annex IV"],
        ...(input.format === "checklist" ? { checklist_markdown: toChecklistMarkdown() } : {}),
        ...(input.sme_simplified
          ? {
              sme_note:
                GUIDANCE_NOTE,
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
