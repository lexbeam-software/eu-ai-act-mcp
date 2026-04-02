import { z } from "zod";
export declare const deadlinesInputSchema: z.ZodObject<{
    area: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    area?: string | undefined;
}, {
    area?: string | undefined;
}>;
export declare const deadlinesOutputSchema: z.ZodObject<{
    milestones: z.ZodArray<z.ZodAny, "many">;
    digitalOmnibus: z.ZodAny;
    source: z.ZodString;
    lastUpdated: z.ZodString;
}, "strip", z.ZodTypeAny, {
    source: string;
    milestones: any[];
    lastUpdated: string;
    digitalOmnibus?: any;
}, {
    source: string;
    milestones: any[];
    lastUpdated: string;
    digitalOmnibus?: any;
}>;
export type DeadlinesInput = z.infer<typeof deadlinesInputSchema>;
export type DeadlinesOutput = z.infer<typeof deadlinesOutputSchema>;
//# sourceMappingURL=deadlines.d.ts.map