import { classifyInputSchema, classifyOutputSchema, } from "../schemas/classify.js";
import { BRANDING } from "../constants.js";
import { scoreKeywordMatch } from "../utils/matching.js";
import { prohibitedPractices, annexIIICategories, transparencyTriggers, } from "../knowledge/annex-iii.js";
const ALL_SIGNAL_KEYS = [
    "domain",
    "uses_biometrics",
    "biometric_realtime",
    "biometric_law_enforcement",
    "is_safety_component_of_regulated_product",
    "affects_fundamental_rights",
    "targets_children_or_vulnerable",
    "generates_synthetic_content",
    "interacts_with_natural_persons",
    "performs_emotion_recognition_workplace_or_school",
    "performs_social_scoring_by_public_authority",
];
const SIGNAL_QUESTIONS = {
    domain: "What is the primary sector this AI system operates in (employment, education, biometrics, critical infrastructure, law enforcement, migration, justice, essential services, health, GPAI, product safety, other)?",
    uses_biometrics: "Does the system process biometric data such as face, fingerprint, iris, voice or gait?",
    biometric_realtime: "If the system uses biometrics, does it process them in real time?",
    biometric_law_enforcement: "Is the biometric system used by or on behalf of law enforcement authorities?",
    is_safety_component_of_regulated_product: "Is the system a safety component of a product covered by EU harmonisation legislation (Annex I — medical devices, machinery, toys, etc.)?",
    affects_fundamental_rights: "Could the system materially affect the health, safety, or fundamental rights of natural persons?",
    targets_children_or_vulnerable: "Is the system directed at, or does it materially affect, children or other vulnerable groups?",
    generates_synthetic_content: "Does the system generate or manipulate images, audio, video, or text?",
    interacts_with_natural_persons: "Is the system designed to interact directly with natural persons (e.g., as a chatbot or voice assistant)?",
    performs_emotion_recognition_workplace_or_school: "Does the system infer emotions of natural persons in the workplace or in educational institutions?",
    performs_social_scoring_by_public_authority: "Is the system used by or on behalf of a public authority to score natural persons on social behaviour or personality?",
};
const DOMAIN_TO_ANNEX_III = {
    biometrics: 1,
    critical_infrastructure: 2,
    education: 3,
    employment: 4,
    essential_services: 5,
    law_enforcement: 6,
    migration: 7,
    justice: 8,
};
function obligationsSummaryForHighRisk(role) {
    if (role === "provider") {
        return "Provider obligations: conformity assessment (Art. 43), technical documentation (Art. 11), risk management system (Art. 9), logging (Art. 12), transparency (Art. 13), human oversight (Art. 14), accuracy/robustness/cybersecurity (Art. 15), quality management (Art. 17), EU database registration (Art. 49), post-market monitoring (Art. 72).";
    }
    if (role === "deployer") {
        return "Deployer obligations: use per instructions (Art. 26(1)), human oversight by competent persons (Art. 26(2)), input data relevance (Art. 26(4)), monitor and report incidents (Art. 26(5)), DPIA where required (Art. 26(9)), inform affected persons (Art. 26(7)(11)), FRIA for public-sector deployers (Art. 27).";
    }
    return "Provider obligations include conformity assessment, technical documentation, risk management, logging, transparency, human oversight, and EU database registration. Deployer obligations include use per instructions, human oversight by competent persons, monitoring, incident reporting, and informing affected persons. Role determination needed to specify applicable obligations.";
}
function roleOrUncertain(role) {
    return role === "provider" || role === "deployer" ? role : "uncertain";
}
function buildBase(partial) {
    return {
        annex_iii_category: null,
        caveat: null,
        lexbeam_url: `${BRANDING.baseUrl}/tools/mcp`,
        ...partial,
    };
}
function formatReturn(result) {
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], structuredContent: result };
}
function missingFromSignals(signals) {
    const provided = new Set();
    if (signals) {
        for (const key of Object.keys(signals)) {
            if (signals[key] !== undefined)
                provided.add(key);
        }
    }
    return ALL_SIGNAL_KEYS.filter((k) => !provided.has(k));
}
function questionsFor(missing, limit = 3) {
    return missing.slice(0, limit).map((k) => SIGNAL_QUESTIONS[k]);
}
// ---------------------------------------------------------------------------
// Step 0 — Structured signals → deterministic classification
// ---------------------------------------------------------------------------
function classifyFromSignals(input) {
    const s = input.signals;
    if (!s)
        return null;
    const role = roleOrUncertain(input.role);
    const matched = [];
    const missing = missingFromSignals(s).map(String);
    // Prohibited practices (Art. 5) — highest priority
    if (s.performs_social_scoring_by_public_authority) {
        matched.push("performs_social_scoring_by_public_authority → Art. 5(1)(c)");
        return {
            ...buildBase({
                risk_classification: "prohibited",
                confidence: "high",
                relevant_articles: ["Art. 5", "Art. 5(1)(c)"],
                role_determination: role,
                obligations_summary: "Prohibited: social scoring by public authorities (Art. 5(1)(c)). Deployment is not permitted.",
                caveat: "Automated pre-assessment based on signals. Consult legal counsel for definitive classification.",
            }),
            matched_signals: matched,
            missing_signals: missing,
            next_questions: [],
            basis: "signals",
        };
    }
    if (s.uses_biometrics && s.biometric_realtime && s.biometric_law_enforcement) {
        matched.push("uses_biometrics + biometric_realtime + biometric_law_enforcement → Art. 5(1)(h)");
        return {
            ...buildBase({
                risk_classification: "prohibited",
                confidence: "high",
                relevant_articles: ["Art. 5", "Art. 5(1)(h)"],
                role_determination: role,
                obligations_summary: "Prohibited: real-time remote biometric identification in publicly accessible spaces for law enforcement (Art. 5(1)(h)). Narrow statutory exceptions apply only with prior judicial/administrative authorisation.",
                caveat: "Automated pre-assessment based on signals. Narrow Art. 5(1)(h) exceptions may apply for specific serious crimes — consult legal counsel.",
            }),
            matched_signals: matched,
            missing_signals: missing,
            next_questions: [],
            basis: "signals",
        };
    }
    if (s.performs_emotion_recognition_workplace_or_school) {
        matched.push("performs_emotion_recognition_workplace_or_school → Art. 5(1)(f)");
        return {
            ...buildBase({
                risk_classification: "prohibited",
                confidence: "high",
                relevant_articles: ["Art. 5", "Art. 5(1)(f)"],
                role_determination: role,
                obligations_summary: "Prohibited: emotion recognition in the workplace or educational institutions (Art. 5(1)(f)). Medical or safety-purpose exceptions exist — consult legal counsel.",
                caveat: "Automated pre-assessment based on signals.",
            }),
            matched_signals: matched,
            missing_signals: missing,
            next_questions: [],
            basis: "signals",
        };
    }
    // Annex III high-risk via domain
    if (s.domain && DOMAIN_TO_ANNEX_III[s.domain] !== undefined) {
        const categoryNumber = DOMAIN_TO_ANNEX_III[s.domain];
        const category = annexIIICategories.find((c) => c.number === categoryNumber);
        matched.push(`domain=${s.domain} → Annex III(${category.number}) ${category.name}`);
        return {
            ...buildBase({
                risk_classification: "high-risk",
                confidence: "high",
                relevant_articles: [...category.relevantArticles, "Art. 6(2)"],
                role_determination: role,
                obligations_summary: obligationsSummaryForHighRisk(input.role),
                annex_iii_category: { number: category.number, name: category.name },
                caveat: "Art. 6(3) exception may apply if the system performs only a narrow procedural task with no material influence on decision-making AND does not perform profiling of natural persons. Use euaiact_assess_art6_3_exception to evaluate.",
            }),
            matched_signals: matched,
            missing_signals: missing,
            next_questions: [],
            basis: "signals",
        };
    }
    // Annex I (regulated-product safety component) → high-risk
    if (s.is_safety_component_of_regulated_product) {
        matched.push("is_safety_component_of_regulated_product → Art. 6(1) (Annex I)");
        return {
            ...buildBase({
                risk_classification: "high-risk",
                confidence: "high",
                relevant_articles: ["Art. 6(1)", "Annex I"],
                role_determination: role,
                obligations_summary: obligationsSummaryForHighRisk(input.role),
                caveat: "High-risk via Art. 6(1) (Annex I). Conformity assessment follows the sectoral EU harmonisation legislation applicable to the product.",
            }),
            matched_signals: matched,
            missing_signals: missing,
            next_questions: [],
            basis: "signals",
        };
    }
    // Art. 50 limited risk via signals
    if (s.generates_synthetic_content) {
        matched.push("generates_synthetic_content → Art. 50(2)/50(4)");
        return {
            ...buildBase({
                risk_classification: "limited",
                confidence: "high",
                relevant_articles: ["Art. 50", "Art. 50(2)", "Art. 50(4)"],
                role_determination: role,
                obligations_summary: "Limited-risk transparency obligations: generated content must be marked in a machine-readable format (Art. 50(2)); deepfakes and AI-generated text on matters of public interest must be disclosed (Art. 50(4)).",
            }),
            matched_signals: matched,
            missing_signals: missing,
            next_questions: [],
            basis: "signals",
        };
    }
    if (s.interacts_with_natural_persons) {
        matched.push("interacts_with_natural_persons → Art. 50(1)");
        return {
            ...buildBase({
                risk_classification: "limited",
                confidence: "high",
                relevant_articles: ["Art. 50", "Art. 50(1)"],
                role_determination: role,
                obligations_summary: "Limited-risk transparency obligation: natural persons must be informed that they are interacting with an AI system (Art. 50(1)), unless obvious from context.",
            }),
            matched_signals: matched,
            missing_signals: missing,
            next_questions: [],
            basis: "signals",
        };
    }
    // Signals given but no rule fired → fall through to text classification
    return null;
}
function bestStrongHit(text, items) {
    let best = null;
    for (const item of items) {
        const result = scoreKeywordMatch(text, item.keywords);
        if (result.strongCount === 0 && result.weakCount < 2)
            continue;
        if (!best) {
            best = { item, result };
            continue;
        }
        // Prefer strong count, then raw match count, then score
        const candidateIsBetter = result.strongCount > best.result.strongCount ||
            (result.strongCount === best.result.strongCount && result.matches.length > best.result.matches.length) ||
            (result.strongCount === best.result.strongCount && result.matches.length === best.result.matches.length && result.score > best.result.score);
        if (candidateIsBetter)
            best = { item, result };
    }
    return best;
}
function confidenceFor(result) {
    if (result.strongCount >= 2)
        return "high";
    if (result.strongCount === 1)
        return "medium";
    return "low";
}
function classifyFromText(input) {
    const role = roleOrUncertain(input.role);
    const combined = `${input.description ?? ""} ${input.use_case ?? ""}`.trim();
    const missing = missingFromSignals(input.signals).map(String);
    const questions = questionsFor(missingFromSignals(input.signals));
    if (!combined) {
        return {
            ...buildBase({
                risk_classification: "minimal",
                confidence: "low",
                relevant_articles: ["Art. 6(1)"],
                role_determination: role,
                obligations_summary: "Insufficient information. Please provide a description, a use case, or structured signals so the classifier can evaluate the system.",
                caveat: "No description or signals provided.",
            }),
            matched_signals: [],
            missing_signals: missing,
            next_questions: questions,
            basis: "default",
        };
    }
    // Step 1a: prohibited practices
    const prohibitedHit = bestStrongHit(combined, prohibitedPractices);
    if (prohibitedHit) {
        const matched = prohibitedHit.result.matches.map((m) => `"${m.keyword}" (${m.strength})`);
        return {
            ...buildBase({
                risk_classification: "prohibited",
                confidence: confidenceFor(prohibitedHit.result),
                relevant_articles: ["Art. 5", prohibitedHit.item.article],
                role_determination: role,
                obligations_summary: `This system appears to fall under prohibited AI practices (${prohibitedHit.item.name}). Deployment is not permitted under the EU AI Act.`,
                caveat: "Automated pre-assessment. Consult legal counsel for definitive classification.",
            }),
            matched_signals: matched,
            missing_signals: missing,
            next_questions: questions,
            basis: "text",
        };
    }
    // Step 1b: Annex III high-risk
    const annexHit = bestStrongHit(combined, annexIIICategories);
    if (annexHit) {
        const matched = annexHit.result.matches.map((m) => `"${m.keyword}" (${m.strength})`);
        return {
            ...buildBase({
                risk_classification: "high-risk",
                confidence: confidenceFor(annexHit.result),
                relevant_articles: [...annexHit.item.relevantArticles, "Art. 6(2)"],
                role_determination: role,
                obligations_summary: obligationsSummaryForHighRisk(input.role),
                annex_iii_category: { number: annexHit.item.number, name: annexHit.item.name },
                caveat: "Art. 6(3) exception may apply if the system performs only a narrow procedural task with no material influence on decision-making AND does not perform profiling of natural persons. Use euaiact_assess_art6_3_exception to evaluate.",
            }),
            matched_signals: matched,
            missing_signals: missing,
            next_questions: questions,
            basis: "text",
        };
    }
    // Step 1c: Art. 50 limited risk
    const transparencyHit = bestStrongHit(combined, transparencyTriggers);
    if (transparencyHit) {
        const matched = transparencyHit.result.matches.map((m) => `"${m.keyword}" (${m.strength})`);
        return {
            ...buildBase({
                risk_classification: "limited",
                confidence: confidenceFor(transparencyHit.result),
                relevant_articles: ["Art. 50", transparencyHit.item.article],
                role_determination: role,
                obligations_summary: `System must comply with transparency obligations (${transparencyHit.item.article}): ${transparencyHit.item.description}`,
            }),
            matched_signals: matched,
            missing_signals: missing,
            next_questions: questions,
            basis: "text",
        };
    }
    // Step 1d: default to minimal
    return {
        ...buildBase({
            risk_classification: "minimal",
            confidence: "low",
            relevant_articles: ["Art. 6(1)"],
            role_determination: role,
            obligations_summary: "System appears to be minimal risk. No specific AI Act obligations beyond voluntary codes of conduct (Art. 95) and the universal AI literacy requirement (Art. 4). General product safety and consumer protection laws still apply.",
            caveat: "Classification based on limited information. A detailed assessment may reveal higher risk. All providers and deployers must ensure AI literacy (Art. 4), enforceable since 2 February 2025.",
        }),
        matched_signals: [],
        missing_signals: missing,
        next_questions: questions,
        basis: "default",
    };
}
// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
export function registerClassifyTool(server) {
    server.registerTool("euaiact_classify_system", {
        title: "Classify AI System Under EU AI Act",
        description: "Classify an AI system's risk level under the EU AI Act (Regulation 2024/1689). Accepts a free-text description, a use_case, and/or structured signals (domain, biometric flags, synthetic content, etc.). Signals take precedence over text matching for deterministic classification. Returns risk classification, applicable Annex III category, relevant articles, provider/deployer determination, matched signals, and follow-up questions the agent should relay. Note: Art. 6(3) exceptions require documented justification and cannot be auto-applied; use euaiact_assess_art6_3_exception.",
        annotations: {
            readOnlyHint: true,
            idempotentHint: true,
            openWorldHint: false,
        },
        inputSchema: classifyInputSchema,
        outputSchema: classifyOutputSchema,
    }, async (input) => {
        const signalsResult = classifyFromSignals(input);
        if (signalsResult)
            return formatReturn(signalsResult);
        return formatReturn(classifyFromText(input));
    });
}
//# sourceMappingURL=classify.js.map