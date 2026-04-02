/**
 * EU AI Act - Obligations by Role and Risk Category
 *
 * Source: Regulation (EU) 2024/1689
 */
export interface Obligation {
    obligation: string;
    article: string;
    deadline: string;
    details: string;
    category: string;
}
export declare const providerHighRiskObligations: Obligation[];
export declare const deployerHighRiskObligations: Obligation[];
export declare const providerGPAIObligations: Obligation[];
export declare const limitedRiskTransparencyObligations: Obligation[];
export declare const universalObligations: Obligation[];
//# sourceMappingURL=obligations.d.ts.map