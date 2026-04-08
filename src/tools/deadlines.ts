import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { deadlinesInputSchema, deadlinesOutputSchema, type DeadlinesInput, type DeadlinesOutput } from "../schemas/deadlines.js";
import { getMilestonesWithDaysRemaining, digitalOmnibus } from "../knowledge/deadlines.js";

export function registerDeadlinesTool(server: McpServer): void {
  server.registerTool("euaiact_check_deadlines", {
    title: "Check EU AI Act Implementation Deadlines",
    description: "Returns key implementation milestones and deadlines for the EU AI Act with days remaining, a `next_milestone` shortcut, and the current status of the Digital Omnibus simplification proposal. Use `only_upcoming: true` to drop past milestones.",
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: deadlinesInputSchema,
    outputSchema: deadlinesOutputSchema,
  }, async (input: DeadlinesInput): Promise<{ content: any[], structuredContent: DeadlinesOutput }> => {
    let currentMilestones = getMilestonesWithDaysRemaining();

    if (input.area) {
      const areaLower = input.area.toLowerCase();
      currentMilestones = currentMilestones.filter(m =>
        m.description.toLowerCase().includes(areaLower) ||
        m.name.toLowerCase().includes(areaLower)
      );
    }

    if (input.only_upcoming) {
      currentMilestones = currentMilestones.filter(m => !m.isPast);
    }

    const nextUpcoming = currentMilestones.find(m => !m.isPast) ?? null;

    const output: DeadlinesOutput = {
      milestones: currentMilestones.map(m => ({
        date: m.date,
        name: m.name,
        description: m.description,
        status: m.status,
        articles: m.articles,
        key_obligations: m.keyObligations,
        days_remaining: m.daysRemaining,
        is_past: m.isPast,
      })),
      next_milestone: nextUpcoming
        ? {
            date: nextUpcoming.date,
            name: nextUpcoming.name,
            days_remaining: nextUpcoming.daysRemaining,
          }
        : null,
      digital_omnibus: {
        name: digitalOmnibus.name,
        status: digitalOmnibus.status,
        proposal_date: digitalOmnibus.proposalDate,
        description: digitalOmnibus.description,
        key_changes: digitalOmnibus.keyChanges,
        impact_on_ai_act: digitalOmnibus.impactOnAIAct,
      },
    };

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
      structuredContent: output,
    };
  });
}
