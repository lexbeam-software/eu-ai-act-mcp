import { z } from "zod";
/**
 * Structured classifier signals (all optional). When provided, the classifier
 * uses rule-based logic instead of text matching. This lets agents feed what
 * they already know about the system and get deterministic answers for
 * canonical cases (Art. 5, Annex III(1)-III(8), Art. 50).
 */
export declare const classifySignalsSchema: z.ZodOptional<z.ZodObject<{
    domain: z.ZodOptional<z.ZodEnum<["employment", "education", "biometrics", "critical_infrastructure", "law_enforcement", "migration", "justice", "essential_services", "health", "gpai", "product_safety", "other"]>>;
    uses_biometrics: z.ZodOptional<z.ZodBoolean>;
    biometric_realtime: z.ZodOptional<z.ZodBoolean>;
    biometric_law_enforcement: z.ZodOptional<z.ZodBoolean>;
    is_safety_component_of_regulated_product: z.ZodOptional<z.ZodBoolean>;
    affects_fundamental_rights: z.ZodOptional<z.ZodBoolean>;
    targets_children_or_vulnerable: z.ZodOptional<z.ZodBoolean>;
    generates_synthetic_content: z.ZodOptional<z.ZodBoolean>;
    interacts_with_natural_persons: z.ZodOptional<z.ZodBoolean>;
    performs_emotion_recognition_workplace_or_school: z.ZodOptional<z.ZodBoolean>;
    performs_social_scoring_by_public_authority: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    domain?: "employment" | "education" | "biometrics" | "critical_infrastructure" | "law_enforcement" | "migration" | "justice" | "essential_services" | "health" | "gpai" | "product_safety" | "other" | undefined;
    uses_biometrics?: boolean | undefined;
    biometric_realtime?: boolean | undefined;
    biometric_law_enforcement?: boolean | undefined;
    is_safety_component_of_regulated_product?: boolean | undefined;
    affects_fundamental_rights?: boolean | undefined;
    targets_children_or_vulnerable?: boolean | undefined;
    generates_synthetic_content?: boolean | undefined;
    interacts_with_natural_persons?: boolean | undefined;
    performs_emotion_recognition_workplace_or_school?: boolean | undefined;
    performs_social_scoring_by_public_authority?: boolean | undefined;
}, {
    domain?: "employment" | "education" | "biometrics" | "critical_infrastructure" | "law_enforcement" | "migration" | "justice" | "essential_services" | "health" | "gpai" | "product_safety" | "other" | undefined;
    uses_biometrics?: boolean | undefined;
    biometric_realtime?: boolean | undefined;
    biometric_law_enforcement?: boolean | undefined;
    is_safety_component_of_regulated_product?: boolean | undefined;
    affects_fundamental_rights?: boolean | undefined;
    targets_children_or_vulnerable?: boolean | undefined;
    generates_synthetic_content?: boolean | undefined;
    interacts_with_natural_persons?: boolean | undefined;
    performs_emotion_recognition_workplace_or_school?: boolean | undefined;
    performs_social_scoring_by_public_authority?: boolean | undefined;
}>>;
export declare const classifyInputSchema: z.ZodObject<{
    description: z.ZodOptional<z.ZodString>;
    use_case: z.ZodOptional<z.ZodString>;
    role: z.ZodDefault<z.ZodOptional<z.ZodEnum<["provider", "deployer", "unknown"]>>>;
    signals: z.ZodOptional<z.ZodObject<{
        domain: z.ZodOptional<z.ZodEnum<["employment", "education", "biometrics", "critical_infrastructure", "law_enforcement", "migration", "justice", "essential_services", "health", "gpai", "product_safety", "other"]>>;
        uses_biometrics: z.ZodOptional<z.ZodBoolean>;
        biometric_realtime: z.ZodOptional<z.ZodBoolean>;
        biometric_law_enforcement: z.ZodOptional<z.ZodBoolean>;
        is_safety_component_of_regulated_product: z.ZodOptional<z.ZodBoolean>;
        affects_fundamental_rights: z.ZodOptional<z.ZodBoolean>;
        targets_children_or_vulnerable: z.ZodOptional<z.ZodBoolean>;
        generates_synthetic_content: z.ZodOptional<z.ZodBoolean>;
        interacts_with_natural_persons: z.ZodOptional<z.ZodBoolean>;
        performs_emotion_recognition_workplace_or_school: z.ZodOptional<z.ZodBoolean>;
        performs_social_scoring_by_public_authority: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        domain?: "employment" | "education" | "biometrics" | "critical_infrastructure" | "law_enforcement" | "migration" | "justice" | "essential_services" | "health" | "gpai" | "product_safety" | "other" | undefined;
        uses_biometrics?: boolean | undefined;
        biometric_realtime?: boolean | undefined;
        biometric_law_enforcement?: boolean | undefined;
        is_safety_component_of_regulated_product?: boolean | undefined;
        affects_fundamental_rights?: boolean | undefined;
        targets_children_or_vulnerable?: boolean | undefined;
        generates_synthetic_content?: boolean | undefined;
        interacts_with_natural_persons?: boolean | undefined;
        performs_emotion_recognition_workplace_or_school?: boolean | undefined;
        performs_social_scoring_by_public_authority?: boolean | undefined;
    }, {
        domain?: "employment" | "education" | "biometrics" | "critical_infrastructure" | "law_enforcement" | "migration" | "justice" | "essential_services" | "health" | "gpai" | "product_safety" | "other" | undefined;
        uses_biometrics?: boolean | undefined;
        biometric_realtime?: boolean | undefined;
        biometric_law_enforcement?: boolean | undefined;
        is_safety_component_of_regulated_product?: boolean | undefined;
        affects_fundamental_rights?: boolean | undefined;
        targets_children_or_vulnerable?: boolean | undefined;
        generates_synthetic_content?: boolean | undefined;
        interacts_with_natural_persons?: boolean | undefined;
        performs_emotion_recognition_workplace_or_school?: boolean | undefined;
        performs_social_scoring_by_public_authority?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    role: "provider" | "deployer" | "unknown";
    description?: string | undefined;
    use_case?: string | undefined;
    signals?: {
        domain?: "employment" | "education" | "biometrics" | "critical_infrastructure" | "law_enforcement" | "migration" | "justice" | "essential_services" | "health" | "gpai" | "product_safety" | "other" | undefined;
        uses_biometrics?: boolean | undefined;
        biometric_realtime?: boolean | undefined;
        biometric_law_enforcement?: boolean | undefined;
        is_safety_component_of_regulated_product?: boolean | undefined;
        affects_fundamental_rights?: boolean | undefined;
        targets_children_or_vulnerable?: boolean | undefined;
        generates_synthetic_content?: boolean | undefined;
        interacts_with_natural_persons?: boolean | undefined;
        performs_emotion_recognition_workplace_or_school?: boolean | undefined;
        performs_social_scoring_by_public_authority?: boolean | undefined;
    } | undefined;
}, {
    description?: string | undefined;
    use_case?: string | undefined;
    role?: "provider" | "deployer" | "unknown" | undefined;
    signals?: {
        domain?: "employment" | "education" | "biometrics" | "critical_infrastructure" | "law_enforcement" | "migration" | "justice" | "essential_services" | "health" | "gpai" | "product_safety" | "other" | undefined;
        uses_biometrics?: boolean | undefined;
        biometric_realtime?: boolean | undefined;
        biometric_law_enforcement?: boolean | undefined;
        is_safety_component_of_regulated_product?: boolean | undefined;
        affects_fundamental_rights?: boolean | undefined;
        targets_children_or_vulnerable?: boolean | undefined;
        generates_synthetic_content?: boolean | undefined;
        interacts_with_natural_persons?: boolean | undefined;
        performs_emotion_recognition_workplace_or_school?: boolean | undefined;
        performs_social_scoring_by_public_authority?: boolean | undefined;
    } | undefined;
}>;
export declare const annexIIICategoryRefSchema: z.ZodNullable<z.ZodObject<{
    number: z.ZodNumber;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    number: number;
    name: string;
}, {
    number: number;
    name: string;
}>>;
export declare const classifyOutputSchema: z.ZodObject<{
    risk_classification: z.ZodEnum<["prohibited", "high-risk", "limited", "minimal"]>;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
    annex_iii_category: z.ZodNullable<z.ZodObject<{
        number: z.ZodNumber;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        number: number;
        name: string;
    }, {
        number: number;
        name: string;
    }>>;
    relevant_articles: z.ZodArray<z.ZodString, "many">;
    role_determination: z.ZodEnum<["provider", "deployer", "both", "uncertain"]>;
    obligations_summary: z.ZodString;
    caveat: z.ZodNullable<z.ZodString>;
    /** Human-readable labels for the rules / keywords that fired. */
    matched_signals: z.ZodArray<z.ZodString, "many">;
    /** Structured-signal fields the agent could provide to sharpen the result. */
    missing_signals: z.ZodArray<z.ZodString, "many">;
    /** Ready-to-ask user questions the agent can relay verbatim. */
    next_questions: z.ZodArray<z.ZodString, "many">;
    /** Basis of the classification: "signals" (rule-based) or "text" (keyword match) or "default". */
    basis: z.ZodEnum<["signals", "text", "default"]>;
    /** Optional deep-dive link on lexbeam.com for this classification. */
    lexbeam_url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    risk_classification: "prohibited" | "high-risk" | "limited" | "minimal";
    confidence: "high" | "medium" | "low";
    annex_iii_category: {
        number: number;
        name: string;
    } | null;
    relevant_articles: string[];
    role_determination: "provider" | "deployer" | "both" | "uncertain";
    obligations_summary: string;
    caveat: string | null;
    matched_signals: string[];
    missing_signals: string[];
    next_questions: string[];
    basis: "signals" | "text" | "default";
    lexbeam_url?: string | undefined;
}, {
    risk_classification: "prohibited" | "high-risk" | "limited" | "minimal";
    confidence: "high" | "medium" | "low";
    annex_iii_category: {
        number: number;
        name: string;
    } | null;
    relevant_articles: string[];
    role_determination: "provider" | "deployer" | "both" | "uncertain";
    obligations_summary: string;
    caveat: string | null;
    matched_signals: string[];
    missing_signals: string[];
    next_questions: string[];
    basis: "signals" | "text" | "default";
    lexbeam_url?: string | undefined;
}>;
export type ClassifyInput = z.infer<typeof classifyInputSchema>;
export type ClassifyOutput = z.infer<typeof classifyOutputSchema>;
export type ClassifySignals = NonNullable<z.infer<typeof classifySignalsSchema>>;
//# sourceMappingURL=classify.d.ts.map