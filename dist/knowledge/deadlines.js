/**
 * EU AI Act - Key Milestones and Deadlines
 *
 * Source: Regulation (EU) 2024/1689
 */
export const KNOWLEDGE_VERSION = "2026-05-08.omnibus-provisional";
export const LAST_CONTENT_UPDATE = "2026-05-08";
export const LAST_OMNIBUS_VERIFICATION = "2026-05-08";
export const omnibusSources = [
    {
        name: "Council of the European Union press release",
        date: "2026-05-07",
        url: "https://www.consilium.europa.eu/en/press/press-releases/2026/05/07/artificial-intelligence-council-and-parliament-agree-to-simplify-and-streamline-rules/pdf/",
    },
    {
        name: "European Parliament press release",
        date: "2026-05-07",
        url: "https://www.europarl.europa.eu/news/en/press-room/20260427IPR42011/ai-act-deal-on-simplification-measures-ban-on-nudifier-apps",
    },
    {
        name: "European Parliament Legislative Observatory procedure 2025/0359(COD)",
        date: "2026-05-08",
        url: "https://oeil.secure.europarl.europa.eu/oeil/en/procedure-file?reference=2025/0359(COD)",
    },
    {
        name: "European Commission AI Act Service Desk timeline",
        date: "2026-05-08",
        url: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/timeline/timeline-implementation-eu-ai-act",
    },
];
// ---------------------------------------------------------------------------
// Milestone Timeline
// ---------------------------------------------------------------------------
export const milestones = [
    {
        date: "2024-08-01",
        name: "Entry into force",
        description: "The EU AI Act (Regulation 2024/1689) entered into force on 1 August 2024, 20 days after publication in the Official Journal of the EU on 12 July 2024.",
        status: "in_effect",
        articles: ["Art. 113"],
        keyObligations: [
            "Regulation published and legally binding",
            "Phased application timeline begins",
        ],
    },
    {
        date: "2025-02-02",
        name: "Prohibited practices and AI literacy",
        description: "The prohibition of unacceptable-risk AI practices under Art. 5 and the AI literacy obligation under Art. 4 apply from 2 February 2025 (6 months after entry into force).",
        status: "in_effect",
        articles: ["Art. 5", "Art. 4", "Art. 113(a)"],
        keyObligations: [
            "All prohibited AI practices (Art. 5) must cease",
            "Providers and deployers must ensure AI literacy of staff (Art. 4)",
            "Subliminal manipulation, exploitation of vulnerabilities, social scoring, untargeted facial scraping, emotion recognition in workplaces/schools - all banned",
        ],
    },
    {
        date: "2025-08-02",
        name: "GPAI model obligations and governance",
        description: "Obligations for providers of general-purpose AI models (Art. 51-56) apply from 2 August 2025 (12 months after entry into force). Governance structures including the AI Office, AI Board, and advisory forum become operational.",
        status: "in_effect",
        articles: [
            "Art. 51", "Art. 52", "Art. 53", "Art. 54", "Art. 55", "Art. 56",
            "Art. 64", "Art. 65", "Art. 66", "Art. 67",
        ],
        keyObligations: [
            "GPAI providers must publish training data summaries",
            "Technical documentation for GPAI models required",
            "Copyright compliance policies must be in place",
            "Systemic risk GPAI models: additional evaluation, testing, incident reporting, and cybersecurity obligations",
            "AI Office and AI Board operational",
            "Codes of practice for GPAI expected to be finalised",
        ],
    },
    {
        date: "2026-08-02",
        name: "High-risk Annex III obligations",
        description: "The full set of obligations for high-risk AI systems listed in Annex III applies from 2 August 2026 (24 months after entry into force). This is the major compliance deadline for most organisations.",
        status: "upcoming",
        articles: [
            "Art. 6", "Art. 9", "Art. 10", "Art. 11", "Art. 12", "Art. 13",
            "Art. 14", "Art. 15", "Art. 16", "Art. 17", "Art. 26", "Art. 27",
            "Art. 43", "Art. 47", "Art. 49", "Art. 50", "Art. 72", "Art. 73",
            "Art. 99",
        ],
        keyObligations: [
            "Risk management systems for high-risk AI",
            "Data governance and management practices",
            "Technical documentation (Annex IV)",
            "Automatic logging and record-keeping",
            "Transparency and instructions for deployers",
            "Human oversight measures",
            "Accuracy, robustness, and cybersecurity requirements",
            "Quality management systems",
            "Conformity assessments",
            "EU database registration",
            "Deployer obligations including FRIA",
            "Limited risk transparency obligations (Art. 50)",
            "Post-market monitoring and incident reporting",
            "Penalties framework enforceable",
        ],
        provisionalDateIfAdopted: "2027-12-02",
    },
    {
        date: "2027-08-02",
        name: "Annex I regulated product obligations",
        description: "Obligations for high-risk AI systems that are safety components of products covered by existing EU harmonisation legislation listed in Annex I (e.g. medical devices, machinery, toys, lifts, radio equipment) apply from 2 August 2027 (36 months after entry into force).",
        status: "upcoming",
        articles: ["Art. 6(1)", "Art. 113(b)", "Annex I"],
        keyObligations: [
            "AI safety components in regulated products must comply",
            "Integration with existing CE marking and conformity assessment procedures",
            "Covers: medical devices, machinery, toys, lifts, pressure equipment, radio equipment, civil aviation, motor vehicles, and more",
            "Third-party conformity assessment aligned with sectoral legislation",
        ],
        provisionalDateIfAdopted: "2028-08-02",
    },
];
export const digitalOmnibus = {
    name: "Digital Omnibus Simplification Package",
    status: "provisional_agreement", // updated 2026-05-08: was "proposal_only"; political agreement reached 2026-05-07, not yet formally adopted
    proposalDate: "2025-12-04", // Commission tabled the original proposal on this date
    provisionalAgreementDate: "2026-05-07",
    lastVerifiedAt: LAST_OMNIBUS_VERIFICATION,
    description: "European Commission proposal (tabled 2025-12-04) to simplify reporting and compliance obligations across the AI Act, GDPR, NIS2, DORA. The AI Act portion progressed to a Council/Parliament PROVISIONAL POLITICAL AGREEMENT on 2026-05-07. Status as of 2026-05-08: not formally adopted. Pending Council and Parliament endorsement, legal/linguistic revision, and Official Journal publication. EP Legislative Observatory (procedure 2025/0359(COD)) shows file as awaiting Parliament's position in 1st reading.",
    keyChanges: [
        "Annex III high-risk obligations: current law 2 Aug 2026 -> provisional agreement would shift to 2 Dec 2027",
        "Annex I high-risk obligations: current law 2 Aug 2027 -> provisional agreement would shift to 2 Aug 2028",
        "Article 50 GenAI watermarking and output detection: current law 2 Aug 2026 -> provisional agreement would shift to 2 Dec 2026",
        "Article 5 prohibited practices list expanded with CSAM and non-consensual sexual/intimate content; provisional compliance by 2 Dec 2026",
        "Registration of 'exempted' Annex III high-risk systems: REMAINS MANDATED (Parliament blocked Commission simplification)",
        "Sensitive personal data processing for bias detection: broader scope, 'strictly necessary' clause retained",
        "GPAI obligations themselves (in force since 2 Aug 2025): UNCHANGED",
        "Commission enforcement powers and fines for GPAI (start 2 Aug 2026): UNCHANGED",
        "Legacy GPAI compliance deadline (2 Aug 2027 for models placed before 2 Aug 2025): UNCHANGED",
    ],
    impactOnAIAct: "The 2026-05-07 provisional Council/Parliament political agreement would shift several deadlines for high-risk AI systems IF formally adopted. The agreement is NOT yet adopted law: pending formal adoption plus Official Journal publication, current-law dates remain authoritative for compliance advice. Plan against current law; treat the provisional shifts as politically foreseeable but not yet binding. Sources: Council press release 2026-05-07, European Parliament press release 2026-05-07, EP Legislative Observatory procedure 2025/0359(COD), AI Act Service Desk timeline.",
    sources: omnibusSources,
};
// ---------------------------------------------------------------------------
// Helper Function
// ---------------------------------------------------------------------------
export function getMilestonesWithDaysRemaining() {
    const now = new Date();
    // Normalise to start of day in UTC for consistent calculation
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    return milestones.map((milestone) => {
        const milestoneDate = new Date(milestone.date + "T00:00:00Z");
        const diffMs = milestoneDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return {
            ...milestone,
            daysRemaining,
            isPast: daysRemaining <= 0,
        };
    });
}
//# sourceMappingURL=deadlines.js.map