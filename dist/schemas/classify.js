import { z } from "zod";
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
        .describe("Primary sector where the system operates"),
    uses_biometrics: z.boolean().optional().describe("System processes biometric data (face, fingerprint, iris, voice, gait)"),
    biometric_realtime: z.boolean().optional().describe("Biometric processing happens in real time"),
    biometric_law_enforcement: z.boolean().optional().describe("Biometric system is used by or for law enforcement"),
    is_safety_component_of_regulated_product: z
        .boolean()
        .optional()
        .describe("System is a safety component of a product covered by EU harmonisation legislation (Annex I)"),
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
    performs_social_scoring_by_public_authority: z
        .boolean()
        .optional()
        .describe("System is used by or on behalf of a public authority to score natural persons (Art. 5(1)(c))"),
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
    risk_classification: z.enum(["prohibited", "high-risk", "limited", "minimal"]),
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
//# sourceMappingURL=classify.js.map