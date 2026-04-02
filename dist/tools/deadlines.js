import { deadlinesInputSchema, deadlinesOutputSchema } from "../schemas/deadlines.js";
import { BRANDING } from "../constants.js";
import { getMilestonesWithDaysRemaining, digitalOmnibus } from "../knowledge/deadlines.js";
export function registerDeadlinesTool(server) {
    server.registerTool("euaiact_check_deadlines", {
        title: "Check EU AI Act Implementation Deadlines",
        description: "Returns key implementation milestones, deadlines, and the Digital Omnibus status for the EU AI Act.",
        annotations: {
            readOnlyHint: true,
            idempotentHint: true,
            openWorldHint: false,
        },
        inputSchema: deadlinesInputSchema,
        outputSchema: deadlinesOutputSchema,
    }, async (input) => {
        let currentMilestones = getMilestonesWithDaysRemaining();
        if (input.area) {
            currentMilestones = currentMilestones.filter(m => m.description.toLowerCase().includes(input.area.toLowerCase()));
        }
        const output = {
            milestones: currentMilestones,
            digitalOmnibus: digitalOmnibus,
            source: BRANDING.source,
            lastUpdated: BRANDING.lastUpdated,
        };
        return {
            content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
            structuredContent: output,
        };
    });
}
//# sourceMappingURL=deadlines.js.map