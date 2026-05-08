/**
 * EU AI Act - Key Milestones and Deadlines
 *
 * Source: Regulation (EU) 2024/1689
 */
export interface Milestone {
    date: string;
    name: string;
    description: string;
    status: "in_effect" | "upcoming" | "proposal_only";
    articles: string[];
    keyObligations: string[];
    provisionalDateIfAdopted?: string;
}
export interface MilestoneWithDaysRemaining extends Milestone {
    daysRemaining: number;
    isPast: boolean;
}
export interface SourceCitation {
    name: string;
    date: string;
    url: string;
}
export declare const KNOWLEDGE_VERSION = "2026-05-08.omnibus-provisional";
export declare const LAST_CONTENT_UPDATE = "2026-05-08";
export declare const LAST_OMNIBUS_VERIFICATION = "2026-05-08";
export declare const omnibusSources: SourceCitation[];
export declare const milestones: Milestone[];
export interface LegislativeProposal {
    name: string;
    status: string;
    proposalDate: string;
    provisionalAgreementDate: string;
    lastVerifiedAt: string;
    description: string;
    keyChanges: string[];
    impactOnAIAct: string;
    sources: SourceCitation[];
}
export declare const digitalOmnibus: LegislativeProposal;
export declare function getMilestonesWithDaysRemaining(): MilestoneWithDaysRemaining[];
//# sourceMappingURL=deadlines.d.ts.map