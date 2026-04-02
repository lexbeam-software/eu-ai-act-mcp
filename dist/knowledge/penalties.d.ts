/**
 * EU AI Act - Penalty Framework
 *
 * Source: Regulation (EU) 2024/1689, Art. 99-101
 */
export interface PenaltyTier {
    id: string;
    name: string;
    maxFineEUR: number;
    globalTurnoverPercentage: number;
    article: string;
    description: string;
    applicableTo: string[];
    examples: string[];
}
export interface SMEReduction {
    entityType: string;
    description: string;
    article: string;
    details: string;
}
export interface PenaltyFramework {
    tiers: PenaltyTier[];
    smeReductions: SMEReduction[];
    enforcementDate: string;
    enforcementAuthority: string;
    notes: string[];
}
export declare const penaltyFramework: PenaltyFramework;
export declare function getPenaltyTier(violationType: "prohibited" | "high_risk" | "false_info"): PenaltyTier;
export declare function calculateMaxFine(violationType: "prohibited" | "high_risk" | "false_info", annualTurnoverEUR: number, isSME?: boolean): {
    fixedCap: number;
    turnoverBased: number;
    applicableFine: number;
};
//# sourceMappingURL=penalties.d.ts.map