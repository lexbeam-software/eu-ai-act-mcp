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

// ---------------------------------------------------------------------------
// Penalty Tiers
// ---------------------------------------------------------------------------

const penaltyTiers: PenaltyTier[] = [
  {
    id: "tier-1-prohibited",
    name: "Prohibited AI practices",
    maxFineEUR: 35_000_000,
    globalTurnoverPercentage: 7,
    article: "Art. 99(3)",
    description:
      "Non-compliance with the prohibition of AI practices under Art. 5. The fine is up to EUR 35 million or, if the offender is an undertaking, up to 7% of total worldwide annual turnover in the preceding financial year, whichever is higher.",
    applicableTo: [
      "Providers deploying prohibited AI practices",
      "Deployers using prohibited AI systems",
      "Any entity violating Art. 5 prohibitions",
    ],
    examples: [
      "Operating a social scoring system as a public authority",
      "Deploying subliminal manipulation AI causing significant harm",
      "Using untargeted facial scraping to build recognition databases",
      "Operating real-time remote biometric identification in public spaces without legal basis",
    ],
  },
  {
    id: "tier-2-high-risk",
    name: "High-risk AI system obligations",
    maxFineEUR: 15_000_000,
    globalTurnoverPercentage: 3,
    article: "Art. 99(4)",
    description:
      "Non-compliance with obligations for providers, deployers, and other actors under the Regulation (other than Art. 5 and false information). Covers high-risk requirements (Art. 9-17), deployer obligations (Art. 26-27), conformity assessment (Art. 43), and other substantive requirements. Up to EUR 15 million or 3% of global turnover, whichever is higher.",
    applicableTo: [
      "Providers of high-risk AI systems",
      "Deployers of high-risk AI systems",
      "Importers and distributors",
      "Authorised representatives",
      "GPAI model providers (for Art. 51-56 violations)",
    ],
    examples: [
      "Placing a high-risk AI system on the market without conformity assessment",
      "Failing to implement a risk management system for high-risk AI",
      "Deployer failing to perform a FRIA when required",
      "GPAI provider failing to provide technical documentation",
      "Failure to register in the EU database",
    ],
  },
  {
    id: "tier-3-false-info",
    name: "False or misleading information",
    maxFineEUR: 7_500_000,
    globalTurnoverPercentage: 1,
    article: "Art. 99(5)",
    description:
      "Supplying incorrect, incomplete, or misleading information to notified bodies, national competent authorities, or the AI Office in reply to a request. Up to EUR 7.5 million or 1% of global turnover, whichever is higher.",
    applicableTo: [
      "Any entity providing information to regulators",
      "Providers during conformity assessments",
      "Entities responding to regulatory requests",
    ],
    examples: [
      "Providing false technical documentation during a conformity assessment",
      "Misleading a national authority about an AI system's capabilities",
      "Submitting incorrect information to the EU database",
      "Failing to disclose known risks when responding to regulatory inquiry",
    ],
  },
];

// ---------------------------------------------------------------------------
// SME and Startup Reductions
// ---------------------------------------------------------------------------

const smeReductions: SMEReduction[] = [
  {
    entityType: "SMEs (including startups)",
    description:
      "For SMEs including startups, each fine referred to in Art. 99 is the lower of the two amounts (fixed amount or turnover percentage), providing a proportionate cap.",
    article: "Art. 99(6)",
    details:
      "When calculating fines for SMEs and startups, the applicable amount is whichever is lower: the fixed EUR cap or the turnover-based percentage. This effectively caps fines at the lower threshold rather than the higher one, as applies for larger undertakings.",
  },
  {
    entityType: "EU institutions, bodies, offices, and agencies",
    description:
      "Where an EU institution, body, office, or agency falls within the scope of this Regulation, the European Data Protection Supervisor may impose fines. Maximum fine levels align with the tiers above.",
    article: "Art. 100",
    details:
      "The EDPS enforces the AI Act against EU-level bodies. The tier structure mirrors Art. 99 but enforcement and appeal procedures follow EDPS-specific rules.",
  },
];

// ---------------------------------------------------------------------------
// Full Framework Export
// ---------------------------------------------------------------------------

export const penaltyFramework: PenaltyFramework = {
  tiers: penaltyTiers,
  smeReductions,
  enforcementDate: "2026-08-02",
  enforcementAuthority:
    "National market surveillance authorities (each Member State designates at least one). The AI Office enforces GPAI-specific provisions at EU level.",
  notes: [
    "Member States must lay down rules on penalties by 2 August 2025 and notify the Commission.",
    "Penalties must be effective, proportionate, and dissuasive (Art. 99(1)).",
    "When deciding the fine amount, authorities consider: nature, gravity, and duration of the infringement; whether other fines have already been imposed; size and market share of the entity; any previous infringements; degree of cooperation; and the way the infringement became known to the authority.",
    "Fines apply to providers, deployers, importers, distributors, authorised representatives, and product manufacturers where applicable.",
    "The 'whichever is higher' rule applies for large undertakings; for SMEs/startups, 'whichever is lower' applies (Art. 99(6)).",
    "AI Office can fine GPAI providers up to EUR 15M or 3% of turnover for Art. 51-56 violations, and up to EUR 7.5M or 1% for false information (Art. 101).",
  ],
};

// ---------------------------------------------------------------------------
// Helper - Lookup penalty tier by violation type
// ---------------------------------------------------------------------------

export function getPenaltyTier(
  violationType: "prohibited" | "high_risk" | "false_info"
): PenaltyTier {
  const mapping: Record<string, string> = {
    prohibited: "tier-1-prohibited",
    high_risk: "tier-2-high-risk",
    false_info: "tier-3-false-info",
  };
  const tier = penaltyTiers.find((t) => t.id === mapping[violationType]);
  if (!tier) throw new Error(`Unknown violation type: ${violationType}`);
  return tier;
}

// ---------------------------------------------------------------------------
// Helper - Calculate maximum fine for a given turnover
// ---------------------------------------------------------------------------

export function calculateMaxFine(
  violationType: "prohibited" | "high_risk" | "false_info",
  annualTurnoverEUR: number,
  isSME: boolean = false
): { fixedCap: number; turnoverBased: number; applicableFine: number } {
  const tier = getPenaltyTier(violationType);
  const turnoverBased = annualTurnoverEUR * (tier.globalTurnoverPercentage / 100);

  // SMEs get the lower amount; large undertakings get the higher amount
  const applicableFine = isSME
    ? Math.min(tier.maxFineEUR, turnoverBased)
    : Math.max(tier.maxFineEUR, turnoverBased);

  return {
    fixedCap: tier.maxFineEUR,
    turnoverBased: Math.round(turnoverBased),
    applicableFine: Math.round(applicableFine),
  };
}
