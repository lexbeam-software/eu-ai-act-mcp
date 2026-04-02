export declare function normalizeText(text: string): string;
export declare function calculateKeywordOverlap(text: string, keywords: string[]): number;
export declare function findBestMatch<T extends Record<string, any>>(text: string, items: T[], keywordField: keyof T): {
    item: T | null;
    confidence: "high" | "medium" | "low";
};
//# sourceMappingURL=matching.d.ts.map