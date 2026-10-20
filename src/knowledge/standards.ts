/**
 * EU AI Act - Harmonised standards and Commission guidance, with their status.
 *
 * The verified follow-on that sources.ts names for standards, guidance and codes.
 * Cross-read on 2026-10-20 against the pinned OJ act
 * (law/celex-32026D2274-harmonised-standards: Commission Implementing Decision
 * (EU) 2026/2274) and against the Commission's AI Act pages as last updated on
 * 19 October 2026.
 *
 * A harmonised standard is voluntary. Conformity with a standard whose reference
 * is published in the Official Journal gives a presumption of conformity only to
 * the extent the standard covers the requirement (Art. 40(1)). The standard is not
 * law and its text is not reproduced here; CEN and CENELEC distribute it through
 * the national standardisation bodies.
 */

import type { SourceStatus } from "./sources.js";

/** Date of the last cross-read of everything in this file. */
export const STANDARDS_REVIEWED_ON = "2026-10-20";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** The review date as prose ("20 October 2026"), for every served "only" or "not yet" statement. */
export function standardsReviewedOnText(iso: string = STANDARDS_REVIEWED_ON): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export interface CitedHarmonisedStandard {
  reference: string;
  title: string;
  developed_by: string;
  ai_act_provisions_covered: string[];
  not_covered: string;
  oj_publication: {
    act: string;
    status: SourceStatus;
    celex: string;
    adopted: string;
    published: string;
    entry_into_force: string;
    eli: string;
    restriction: string | null;
  };
  presumption_of_conformity_from: string;
  presumption_basis: string;
  standardisation_request: string;
  design: string;
  where_it_matters: string[];
}

export interface StandardisationArea {
  area: string;
  ai_act_provisions: string[];
  oj_reference: string | null;
}

export interface GuidanceSource {
  id: string;
  title: string;
  status: SourceStatus;
  /** ISO date of publication or of the decisive Commission act. */
  date: string;
  url: string;
  ai_act_provisions: string[];
  note: string;
}

const COMMISSION_STANDARD_PAGE =
  "https://digital-strategy.ec.europa.eu/en/library/first-harmonised-standard-supporting-ai-act-published-official-journal";
const COMMISSION_STANDARDISATION_PAGE = "https://digital-strategy.ec.europa.eu/en/policies/ai-act-standardisation";

export const citedHarmonisedStandards: CitedHarmonisedStandard[] = [
  {
    reference: "EN 18286:2026",
    title: "Artificial intelligence - Quality management system for EU AI Act regulatory purposes",
    developed_by: "CEN and CENELEC (Joint Technical Committee JTC 21)",
    ai_act_provisions_covered: ["Art. 17"],
    not_covered:
      "The requirements of Chapter III, Section 2 (Art. 8 to 15: risk management, data, technical documentation, record-keeping, transparency, human oversight, accuracy, robustness, cybersecurity). No harmonised standard covering them had its reference published in the Official Journal as of 19 October 2026; the Commission expects further harmonised standards to follow.",
    oj_publication: {
      act: "Commission Implementing Decision (EU) 2026/2274 of 12 October 2026 on the harmonised standards for high-risk AI systems drafted in support of Regulation (EU) 2024/1689",
      status: "enacted_oj",
      celex: "32026D2274",
      adopted: "2026-10-12",
      published: "2026-10-14",
      entry_into_force: "2026-10-14",
      eli: "http://data.europa.eu/eli/dec_impl/2026/2274/oj",
      restriction: null,
    },
    presumption_of_conformity_from: "2026-10-14",
    presumption_basis:
      "The Commission states that providers implementing EN 18286 benefit from a presumption of conformity with the Art. 17 requirements the standard covers, from the publication of the reference in the Official Journal (recital 6 of Implementing Decision (EU) 2026/2274). Recital 1 of that decision reads Art. 40 as a presumption for the requirements covered by the standard. The wording of Art. 40(1) names the requirements of Chapter III, Section 2 and the GPAI obligations of Chapter V, Sections 2 and 3, while Art. 17 sits in Section 3; the Digital Omnibus added to Art. 40(2) a request for deliverables that facilitate the presumption of conformity with Chapter III, Sections 2 and 3. Cite the presumption as the Commission's position with this source.",
    standardisation_request:
      "Commission Implementing Decision C(2025) 3871 of 23 June 2025 (repealing C(2023) 3215), Annex I point 9: quality management systems for providers of AI systems, including post-market monitoring processes.",
    design:
      "Per the Commission (19 October 2026): mapped to Art. 17, built around the AI system lifecycle rather than the organisation, and designed to be layered on top of existing standards such as ISO/IEC 42001, ISO 9001 or a sectoral quality management system (e.g. ISO 13485) rather than replace them. Providers in regulated sectors may integrate management systems instead of running separate ones. The Commission calls it the only AI quality management system standard with a presumption of conformity.",
    where_it_matters: [
      "Art. 17(1): every provider of a high-risk AI system needs a documented quality management system; applying EN 18286 is voluntary.",
      "Art. 17(2): implementation is proportionate to the size of the provider's organisation, in particular for an SME, including a start-up, or an SMC, without lowering the rigour required for compliance.",
      "Art. 17(4): financial institutions that meet the duty through their internal-governance rules under Union financial services law must take harmonised standards referred to in Art. 40 into account.",
      "Annex VI point 2 (internal control): the provider verifies that its quality management system complies with Art. 17. Annex VII: a notified body assesses the quality management system.",
      "Art. 43(3): for products under Annex I, Section A, the assessment of the Art. 17 quality management system is part of the sectoral conformity assessment.",
      "Annex IV point 7 and Annex V point 6: the technical documentation lists the harmonised standards applied and the EU declaration of conformity references them.",
      "Art. 43(1), Annex III point 1 (biometrics): the choice of internal control under Annex VI depends on harmonised standards or common specifications applied for the Section 2 requirements. EN 18286 covers Art. 17, not Section 2, so it does not on its own open the Annex VI route.",
    ],
  },
];

/**
 * The ten deliverable areas of the standardisation request, as listed on the
 * Commission's standardisation page (19 October 2026). The article mapping is
 * this server's reading of which provision each area serves.
 */
export const standardisationAreas: StandardisationArea[] = [
  { area: "risk management", ai_act_provisions: ["Art. 9"], oj_reference: null },
  { area: "governance and quality of datasets", ai_act_provisions: ["Art. 10"], oj_reference: null },
  { area: "record keeping", ai_act_provisions: ["Art. 12"], oj_reference: null },
  { area: "transparency", ai_act_provisions: ["Art. 13"], oj_reference: null },
  { area: "human oversight", ai_act_provisions: ["Art. 14"], oj_reference: null },
  { area: "accuracy", ai_act_provisions: ["Art. 15"], oj_reference: null },
  { area: "robustness", ai_act_provisions: ["Art. 15"], oj_reference: null },
  { area: "cybersecurity", ai_act_provisions: ["Art. 15"], oj_reference: null },
  { area: "quality management", ai_act_provisions: ["Art. 17"], oj_reference: "EN 18286:2026" },
  { area: "conformity assessment", ai_act_provisions: ["Art. 43"], oj_reference: null },
];

export const notHarmonisedUnderTheAiAct = [
  {
    reference: "ISO/IEC 42001",
    note: "International AI management system standard. It is not a harmonised standard under the AI Act and applying it gives no presumption of conformity under the AI Act. EN 18286 is designed to be layered on top of it.",
  },
];

export const guidanceSources: GuidanceSource[] = [
  {
    id: "guidelines_high_risk_classification_draft",
    title: "Draft Commission guidelines on the classification of high-risk AI systems",
    status: "commission_guideline_draft",
    date: "2026-05-19",
    url: "https://digital-strategy.ec.europa.eu/en/library/draft-commission-guidelines-classification-high-risk-ai-systems",
    ai_act_provisions: ["Art. 6", "Annex I", "Annex III"],
    note: "Art. 6(5) required the Commission to provide guidelines with a comprehensive list of practical examples of high-risk and not high-risk use cases no later than 2 February 2026. The Commission published a draft on 19 May 2026 and held a targeted stakeholder consultation until 23 July 2026; its guidelines page, last updated 19 October 2026, still describes them as draft. Non-binding; the examples are interpretive input, not a substitute for Art. 6 and Annex III.",
  },
  {
    id: "guidelines_transparency_art50",
    title: "Guidelines on the implementation of the transparency obligations for certain AI systems under Article 50 of the AI Act",
    status: "commission_guideline_final",
    date: "2026-07-20",
    url: "https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems",
    ai_act_provisions: ["Art. 50"],
    note: "Adopted by the Commission; a non-binding interpretation. Covers which provider and deployer carries which Art. 50 duty, the definitions (directly interactive systems, synthetic content, deepfakes, AI-generated text on matters of public interest) and exceptions such as standard editing. Providers and deployers of generative AI systems that do not adhere to the Code of Practice on Transparency of AI-generated Content have to demonstrate compliance with the marking and labelling obligations through alternative, equivalently adequate means.",
  },
  {
    id: "code_transparency_ai_generated_content",
    title: "Code of Practice on Transparency of AI-generated Content",
    status: "code_adequate_voluntary_tool",
    date: "2026-07-08",
    url: "https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content",
    ai_act_provisions: ["Art. 50(2)", "Art. 50(4)", "Art. 50(5)", "Art. 50(7)"],
    note: "On 8 July 2026 the Commission concluded that the code adequately covers the obligations in Art. 50(2), (4) and (5); the AI Board adopted its adequacy assessment the next day (Commission opinion published 9 July 2026). Voluntary; adherence is not conclusive evidence of compliance. The Commission also offers a set of EU icons for disclosing AI-generated images, audio and text.",
  },
];

/** Payload of the euaiact://standards resource. */
export function buildStandardsPayload() {
  return {
    reviewed_on: STANDARDS_REVIEWED_ON,
    summary:
      `As of ${standardsReviewedOnText()}, one harmonised standard supports the AI Act: EN 18286:2026, the quality management system standard for Art. 17, whose reference was published in the Official Journal on 14 October 2026 by Commission Implementing Decision (EU) 2026/2274. As of the same date no harmonised standard covers the Chapter III, Section 2 requirements. Harmonised standards are voluntary; a cited standard gives a presumption of conformity only to the extent it covers a requirement.`,
    cited_harmonised_standards: citedHarmonisedStandards,
    standardisation_request: {
      act: "Commission Implementing Decision C(2025) 3871 of 23 June 2025",
      addressees: "CEN and CENELEC (Joint Technical Committee JTC 21)",
      areas: standardisationAreas,
    },
    not_harmonised_under_the_ai_act: notHarmonisedUnderTheAiAct,
    commission_guidance: guidanceSources,
    sources: [
      { title: "Commission Implementing Decision (EU) 2026/2274, Official Journal", url: "http://data.europa.eu/eli/dec_impl/2026/2274/oj" },
      { title: "European Commission: First harmonised standard supporting the AI Act published in the Official Journal (19 October 2026)", url: COMMISSION_STANDARD_PAGE },
      { title: "European Commission: Standardisation of the AI Act", url: COMMISSION_STANDARDISATION_PAGE },
    ],
    caveat:
      "Status as of the review date. Check the Official Journal for references published later. The standards' texts are sold through national standardisation bodies and are not reproduced here.",
  };
}
