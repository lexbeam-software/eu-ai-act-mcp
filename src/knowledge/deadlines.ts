/**
 * EU AI Act - Key Milestones and Deadlines
 *
 * Source: Regulation (EU) 2024/1689
 */

export interface Milestone {
  date: string; // ISO date
  name: string;
  description: string;
  status: "in_effect" | "upcoming" | "proposal_only";
  articles: string[];
  keyObligations: string[];
}

export interface MilestoneWithDaysRemaining extends Milestone {
  daysRemaining: number;
  isPast: boolean;
}

// ---------------------------------------------------------------------------
// Milestone Timeline
// ---------------------------------------------------------------------------

export const milestones: Milestone[] = [
  {
    date: "2024-08-01",
    name: "Entry into force",
    description:
      "The EU AI Act (Regulation 2024/1689) entered into force on 1 August 2024, 20 days after publication in the Official Journal of the EU on 12 July 2024.",
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
    description:
      "The prohibition of unacceptable-risk AI practices under Art. 5 and the AI literacy obligation under Art. 4 apply from 2 February 2025 (6 months after entry into force).",
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
    description:
      "Obligations for providers of general-purpose AI models (Art. 51-56) apply from 2 August 2025 (12 months after entry into force). Governance structures including the AI Office, AI Board, and advisory forum become operational.",
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
    description:
      "The full set of obligations for high-risk AI systems listed in Annex III applies from 2 August 2026 (24 months after entry into force). This is the major compliance deadline for most organisations.",
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
  },
  {
    date: "2027-08-02",
    name: "Annex I regulated product obligations",
    description:
      "Obligations for high-risk AI systems that are safety components of products covered by existing EU harmonisation legislation listed in Annex I (e.g. medical devices, machinery, toys, lifts, radio equipment) apply from 2 August 2027 (36 months after entry into force).",
    status: "upcoming",
    articles: ["Art. 6(1)", "Art. 113(b)", "Annex I"],
    keyObligations: [
      "AI safety components in regulated products must comply",
      "Integration with existing CE marking and conformity assessment procedures",
      "Covers: medical devices, machinery, toys, lifts, pressure equipment, radio equipment, civil aviation, motor vehicles, and more",
      "Third-party conformity assessment aligned with sectoral legislation",
    ],
  },
];

// ---------------------------------------------------------------------------
// Digital Omnibus Proposal
// ---------------------------------------------------------------------------

export interface LegislativeProposal {
  name: string;
  status: string;
  proposalDate: string;
  description: string;
  keyChanges: string[];
  impactOnAIAct: string;
}

export const digitalOmnibus: LegislativeProposal = {
  name: "Digital Omnibus Simplification Package",
  status: "proposal_only",
  proposalDate: "2025-12-04",
  description:
    "European Commission proposal to simplify reporting and compliance obligations across the AI Act, GDPR, NIS2, DORA, and other digital regulations. Part of the broader EU simplification agenda. NOT YET ADOPTED - still a legislative proposal going through ordinary legislative procedure.",
  keyChanges: [
    "Proposed narrowing of Annex III high-risk categories (e.g. removing certain AI components in regulated products)",
    "Proposed extension of certain deadlines for SMEs",
    "Proposed alignment of incident reporting across AI Act, NIS2, and DORA",
    "Proposed reduction of documentation burden for low-risk GPAI models",
    "Proposed strengthening of the Art. 6(3) exception mechanism",
  ],
  impactOnAIAct:
    "If adopted, the Digital Omnibus could significantly reduce the scope of high-risk classification and ease compliance burdens. However, as a proposal only (December 2025), organisations should NOT rely on these changes for current compliance planning. Continue preparing against the current regulation text.",
};

// ---------------------------------------------------------------------------
// Helper Function
// ---------------------------------------------------------------------------

export function getMilestonesWithDaysRemaining(): MilestoneWithDaysRemaining[] {
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
