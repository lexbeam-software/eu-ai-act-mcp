import { z } from "zod";
import { annexIIICategories } from "../knowledge/annex-iii.js";

/**
 * What `signals.domain` asserts. Annex III does not regulate sectors; it lists uses inside
 * eight areas. Until 1.6.0 the field read "Primary sector where the system operates" while
 * the classifier concluded high-risk from it alone, so an agent that filled it faithfully got
 * a school timetable, a payroll check and a court-room scheduler back as high-risk with high
 * confidence. The text is built from the same per-area descriptions the classifier reports,
 * so the two cannot drift apart.
 */
const DOMAIN_TO_AREA: Record<string, number> = {
  biometrics: 1,
  critical_infrastructure: 2,
  education: 3,
  employment: 4,
  essential_services: 5,
  law_enforcement: 6,
  migration: 7,
  justice: 8,
};

const listedUses = Object.entries(DOMAIN_TO_AREA)
  .map(([domain, area]) => {
    const category = annexIIICategories.find((candidate) => candidate.number === area)!;
    return `${domain}: ${category.description.replace(/^AI systems intended (?:for use |to be used )?/, "")}`;
  })
  .join(" | ");

export const DOMAIN_SIGNAL_DESCRIPTION =
  "The Annex III area whose LISTED use the system itself performs. Annex III regulates specific " +
  "uses, never a sector: choose an area only when the system does one of the uses listed for it " +
  "below, and choose `other` when it merely operates in that sector (a utility's billing chatbot, " +
  "a school timetable, a payroll check, fleet maintenance for the police, appointment booking at " +
  "an immigration office, a court-room scheduler, legal research for a law firm). Leave it out " +
  "when the description does not let you tell. Listed uses: " +
  listedUses +
  " | health, gpai, product_safety: not Annex III areas; use them for a health context, a " +
  "general-purpose AI model, or a safety component of a product under Annex I.";

/**
 * Structured classifier signals (all optional). When provided, the classifier
 * uses rule-based logic instead of text matching. This lets agents feed what
 * they already know about the system and get deterministic answers for
 * canonical cases (Art. 5, Annex III(1)-III(8), Art. 50).
 */
export const classifySignalsSchema = z
  .object({
    domain: z
      .enum([
        "employment",
        "education",
        "biometrics",
        "critical_infrastructure",
        "law_enforcement",
        "migration",
        "justice",
        "essential_services",
        "health",
        "gpai",
        "product_safety",
        "other",
      ])
      .optional()
      .describe(DOMAIN_SIGNAL_DESCRIPTION),
    uses_biometrics: z.boolean().optional().describe("System processes biometric data (face, fingerprint, iris, voice, gait)"),
    biometric_sole_purpose_verification: z
      .boolean()
      .optional()
      .describe("Biometric use is solely to verify that a specific natural person is the person they claim to be, which is excluded from Annex III(1)(a)"),
    biometric_remote_identification: z
      .boolean()
      .optional()
      .describe("System performs remote biometric identification, not merely one-to-one biometric verification"),
    biometric_realtime: z.boolean().optional().describe("Biometric processing happens in real time"),
    biometric_law_enforcement: z.boolean().optional().describe("Biometric system is used by or for law enforcement"),
    biometric_publicly_accessible_space: z
      .boolean()
      .optional()
      .describe("Real-time remote biometric identification takes place in publicly accessible spaces (Art. 5(1)(h))"),
    is_safety_component_of_regulated_product: z
      .boolean()
      .optional()
      .describe("System is a safety component of a product covered by EU harmonisation legislation (Annex I)"),
    requires_third_party_conformity_assessment: z
      .boolean()
      .optional()
      .describe("The product or AI system is required to undergo third-party conformity assessment under the applicable Annex I legislation"),
    affects_fundamental_rights: z
      .boolean()
      .optional()
      .describe("System materially affects health, safety, or fundamental rights of natural persons"),
    targets_children_or_vulnerable: z
      .boolean()
      .optional()
      .describe("System is directed at or materially affects children or other vulnerable groups (Art. 5(1)(b))"),
    generates_synthetic_content: z
      .boolean()
      .optional()
      .describe("System generates or manipulates images, audio, video, or text (Art. 50(2)/(4))"),
    interacts_with_natural_persons: z
      .boolean()
      .optional()
      .describe("System is designed to interact directly with natural persons (Art. 50(1))"),
    performs_emotion_recognition_workplace_or_school: z
      .boolean()
      .optional()
      .describe("System infers emotions of natural persons in the workplace or educational institutions (Art. 5(1)(f))"),
    performs_social_scoring: z
      .boolean()
      .optional()
      .describe("System evaluates or classifies natural persons or groups over time based on social behaviour or personal/personality characteristics, leading to detrimental treatment (Art. 5(1)(c))"),
    social_scoring_unrelated_context: z
      .boolean()
      .optional()
      .describe("Social scoring leads to detrimental or unfavourable treatment in social contexts unrelated to the contexts in which the data was originally generated or collected (Art. 5(1)(c)(i))"),
    social_scoring_unjustified_or_disproportionate: z
      .boolean()
      .optional()
      .describe("Social scoring leads to detrimental or unfavourable treatment that is unjustified or disproportionate to the social behaviour or its gravity (Art. 5(1)(c)(ii))"),
    performs_social_scoring_by_public_authority: z
      .boolean()
      .optional()
      .describe("Legacy alias: public-authority social scoring. Art. 5(1)(c) is not limited to public authorities."),
  })
  .optional();

export const classifyInputSchema = z.object({
  description: z
    .string()
    .optional()
    .describe("Free-text description of the AI system and its functionalities"),
  use_case: z
    .string()
    .optional()
    .describe("Specific context where the system is deployed"),
  role: z.enum(["provider", "deployer", "unknown"]).optional().default("unknown"),
  signals: classifySignalsSchema,
});

export const annexIIICategoryRefSchema = z
  .object({
    number: z.number(),
    name: z.string(),
  })
  .nullable();

export const classifyOutputSchema = z.object({
  risk_classification: z.enum(["prohibited", "high-risk", "limited", "minimal", "insufficient_information"]),
  confidence: z.enum(["high", "medium", "low"]),
  annex_iii_category: annexIIICategoryRefSchema,
  relevant_articles: z.array(z.string()),
  role_determination: z.enum(["provider", "deployer", "both", "uncertain"]),
  obligations_summary: z.string(),
  caveat: z.string().nullable(),
  /** Human-readable labels for the rules / keywords that fired. */
  matched_signals: z.array(z.string()),
  /** Structured-signal fields the agent could provide to sharpen the result. */
  missing_signals: z.array(z.string()),
  /** Ready-to-ask user questions the agent can relay verbatim. */
  next_questions: z.array(z.string()),
  /** Basis of the classification: "signals" (rule-based) or "text" (keyword match) or "default". */
  basis: z.enum(["signals", "text", "default"]),
  /** Optional deep-dive link on lexbeam.com for this classification. */
  lexbeam_url: z.string().optional(),
});

export type ClassifyInput = z.infer<typeof classifyInputSchema>;
export type ClassifyOutput = z.infer<typeof classifyOutputSchema>;
export type ClassifySignals = NonNullable<z.infer<typeof classifySignalsSchema>>;
