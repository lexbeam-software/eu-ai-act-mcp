/**
 * EU AI Act - Annex III High-Risk Categories, Art. 5 Prohibited Practices,
 * Art. 6(3) Exceptions, and Art. 50 Limited Risk Triggers
 *
 * Source: Regulation (EU) 2024/1689
 */
export interface HighRiskCategory {
    number: number;
    name: string;
    description: string;
    examples: string[];
    keywords: string[];
    relevantArticles: string[];
}
export interface ProhibitedPractice {
    id: string;
    name: string;
    description: string;
    examples: string[];
    keywords: string[];
    article: string;
}
export interface ExceptionCondition {
    id: string;
    condition: string;
    description: string;
    article: string;
}
export interface TransparencyTrigger {
    id: string;
    name: string;
    description: string;
    examples: string[];
    keywords: string[];
    article: string;
}
export declare const annexIIICategories: HighRiskCategory[];
export declare const prohibitedPractices: ProhibitedPractice[];
export declare const article6_3_exceptions: ExceptionCondition[];
export declare const transparencyTriggers: TransparencyTrigger[];
//# sourceMappingURL=annex-iii.d.ts.map