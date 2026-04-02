import { z } from "zod";
export const deadlinesInputSchema = z.object({
    area: z.string().optional().describe("Optional filter by compliance area"),
});
export const deadlinesOutputSchema = z.object({
    milestones: z.array(z.any()),
    digitalOmnibus: z.any(),
    source: z.string(),
    lastUpdated: z.string(),
});
//# sourceMappingURL=deadlines.js.map