// Direct function tests for the EU AI Act MCP server.
// Run `npm run build` first so dist/ is up to date.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { classifyInputSchema } from "./dist/schemas/classify.js";
import { obligationsInputSchema } from "./dist/schemas/obligations.js";
import { penaltiesInputSchema } from "./dist/schemas/penalties.js";
import { faqInputSchema } from "./dist/schemas/faq.js";
import { deadlinesInputSchema } from "./dist/schemas/deadlines.js";
import { articleInputSchema } from "./dist/schemas/article.js";
import { gpaiSystemicInputSchema } from "./dist/schemas/gpai-systemic.js";
import { art6ExceptionInputSchema } from "./dist/schemas/art6.js";
import { annexIvInputSchema } from "./dist/schemas/annex-iv.js";
import { scoreKeywordMatch, calculateKeywordOverlap, findBestMatch } from "./dist/utils/matching.js";
import { prohibitedPractices, annexIIICategories, transparencyTriggers } from "./dist/knowledge/annex-iii.js";
import {
  getMilestonesWithDaysRemaining,
  digitalOmnibus,
  digitalOmnibusPack,
  omnibusEnactment,
  isOmnibusEnacted,
  resolveOmnibusStatus,
  buildOmnibusSummary,
  getOperativeHighRiskDates,
  getOperativeMilestones,
  getEffectiveSourceRegistry,
} from "./dist/knowledge/deadlines.js";
import { sourceRegistry, SOURCE_STATUS_LABELS, isEnacted } from "./dist/knowledge/sources.js";
import {
  providerHighRiskObligations,
  deployerHighRiskObligations,
  limitedRiskTransparencyObligations,
  providerLimitedRiskTransparencyObligations,
  deployerLimitedRiskTransparencyObligations,
  providerGPAIObligations,
  universalObligations,
} from "./dist/knowledge/obligations.js";
import { calculateMaxFine, getPenaltyTier, penaltyFramework } from "./dist/knowledge/penalties.js";
import { faqDatabase } from "./dist/knowledge/faq-database.js";
import { articles, findArticle } from "./dist/knowledge/articles.js";
import { annexIVItems } from "./dist/knowledge/annex-iv.js";
import { BRANDING, SERVER_INSTRUCTIONS } from "./dist/constants.js";
import { createServer } from "./dist/server.js";
import {
  assessSystemResponseSchema,
  systemProfileSchema,
} from "./dist/decision-contract/index.js";
import {
  canonicalResponseHash,
  canonicalize,
} from "./dist/utils/canonical-json.js";

let pass = 0;
let fail = 0;

function test(name, condition) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    pass++;
  } else {
    console.log(`  ❌ ${name}`);
    fail++;
  }
}

// ─── Helper: directly exercise the classifier via the same code path as the
// MCP tool would, by calling the registered handler. This is more rigorous
// than re-implementing the dispatch in the test. The McpServer SDK exposes
// handlers through its internal _toolHandlers map; we extract what we need
// via a lightweight capture during registration. ───────────────────────────

// We can't easily introspect the SDK's internal handler map across versions,
// so we re-import the classify logic by calling the tool's internal
// functions through a thin shim: build a fake server that captures
// registered tools.
function captureRegisteredTools() {
  const registered = {};
  const fakeServer = {
    registerTool: (name, _config, handler) => {
      registered[name] = handler;
    },
    resource: () => {},
    prompt: () => {},
  };
  return { fakeServer, registered };
}

async function callTool(toolName, input) {
  const { fakeServer, registered } = captureRegisteredTools();
  // Dynamically import the register functions directly to avoid the real SDK.
  const { registerClassifyTool } = await import("./dist/tools/classify.js");
  const { registerDeadlinesTool } = await import("./dist/tools/deadlines.js");
  const { registerObligationsTool } = await import("./dist/tools/obligations.js");
  const { registerFaqTool } = await import("./dist/tools/faq.js");
  const { registerPenaltiesTool } = await import("./dist/tools/penalties.js");
  const { registerArticleTool } = await import("./dist/tools/article.js");
  const { registerGpaiSystemicTool } = await import("./dist/tools/gpai-systemic.js");
  const { registerArt6ExceptionTool } = await import("./dist/tools/art6-exception.js");
  const { registerAnnexIvTool } = await import("./dist/tools/annex-iv.js");
  const { registerAssessSystemTool } = await import("./dist/tools/assess-system.js");

  registerClassifyTool(fakeServer);
  registerDeadlinesTool(fakeServer);
  registerObligationsTool(fakeServer);
  registerFaqTool(fakeServer);
  registerPenaltiesTool(fakeServer);
  registerArticleTool(fakeServer);
  registerGpaiSystemicTool(fakeServer);
  registerArt6ExceptionTool(fakeServer);
  registerAnnexIvTool(fakeServer);
  registerAssessSystemTool(fakeServer);

  const handler = registered[toolName];
  if (!handler) throw new Error(`Tool not registered: ${toolName}`);
  return handler(input);
}

// ─── SCHEMAS ────────────────────────────────────────────────────────────────
console.log("\n📋 SCHEMA VALIDATION");
test("classify: empty input (signals-only ok)", classifyInputSchema.safeParse({}).success);
test("classify: description+use_case", classifyInputSchema.safeParse({ description: "x", use_case: "y" }).success);
test("classify: signals only", classifyInputSchema.safeParse({ signals: { domain: "employment" } }).success);
test("classify: Annex I signal includes third-party conformity condition", classifyInputSchema.safeParse({ signals: { is_safety_component_of_regulated_product: true, requires_third_party_conformity_assessment: true } }).success);
test("classify: biometric verification exclusion signal parses", classifyInputSchema.safeParse({ signals: { uses_biometrics: true, biometric_sole_purpose_verification: true } }).success);
test("obligations input parses", obligationsInputSchema.safeParse({ role: "provider", risk_level: "high-risk" }).success);
test("obligations input parses high-risk source", obligationsInputSchema.safeParse({ role: "provider", risk_level: "high-risk", high_risk_source: "annex_i" }).success);
test("obligations input parses GPAI legacy flag", obligationsInputSchema.safeParse({ role: "provider", risk_level: "gpai", gpai_model_placed_on_market_before_2025_08_02: true }).success);
test("obligations gpai", obligationsInputSchema.safeParse({ role: "provider", risk_level: "gpai" }).success);
test("penalties input parses", penaltiesInputSchema.safeParse({ violation_type: "prohibited", annual_turnover_eur: 1000000 }).success);
test("penalties gpai input parses", penaltiesInputSchema.safeParse({ violation_type: "gpai", annual_turnover_eur: 1000000 }).success);
test("faq input parses", faqInputSchema.safeParse({ question: "test" }).success);
test("deadlines empty parses", deadlinesInputSchema.safeParse({}).success);
test("deadlines with area parses", deadlinesInputSchema.safeParse({ area: "GPAI" }).success);
test("deadlines only_upcoming parses", deadlinesInputSchema.safeParse({ only_upcoming: true }).success);
test("article input parses", articleInputSchema.safeParse({ article: "5" }).success);
test("gpai input: empty ok", gpaiSystemicInputSchema.safeParse({}).success);
test("gpai input: with flops", gpaiSystemicInputSchema.safeParse({ training_flops: 2e25 }).success);
test("art6 input: profiling flag required", art6ExceptionInputSchema.safeParse({ performs_profiling: true }).success);
test("art6 input: missing profiling rejected", !art6ExceptionInputSchema.safeParse({}).success);
test("annex iv: empty ok", annexIvInputSchema.safeParse({}).success);
test("annex iv: checklist format", annexIvInputSchema.safeParse({ format: "checklist" }).success);
test("assess system: sparse frozen profile parses", systemProfileSchema.safeParse({ profile_version: "1.0" }).success);
test("assess system: caller-selected regulation is rejected", !systemProfileSchema.safeParse({ profile_version: "1.0", regulation_id: "other" }).success);

// ─── DIST / SOURCE CONSISTENCY ─────────────────────────────────────────────
console.log("\n📦 DIST / SOURCE CONSISTENCY");
function listTsFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? listTsFiles(full) : [full];
  }).filter((path) => path.endsWith(".ts"));
}

for (const sourcePath of listTsFiles("src")) {
  const generatedPath = sourcePath.replace(/^src\//, "dist/").replace(/\.ts$/, ".js");
  test(`source has generated JS: ${generatedPath}`, existsSync(generatedPath));
}

for (const path of [
  "dist/tools/annex-iv.js",
  "dist/tools/art6-exception.js",
  "dist/tools/article.js",
  "dist/tools/gpai-systemic.js",
  "dist/tools/penalties.js",
  "dist/schemas/annex-iv.js",
  "dist/schemas/art6.js",
  "dist/schemas/article.js",
  "dist/schemas/gpai-systemic.js",
  "dist/schemas/penalties.js",
]) {
  test(`generated file present: ${path}`, existsSync(path));
}

// ─── MATCHING REGRESSIONS (v1.1.0) ─────────────────────────────────────────
console.log("\n🛠️ MATCHING BUG REGRESSIONS");

// BUG 1: the old implementation let single-character tokens match multi-word
// keywords via the fallback prefix check. "e" in "e-commerce" caused
// "emotion recognition workplace" to match. The fix disables that path.
{
  const chatbotText = "ai chatbot for customer support that handles returns e commerce service";
  const emotionPractice = prohibitedPractices.find((p) => p.article === "Art. 5(1)(f)");
  const hit = scoreKeywordMatch(chatbotText, emotionPractice.keywords);
  test("chatbot text does NOT match Art. 5(1)(f) emotion keywords", hit.strongCount === 0);
  test("chatbot text does NOT match ANY prohibited practice strongly", prohibitedPractices.every((p) => scoreKeywordMatch(chatbotText, p.keywords).strongCount === 0));
}

// BUG 2: the old scoring divided matches by total keyword count, so realistic
// descriptions with only a few overlapping keywords scored below the 0.3
// threshold. The new classifier uses strongCount >= 1, so a recruitment
// description hits Annex III(4) even with only 2-3 overlapping keywords.
{
  const recruitment = "ai system screens cvs and ranks candidates for hiring decisions recruitment";
  const ann4 = annexIIICategories.find((c) => c.number === 4);
  const hit = scoreKeywordMatch(recruitment, ann4.keywords);
  test("recruitment text strongly hits Annex III(4)", hit.strongCount >= 1);
}

// calculateKeywordOverlap is preserved as a numeric alias
{
  const score = calculateKeywordOverlap("social scoring citizen trustworthiness", ["social scoring", "citizen score", "trustworthiness score"]);
  test("calculateKeywordOverlap numeric alias still works", score > 0);
}

// symmetric findBestMatch for FAQ
{
  const fria = findBestMatch("FRIA for credit scoring", faqDatabase, "question");
  test("FAQ search: FRIA credit scoring hits faq-22", fria.item?.id === "faq-22-fria-credit-scoring");
  const flops = findBestMatch("FLOPs threshold for GPAI systemic risk", faqDatabase, "question");
  test("FAQ search: FLOPs threshold hits faq-21", flops.item?.id === "faq-21-gpai-flops-threshold");
  const chatbot = findBestMatch("Do chatbots need disclosure under Art. 50", faqDatabase, "question");
  test("FAQ search: chatbot disclosure hits faq-23", chatbot.item?.id === "faq-23-chatbot-disclosure");
}

// ─── CLASSIFIER BEHAVIOUR ───────────────────────────────────────────────────
console.log("\n🎯 CLASSIFIER (text + signals)");

// Text regression tests from the Smithery probe session
const classifyResults = {};
for (const [key, input] of Object.entries({
  chatbot: { description: "AI chatbot for customer support that handles returns", use_case: "E-commerce" },
  recruitment: { description: "AI system that screens CVs and ranks candidates for hiring decisions", use_case: "Recruitment" },
  rtFacial: { description: "real-time facial recognition in public spaces for law enforcement", use_case: "Police identifying suspects" },
  socialScoring: { description: "government system assigning citizen trustworthiness scores for access to public services", use_case: "Public authority" },
  creditScoring: { description: "credit scoring model determining loan eligibility", use_case: "Bank creditworthiness" },
  deepfake: { description: "AI that generates deepfake videos from a photo", use_case: "Entertainment" },
  spellchecker: { description: "Spell checker that suggests corrections as you type", use_case: "Word processor" },
  signalsRbi: { signals: { uses_biometrics: true, biometric_realtime: true, biometric_law_enforcement: true, biometric_publicly_accessible_space: true } },
  signalsNonPublicRbi: { signals: { uses_biometrics: true, biometric_realtime: true, biometric_law_enforcement: true, biometric_publicly_accessible_space: false } },
  signalsEmployment: { signals: { domain: "employment" } },
  signalsSocialScoring: { signals: { performs_social_scoring_by_public_authority: true, social_scoring_unrelated_context: true } },
  signalsPrivateSocialScoring: { signals: { performs_social_scoring: true, social_scoring_unjustified_or_disproportionate: true } },
  signalsIncompleteSocialScoring: { signals: { performs_social_scoring: true } },
  signalsChatbot: { signals: { interacts_with_natural_persons: true } },
  signalsSynthetic: { signals: { generates_synthetic_content: true } },
  signalsAnnexI: { signals: { is_safety_component_of_regulated_product: true, requires_third_party_conformity_assessment: true } },
  signalsAnnexIIncomplete: { signals: { is_safety_component_of_regulated_product: true } },
  signalsAnnexINoThirdParty: { description: "AI component in a regulated product that is not subject to third-party conformity assessment", signals: { is_safety_component_of_regulated_product: true, requires_third_party_conformity_assessment: false } },
  signalsBiometricVerification: { description: "Fingerprint biometric verification only to confirm an employee is the person they claim to be for workstation login.", signals: { uses_biometrics: true, biometric_sole_purpose_verification: true } },
  signalsBiometricsOnly: { signals: { domain: "biometrics" } },
  signalsEmotionWorkplace: { signals: { performs_emotion_recognition_workplace_or_school: true } },
  lifeHealthInsurance: { description: "AI model used for risk assessment and pricing for life and health insurance", use_case: "Insurance underwriting" },
  carInsurance: { description: "AI model used to calculate car insurance premiums for vehicle insurance", use_case: "Motor insurance pricing" },
  travelDocumentVerification: { description: "AI-powered document authenticity verification for travel documents at an automated border e-gate.", role: "provider" },
  crimeAnalyticsNoIndividual: { description: "Police dashboard uses AI crime analytics to identify offence patterns and hotspots from aggregated historical reports. It does not assess individual risk or make decisions about natural persons.", role: "deployer" },
  withoutProfiling: { description: "Police dashboard uses AI crime analytics to identify offence patterns and hotspots from aggregated historical reports, without profiling natural persons or assessing individual risk.", role: "deployer" },
})) {
  classifyResults[key] = await callTool("euaiact_classify_system", input);
}

function structured(r) {
  return r.structuredContent;
}

test(
  "chatbot text → limited risk (not prohibited)",
  structured(classifyResults.chatbot).risk_classification === "limited",
);
test(
  "chatbot text cites Art. 50(1)",
  structured(classifyResults.chatbot).relevant_articles.some((a) => a.includes("50(1)")),
);
test(
  "recruitment text → high-risk",
  structured(classifyResults.recruitment).risk_classification === "high-risk",
);
test(
  "recruitment text → Annex III(4)",
  structured(classifyResults.recruitment).annex_iii_category?.number === 4,
);
test(
  "real-time RBI text → prohibited",
  structured(classifyResults.rtFacial).risk_classification === "prohibited",
);
test(
  "real-time RBI cites Art. 5(1)(h) NOT 5(1)(e)",
  structured(classifyResults.rtFacial).relevant_articles.some((a) => a.includes("5(1)(h)")) &&
    !structured(classifyResults.rtFacial).relevant_articles.some((a) => a === "Art. 5(1)(e)"),
);
test(
  "social scoring text → prohibited Art. 5(1)(c)",
  structured(classifyResults.socialScoring).risk_classification === "prohibited" &&
    structured(classifyResults.socialScoring).relevant_articles.some((a) => a.includes("5(1)(c)")),
);
test(
  "credit scoring text → high-risk Annex III(5)",
  structured(classifyResults.creditScoring).risk_classification === "high-risk" &&
    structured(classifyResults.creditScoring).annex_iii_category?.number === 5,
);
test(
  "deepfake text → limited risk Art. 50",
  structured(classifyResults.deepfake).risk_classification === "limited",
);
test(
  "spellchecker text → insufficient_information (no positive match)",
  structured(classifyResults.spellchecker).risk_classification === "insufficient_information",
);

// Signals path
test(
  "signals RBI → prohibited Art. 5(1)(h) high confidence",
  structured(classifyResults.signalsRbi).risk_classification === "prohibited" &&
    structured(classifyResults.signalsRbi).confidence === "high" &&
    structured(classifyResults.signalsRbi).basis === "signals",
);
test(
  "signals non-public RBI → not prohibited without publicly accessible space",
  structured(classifyResults.signalsNonPublicRbi).risk_classification === "high-risk" &&
    structured(classifyResults.signalsNonPublicRbi).annex_iii_category?.number === 1 &&
    structured(classifyResults.signalsNonPublicRbi).basis === "signals",
);
test(
  "signals employment → high-risk Annex III(4)",
  structured(classifyResults.signalsEmployment).risk_classification === "high-risk" &&
    structured(classifyResults.signalsEmployment).annex_iii_category?.number === 4,
);
test(
  "signals social scoring → prohibited Art. 5(1)(c)",
  structured(classifyResults.signalsSocialScoring).risk_classification === "prohibited" &&
    structured(classifyResults.signalsSocialScoring).relevant_articles.some((a) => a.includes("5(1)(c)")),
);
test(
  "signals private social scoring → prohibited Art. 5(1)(c)",
  structured(classifyResults.signalsPrivateSocialScoring).risk_classification === "prohibited" &&
    /public authorities/i.test(structured(classifyResults.signalsPrivateSocialScoring).obligations_summary) === false,
);
test(
  "signals social scoring without a treatment limb → insufficient information",
  structured(classifyResults.signalsIncompleteSocialScoring).risk_classification === "insufficient_information" &&
    structured(classifyResults.signalsIncompleteSocialScoring).next_questions.length === 2,
);
test(
  "signals interacts_with_natural_persons → limited Art. 50(1)",
  structured(classifyResults.signalsChatbot).risk_classification === "limited",
);
test(
  "signals generates_synthetic_content → limited Art. 50",
  structured(classifyResults.signalsSynthetic).risk_classification === "limited",
);
test(
  "signals annex I safety component → high-risk Art. 6(1)",
  structured(classifyResults.signalsAnnexI).risk_classification === "high-risk" &&
    structured(classifyResults.signalsAnnexI).relevant_articles.includes("Art. 6(1)"),
);
test(
  "signals Annex I without third-party conformity fact → insufficient information",
  structured(classifyResults.signalsAnnexIIncomplete).risk_classification === "insufficient_information" &&
    /third-party conformity/i.test(structured(classifyResults.signalsAnnexIIncomplete).caveat),
);
test(
  "signals Annex I with no third-party conformity → not high-risk from Art. 6(1)",
  structured(classifyResults.signalsAnnexINoThirdParty).risk_classification === "insufficient_information",
);
test(
  "sole-purpose biometric verification signal does not auto-classify Annex III(1)",
  // 1.4.4 final: scoped exclusion (not-high-risk under III(1)(a)) without an
  // overall risk claim; never high-risk, never an overclaimed minimal.
  structured(classifyResults.signalsBiometricVerification).risk_classification === "insufficient_information" &&
    structured(classifyResults.signalsBiometricVerification).relevant_articles.includes("Annex III(1)(a)"),
);
test(
  "domain=biometrics alone does not auto-classify Annex III(1)",
  structured(classifyResults.signalsBiometricsOnly).risk_classification === "insufficient_information",
);
test(
  "signals emotion recognition workplace → prohibited Art. 5(1)(f)",
  structured(classifyResults.signalsEmotionWorkplace).risk_classification === "prohibited",
);
test(
  "life/health insurance pricing → high-risk Annex III(5)",
  structured(classifyResults.lifeHealthInsurance).risk_classification === "high-risk" &&
    structured(classifyResults.lifeHealthInsurance).annex_iii_category?.number === 5,
);
test(
  "ordinary car insurance pricing does not hit Annex III(5) from generic insurance",
  structured(classifyResults.carInsurance).annex_iii_category?.number !== 5,
);
test(
  "travel document verification does not hit Annex III(7)",
  structured(classifyResults.travelDocumentVerification).annex_iii_category?.number !== 7,
);
test(
  "aggregated crime analytics without individual risk does not hit Annex III(6)",
  structured(classifyResults.crimeAnalyticsNoIndividual).annex_iii_category?.number !== 6,
);
test(
  "without profiling text does not trigger prohibited Art. 5(1)(d)",
  structured(classifyResults.withoutProfiling).risk_classification !== "prohibited",
);

// matched_signals + next_questions populated
test(
  "chatbot result includes matched_signals array",
  Array.isArray(structured(classifyResults.chatbot).matched_signals),
);
{
  const emptyResult = (await callTool("euaiact_classify_system", {})).structuredContent;
  test(
    "empty-input classify returns insufficient_information",
    emptyResult.risk_classification === "insufficient_information",
  );
  test(
    "empty-input classify returns follow-up questions",
    emptyResult.next_questions.length > 0,
  );
}
test(
  "classify output has no `disclaimer` field (branding slim)",
  !("disclaimer" in structured(classifyResults.chatbot)),
);
test(
  "classify output has no `source` field (branding slim)",
  !("source" in structured(classifyResults.chatbot)),
);

// ─── DEADLINES ──────────────────────────────────────────────────────────────
console.log("\n📅 DEADLINES");
const milestones = getMilestonesWithDaysRemaining();
test("8 milestones total (enacted state)", milestones.length === 8);
// Date-independent properties: these hold on ANY day the suite runs, so the
// suite cannot rot when the calendar passes a milestone (the 1.4.3 defect class).
test("isPast agrees with the clock for every milestone", milestones.every((m) => m.isPast === (new Date(m.date + "T00:00:00Z").getTime() <= Date.now())));
test("status is derived: past milestones are in_effect", milestones.filter((m) => m.isPast).every((m) => m.status === "in_effect"));
test("status is derived: future milestones are upcoming", milestones.filter((m) => !m.isPast).every((m) => m.status === "upcoming"));
test("status never contradicts is_past", milestones.every((m) => (m.status === "in_effect") === m.isPast || m.status === "proposal_only"));
test("daysRemaining sign matches isPast", milestones.every((m) => (m.daysRemaining <= 0) === m.isPast));
test("milestones are chronologically ordered", milestones.every((m, i) => i === 0 || m.date >= milestones[i - 1].date));
// Fixed historical facts, safe on any date:
test("Entry into force is past", milestones[0].isPast === true);
test("2026-08-02 milestone no longer claims Arts. 99-100 start then", !milestones.some((m) => m.date === "2026-08-02" && (m.articles.includes("Art. 99") || m.articles.includes("Art. 100"))));
test("2026-08-02 milestone names Arts. 88-94 supervision and Art. 101", milestones.some((m) => m.date === "2026-08-02" && m.articles.includes("Art. 88-94") && m.articles.includes("Art. 101") && /Arts\. 99 and 100.*2 August 2025/.test(m.description)));
test("2027-12-02 milestone articles are Sections 1-3 only (no 43/47/49/72/73)", milestones.some((m) => m.date === "2027-12-02") && !milestones.some((m) => m.date === "2027-12-02" && ["Art. 43", "Art. 47", "Art. 49", "Art. 72", "Art. 73"].some((a) => m.articles.includes(a))));
test("2027-12-02 milestone explains formal vs practical trigger for Arts. 43-73", milestones.some((m) => m.date === "2027-12-02" && /formally apply since 2 August 2026/.test(m.description) && /practically triggered/.test(m.description)));
test("Digital Omnibus summary status is enacted_oj", digitalOmnibus.status === "enacted_oj");
test("Digital Omnibus impact states it is enacted and in force", digitalOmnibus.impactOnAIAct.includes("in force since 2026-07-27"));
test("Chapter XII penalty framework date is 2025-08-02", penaltyFramework.enforcementDate === "2025-08-02");
test("2025 milestone includes Chapter XII penalties except Art. 101", milestones[2].keyObligations.some((o) => /Chapter XII penalty framework applies, except Art\. 101/.test(o)));

// Tool-level: only_upcoming filter
{
  const r = await callTool("euaiact_check_deadlines", { only_upcoming: true });
  const s = structured(r);
  test("deadlines only_upcoming filter drops past entries", s.milestones.every((m) => !m.is_past));
  // Date-independent: next_milestone is the first non-past entry, or null once
  // every milestone has passed (from 2028-08-03 the null is the correct answer).
  test("deadlines next_milestone agrees with the clock", s.next_milestone !== null || s.milestones.length === 0);
  test("deadlines only_upcoming status never says in_effect", s.milestones.every((m) => m.status !== "in_effect"));
}

// ─── SOURCE-STATE: DIGITAL OMNIBUS (v1.3.0) ─────────────────────────────────
console.log("\n🧭 SOURCE-STATE / DIGITAL OMNIBUS");

// Verified proposal facts (cross-read against COM(2025) 836 on 2026-06-15)
test("Omnibus proposal date is 2025-11-19", digitalOmnibusPack.proposal.date === "2025-11-19");
test("Omnibus proposal CELEX is 52025PC0836", digitalOmnibusPack.proposal.celex === "52025PC0836");
test("Omnibus pack is enacted", digitalOmnibusPack.enacted === true);
test("Omnibus political agreement date is 2026-05-07", digitalOmnibusPack.politicalAgreement.date === "2026-05-07");
test("Omnibus high-risk application date Annex III is 2027-12-02", digitalOmnibusPack.highRiskTimeline.applicationDates.annex_iii_art_6_2 === "2027-12-02");
test("Omnibus high-risk application date Annex I is 2028-08-02", digitalOmnibusPack.highRiskTimeline.applicationDates.annex_i_art_6_1 === "2028-08-02");
test("Omnibus Art 50(2) transition date is the enacted 2026-12-02", digitalOmnibusPack.deltas.some((d) => d.article.includes("50(2)") && d.effectiveDate === "2026-12-02"));
test("Omnibus Art 50(2) delta is attributed to the enacted OJ text", digitalOmnibusPack.deltas.some((d) => d.article.includes("50(2)") && d.sourceStatus === "enacted_oj" && d.sourceId === "omnibus_oj"));
test("Retired proposal date 2027-02-02 appears in no delta", digitalOmnibusPack.deltas.every((d) => d.effectiveDate !== "2027-02-02"));

// Art. 5 prohibitions are enacted law now, not an unverified agreement item.
// Guards the 2026-07-27 correction: the old "do not emit as current Art. 5 law"
// caution survived the flip and was actively wrong.
{
  const nud = digitalOmnibusPack.deltas.find((d) => /Art\. 5 \(prohibited/.test(d.article));
  test("Art. 5 delta is tagged enacted_oj", !!nud && nud.sourceStatus === "enacted_oj");
  test("Art. 5 delta carries the enacted 2026-12-02 date", !!nud && nud.effectiveDate === "2026-12-02");
  test("Art. 5 delta no longer warns against emitting it as current law", !!nud && !/do not emit as current/i.test(nud.note || ""));
}

// Art. 4 was REPLACED, not recast into a Commission-only duty. The proposal's
// version shipped in 1.4.1 and was wrong as law; this guards the correction.
{
  const a4 = digitalOmnibusPack.deltas.find((d) => /^Art\. 4 \(AI literacy\)/.test(d.article));
  test("Art. 4 delta exists and is tagged enacted_oj", !!a4 && a4.sourceStatus === "enacted_oj");
  test("Art. 4 delta does not claim a Commission/Member-State-only recast", !!a4 && !/recast into a duty on the Commission and Member States/i.test(a4.change));
  test("Art. 4 delta states the support-the-development duty", !!a4 && /SUPPORT THE DEVELOPMENT/i.test(a4.change));
  test("Art. 4 delta records that no specific literacy level must be guaranteed", !!a4 && /does not require .*guarantee any specific level/i.test(a4.change));
}

// Art. 49 registration duty SURVIVES the enacted act. The proposal deleted it;
// stating that as law would tell a provider to skip a live registration duty.
{
  const a49 = digitalOmnibusPack.deltas.find((d) => /Art\. 49/.test(d.article));
  test("Art. 49 delta exists and is tagged enacted_oj", !!a49 && a49.sourceStatus === "enacted_oj");
  test("Art. 49 delta states the registration duty survives", !!a49 && /SURVIVES/.test(a49.change));
  test("Art. 49 delta does not claim the duty was deleted", !!a49 && !/^Deletes the EU-database registration duty/i.test(a49.change));
  test("Art. 49 delta records the Annex VIII Section B points 7 and 9 deletion", !!a49 && /Annex VIII Section B points 7 and 9/.test(a49.change));
}

// Once the pack reads as enacted, no delta may still be sourced to the proposal
// or the political agreement: each one must have been reconciled against the OJ.
{
  const stale = digitalOmnibusPack.deltas.filter((d) => d.sourceStatus !== "enacted_oj");
  test(
    `Enacted pack: every delta reconciled against the OJ text (${stale.length} stale)`,
    !digitalOmnibusPack.enacted || stale.length === 0,
  );
  test("Enacted pack: every delta cites its amending item number", !digitalOmnibusPack.enacted || digitalOmnibusPack.deltas.every((d) => /item(s)? \d/.test(d.change)));
}

// The superseded Art. 4 wording must not survive anywhere in the knowledge base.
{
  const a4art = articles.find((a) => a.number === "4");
  test("Art. 4 article summary drops the superseded 'ensure ... sufficient level' wording", !!a4art && !/must take measures to ensure, to their best extent, a sufficient level/i.test(a4art.summary));
  test("Art. 4 article summary records the 27 July 2026 replacement", !!a4art && /27 July 2026/.test(a4art.summary));
  test("Universal obligation reflects the support-the-development duty", /support the development/i.test(universalObligations[0].obligation));
}

// Source registry carries correct statuses
test("Source registry: OJ is enacted_oj", sourceRegistry.oj_2024_1689.status === "enacted_oj");
test("Source registry: COM(2025) 836 is commission_proposal", sourceRegistry.com_2025_836.status === "commission_proposal");
test("Source registry: omnibus record is adopted_pending_publication", sourceRegistry.omnibus_agreement_2026_05_07.status === "adopted_pending_publication");
test("Source registry: omnibus note records EP 2026-06-16 and Council 2026-06-29", /2026-06-16/.test(sourceRegistry.omnibus_agreement_2026_05_07.note) && /2026-06-29/.test(sourceRegistry.omnibus_agreement_2026_05_07.note));
test("Source registry: exactly one enacted_oj source (the OJ instrument, no policy page)", Object.values(sourceRegistry).filter((x) => x.status === "enacted_oj").length === 1);
test("Omnibus delta pack is expanded but curated (>=13 deltas)", digitalOmnibusPack.deltas.length >= 13);
test("Omnibus pack carries a non-exhaustive coverage note", /NON-EXHAUSTIVE/i.test(digitalOmnibusPack.coverageNote));
test("Omnibus deltas include Art 43 conformity assessment", digitalOmnibusPack.deltas.some((d) => /Art\. 43/.test(d.article)));
test("Omnibus superseded proposal mechanism tagged commission_proposal", digitalOmnibusPack.highRiskTimeline.supersededProposalMechanismSourceStatus === "commission_proposal");
test("Omnibus application dates tagged enacted_oj", digitalOmnibusPack.highRiskTimeline.applicationDatesSourceStatus === "enacted_oj");

// Art. 113(3)(c) as enacted is TWO PLAIN DATES. The Commission proposal's trigger
// (application 6/12 months after a decision on the availability of support
// measures) was deleted before adoption. The server described 2027-12-02 as a
// beatable backstop until 1.4.3; these guard that it never says so again.
test("Omnibus mechanism field states it is superseded and not law", /SUPERSEDED, NOT LAW/.test(digitalOmnibusPack.highRiskTimeline.supersededProposalMechanism));
test("Omnibus timeline note calls the dates unconditional", /UNCONDITIONAL/.test(digitalOmnibusPack.highRiskTimeline.note));
test("Omnibus timeline note quotes the enacted Art. 113(3)(c)", /with the exception of Article 6\(5\), shall apply from/.test(digitalOmnibusPack.highRiskTimeline.note));
test("Omnibus Art. 113 delta records the trigger as deleted", digitalOmnibusPack.deltas.some((d) => /Art\. 113/.test(d.article) && /DELETED/.test(d.note ?? "")));

// Tool guardrail: default keeps current OJ law; pending specifics withheld from the WHOLE payload (not just milestones)
{
  const r = await callTool("euaiact_check_deadlines", {});
  const s = structured(r);
  const full = JSON.stringify(s);
  test("deadlines default: pending_omnibus is null", s.pending_omnibus === null);
  test("deadlines default: operative Annex III date 2027-12-02 present", s.milestones.some((m) => m.date === "2027-12-02"));
  test("deadlines default: operative Annex I date 2028-08-02 present", s.milestones.some((m) => m.date === "2028-08-02"));
  test("deadlines default: the 2026-08-02 milestone is scoped to what was NOT deferred", s.milestones.some((m) => m.date === "2026-08-02" && /not deferred/i.test(m.name)) && !s.milestones.some((m) => m.date === "2026-08-02" && /Annex III/i.test(m.name)));
  test("deadlines default: retired 2 Feb 2027 date never appears", !/2027-02-02|2 Feb 2027/.test(full));
  test("deadlines default: the enacted Art. 5 prohibitions ARE surfaced (they are operative law)", /CSAM|intimate/i.test(full) && s.milestones.some((m) => m.date === "2026-12-02"));
  // Regression guard for the 1.4.2 defect: the Annex III milestone told callers
  // 2027-12-02 was a backstop that obligations could beat by six months after a
  // Commission support-measures decision. That trigger is not in the enacted act.
  test("deadlines default: no milestone calls a high-risk date a backstop", !s.milestones.some((m) => /backstop/i.test(m.description) && !/not a backstop/i.test(m.description)));
  test("deadlines default: no milestone offers an earlier support-measures trigger", !/(bite|apply|start).{0,60}earlier.{0,120}(Commission|support measure)/is.test(full));
  test("deadlines default: Annex III milestone states the date is fixed", s.milestones.some((m) => m.date === "2027-12-02" && /fixed date, not a backstop/i.test(m.description)));
  // Hardened guard: the deleted months-after-Commission-decision mechanism must
  // not survive ANYWHERE in the serialized payload (description, keyObligations,
  // name, articles), in any numeric spelling. "6 months after entry into force"
  // stays legal because the window requires Commission/support-measures context.
  const monthsTrigger = /(six|6|twelve|12)\s+months\s+after[^.]{0,120}(Commission|support measure)/is;
  const negated = /deleted before adoption|was deleted|not a backstop/i;
  // Descriptions may mention the deleted trigger ONLY while negating it in the
  // same breath; every other field must be entirely free of it, so the 1.4.3
  // guard bypass (mechanism reinstated in keyObligations) can never pass again.
  test("deadlines default: months-after trigger in a description only when negated", s.milestones.every((m) => !monthsTrigger.test(m.description) || negated.test(m.description)));
  test("deadlines default: months-after trigger absent from name/obligations/articles", !s.milestones.some((m) => monthsTrigger.test(JSON.stringify([m.name, m.key_obligations ?? m.keyObligations, m.articles]))));
}

// Tool guardrail: pending mode surfaces the flagged pack; current-law milestones unchanged
{
  const r = await callTool("euaiact_check_deadlines", { include_pending_omnibus: true });
  const s = structured(r);
  const full = JSON.stringify(s);
  test("deadlines pending: pending_omnibus populated", s.pending_omnibus !== null);
  test("deadlines pending: pack marked enacted", s.pending_omnibus.enacted === true);
  test("deadlines pending: application date Annex III is 2027-12-02", s.pending_omnibus.high_risk_timeline.application_dates.annex_iii_art_6_2 === "2027-12-02");
  test("deadlines pending: superseded mechanism tagged commission_proposal", s.pending_omnibus.high_risk_timeline.superseded_proposal_mechanism_source_status === "commission_proposal");
  test("deadlines pending: application dates tagged enacted_oj", s.pending_omnibus.high_risk_timeline.application_dates_source_status === "enacted_oj");
  test("deadlines pending: coverage_note marks deltas non-exhaustive", /NON-EXHAUSTIVE/i.test(s.pending_omnibus.coverage_note));
  test("deadlines pending: opt-in DOES expose the deferred dates", /2027-12-02/.test(full) && /2028-08-02/.test(full));
  test("deadlines pending: current-law milestone 2026-08-02 still present", s.milestones.some((m) => m.date === "2026-08-02"));
  test("deadlines pending: pack status is enacted_oj", s.pending_omnibus.status === "enacted_oj");
  test("deadlines pending: enactment record served with the real CELEX/OJ/EIF", s.pending_omnibus.enactment.celex === "32026R1744" && s.pending_omnibus.enactment.oj_publication_date === "2026-07-24" && s.pending_omnibus.enactment.entry_into_force === "2026-07-27");
  test("deadlines pending: enactment record carries EP and Council adoption dates", s.pending_omnibus.enactment.ep_endorsement === "2026-06-16" && s.pending_omnibus.enactment.council_adoption === "2026-06-29");
  // The deleted trigger may appear in the opt-in pack, but only as superseded
  // proposal text: never in the enacted key-changes list as a live alternative.
  test("deadlines pending: enacted key_changes carry no live support-measures trigger", !s.digital_omnibus.key_changes.some((k) => /(or|whichever).{0,40}(6|12|six|twelve) months after/i.test(k)));
  test("deadlines pending: enacted key_changes call the Annex III date unconditional", s.digital_omnibus.key_changes.some((k) => /Annex III/.test(k) && /unconditional/i.test(k)));
}

// ─── OMNIBUS ENACTMENT FLIP (M2/M3, prep 2026-07-07) ───────────────────────
console.log("\n🔀 OMNIBUS ENACTMENT FLIP (M2/M3)");

// New source-status tier between political_agreement and enacted_oj
test(
  "adopted_pending_publication tier has the agreed label",
  SOURCE_STATUS_LABELS.adopted_pending_publication === "Adopted by the co-legislators, pending Official Journal publication",
);
test("isEnacted(adopted_pending_publication) is false", isEnacted("adopted_pending_publication") === false);
test("isEnacted(enacted_oj) is true", isEnacted("enacted_oj") === true);

// (a) ENACTED: the committed default carries the real OJ identifiers
test(
  "enacted: committed enactment record holds the real OJ values",
  omnibusEnactment.status === "enacted_oj" &&
    omnibusEnactment.celex === "32026R1744" &&
    omnibusEnactment.ojPublicationDate === "2026-07-24" &&
    omnibusEnactment.entryIntoForce === "2026-07-27",
);
test(
  "enacted: record carries EP 2026-06-16 and Council 2026-06-29",
  omnibusEnactment.epEndorsement === "2026-06-16" && omnibusEnactment.councilAdoption === "2026-06-29",
);
test("enacted: isOmnibusEnacted() is true by default", isOmnibusEnacted() === true);
test("enacted: resolveOmnibusStatus() is enacted_oj", resolveOmnibusStatus() === "enacted_oj");
test("enacted: pack.enacted is true", digitalOmnibusPack.enacted === true);
test("enacted: pack.status is enacted_oj", digitalOmnibusPack.status === "enacted_oj");
test("enacted: operative Annex III date is the deferred 2027-12-02", getOperativeHighRiskDates().annexIiiHighRisk === "2027-12-02");
test("enacted: operative Annex I date is the deferred 2028-08-02", getOperativeHighRiskDates().annexIHighRisk === "2028-08-02");
test(
  "enacted: operative milestones carry the deferred Annex III and Annex I dates",
  getOperativeMilestones().some((m) => m.date === "2027-12-02") &&
    getOperativeMilestones().some((m) => m.date === "2028-08-02"),
);
{
  const r = await callTool("euaiact_check_deadlines", {});
  const s = structured(r);
  test(
    "enacted: default tool output no longer presents Annex III high-risk at 2026-08-02",
    !s.milestones.some((m) => m.date === "2026-08-02" && /Annex III/.test(m.name)),
  );
  test("enacted: default tool output carries the deferred dates", /2027-12-02/.test(JSON.stringify(s)) && /2028-08-02/.test(JSON.stringify(s)));
  test("enacted: default digital_omnibus status resolves enacted_oj", s.digital_omnibus.status === "enacted_oj");
  test("enacted: default digital_omnibus impact states it is enacted", /^Enacted/i.test(s.digital_omnibus.impact_on_ai_act));
}

// Fail-closed guard: a half-flipped record must NOT read as enacted
{
  const halfFlipped = { ...omnibusEnactment, status: "enacted_oj", celex: null, ojPublicationDate: null, entryIntoForce: null };
  test("fail-closed: status=enacted_oj without CELEX/OJ/EIF is NOT enacted", isOmnibusEnacted(halfFlipped) === false);
  test("fail-closed: half-flipped record resolves back to adopted_pending_publication", resolveOmnibusStatus(halfFlipped) === "adopted_pending_publication");
  test("fail-closed: half-flipped record keeps current-law Annex III date", getOperativeHighRiskDates(halfFlipped).annexIiiHighRisk === "2026-08-02");

  // Blank-string / whitespace OJ values must also fail closed (not just null)
  const blankFilled = { ...omnibusEnactment, status: "enacted_oj", celex: "", ojPublicationDate: "", entryIntoForce: "" };
  test("fail-closed: status=enacted_oj with BLANK-string OJ values is NOT enacted", isOmnibusEnacted(blankFilled) === false);
  test("fail-closed: blank-string record keeps current-law Annex III date", getOperativeHighRiskDates(blankFilled).annexIiiHighRisk === "2026-08-02");
  const whitespaceFilled = { ...omnibusEnactment, status: "enacted_oj", celex: "  ", ojPublicationDate: " ", entryIntoForce: "\t" };
  test("fail-closed: whitespace-only OJ values are NOT enacted", isOmnibusEnacted(whitespaceFilled) === false);
}

// (b) FLIP: a filled copy of the record proves the one-edit flip.
// All three values are FAKE test fixtures; the real ones exist only on OJ day.
{
  const fakeEnacted = {
    ...omnibusEnactment,
    status: "enacted_oj",
    celex: "32026R9999",            // FAKE CELEX, test-only
    ojPublicationDate: "2026-07-20", // FAKE OJ date, test-only
    entryIntoForce: "2026-07-23",    // FAKE entry into force (3rd day after), test-only
  };
  test("flip: isOmnibusEnacted(filled record) is true", isOmnibusEnacted(fakeEnacted) === true);
  test("flip: status resolves enacted_oj", resolveOmnibusStatus(fakeEnacted) === "enacted_oj");

  const dates = getOperativeHighRiskDates(fakeEnacted);
  test("flip: operative Annex III date becomes 2027-12-02", dates.annexIiiHighRisk === "2027-12-02");
  test("flip: operative Annex I date becomes 2028-08-02", dates.annexIHighRisk === "2028-08-02");
  test("flip: Art. 50 transparency stays 2026-08-02 (NOT deferred)", dates.art50Transparency === "2026-08-02");
  test("flip: GPAI enforcement/fines stay 2026-08-02 (NOT deferred)", dates.gpaiEnforcementFines === "2026-08-02");
  test("flip: legacy GPAI compliance stays 2027-08-02 (NOT deferred)", dates.legacyGpaiCompliance === "2027-08-02");

  const ms = getMilestonesWithDaysRemaining(fakeEnacted);
  test("flip: milestones list Annex III high-risk at 2027-12-02", ms.some((m) => m.date === "2027-12-02" && /Annex III/.test(m.name)));
  test("flip: milestones list Annex I at 2028-08-02", ms.some((m) => m.date === "2028-08-02" && /Annex I/.test(m.name)));
  test(
    "flip: 2026-08-02 milestone survives, re-scoped to Art. 50 + GPAI enforcement",
    ms.some((m) => m.date === "2026-08-02" && /Art\. 50/.test(m.name) && /GPAI/.test(m.name)),
  );
  test("flip: no milestone still presents Annex III high-risk at 2026-08-02", !ms.some((m) => m.date === "2026-08-02" && /Annex III/.test(m.name)));
  test("flip: legacy GPAI keeps its own 2027-08-02 milestone", ms.some((m) => m.date === "2027-08-02" && /Legacy GPAI/i.test(m.name)));
  test("flip: milestones stay date-sorted", ms.every((m, i, a) => i === 0 || a[i - 1].date <= m.date));
  test("flip: milestone descriptions cite the (fake) CELEX and OJ date", ms.some((m) => m.description.includes("32026R9999") && m.description.includes("2026-07-20")));

  const summary = buildOmnibusSummary(fakeEnacted);
  test("flip: derived summary status is enacted_oj", summary.status === "enacted_oj");
  test("flip: derived summary impact reads as enacted/in force", /in force since 2026-07-23/.test(summary.impactOnAIAct));

  const reg = getEffectiveSourceRegistry(fakeEnacted);
  test("flip: effective source registry gains an enacted_oj omnibus record with the (fake) CELEX", reg.omnibus_oj?.status === "enacted_oj" && reg.omnibus_oj?.celex === "32026R9999");
  test("flip: static source registry itself is untouched by the derived view", !("omnibus_oj" in sourceRegistry));
}

// The flip simulation must not have mutated the committed default
test(
  "post-flip-sim: committed record is unchanged by simulation (pure functions, no mutation)",
  omnibusEnactment.celex === "32026R1744" && omnibusEnactment.status === "enacted_oj" && isOmnibusEnacted() === true,
);

// Reverse simulation: a pending copy must still resolve to pre-OJ behaviour, so the
// machinery keeps working in both directions after the flip.
{
  const pendingCopy = {
    ...omnibusEnactment,
    status: "adopted_pending_publication",
    celex: null,
    ojPublicationDate: null,
    entryIntoForce: null,
  };
  test("reverse-sim: a pending copy is not enacted", isOmnibusEnacted(pendingCopy) === false);
  test("reverse-sim: a pending copy keeps the current-law Annex III date", getOperativeHighRiskDates(pendingCopy).annexIiiHighRisk === "2026-08-02");
  test("reverse-sim: a pending copy keeps the current-law Annex I date", getOperativeHighRiskDates(pendingCopy).annexIHighRisk === "2027-08-02");
}

// ─── ART. 5 PROHIBITION KEYWORD SENSITIVITY ────────────────────────────────
// The new Art. 5(1)(ba)/(bb) prohibitions must fire on how people actually
// describe these systems, without catching ordinary Art. 50 generative tools.
// Bare single words match loosely by stem: "deepfake" once reclassified a
// marketing text generator as prohibited, and a bare "nude" would catch a
// colour-palette tool. Hence phrases.
console.log("\n🚫 ART. 5 PROHIBITION KEYWORDS");
{
  const ba = prohibitedPractices.find((p) => p.id === "art5-1ba");
  const bb = prohibitedPractices.find((p) => p.id === "art5-1bb");
  const shouldMatch = [
    ["nudification app", ba],
    ["an app that undresses people in photos", ba],
    ["generates a realistic nude image of a real person", ba],
    ["creates naked photos of someone without their consent", ba],
    ["creates sexually explicit images of identifiable people", ba],
    ["generates child sexual abuse material", bb],
  ];
  for (const [text, practice] of shouldMatch) {
    test(
      `Art. 5 keywords match: "${text.slice(0, 44)}"`,
      scoreKeywordMatch(text, practice.keywords).strongCount > 0,
    );
  }
  const mustNotMatch = [
    "deepfake text generator for marketing copy",
    "nude colour palette generator for interior design",
    "chatbot that answers customer questions",
  ];
  for (const text of mustNotMatch) {
    test(
      `Art. 5 keywords do NOT match: "${text.slice(0, 44)}"`,
      scoreKeywordMatch(text, ba.keywords).strongCount === 0 &&
        scoreKeywordMatch(text, bb.keywords).strongCount === 0,
    );
  }
}

// ─── CROSS-TOOL CONSISTENCY ─────────────────────────────────────────────────
// Regression guard: the obligations tool and the deadlines tool must never state
// different application dates for the same system. Before this guard existed the
// obligations data carried a hardcoded 2026-08-02 that survived the Omnibus flip.
console.log("\n🔗 CROSS-TOOL CONSISTENCY");
{
  const operative = getOperativeHighRiskDates();
  for (const [label, source, expected] of [
    ["annex_iii", "annex_iii", operative.annexIiiHighRisk],
    ["annex_i", "annex_i", operative.annexIHighRisk],
  ]) {
    const r = await callTool("euaiact_get_obligations", {
      role: "provider",
      risk_level: "high-risk",
      high_risk_source: source,
    });
    const obls = structured(r).obligations;
    const chapterIii = obls.filter((o) => o.article !== "Art. 4");
    test(
      `cross-tool: provider ${label} obligations all carry the operative date ${expected}`,
      chapterIii.length > 0 && chapterIii.every((o) => o.deadline === expected),
    );
    test(
      `cross-tool: provider ${label} obligations never carry the superseded 2026-08-02`,
      !chapterIii.some((o) => o.deadline === "2026-08-02"),
    );
  }
  const lim = await callTool("euaiact_get_obligations", { role: "provider", risk_level: "limited" });
  test(
    "cross-tool: limited-risk Art. 50 obligations stay on 2026-08-02 (not deferred)",
    structured(lim).obligations.filter((o) => o.article !== "Art. 4").every((o) => o.deadline === "2026-08-02"),
  );
}

// ─── OBLIGATIONS ────────────────────────────────────────────────────────────
console.log("\n📜 OBLIGATIONS");
test("Provider high-risk: 13 obligations", providerHighRiskObligations.length === 13);
test("Deployer high-risk: 9 obligations", deployerHighRiskObligations.length === 9);
test("Limited risk transparency: 4 obligations", limitedRiskTransparencyObligations.length === 4);
test("Provider limited-risk transparency: 2 obligations", providerLimitedRiskTransparencyObligations.length === 2);
test("Deployer limited-risk transparency: 2 obligations", deployerLimitedRiskTransparencyObligations.length === 2);
test("GPAI obligations: 8 obligations", providerGPAIObligations.length === 8);
test("Universal obligations: 1 (AI literacy)", universalObligations.length === 1);
{
  const r = await callTool("euaiact_get_obligations", { role: "provider", risk_level: "high-risk" });
  test("obligations tool has no `disclaimer` field", !("disclaimer" in structured(r)));
  test("obligations tool has no `source` field", !("source" in structured(r)));
  test("obligations tool includes lexbeam_url", typeof structured(r).lexbeam_url === "string");
  test("provider high-risk Art. 49 obligation is conditional", /Annex III/.test(structured(r).obligations.find((o) => o.article === "Art. 49")?.details ?? ""));
}
{
  const r = await callTool("euaiact_get_obligations", { role: "provider", risk_level: "high-risk", high_risk_source: "annex_i" });
  test("provider Annex I high-risk obligations omit Art. 49 EU database registration", !structured(r).obligations.some((o) => o.article === "Art. 49"));
}
{
  const r = await callTool("euaiact_get_obligations", { role: "provider", risk_level: "high-risk", high_risk_source: "annex_iii", annex_iii_point: 2 });
  test("provider Annex III point 2 obligations omit Art. 49 EU database registration", !structured(r).obligations.some((o) => o.article === "Art. 49"));
}
{
  const r = await callTool("euaiact_get_obligations", { role: "deployer", risk_level: "limited", filter_keyword: "emotion" });
  const p = structured(r);
  test("limited-risk deployer emotion obligation uses deployer actor", p.obligations.length === 1 && /Deployers/.test(p.obligations[0].details));
  test("limited-risk penalties use Art. 99(4)", p.penalties.basis === "Art. 99(4)");
}
{
  const r = await callTool("euaiact_get_obligations", { role: "provider", risk_level: "limited", filter_keyword: "machine-readable" });
  const p = structured(r);
  test("limited-risk provider marking obligation is Art. 50(2)", p.obligations.length === 1 && p.obligations[0].article === "Art. 50(2)");
}
{
  const r = await callTool("euaiact_get_obligations", { role: "deployer", risk_level: "gpai" });
  const p = structured(r);
  test("GPAI deployer query does not return provider obligations", p.obligations.length === 0);
  test("GPAI deployer penalty basis explains provider-only Art. 101", /providers/i.test(p.penalties.basis));
}
{
  const r = await callTool("euaiact_get_obligations", { role: "provider", risk_level: "gpai", gpai_model_placed_on_market_before_2025_08_02: true });
  const p = structured(r);
  test("GPAI legacy model obligations use Art. 111(3) 2027 deadline", p.obligations.length > 0 && p.obligations.every((o) => o.deadline === "2027-08-02"));
}

// ─── PENALTIES ──────────────────────────────────────────────────────────────
console.log("\n💰 PENALTIES");
const p1 = calculateMaxFine("prohibited", 1_000_000_000, false);
test("EUR 1B prohibited: 7% = EUR 70M (higher of two)", p1.applicableFine === 70_000_000);
const p2 = calculateMaxFine("high_risk", 100_000_000, false);
test("EUR 100M high-risk: cap 15M", p2.applicableFine === 15_000_000);
const p3 = calculateMaxFine("prohibited", 10_000_000, true);
test("EUR 10M SME prohibited: 7% = 700K (lower of two)", p3.applicableFine === 700_000);
const p5 = calculateMaxFine("false_info", 2_000_000_000, false);
test("EUR 2B false_info: 1% = 20M (higher)", p5.applicableFine === 20_000_000);
test("Prohibited tier = Art. 99(3)", getPenaltyTier("prohibited").article === "Art. 99(3)");
test("GPAI penalty tier = Art. 101", getPenaltyTier("gpai").article === "Art. 101");
{
  const p = calculateMaxFine("gpai", 1_000_000_000, true);
  test("GPAI penalties do not apply Art. 99(6) SME lower cap", p.applicableFine === 30_000_000);
}

// Tool-level: SME description contradiction fix
{
  const r = await callTool("euaiact_calculate_penalty", {
    violation_type: "prohibited",
    annual_turnover_eur: 50_000_000,
    is_sme: true,
  });
  const payload = structured(r);
  test(
    "SME response: tier_details.description says 'lower'",
    /lower/i.test(payload.tier_details.description),
  );
  test(
    "SME response: tier_details.description does NOT still say 'whichever is higher'",
    !/whichever is higher/i.test(payload.tier_details.description),
  );
  test(
    "SME response: comparative block present",
    typeof payload.comparative?.sme_applicable_fine_eur === "number",
  );
  test(
    "SME response: reduction_eur correctly computed",
    payload.comparative.reduction_eur ===
      payload.comparative.non_sme_applicable_fine_eur - payload.comparative.sme_applicable_fine_eur,
  );
  test(
    "SME response has no `disclaimer` field (branding slim)",
    !("disclaimer" in payload),
  );
}
{
  const r = await callTool("euaiact_calculate_penalty", {
    violation_type: "gpai",
    annual_turnover_eur: 1_000_000_000,
    is_sme: true,
  });
  const payload = structured(r);
  test("GPAI penalty tool uses Art. 101", payload.tier_details.article === "Art. 101");
  test("GPAI SME response still uses higher amount", payload.max_fine.applicable_fine_eur === 30_000_000);
  test("GPAI SME response explains no Art. 99(6) lower cap", /no Art\. 99\(6\)/i.test(payload.max_fine.explanation));
}

// ─── FAQ ────────────────────────────────────────────────────────────────────
console.log("\n❓ FAQ");
test("24 FAQ entries after v1.1.0 additions", faqDatabase.length === 24);
test(
  "faq-21-gpai-flops-threshold present",
  faqDatabase.some((f) => f.id === "faq-21-gpai-flops-threshold"),
);
test(
  "faq-22-fria-credit-scoring present",
  faqDatabase.some((f) => f.id === "faq-22-fria-credit-scoring"),
);
test(
  "faq-23-chatbot-disclosure present",
  faqDatabase.some((f) => f.id === "faq-23-chatbot-disclosure"),
);
test(
  "faq-24-minimal-risk-examples present",
  faqDatabase.some((f) => f.id === "faq-24-minimal-risk-examples"),
);
{
  const r = await callTool("euaiact_answer_question", { question: "what is the FLOPs threshold for GPAI systemic risk" });
  test("answer_question: FLOPs question → faq-21", /10\^25|1e25|10\*\*25|1\.e\+25/i.test(structured(r).answer));
  test("answer_question response has no `source` field", !("source" in structured(r)));
}
{
  const r = await callTool("euaiact_answer_question", { question: "What are transparency obligations for chatbots and generated content under Article 50?" });
  test("FAQ transparency answer maps machine-readable marking to Art. 50(2)", /Art\. 50\(2\).*machine-readable|machine-readable.*Art\. 50\(2\)/s.test(structured(r).answer));
  test("FAQ transparency answer does not cite Art. 50(5) for marking", !/50\(5\).*machine-readable|machine-readable.*50\(5\)/s.test(structured(r).answer));
}
{
  const ids = transparencyTriggers.map((t) => t.id);
  test("Art. 50 transparency trigger ids are unique", new Set(ids).size === ids.length);
}

// ─── NEW TOOLS (v1.1.0) ────────────────────────────────────────────────────
console.log("\n🆕 NEW TOOLS");

// get_article
test("articles corpus has Art. 5", articles.some((a) => a.number === "5"));
test("findArticle('5') returns Art. 5", findArticle("5")?.number === "5");
test("findArticle('Art. 99') returns Art. 99", findArticle("Art. 99")?.number === "99");
test("findArticle('12') separates technical logging from retention duties", /Retention of automatically generated logs is dealt with separately/.test(findArticle("12")?.summary ?? ""));
test("findArticle('99') does not place GPAI fines under Art. 99(4)", !/GPAI obligations/.test(findArticle("99")?.summary ?? "") && /Art\. 101/.test(findArticle("99")?.summary ?? ""));
{
  const r = await callTool("euaiact_get_article", { article: "5" });
  const p = structured(r);
  test("get_article(5): available=true", p.available === true);
  // 1.4.4: links point at the consolidated version, so following the citation
  // shows the amended law rather than the superseded original text.
  test("get_article(5): links the consolidated text", p.eurlex_url.includes("CELEX:02024R1689-20260727"));
  test("get_article(5): title mentions prohibited", /prohibit/i.test(p.article.title));
}
{
  const r = await callTool("euaiact_get_article", { article: "201" });
  test("get_article(201): unavailable with eurlex fallback", structured(r).available === false && structured(r).eurlex_url.length > 0);
}

// gpai_systemic
{
  const r = await callTool("euaiact_check_gpai_systemic_risk", { training_flops: 2e25 });
  const p = structured(r);
  test("gpai 2e25: crosses threshold", p.crosses_flops_threshold === true);
  test("gpai 2e25: systemic designation", p.systemic_risk_designation === "threshold_met");
  test("gpai 2e25: is systemic true", p.is_gpai_with_systemic_risk === true);
  test("gpai 2e25: Art. 55 obligations returned", p.systemic_risk_obligations_art_55.length > 0);
  test("gpai 2e25: Art. 53 baseline present", p.baseline_obligations_art_53.length > 0);
  test("gpai 2e25: notification duty mentions 2 weeks", /two weeks/i.test(p.notification_duty));
}
{
  const r = await callTool("euaiact_check_gpai_systemic_risk", { training_flops: 1e23 });
  const p = structured(r);
  test("gpai 1e23: below threshold", p.crosses_flops_threshold === false);
  test("gpai 1e23: no Art. 55 obligations", p.systemic_risk_obligations_art_55.length === 0);
}
{
  const r = await callTool("euaiact_check_gpai_systemic_risk", { commission_designated: true });
  test("gpai commission_designated: systemic true", structured(r).is_gpai_with_systemic_risk === true);
}

// art6_exception
{
  const r = await callTool("euaiact_assess_art6_3_exception", {
    annex_iii_number: 4,
    performs_profiling: true,
    narrow_procedural_task: true,
  });
  const p = structured(r);
  test("art6: profiling blocks exception", p.exception_available === false && p.profiling_blocks_exception === true);
  test("art6: reason mentions profiling", /profiling/i.test(p.reasoning));
}
{
  const r = await callTool("euaiact_assess_art6_3_exception", {
    performs_profiling: false,
    no_significant_risk_to_health_safety_fundamental_rights: true,
    narrow_procedural_task: true,
    documented_assessment: true,
  });
  const p = structured(r);
  test("art6: narrow procedural + no profiling + documented → available", p.exception_available === true);
  test("art6: Art. 49(2) registration duty mentioned", /49\(2\)/.test(p.registration_duty));
}
{
  const r = await callTool("euaiact_assess_art6_3_exception", {
    performs_profiling: false,
    narrow_procedural_task: true,
    documented_assessment: true,
  });
  const p = structured(r);
  test("art6: narrow task without no-significant-risk gate → unavailable", p.exception_available === false);
  test("art6: no-significant-risk gate absence is explained", /significant risk/i.test(p.reasoning));
}
{
  const r = await callTool("euaiact_assess_art6_3_exception", {
    performs_profiling: false,
  });
  test("art6: no conditions asserted → unavailable", structured(r).exception_available === false);
}

// annex_iv checklist
test("annexIVItems has 9 items", annexIVItems.length === 9);
{
  const r = await callTool("euaiact_annex_iv_checklist", {});
  const p = structured(r);
  test("annex_iv default: 9 items", p.total_items === 9);
  test("annex_iv default: no markdown field", p.checklist_markdown === undefined);
}
{
  const r = await callTool("euaiact_annex_iv_checklist", { format: "checklist", sme_simplified: true });
  const p = structured(r);
  test("annex_iv checklist format: markdown present", typeof p.checklist_markdown === "string" && p.checklist_markdown.includes("# Annex IV"));
  test("annex_iv checklist format: SME note present", typeof p.sme_note === "string" && p.sme_note.includes("simplified"));
}

// ─── BRANDING / INSTRUCTIONS ───────────────────────────────────────────────
console.log("\n🏷️ BRANDING + INSTRUCTIONS");
test("BRANDING.source still mentions Lexbeam", BRANDING.source.includes("Lexbeam"));
test("SERVER_INSTRUCTIONS contains disclaimer", /not legal advice/i.test(SERVER_INSTRUCTIONS));
test("SERVER_INSTRUCTIONS mentions Lexbeam attribution", /Lexbeam/.test(SERVER_INSTRUCTIONS));
test("SERVER_INSTRUCTIONS references get_article tool", /get_article/.test(SERVER_INSTRUCTIONS));

// ─── SERVER WIRING ─────────────────────────────────────────────────────────
console.log("\n🔌 SERVER WIRING");
{
  const srv = createServer();
  test("createServer returns an McpServer instance", typeof srv === "object");
  test("assessment is registered as tool 10 after the nine atomic tools",
    Object.keys(srv._registeredTools).join(",") === [
      "euaiact_classify_system",
      "euaiact_check_deadlines",
      "euaiact_get_obligations",
      "euaiact_answer_question",
      "euaiact_calculate_penalty",
      "euaiact_get_article",
      "euaiact_check_gpai_systemic_risk",
      "euaiact_assess_art6_3_exception",
      "euaiact_annex_iv_checklist",
      "euaiact_assess_system",
    ].join(","));
}

// ─── 1.4.4 REGRESSIONS (batch 2: classifier, GPAI, FAQ, penalties, obligations)
console.log("\n🩹 1.4.4 REGRESSIONS");
{
  // Classifier: "minimal" is reachable, and a complete negative signal set earns it.
  const ALL_FALSE = {
    domain: "other", uses_biometrics: false, biometric_sole_purpose_verification: false,
    biometric_remote_identification: false, biometric_realtime: false, biometric_law_enforcement: false,
    biometric_publicly_accessible_space: false, is_safety_component_of_regulated_product: false,
    requires_third_party_conformity_assessment: false, affects_fundamental_rights: false,
    targets_children_or_vulnerable: false, generates_synthetic_content: false,
    interacts_with_natural_persons: false, performs_emotion_recognition_workplace_or_school: false,
    performs_social_scoring: false, social_scoring_unrelated_context: false,
    social_scoring_unjustified_or_disproportionate: false,
    performs_social_scoring_by_public_authority: false,
  };
  const rMin = structured(await callTool("euaiact_classify_system", { description: "email spam filter", signals: ALL_FALSE }));
  test("classify: complete negative signal set returns minimal", rMin.risk_classification === "minimal");
  test("classify: complete negative signal set is high confidence", rMin.confidence === "high");
  test("classify: minimal cites Art. 95 codes of conduct", rMin.relevant_articles.includes("Art. 95"));
  test("classify: minimal caveat does not claim limited information", !/limited information/i.test(rMin.caveat ?? ""));

  const rTwo = structured(await callTool("euaiact_classify_system", { signals: { uses_biometrics: false, performs_social_scoring: false } }));
  test("classify: two negatives alone are NOT minimal", rTwo.risk_classification !== "minimal");
  test("classify: signals-present empty-input caveat is honest", !/No description or signals provided/.test(rTwo.caveat ?? ""));

  // e-gate canonical case: 1:1 verification excluded from Annex III(1)(a)
  const rGateSig = structured(await callTool("euaiact_classify_system", { signals: { uses_biometrics: true, biometric_sole_purpose_verification: true } }));
  // Cross-model round 3: the exclusion answers ONE question and must not
  // overclaim an overall "minimal"; it states not-high-risk-under-III(1)(a).
  test("classify: verification exclusion is scoped, not minimal", rGateSig.risk_classification === "insufficient_information" && rGateSig.relevant_articles.includes("Annex III(1)(a)") && /Not high-risk under Annex III\(1\)\(a\)/.test(rGateSig.obligations_summary));
  const rGateTxt = structured(await callTool("euaiact_classify_system", { description: "airport e-gate that matches a traveller face against their passport photo to verify the claimed identity", signals: { uses_biometrics: true } }));
  test("classify: e-gate description alone reaches the exclusion", /Not high-risk under Annex III\(1\)\(a\)/.test(rGateTxt.obligations_summary) && rGateTxt.risk_classification !== "high-risk");
  const rWatch = structured(await callTool("euaiact_classify_system", { description: "camera system that scans faces in the terminal to identify persons on a watchlist", signals: { uses_biometrics: true } }));
  test("classify: watchlist identification is NOT excluded as verification", rWatch.risk_classification !== "minimal");

  // Cross-model round 3 blockers, pinned as regressions:
  const P8 = { uses_biometrics: false, performs_social_scoring: false, generates_synthetic_content: false, interacts_with_natural_persons: false, is_safety_component_of_regulated_product: false, affects_fundamental_rights: false, targets_children_or_vulnerable: false, performs_emotion_recognition_workplace_or_school: false };
  const rB1 = structured(await callTool("euaiact_classify_system", { description: "AI system that ranks and shortlists job applicants for recruitment", signals: P8 }));
  test("blocker: partial negative signals cannot override risky text (recruitment)", rB1.risk_classification === "high-risk" && rB1.basis === "text");
  const rB2 = structured(await callTool("euaiact_classify_system", { description: "system deciding eligibility for essential public assistance benefits", signals: P8 }));
  test("blocker: partial negative signals cannot override risky text (benefits)", rB2.risk_classification === "high-risk");
  const COMPLETE_ROUTE_NEGATIVES = {
    domain: "other", uses_biometrics: false, biometric_sole_purpose_verification: false,
    biometric_remote_identification: false, biometric_realtime: false,
    biometric_law_enforcement: false, biometric_publicly_accessible_space: false,
    is_safety_component_of_regulated_product: false,
    requires_third_party_conformity_assessment: false,
    generates_synthetic_content: false, interacts_with_natural_persons: false,
    performs_emotion_recognition_workplace_or_school: false, performs_social_scoring: false,
    social_scoring_unrelated_context: false,
    social_scoring_unjustified_or_disproportionate: false,
  };
  const rStructuredDominance = structured(await callTool("euaiact_classify_system", {
    description: "Format job application documents into a consistent layout without ranking, filtering, scoring, or evaluating candidates",
    use_case: "Document formatting for job application files without candidate evaluation",
    signals: COMPLETE_ROUTE_NEGATIVES,
  }));
  test("classify: complete structured negatives dominate recruitment vocabulary",
    rStructuredDominance.risk_classification === "minimal" &&
    rStructuredDominance.basis === "signals");
  const rB3 = structured(await callTool("euaiact_classify_system", { description: "scans faces in the terminal to identify persons on a watchlist", signals: { uses_biometrics: true, biometric_sole_purpose_verification: true } }));
  test("blocker: verification signal contradicted by identification text", rB3.risk_classification === "insufficient_information" && /CONTRADICTED|contradiction|mutually exclusive/i.test(JSON.stringify(rB3)));

  // Citation hygiene: no duplicates in any classify output
  const rCv = structured(await callTool("euaiact_classify_system", { description: "AI system that screens and ranks CVs for recruitment shortlisting", signals: { domain: "employment" } }));
  test("classify: relevant_articles carries no duplicates", new Set(rCv.relevant_articles).size === rCv.relevant_articles.length);
  test("classify: CV screening still high-risk high confidence", rCv.risk_classification === "high-risk" && rCv.confidence === "high");

  // GPAI: abstention instead of a confident false negative
  const gNone = structured(await callTool("euaiact_check_gpai_systemic_risk", {}));
  test("gpai: no inputs -> undetermined, not a negative", gNone.systemic_risk_designation === "undetermined" && gNone.is_gpai_with_systemic_risk === null && gNone.crosses_flops_threshold === null);
  test("gpai: undetermined says do-not-treat-as-negative", /not.*negative finding/i.test(gNone.notification_duty));
  const gOver = structured(await callTool("euaiact_check_gpai_systemic_risk", { training_flops: 3e25 }));
  test("gpai: 3e25 crosses", gOver.is_gpai_with_systemic_risk === true);
  const gAt = structured(await callTool("euaiact_check_gpai_systemic_risk", { training_flops: 1e25 }));
  test("gpai: adjudicated boundary treats exactly 1e25 as threshold met", gAt.crosses_flops_threshold === true && gAt.is_gpai_with_systemic_risk === true);
  const gDesig = structured(await callTool("euaiact_check_gpai_systemic_risk", { commission_designated: true }));
  test("gpai: designation alone establishes systemic risk", gDesig.is_gpai_with_systemic_risk === true && gDesig.systemic_risk_designation === "commission_designated");

  // FAQ: verbatim echo, visible match, correct routing, abstention
  const fDl = structured(await callTool("euaiact_answer_question", { question: "What are the deadlines under the EU AI Act?" }));
  test("faq: echoes the caller's question verbatim", fDl.question === "What are the deadlines under the EU AI Act?");
  test("faq: names the matched entry separately", typeof fDl.matched_question === "string" && fDl.matched_question.length > 0);
  test("faq: deadline question gets a dated answer", /2 December 2027|2027/.test(fDl.answer));
  const fNone = structured(await callTool("euaiact_answer_question", { question: "completely unrelated question about bananas" }));
  test("faq: unrelated question abstains with tool pointers", fNone.confidence === "low" && /euaiact_check_deadlines/.test(fNone.answer));
  // Cross-model round 3 routing regressions, pinned:
  const fTier = structured(await callTool("euaiact_answer_question", { question: "Which risk tier is an image generation model?" }));
  test("faq: image-model tier question reaches classification", fTier.matched_question?.includes("classify") && fTier.confidence !== "low");
  const fCop = structured(await callTool("euaiact_answer_question", { question: "What does the AI Act mean for our employees using Copilot?" }));
  test("faq: employees-copilot question reaches faq-09", /ChatGPT\/Copilot/.test(fCop.matched_question ?? "") && fCop.confidence !== "low");
  const fReg = structured(await callTool("euaiact_answer_question", { question: "Do I need to register my Annex III system in the EU database?" }));
  test("faq: registration question reaches faq-19", /register/.test(fReg.matched_question ?? "") && fReg.confidence !== "low");
  const fPost = structured(await callTool("euaiact_answer_question", { question: "Is the AI Act postponed by the Digital Omnibus?" }));
  test("faq: postponement question reaches the Omnibus entry", /Omnibus/.test(fPost.matched_question ?? "") && fPost.confidence !== "low");
  // Codex prompt-D exact remaining probe, pinned verbatim:
  const fPostD = structured(await callTool("euaiact_answer_question", { question: "Did the Digital Omnibus postpone the high-risk dates?" }));
  test("faq: omnibus-postponed-high-risk-dates reaches faq-18, not faq-02", /Omnibus/.test(fPostD.matched_question ?? "") && !/by when/.test(fPostD.matched_question ?? "") && fPostD.confidence !== "low");

  // Penalties: input guards live in the schema (the SDK validates before the
  // handler runs; the test harness bypasses it, so assert at schema level).
  test("penalty: negative turnover is rejected", !penaltiesInputSchema.safeParse({ violation_type: "prohibited", annual_turnover_eur: -1000000000, is_sme: true }).success);
  test("penalty: non-finite turnover is rejected", !penaltiesInputSchema.safeParse({ violation_type: "prohibited", annual_turnover_eur: 1e999 }).success);
  test("penalty: is_smc input parses", penaltiesInputSchema.safeParse({ violation_type: "high_risk", annual_turnover_eur: 1e9, is_smc: true }).success);
  const pSmcHr = structured(await callTool("euaiact_calculate_penalty", { violation_type: "high_risk", annual_turnover_eur: 1e9, is_smc: true }));
  test("penalty: SMC gets lower-of on the 99(4) tier", pSmcHr.max_fine.applicable_fine_eur === 15000000);
  const pSmcPro = structured(await callTool("euaiact_calculate_penalty", { violation_type: "prohibited", annual_turnover_eur: 1e9, is_smc: true }));
  test("penalty: SMC gets NO cap on the 99(3) prohibited tier", pSmcPro.max_fine.applicable_fine_eur === 70000000 && /99\(6a\)/.test(pSmcPro.max_fine.explanation));
  const pSme = structured(await callTool("euaiact_calculate_penalty", { violation_type: "prohibited", annual_turnover_eur: 1e9, is_sme: true }));
  test("penalty: SME still capped on 99(3)", pSme.max_fine.applicable_fine_eur === 35000000);

  // Obligations: citation carries the correct mechanism per article class
  const ob = structured(await callTool("euaiact_get_obligations", { risk_level: "high-risk", role: "provider", high_risk_source: "annex_iii" }));
  const ob43 = ob.obligations.find((o) => o.article === "Art. 43");
  const ob9 = ob.obligations.find((o) => o.article === "Art. 9");
  test("obligations: Art. 43 states formal date + practical trigger", !!ob43 && /formally applies since 2 August 2026/.test(ob43.details) && /Art\. 113\(3\)\(c\)\(i\)/.test(ob43.details));
  test("obligations: Art. 43 no longer claims direct 113(3)(c) deferral", !!ob43 && !/per Art\. 113\(3\)\(c\) as amended/.test(ob43.details));
  test("obligations: Art. 9 cites 113(3)(c)(i) directly (Sections 1-3)", !!ob9 && /per Art\. 113\(3\)\(c\)\(i\) as amended/.test(ob9.details));
  const obDep = structured(await callTool("euaiact_get_obligations", { risk_level: "high-risk", role: "deployer", high_risk_source: "annex_iii" }));
  const ob86 = obDep.obligations.find((o) => o.article === "Art. 86");
  test("obligations: deployer Art. 86 (if present) uses the practical-trigger wording", !ob86 || /formally applies since 2 August 2026/.test(ob86.details));
}

// ─── 1.4.4 REGRESSIONS (batch 3: article corpus, links, carve-outs, reuse wording)
console.log("\n📖 1.4.4 REGRESSIONS: ARTICLE CORPUS");
{
  const { articles } = await import("./dist/knowledge/articles.js");
  test("corpus: 28 article summaries including Art. 4a", articles.length === 28 && articles.some((a) => a.number === "4a"));
  test("corpus: every link points at the consolidated text", articles.every((a) => a.eurlex_url.includes("CELEX:02024R1689-20260727")));

  const a4a = structured(await callTool("euaiact_get_article", { article: "4a" }));
  test("get_article(4a): available with bias-detection content", a4a.available === true && /bias detection/i.test(a4a.article.summary));
  test("get_article(4a): names the deleted Art. 10(5) origin", /Art\. 10\(5\)/.test(a4a.article.summary));

  const a5 = structured(await callTool("euaiact_get_article", { article: "5" }));
  test("get_article(5): carries (ba) and (bb) with the 2 Dec 2026 date", /\(ba\)/.test(a5.article.summary) && /\(bb\)/.test(a5.article.summary) && /2 December 2026/.test(a5.article.summary));
  test("get_article(5): carries the Art. 5(1a)/(1b) qualifications", /5\(1a\)/.test(a5.article.summary) && /5\(1b\)/.test(a5.article.summary));

  const a6 = structured(await callTool("euaiact_get_article", { article: "6" }));
  test("get_article(6): carries the Art. 6(1a)-(1c) narrowing", /6\(1a\)/.test(a6.article.summary) && /6\(1c\)/.test(a6.article.summary) && /radio spectrum/.test(a6.article.summary));

  const a10 = structured(await callTool("euaiact_get_article", { article: "10" }));
  test("get_article(10): states the Art. 10(5) deletion and Art. 4a move", /deleted/.test(a10.article.summary) && /Art\. 4a/.test(a10.article.summary));

  const a99 = structured(await callTool("euaiact_get_article", { article: "99" }));
  test("get_article(99): includes point (da) and the 99(6a) SMC rule", /\(da\)/.test(a99.article.summary) && /99\(6a\)/.test(a99.article.summary));

  const exc = structured(await callTool("euaiact_assess_art6_3_exception", { performs_profiling: true, narrow_procedural_task: true, no_significant_risk_to_health_safety_fundamental_rights: true }));
  test("art6-exception: profiling refusal cites the THIRD subparagraph", /third subparagraph/.test(JSON.stringify(exc)) && !/second subparagraph/.test(JSON.stringify(exc)));

  const { annexIIICategories } = await import("./dist/knowledge/annex-iii.js");
  const cat5 = annexIIICategories.find((c) => c.number === 5);
  test("annex III(5): financial-fraud carve-out present", /detecting financial fraud/.test(cat5.description));

  const { SERVER_INSTRUCTIONS } = await import("./dist/constants.js");
  test("reuse wording: no bare public-domain claim in server instructions", !/public.domain/i.test(SERVER_INSTRUCTIONS) && /2011\/833\/EU/.test(SERVER_INSTRUCTIONS));
}

// ─── AUDITED TRUTH CORRECTIONS ─────────────────────────────────────────────
console.log("\n🔒 AUDITED TRUTH CORRECTIONS");
{
  const bundle = readFileSync("dist/server.js", "utf8");
  const readme = readFileSync("README.md", "utf8");
  const changelog = readFileSync("CHANGELOG.md", "utf8");

  test("truth M015: risk resource scopes Art. 50 by actor and paragraph",
    bundle.includes("Art. 50 contains paragraph-specific duties") && bundle.includes("Apply the actor, scope, and exceptions in the relevant paragraph"));
  test("truth M016: minimal label preserves independently triggered duties",
    bundle.includes("No higher-tier obligation is identified from this risk label alone") && bundle.includes("Art. 4") && bundle.includes("Art. 95 codes of conduct are voluntary"));

  const bb = prohibitedPractices.find((practice) => practice.id === "art5-1bb")?.description ?? "";
  test("truth M029: Art. 5(1b) is limited to point (ba)",
    bb.includes("Art. 5(1b) does not apply to point (bb)") && bb.includes("qualifies point (ba) only"));

  const healthcare = faqDatabase.find((entry) => entry.id === "faq-15-healthcare")?.answer ?? "";
  test("truth M063: healthcare answer requires an Art. 6 or Annex III route",
    healthcare.includes("third-party-conformity") && healthcare.includes("Annex III(5)(d)") && healthcare.includes("not high-risk merely because"));

  const penalties = faqDatabase.find((entry) => entry.id === "faq-16-penalties")?.answer ?? "";
  test("truth M061: penalties answer limits the 15M tier to enumerated Art. 99(4) duties",
    penalties.includes("violations enumerated in Art. 99(4)") && penalties.includes("small mid-caps only for paragraphs 4 and 5"));

  const registration = faqDatabase.find((entry) => entry.id === "faq-19-registration")?.answer ?? "";
  test("truth M062: registration answer is not a blanket high-risk rule",
    registration.includes("except a system in Annex III point 2") && registration.includes("not a blanket registration rule"));

  test("truth M064: disclaimer asks for official-source verification",
    readme.includes("verified against current official sources") && readme.includes("qualified local counsel") && !readme.includes("not Rechtsberatung im Sinne"));
  test("truth M073: historical backstop wording is corrected",
    changelog.includes("makes both dates unconditional") && !changelog.includes("Both are backstop dates; a Commission decision"));
  test("truth M074: changelog preserves the Art. 5 qualifier split",
    changelog.includes("Art. 5(1a) applies to both points; Art. 5(1b) qualifies point (ba) only"));
  test("truth M078: changelog names the profiling block as the third subparagraph",
    changelog.includes("profiling block (Art. 6(3), third subparagraph)"));

  const annex = structured(await callTool("euaiact_annex_iv_checklist", { format: "checklist" }));
  test("truth M080: Annex IV output labels implementation prompts as non-binding",
    annex.guidance_note.includes("non-binding implementation prompts") && annex.checklist_markdown.includes(annex.guidance_note));

  const a73 = articles.find((entry) => entry.number === "73")?.summary ?? "";
  test("truth M082: Art. 73 two-day route carries the Art. 3(49)(b) threshold",
    a73.includes("serious and irreversible disruption of the management or operation of critical infrastructure under Art. 3(49)(b)"));

  const articleTool = readFileSync("dist/tools/article.js", "utf8");
  test("truth grounding: article summaries cannot be quoted as statutory text",
    articleTool.includes("The summary is not statutory text") &&
    bundle.includes("Do not quote the summary as statutory text") &&
    !articleTool.includes("quote article text with a link") &&
    !bundle.includes("fetch the text and EUR-Lex URL"));
}

// ─── AGENT JOURNEYS (the ten end-to-end navigation tasks from 2026-08-06) ──
// Each journey is what a consuming agent actually does: a question, one or two
// chained tool calls, and an answer it can act on. These caught 4 failures the
// per-tool tests missed; they run on every build so the surface cannot regress
// tool-by-tool while breaking end-to-end.
console.log("\n🧭 AGENT JOURNEYS");
{
  // J1: CV screening - what and by when
  const j1c = structured(await callTool("euaiact_classify_system", { description: "AI system that screens and ranks CVs for recruitment shortlisting", signals: { domain: "employment" } }));
  const j1o = structured(await callTool("euaiact_get_obligations", { risk_level: "high-risk", role: "provider", high_risk_source: "annex_iii" }));
  test("J1 CV screening: high-risk, dated obligations", j1c.risk_classification === "high-risk" && j1o.obligations.length > 0 && j1o.obligations.some((o) => o.deadline === "2027-12-02"));

  // J2: chatbot transparency
  const j2 = structured(await callTool("euaiact_classify_system", { description: "customer service chatbot that talks to our users", signals: { interacts_with_natural_persons: true } }));
  test("J2 chatbot: limited risk with Art. 50(1)", j2.risk_classification === "limited" && j2.relevant_articles.includes("Art. 50(1)"));

  // J3: FRIA via FAQ
  const j3 = structured(await callTool("euaiact_answer_question", { question: "We are a private bank deploying credit scoring. Do we need a FRIA?" }));
  test("J3 FRIA: answers the FRIA question with Art. 27", /FRIA|Article 27|Art\. 27/.test(j3.answer) && j3.question.includes("private bank"));

  // J4: maximum fine for an Art. 5 breach
  const j4 = structured(await callTool("euaiact_calculate_penalty", { violation_type: "prohibited", annual_turnover_eur: 500000000, is_sme: false }));
  test("J4 penalty: 35M for prohibited at 500M turnover", j4.max_fine.applicable_fine_eur === 35000000);

  // J5: GPAI at 3e25 FLOPs
  const j5 = structured(await callTool("euaiact_check_gpai_systemic_risk", { training_flops: 3e25 }));
  test("J5 GPAI 3e25: systemic with Art. 55 obligations", j5.is_gpai_with_systemic_risk === true && j5.systemic_risk_obligations_art_55.length > 0);

  // J6: airport e-gate (canonical Annex III(1)(a) exclusion)
  const j6 = structured(await callTool("euaiact_classify_system", { description: "airport e-gate that matches a traveller face against their passport photo to verify the claimed identity", signals: { uses_biometrics: true } }));
  test("J6 e-gate: scoped exclusion, never high-risk", /Not high-risk under Annex III\(1\)\(a\)/.test(j6.obligations_summary) && j6.risk_classification !== "high-risk" && j6.risk_classification !== "minimal" && j6.relevant_articles.includes("Annex III(1)(a)"));

  // J7: when do Annex III obligations apply (asked naturally, via FAQ)
  const j7 = structured(await callTool("euaiact_answer_question", { question: "When do the high-risk obligations for Annex III systems apply?" }));
  test("J7 deadlines: dated answer to the natural-language question", /2 December 2027/.test(j7.answer) && j7.question === "When do the high-risk obligations for Annex III systems apply?");

  // J8: grounded citation for Art. 113
  const j8 = structured(await callTool("euaiact_get_article", { article: "113" }));
  test("J8 grounding: summary says 2027 AND the link shows the same law", /2 December 2027/.test(j8.article.summary) && j8.eurlex_url.includes("02024R1689-20260727"));

  // J9: deployer of an Annex III system
  const j9 = structured(await callTool("euaiact_get_obligations", { risk_level: "high-risk", role: "deployer", high_risk_source: "annex_iii" }));
  test("J9 deployer: obligations returned incl. Art. 26", j9.obligations.length >= 5 && j9.obligations.some((o) => /Art\. 26/.test(o.article)));

  // J10: nudification app (enacted Art. 5(1)(ba))
  const j10 = structured(await callTool("euaiact_classify_system", { description: "app that generates non-consensual intimate images of real people from their photos" }));
  test("J10 nudification: prohibited under Art. 5(1)(ba)", j10.risk_classification === "prohibited" && j10.relevant_articles.includes("Art. 5(1)(ba)"));
}

// ─── 1.5 ASSESS SYSTEM CONTRACT ────────────────────────────────────────────
console.log("\n🧩 ASSESS SYSTEM 1.5");
{
  const fixtureRoot = "tests/fixtures/assess-system";
  const goldenRoot = "tests/golden";
  const loadJson = (path) => JSON.parse(readFileSync(path, "utf8"));
  const loadProfile = (name) => loadJson(join(fixtureRoot, name));
  const runAssessment = async (name) =>
    structured(await callTool("euaiact_assess_system", loadProfile(name)));
  const profileFact = (fact_id, value, verification = "caller_asserted") => ({
    fact_id,
    value,
    origin: verification === "evidence_linked"
      ? "cited_evidence"
      : "explicit_structured_input",
    verification,
    evidence_reference_ids: [],
  });

  const high = await runAssessment("contract-high-risk.json");
  test("assess: clear Annex III system is high-risk",
    high.status === "determined" &&
    high.legal_classification.routes.some((route) => route.route === "high_risk"));
  test("assess: classification does not imply readiness",
    high.implementation_readiness.readiness_state === "evidence_missing" &&
    high.implementation_readiness.is_regulatory_approval === false);

  const minimal = await runAssessment("minimal-complete.json");
  test("assess: clear minimal route requires complete negative facts",
    minimal.status === "determined" &&
    minimal.legal_classification.routes.length === 1 &&
    minimal.legal_classification.routes[0].route === "minimal");

  const prohibited = await runAssessment("prohibited-social-scoring.json");
  test("assess: prohibited-practice hit is preserved",
    prohibited.status === "determined" &&
    prohibited.legal_classification.routes.some((route) => route.route === "prohibited"));

  const sparse = await runAssessment("contract-sparse.json");
  test("assess: decisive missing fact abstains instead of guessing",
    sparse.status === "undetermined" &&
    sparse.legal_classification.status === "undetermined" &&
    sparse.legal_classification.routes.length === 0 &&
    sparse.missing_facts.some((fact) => fact.missing_fact_id === "missing.intended-purpose" && fact.decisive));
  test("assess: sparse profile enumerates each affected block",
    sparse.missing_facts.some((fact) => fact.affected_blocks.includes("legal_classification")) &&
    sparse.missing_facts.some((fact) => fact.affected_blocks.includes("impact")) &&
    sparse.missing_facts.some((fact) => fact.affected_blocks.includes("implementation_readiness")));
  const missingPurposeProfile = loadProfile("minimal-complete.json");
  delete missingPurposeProfile.intended_use;
  delete missingPurposeProfile.annex_iii.purpose;
  const missingPurpose = structured(await callTool("euaiact_assess_system", missingPurposeProfile));
  test("assess: decisive missing fact propagates to every named block",
    missingPurpose.missing_facts.some((fact) =>
      fact.missing_fact_id === "missing.intended-purpose" &&
      fact.decisive &&
      fact.affected_blocks.includes("impact")) &&
    missingPurpose.impact.status === "undetermined" &&
    missingPurpose.impact.inherent_impact === null &&
    missingPurpose.impact.residual_impact === null);
  test("assess: omitted jurisdiction is disclosed instead of defaulting to EU",
    sparse.missing_facts.some((fact) => fact.missing_fact_id === "missing.legal.jurisdiction") &&
    sparse.findings.every((finding) => finding.scope.jurisdictions.join(",") === "unspecified"));

  const nonEuProfile = loadProfile("minimal-complete.json");
  nonEuProfile.geography.jurisdictions[0].value = "United States";
  nonEuProfile.geography.used_in_eu.value = false;
  const nonEu = structured(await callTool("euaiact_assess_system", nonEuProfile));
  test("assess: non-EU geography without an EU nexus fact fails closed",
    nonEu.legal_classification.status === "undetermined" &&
    nonEu.missing_facts.some((fact) => fact.missing_fact_id === "missing.legal.jurisdiction"));

  const notApplicable = await runAssessment("contract-not-applicable.json");
  test("assess: definition-boundary result uses the Chapter I application date",
    notApplicable.status === "not_applicable" &&
    notApplicable.findings[0].provenance[0].operative_date === "2025-02-02");

  const lowImpactHighRisk = await runAssessment("high-risk-low-impact-controlled.json");
  test("assess: low impact never erases legal high-risk classification",
    lowImpactHighRisk.impact.inherent_impact.description.includes("limited decision influence") &&
    lowImpactHighRisk.impact.does_not_alter_legal_classification === true &&
    lowImpactHighRisk.legal_classification.routes.some((route) => route.route === "high_risk"));
  test("assess: evidence matching is conservative and duty-category specific",
    lowImpactHighRisk.implementation_readiness.applicable_duties
      .filter((duty) => duty.evidence_state === "documented")
      .map((duty) => duty.duty_id)
      .join(",") === "duty.provider.art.9.risk.management");

  const multiRoute = await runAssessment("high-risk-plus-transparency.json");
  test("assess: legal routes are independently retained",
    multiRoute.legal_classification.routes.map((route) => route.route).join(",") ===
      "high_risk,transparency_duty");
  test("assess: Annex III high-risk output discloses the frozen Art. 6(3) limit",
    multiRoute.legal_classification.limitations.some((limitation) =>
      limitation.includes("no no-significant-risk predicate")));
  test("assess: provider chatbot readiness does not inherit Article 50(2)",
    multiRoute.implementation_readiness.applicable_duties.some(
      (duty) => duty.exact_provision === "Art. 50(1)" && duty.actor_roles.includes("provider"),
    ) &&
    !multiRoute.implementation_readiness.applicable_duties.some(
      (duty) => duty.exact_provision === "Art. 50(2)" && duty.actor_roles.includes("provider"),
    ));

  const deepfakeReadiness = await runAssessment("transparency-deepfake.json");
  test("assess: deepfake readiness retains only triggered Article 50 paragraphs per actor",
    deepfakeReadiness.implementation_readiness.applicable_duties
      .filter((duty) => duty.exact_provision.startsWith("Art. 50"))
      .map((duty) => `${duty.actor_roles[0]}:${duty.exact_provision}`)
      .sort()
      .join(",") === "deployer:Art. 50(4),provider:Art. 50(2)");

  const baProfile = loadProfile("transparency-deepfake.json");
  baProfile.article_5_prohibitions = {
    operation: profileFact("fact.article5.ba.operation", "generation"),
    ba_realistic_intimate_or_sexually_explicit_material_of_identifiable_person:
      profileFact("fact.article5.ba.material", true),
    ba_required_consent_present: profileFact("fact.article5.ba.consent", false),
    ba_manipulation_increases_intimate_exposure:
      profileFact("fact.article5.ba.increased-exposure", true),
    ba_manipulation_alters_sexually_explicit_activity:
      profileFact("fact.article5.ba.alters-activity", false),
    provider_generation_or_manipulation_is_intended_purpose:
      profileFact("fact.article5.provider.intended", true),
    provider_foreseeable_and_reproducible_outcome_without_significant_modification:
      profileFact("fact.article5.provider.foreseeable", true),
    provider_reasonable_and_adequate_safeguards_present:
      profileFact("fact.article5.provider.safeguards", false),
    deployer_uses_for_generation_or_manipulation_purpose:
      profileFact("fact.article5.deployer.purpose", true),
  };
  const ba = structured(await callTool("euaiact_assess_system", baProfile));
  const baLegal = ba.findings.filter((finding) => finding.block === "legal_classification");
  test("MIGRATION-002 holdout.03: ba emits prospective provider and deployer prohibition branches",
    ba.status === "determined" &&
    ba.legal_classification.routes.some((route) =>
      route.route === "prohibited" &&
      route.actor_roles.join(",") === "deployer,provider") &&
    baLegal.some((finding) =>
      finding.scope.actors.join(",") === "provider" &&
      finding.provenance.some((item) =>
        item.exact_provision === "Article 5(1a)(a)(i)" &&
        item.operative_date === "2026-12-02")) &&
    baLegal.some((finding) =>
      finding.scope.actors.join(",") === "deployer" &&
      finding.provenance.some((item) => item.exact_provision === "Article 5(1a)(b)")));
  test("MIGRATION-002 holdout.03: ba evaluates 5(1b) and keeps Article 50 actor-specific",
    baLegal.some((finding) =>
      finding.determination === "does_not_apply" &&
      finding.provenance.some((item) => item.exact_provision === "Article 5(1b)")) &&
    baLegal
      .filter((finding) => finding.provenance.some((item) => item.exact_provision.startsWith("Article 50")))
      .map((finding) => `${finding.scope.actors.join(",")}:${finding.provenance[0].exact_provision}`)
      .sort()
      .join(",") === "deployer:Article 50(4),provider:Article 50(2)" &&
    ba.implementation_readiness.applicable_duties
      .filter((duty) => duty.exact_provision.startsWith("Art. 50"))
      .map((duty) => `${duty.actor_roles.join(",")}:${duty.exact_provision}`)
      .sort()
      .join(",") === "deployer:Art. 50(4),provider:Art. 50(2)" &&
    ba.legal_classification.limitations.some((limitation) => limitation.includes("Article 111(4)")));

  const bbProfile = loadProfile("transparency-deepfake.json");
  bbProfile.transparency.deep_fake_content.value = false;
  bbProfile.article_5_prohibitions = {
    operation: profileFact("fact.article5.bb.operation", "generation"),
    bb_directive_2011_93_category:
      profileFact("fact.article5.bb.directive-category", "article_2_c_iv"),
    bb_without_right_defence_applies_under_national_law:
      profileFact("fact.article5.bb.without-right-defence", false),
    provider_generation_or_manipulation_is_intended_purpose:
      profileFact("fact.article5.bb.provider.intended", true),
    provider_foreseeable_and_reproducible_outcome_without_significant_modification:
      profileFact("fact.article5.bb.provider.foreseeable", true),
    provider_reasonable_and_adequate_safeguards_present:
      profileFact("fact.article5.bb.provider.safeguards", false),
    deployer_uses_for_generation_or_manipulation_purpose:
      profileFact("fact.article5.bb.deployer.purpose", true),
  };
  const bb = structured(await callTool("euaiact_assess_system", bbProfile));
  const bbLegalProvisions = bb.findings
    .filter((finding) => finding.block === "legal_classification")
    .flatMap((finding) => finding.provenance.map((item) => item.exact_provision));
  test("MIGRATION-002 holdout.04: bb is fail-closed and requires human review for caller-asserted defence",
    bb.status === "human_review_required" &&
    bb.legal_classification.status === "human_review_required" &&
    bb.legal_classification.routes.some((route) =>
      route.route === "prohibited" &&
      route.actor_roles.join(",") === "deployer,provider") &&
    bbLegalProvisions.includes("Article 5(1)(bb)") &&
    bbLegalProvisions.includes("Article 5(1a)(a)(i)") &&
    bbLegalProvisions.includes("Article 5(1a)(b)") &&
    !bbLegalProvisions.includes("Article 5(1b)") &&
    bb.findings
      .filter((finding) => finding.provenance.some((item) => item.exact_provision === "Article 5(1)(bb)"))
      .every((finding) => finding.provenance.every((item) => item.operative_date === "2026-12-02")) &&
    bb.findings
      .filter((finding) => finding.provenance.some((item) => item.exact_provision.startsWith("Article 50")))
      .map((finding) => `${finding.scope.actors.join(",")}:${finding.provenance[0].exact_provision}`)
      .join(",") === "provider:Article 50(2)" &&
    bb.facts_used.some((fact) =>
      fact.fact_id === "fact.article5.bb.without-right-defence" &&
      fact.verification === "caller_asserted") &&
    bb.warnings.some((warning) => warning.code === "LEGAL_REVIEW_REQUIRED"));

  const assertedBbDefenceProfile = structuredClone(bbProfile);
  assertedBbDefenceProfile.article_5_prohibitions
    .bb_without_right_defence_applies_under_national_law.value = true;
  const assertedBbDefence = structured(
    await callTool("euaiact_assess_system", assertedBbDefenceProfile),
  );
  test("MIGRATION-002 policy P1: caller-asserted bb defence never removes the prohibition route",
    assertedBbDefence.status === "human_review_required" &&
    assertedBbDefence.legal_classification.routes.some((route) => route.route === "prohibited") &&
    assertedBbDefence.facts_used.some((fact) =>
      fact.fact_id === "fact.article5.bb.without-right-defence" &&
      fact.value === true &&
      fact.verification === "caller_asserted"));

  const standardEditProfile = loadProfile("minimal-complete.json");
  standardEditProfile.article_5_prohibitions = {
    operation: profileFact("fact.article5.edit.operation", "manipulation"),
    ba_realistic_intimate_or_sexually_explicit_material_of_identifiable_person:
      profileFact("fact.article5.edit.material", true),
    ba_required_consent_present: profileFact("fact.article5.edit.consent", true),
    ba_manipulation_increases_intimate_exposure:
      profileFact("fact.article5.edit.increased-exposure", false),
    ba_manipulation_alters_sexually_explicit_activity:
      profileFact("fact.article5.edit.alters-activity", false),
  };
  standardEditProfile.transparency.standard_editing_assistive_function =
    profileFact("fact.transparency.edit.standard", true);
  standardEditProfile.transparency.substantially_alters_input_or_semantics =
    profileFact("fact.transparency.edit.substantial", false);
  const standardEdit = structured(
    await callTool("euaiact_assess_system", standardEditProfile),
  );
  test("MIGRATION-002 holdout.05: complete editing exclusions return determined minimal",
    standardEdit.status === "determined" &&
    standardEdit.legal_classification.routes.map((route) => route.route).join(",") === "minimal" &&
    standardEdit.missing_facts.every((fact) => fact.missing_fact_id !== "missing.intended-purpose") &&
    standardEdit.findings.some((finding) =>
      finding.determination === "does_not_apply" &&
      finding.provenance.some((item) => item.exact_provision === "Article 5(1)(ba)") &&
      finding.provenance.some((item) => item.exact_provision === "Article 5(1b)")) &&
    standardEdit.findings.some((finding) =>
      finding.determination === "does_not_apply" &&
      finding.provenance.some((item) => item.exact_provision === "Article 50(2)")));

  const gpai = await runAssessment("gpai-systemic.json");
  const gpaiLegalProvisions = gpai.findings
    .filter((finding) => finding.block === "legal_classification")
    .flatMap((finding) => finding.provenance.map((item) => item.exact_provision));
  test("MIGRATION-002 holdout.08: compute presumption carries Article 51 and 52 anchors",
    ["Article 51(1)(a)", "Article 51(2)", "Article 52(1)", "Article 52(2)"]
      .every((provision) => gpaiLegalProvisions.includes(provision)) &&
    gpai.implementation_readiness.applicable_duties.some((duty) =>
      duty.exact_provision === "Article 52(1)") &&
    gpai.implementation_readiness.applicable_duties.some((duty) =>
      duty.exact_provision.startsWith("Article 53")) &&
    gpai.implementation_readiness.applicable_duties.some((duty) =>
      duty.exact_provision.startsWith("Article 55")) &&
    !gpai.implementation_readiness.applicable_duties.some((duty) =>
      /^(?:Article|Art\.) 54/.test(duty.exact_provision)));

  const gpaiBoundaryProfile = loadProfile("gpai-systemic.json");
  gpaiBoundaryProfile.gpai.training_flops.value = 1e25;
  const gpaiBoundary = structured(
    await callTool("euaiact_assess_system", gpaiBoundaryProfile),
  );
  const gpaiBoundaryProvisions = gpaiBoundary.findings
    .filter((finding) => finding.block === "legal_classification")
    .flatMap((finding) => finding.provenance.map((item) => item.exact_provision));
  test("MIGRATION-002 holdout.08: exact 1e25 boundary triggers Article 51 and 52 end to end",
    gpaiBoundary.status === "determined" &&
    ["Article 51(1)(a)", "Article 51(2)", "Article 52(1)", "Article 52(2)"]
      .every((provision) => gpaiBoundaryProvisions.includes(provision)) &&
    gpaiBoundary.implementation_readiness.applicable_duties.some((duty) =>
      duty.exact_provision === "Article 52(1)"));

  const explicitNonEuProfile = loadProfile("minimal-complete.json");
  explicitNonEuProfile.geography.jurisdictions[0].value = "Canada";
  explicitNonEuProfile.geography.used_in_eu.value = false;
  explicitNonEuProfile.geography.placed_on_eu_market =
    profileFact("fact.geography.non-eu.placed", false);
  explicitNonEuProfile.geography.output_used_in_eu =
    profileFact("fact.geography.non-eu.output", false);
  const explicitNonEu = structured(
    await callTool("euaiact_assess_system", explicitNonEuProfile),
  );
  test("MIGRATION-002 holdout.10: all explicit negative Article 2 nexus facts yield non-applicability",
    explicitNonEu.status === "not_applicable" &&
    explicitNonEu.legal_classification.status === "not_applicable" &&
    explicitNonEu.impact.status === "determined" &&
    explicitNonEu.implementation_readiness.status === "not_applicable" &&
    !explicitNonEu.missing_facts.some((fact) => fact.missing_fact_id === "missing.legal.jurisdiction") &&
    explicitNonEu.findings.some((finding) =>
      finding.determination === "not_applicable" &&
      finding.provenance.some((item) =>
        item.exact_provision === "Article 2(1)" &&
        item.operative_date === "2026-08-02")));

  const stackedProfile = loadProfile("high-risk-plus-transparency.json");
  stackedProfile.role_facts.roles = [];
  stackedProfile.biometric_and_practices = {
    social_scoring: {
      fact_id: "fact.practice.social-scoring",
      value: true,
      origin: "explicit_structured_input",
      verification: "caller_asserted",
      evidence_reference_ids: [],
    },
    social_scoring_unrelated_context: {
      fact_id: "fact.practice.social-scoring.unrelated-context",
      value: true,
      origin: "explicit_structured_input",
      verification: "caller_asserted",
      evidence_reference_ids: [],
    },
  };
  const stacked = structured(await callTool("euaiact_assess_system", stackedProfile));
  test("assess: prohibited, high-risk, and transparency routes coexist in normative order",
    stacked.legal_classification.routes.map((route) => route.route).join(",") ===
      "prohibited,high_risk,transparency_duty");
  test("assess: a prohibited route cannot hide a missing actor for high-risk readiness",
    stacked.legal_classification.status === "determined" &&
    stacked.implementation_readiness.status === "undetermined" &&
    stacked.status === "undetermined" &&
    stacked.missing_facts.some((fact) => fact.missing_fact_id === "missing.readiness.actor-role"));

  const deepfakeWithoutPurpose = loadProfile("transparency-deepfake.json");
  delete deepfakeWithoutPurpose.intended_use;
  deepfakeWithoutPurpose.transparency.generates_or_manipulates_synthetic_content.value = false;
  const explicitDeepfake = structured(await callTool("euaiact_assess_system", deepfakeWithoutPurpose));
  test("assess: an explicit deep-fake predicate does not require inferred purpose text",
    explicitDeepfake.legal_classification.status === "determined" &&
    explicitDeepfake.legal_classification.routes.map((route) => route.route).join(",") ===
      "transparency_duty");

  // FIX-RUN2 F3 (blind run 2, holdout2.10): an Annex I route may only be
  // grounded when the cited instrument itself is in the pinned Annex I list.
  const annexIInstruments = await import("./dist/decision-contract/annex-i-instruments.js");
  test("FIX-RUN2 F3: pinned Annex I list is the closed post-M1 set, points 2 to 21",
    annexIInstruments.ANNEX_I_INSTRUMENTS.length === 20 &&
    annexIInstruments.ANNEX_I_INSTRUMENTS.map((item) => item.annex_point).join(",") ===
      "2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21" &&
    annexIInstruments.ANNEX_I_INSTRUMENTS.filter((item) => item.section === "A").length === 11 &&
    annexIInstruments.ANNEX_I_INSTRUMENTS.filter((item) => item.section === "B").length === 9 &&
    annexIInstruments.ANNEX_I_INSTRUMENTS.some((item) =>
      item.annex_point === 21 && item.citation === "Regulation (EU) 2023/1230"));
  test("FIX-RUN2 F3: membership is instrument identity, never substring presence",
    annexIInstruments.matchAnnexIInstrument("Regulation (EC) No 1223/2009 on cosmetic products").status === "not_listed" &&
    annexIInstruments.matchAnnexIInstrument("Directive 2001/83/EC").status === "not_listed" &&
    annexIInstruments.matchAnnexIInstrument("Regulation (EC) No 178/2002").status === "not_listed" &&
    annexIInstruments.matchAnnexIInstrument("Regulation (EU) 2017/745").entry?.annex_point === 11 &&
    annexIInstruments.matchAnnexIInstrument("32017R0745").entry?.annex_point === 11 &&
    annexIInstruments.matchAnnexIInstrument("Regulation (EU) 2023/1230 on machinery").entry?.annex_point === 21 &&
    annexIInstruments.matchAnnexIInstrument("Regulation (EU) 2017/745 of the European Parliament and of the Council of 5 April 2017 on medical devices, amending Directive 2001/83/EC, Regulation (EC) No 178/2002 and Regulation (EC) No 1223/2009").status === "listed" &&
    annexIInstruments.matchAnnexIInstrument("the applicable European cosmetics harmonisation framework").status === "no_citation");

  const annexITrapProfile = {
    profile_version: "1.0",
    identity: {
      system_name: profileFact("fact.identity.name", "Cosmetics shade formulator"),
      machine_based_system: profileFact("fact.identity.machine", true),
      infers_from_inputs_how_to_generate_outputs: profileFact("fact.identity.infers", true),
    },
    intended_use: {
      intended_purpose: profileFact(
        "fact.intended-use.purpose",
        "Recommend cosmetic foundation shade formulations to laboratory technicians",
      ),
      reasonably_foreseeable_uses: [],
    },
    role_facts: {
      roles: [
        profileFact("fact.role.product-manufacturer", "product_manufacturer"),
        profileFact("fact.role.provider", "provider"),
      ],
    },
    geography: {
      jurisdictions: [profileFact("fact.geo.eu", "EU")],
      used_in_eu: profileFact("fact.geo.used", true),
      affected_person_groups: [profileFact("fact.geo.group.consumers", "Cosmetics consumers")],
    },
    decision_context: {
      decision_consequence: profileFact(
        "fact.decision.consequence",
        "Shade formulation suggestions reviewed by laboratory staff",
      ),
      materially_influences_decision: profileFact("fact.decision.influence", false),
    },
    annex_i: {
      product_or_safety_component: profileFact("fact.annex-i.product", true),
      annex_i_legislation: [
        profileFact(
          "fact.annex-i.cosmetics",
          "Regulation (EC) No 1223/2009 on cosmetic products",
        ),
      ],
      third_party_conformity_assessment_required: profileFact("fact.annex-i.conformity", true),
    },
    transparency: {
      interacts_with_natural_persons: profileFact("fact.transparency.interacts", false),
      generates_or_manipulates_synthetic_content: profileFact("fact.transparency.synthetic", false),
      deep_fake_content: profileFact("fact.transparency.deepfake", false),
    },
  };
  const annexITrap = structured(await callTool("euaiact_assess_system", annexITrapProfile));
  const annexITrapNegative = annexITrap.findings.find(
    (finding) => finding.finding_id === "finding.legal.high-risk.annex-i.not-listed.001",
  );
  test("FIX-RUN2 F3: a caller-asserted non-listed instrument cannot create the Annex I route",
    annexITrap.status === "determined" &&
    annexITrap.legal_classification.status === "determined" &&
    annexITrap.impact.status === "determined" &&
    annexITrap.implementation_readiness.status === "determined" &&
    annexITrap.legal_classification.routes.map((route) => route.route).join(",") === "minimal" &&
    annexITrap.legal_classification.routes[0].finding_ids.includes(
      "finding.legal.high-risk.annex-i.not-listed.001") &&
    !annexITrap.findings.some((finding) =>
      finding.determination === "applies" &&
      finding.provenance.some((item) => item.exact_provision.includes("Article 6(1)"))));
  test("FIX-RUN2 F3: the negative boundary carries the clean Article 6(1) anchor at the Annex I regime date",
    annexITrapNegative !== undefined &&
    annexITrapNegative.determination === "does_not_apply" &&
    annexITrapNegative.provenance.length === 1 &&
    annexITrapNegative.provenance[0].exact_provision === "Article 6(1)" &&
    annexITrapNegative.provenance[0].operative_date === "2028-08-02" &&
    annexITrapNegative.summary.includes("listed in Annex I") &&
    annexITrap.facts_used.some((fact) =>
      fact.fact_id === "fact.annex-i.cosmetics" &&
      fact.verification === "caller_asserted") &&
    annexITrap.facts_used.some((fact) =>
      fact.fact_id === "fact.annex-i.conformity" && fact.value === true));

  const annexIListedProfile = structuredClone(annexITrapProfile);
  annexIListedProfile.annex_i.annex_i_legislation = [
    profileFact("fact.annex-i.machinery", "Regulation (EU) 2023/1230 on machinery"),
  ];
  const annexIListed = structured(await callTool("euaiact_assess_system", annexIListedProfile));
  test("FIX-RUN2 F3: a listed instrument, including the M1 machinery entry, still grounds the route",
    annexIListed.legal_classification.routes.some((route) => route.route === "high_risk") &&
    annexIListed.findings.some((finding) =>
      finding.determination === "applies" &&
      finding.provenance.some((item) => item.exact_provision === "Article 6(1) and Annex I")));

  const annexIVagueProfile = structuredClone(annexITrapProfile);
  annexIVagueProfile.annex_i.annex_i_legislation = [
    profileFact("fact.annex-i.vague", "the applicable European cosmetics harmonisation framework"),
  ];
  const annexIVague = structured(await callTool("euaiact_assess_system", annexIVagueProfile));
  test("FIX-RUN2 F3: an unidentifiable instrument name fails closed with a decisive missing fact",
    annexIVague.status === "undetermined" &&
    annexIVague.legal_classification.routes.length === 0 &&
    annexIVague.missing_facts.some((fact) =>
      fact.missing_fact_id === "missing.annex-i.instrument-identity" &&
      fact.profile_path === "/annex_i/annex_i_legislation" &&
      fact.decisive === true));

  // FIX-RUN2 F2 (blind run 2, holdout2.08): abstention enumerates every
  // independent decisive missing fact at leaf level, never only the first
  // gap family found.
  const nexusLeafPaths = [
    "/geography/placed_on_eu_market",
    "/geography/used_in_eu",
    "/geography/output_used_in_eu",
    "/geography/jurisdictions",
  ];
  const dressedTrapProfile = {
    profile_version: "1.0",
    role_facts: { roles: [profileFact("fact.role.provider", "provider")] },
    annex_iii: {
      domain: profileFact("fact.annex-iii.domain", "employment"),
      purpose: profileFact(
        "fact.annex-iii.purpose",
        "Scoring pilot for workforce evaluation across teams",
      ),
    },
  };
  const dressedTrap = structured(await callTool("euaiact_assess_system", dressedTrapProfile));
  const dressedDecisive = dressedTrap.missing_facts.filter((fact) => fact.decisive);
  test("FIX-RUN2 F2: abstention enumerates the missing intended purpose alongside the nexus gap",
    dressedTrap.status === "undetermined" &&
    dressedTrap.legal_classification.status === "undetermined" &&
    dressedTrap.impact.status === "undetermined" &&
    dressedTrap.implementation_readiness.status === "undetermined" &&
    dressedTrap.legal_classification.routes.length === 0 &&
    dressedDecisive.some((fact) =>
      fact.missing_fact_id === "missing.intended-purpose" &&
      fact.profile_path === "/intended_use/intended_purpose") &&
    dressedDecisive.some((fact) =>
      fact.missing_fact_id === "missing.legal.jurisdiction" &&
      nexusLeafPaths.includes(fact.profile_path)) &&
    dressedDecisive.length >= 2 &&
    dressedDecisive.every((fact) =>
      fact.question.trim().length > 0 && fact.reason.trim().length > 0));
  test("FIX-RUN2 F2: the abstention finding references both independent legal gaps",
    dressedTrap.findings.some((finding) =>
      finding.finding_basis === "tool_state_abstention" &&
      finding.provenance.length === 0 &&
      finding.missing_fact_ids.includes("missing.intended-purpose") &&
      finding.missing_fact_ids.includes("missing.legal.jurisdiction")));

  const nonEuLeafProfile = {
    profile_version: "1.0",
    intended_use: {
      intended_purpose: profileFact(
        "fact.purpose.non-eu",
        "Spam filter for a non-Union mail service",
      ),
      reasonably_foreseeable_uses: [],
    },
    role_facts: { roles: [profileFact("fact.role.non-eu.provider", "provider")] },
    geography: {
      jurisdictions: [profileFact("fact.geo.non-eu.us", "United States")],
      used_in_eu: profileFact("fact.geo.non-eu.used", false),
      affected_person_groups: [profileFact("fact.geo.non-eu.group", "Mailbox owners")],
    },
  };
  const nonEuLeaf = structured(await callTool("euaiact_assess_system", nonEuLeafProfile));
  test("FIX-RUN2 F2: the nexus gap names the first absent geography leaf under its stable ID",
    nonEuLeaf.missing_facts.some((fact) =>
      fact.missing_fact_id === "missing.legal.jurisdiction" &&
      fact.profile_path === "/geography/placed_on_eu_market") &&
    !nonEuLeaf.missing_facts.some((fact) =>
      fact.missing_fact_id === "missing.intended-purpose"));

  const fallbackLeafProfile = {
    profile_version: "1.0",
    intended_use: {
      intended_purpose: profileFact("fact.purpose.fallback", "Non-Union analytics pilot"),
      reasonably_foreseeable_uses: [],
    },
    geography: {
      jurisdictions: [profileFact("fact.geo.fallback.us", "United States")],
      placed_on_eu_market: profileFact("fact.geo.fallback.placed", false),
      used_in_eu: profileFact("fact.geo.fallback.used", false),
      output_used_in_eu: profileFact("fact.geo.fallback.output", false),
      affected_person_groups: [],
    },
  };
  const fallbackLeaf = structured(await callTool("euaiact_assess_system", fallbackLeafProfile));
  test("FIX-RUN2 F2: with every boolean leaf supplied the nexus gap falls back to the jurisdictions leaf",
    fallbackLeaf.missing_facts.some((fact) =>
      fact.missing_fact_id === "missing.legal.jurisdiction" &&
      fact.profile_path === "/geography/jurisdictions"));

  // FIX-RUN2 F1 (A4 size finding): a rich dual-route dual-actor envelope must
  // stay inside the 64 KiB canonical bound without losing any duty-level
  // provision or operative-date anchor.
  const worstCase = await runAssessment("worst-case-dual-route.json");
  const worstCaseBytes = Buffer.byteLength(canonicalize(worstCase), "utf8");
  test("FIX-RUN2 F1: the rich dual-route worst case stays inside the 64 KiB bound",
    worstCase.status === "determined" &&
    worstCase.legal_classification.routes.map((route) => route.route).join(",") ===
      "high_risk,transparency_duty" &&
    worstCase.implementation_readiness.applicable_duties.length >= 20 &&
    new Set(
      worstCase.implementation_readiness.applicable_duties.flatMap((duty) => duty.actor_roles),
    ).size >= 2 &&
    worstCaseBytes <= 65_536);
  test("FIX-RUN2 F1: the worst case is deterministic across repeated runs",
    canonicalResponseHash(worstCase) ===
      canonicalResponseHash(await runAssessment("worst-case-dual-route.json")));
  const worstCaseReadinessFindings = new Map(
    worstCase.findings
      .filter((finding) => finding.block === "implementation_readiness")
      .map((finding) => [finding.finding_id, finding]),
  );
  test("FIX-RUN2 F1: every duty keeps its provision and date anchored in its actor finding",
    worstCase.implementation_readiness.applicable_duties.every((duty) =>
      duty.finding_ids.length > 0 &&
      duty.finding_ids.every((findingId) => {
        const finding = worstCaseReadinessFindings.get(findingId);
        return finding !== undefined &&
          finding.determination === "applies" &&
          finding.finding_basis === "legal_proposition" &&
          duty.actor_roles.every((actor) => finding.scope.actors.includes(actor)) &&
          finding.provenance.some((item) =>
            item.exact_provision === duty.exact_provision &&
            item.operative_date === duty.operative_date);
      })));
  const worstCaseFindingIds = worstCase.findings
    .map((finding) => finding.finding_id)
    .sort();
  test("FIX-RUN2 F1: the global disclosure warnings still cover every finding",
    ["NON_BINDING_SOURCE", "OUTPUT_NOT_LEGAL_ADVICE", "SUMMARY_ONLY"].every((code) =>
      JSON.stringify(
        worstCase.warnings.find((warning) => warning.code === code)?.finding_ids,
      ) === JSON.stringify(worstCaseFindingIds)));

  const freeTextOnly = await runAssessment("free-text-only.json");
  test("assess: unverified free text cannot satisfy a decisive predicate",
    freeTextOnly.status === "undetermined" &&
    freeTextOnly.warnings.some((warning) => warning.code === "UNVERIFIED_FREE_TEXT") &&
    freeTextOnly.legal_classification.routes.length === 0);

  const duplicateIdProfile = loadProfile("contract-high-risk.json");
  duplicateIdProfile.identity.lifecycle_stage.fact_id =
    duplicateIdProfile.identity.system_name.fact_id;
  let duplicateIdRejected = false;
  try {
    await callTool("euaiact_assess_system", duplicateIdProfile);
  } catch (error) {
    duplicateIdRejected = /Duplicate fact_id/.test(String(error));
  }
  test("assess: duplicate fact IDs are rejected before decisioning", duplicateIdRejected);

  const danglingEvidenceProfile = loadProfile("high-risk-low-impact-controlled.json");
  danglingEvidenceProfile.controls_and_evidence.controls[0].evidence_reference_ids = [
    "evidence.unknown",
  ];
  let danglingEvidenceRejected = false;
  try {
    await callTool("euaiact_assess_system", danglingEvidenceProfile);
  } catch (error) {
    danglingEvidenceRejected = /unknown evidence_id/.test(String(error));
  }
  test("assess: dangling evidence IDs are rejected before decisioning", danglingEvidenceRejected);

  const allFindingReferencesResolve = (response) => {
    const facts = new Set(response.facts_used.map((fact) => fact.fact_id));
    const assumptions = new Set(response.assumptions.map((item) => item.assumption_id));
    const missing = new Set(response.missing_facts.map((item) => item.missing_fact_id));
    return response.findings.every((finding) =>
      finding.fact_ids.every((id) => facts.has(id)) &&
      finding.assumption_ids.every((id) => assumptions.has(id)) &&
      finding.missing_fact_ids.every((id) => missing.has(id)) &&
      (finding.finding_basis === "legal_proposition"
        ? finding.provenance.length > 0
        : finding.provenance.length === 0) &&
      finding.provenance.every((record) =>
        record.instrument_id === "regulation-eu-2024-1689" &&
        record.instrument_status === "enacted" &&
        record.authority_source_ids.join(",") === "source.oj.2024.1689.original,source.oj.2026.1744" &&
        record.source_id && record.exact_provision && record.official_url &&
        record.operative_date &&
        record.source_status === "official_consolidated_snapshot_non_authentic" &&
        record.verification_level === "consolidated_snapshot_integrity_verified"));
  };
  test("assess: every finding has resolving fact and full provenance references",
    allFindingReferencesResolve(high) &&
    allFindingReferencesResolve(prohibited) &&
    allFindingReferencesResolve(sparse));
  test("assess: no numeric or other confidence field is emitted",
    !JSON.stringify([high, minimal, prohibited, sparse]).includes('"confidence"'));
  test("assess: curated labels are disclosed as summaries, not statutory text",
    [high, minimal, prohibited, sparse].every((output) =>
      output.warnings.some((warning) =>
        warning.code === "SUMMARY_ONLY" && warning.message.includes("not statutory text"))));
  test("assess: consolidated snapshot limitation is disclosed on every output",
    [high, minimal, prohibited, sparse].every((output) =>
      output.warnings.some((warning) => warning.code === "NON_BINDING_SOURCE")));
  test("assess: sealed corpus identity is fixed and complete",
    high.corpus.sha256 === "bd86e216a0c5958809275c972fc5ad9f8d9e358975d6dbec28556c1310d701d5" &&
    high.corpus.source_snapshot_ids.length === 4 &&
    readFileSync("compiler/PROOF-no-regression.md", "utf8").includes(high.corpus.sha256));

  const runtimeSchemaPairs = [
    ["schemas/shared.ts", "src/decision-contract/shared.ts"],
    ["schemas/profile.ts", "src/decision-contract/profile.ts"],
    ["schemas/finding.ts", "src/decision-contract/finding.ts"],
    ["schemas/result-blocks.ts", "src/decision-contract/result-blocks.ts"],
    ["schemas/envelope.ts", "src/decision-contract/envelope.ts"],
  ];
  test("assess: runtime schemas are byte-identical mirrors of the frozen contract",
    runtimeSchemaPairs.every(([frozen, runtime]) =>
      readFileSync(frozen, "utf8") === readFileSync(runtime, "utf8")));

  const index = loadJson(join(fixtureRoot, "fixture-index.json"));
  const hashes = loadJson(join(goldenRoot, "hashes.json"));
  test("assess: exactly 12 runnable contract profiles are golden-pinned",
    index.cases.length === 12 && hashes.goldens.length === 12);
  const unicodeCompare = (left, right) => {
    const a = [...left].map((character) => character.codePointAt(0));
    const b = [...right].map((character) => character.codePointAt(0));
    for (let index = 0; index < Math.min(a.length, b.length); index++) {
      if (a[index] !== b[index]) return a[index] - b[index];
    }
    return a.length - b.length;
  };
  const isSorted = (values, compare = unicodeCompare) =>
    values.every((value, index) => index === 0 || compare(values[index - 1], value) <= 0);
  const blockOrder = { legal_classification: 0, impact: 1, implementation_readiness: 2 };
  const routeOrder = { prohibited: 0, high_risk: 1, transparency_duty: 2, gpai: 3, minimal: 4 };
  const atomicOrder = [
    "euaiact_annex_iv_checklist",
    "euaiact_answer_question",
    "euaiact_assess_art6_3_exception",
    "euaiact_calculate_penalty",
    "euaiact_check_deadlines",
    "euaiact_check_gpai_systemic_risk",
    "euaiact_classify_system",
    "euaiact_get_article",
    "euaiact_get_obligations",
  ];
  const orderingConforms = (output) =>
    isSorted(output.corpus.source_snapshot_ids) &&
    isSorted(output.facts_used.map((item) => item.fact_id)) &&
    output.facts_used.every((item) => isSorted(item.evidence_reference_ids)) &&
    isSorted(output.assumptions.map((item) => item.assumption_id)) &&
    output.assumptions.every((item) => isSorted(item.source_fact_ids)) &&
    isSorted(output.missing_facts.map((item) => `${item.profile_path}\u0000${item.missing_fact_id}`)) &&
    isSorted(output.findings, (left, right) =>
      blockOrder[left.block] - blockOrder[right.block] || unicodeCompare(left.finding_id, right.finding_id)) &&
    output.findings.every((finding) =>
      isSorted(finding.fact_ids) &&
      isSorted(finding.assumption_ids) &&
      isSorted(finding.missing_fact_ids) &&
      isSorted(finding.provenance, (left, right) =>
        unicodeCompare(left.source_id, right.source_id) ||
        unicodeCompare(left.exact_provision, right.exact_provision) ||
        unicodeCompare(left.operative_date, right.operative_date))) &&
    isSorted(output.warnings, (left, right) =>
      unicodeCompare(left.code, right.code) || unicodeCompare(left.warning_id, right.warning_id)) &&
    output.warnings.every((warning) => isSorted(warning.finding_ids)) &&
    isSorted(output.recommended_next_calls, (left, right) =>
      atomicOrder.indexOf(left.tool_name) - atomicOrder.indexOf(right.tool_name)) &&
    output.recommended_next_calls.every((call) => isSorted(call.input_fact_ids)) &&
    isSorted(output.legal_classification.routes, (left, right) =>
      routeOrder[left.route] - routeOrder[right.route]);
  const goldenOutputs = [];
  for (const fixture of index.cases) {
    const output = await runAssessment(fixture.profile);
    goldenOutputs.push(output);
    const golden = loadJson(join(goldenRoot, fixture.golden));
    const expected = hashes.goldens.find((item) => item.case_id === fixture.case_id);
    test(`assess golden: ${fixture.case_id}`,
      assessSystemResponseSchema.safeParse(output).success &&
      canonicalize(output) === canonicalize(golden) &&
      canonicalResponseHash(output) === expected?.canonical_sha256);
  }
  test("assess: all normative response ordering rules hold across the golden set",
    goldenOutputs.every(orderingConforms));
  test("assess: every canonical golden response stays within the 64 KiB bound",
    goldenOutputs.every((output) => Buffer.byteLength(canonicalize(output), "utf8") <= 65_536));

  const permutedProfile = loadProfile("high-risk-low-impact-controlled.json");
  permutedProfile.controls_and_evidence.evidence_references[0].supports_fact_ids.reverse();
  const orderedProfileResult = await runAssessment("high-risk-low-impact-controlled.json");
  const permutedProfileResult = structured(await callTool("euaiact_assess_system", permutedProfile));
  test("assess: input ID order is normalized before decisioning",
    canonicalResponseHash(orderedProfileResult) === canonicalResponseHash(permutedProfileResult));

  // Material influence without a consequence or a decision subject gives the impact
  // block nothing to describe. 1.5.0 threw a TypeError on this input; it must abstain
  // on impact and leave the legal classification exactly as it was.
  const influenceOnlyProfile = loadProfile("contract-high-risk.json");
  delete influenceOnlyProfile.decision_context.decision_consequence;
  delete influenceOnlyProfile.decision_context.decision_subject;
  const influenceOnlyResult = structured(await callTool("euaiact_assess_system", influenceOnlyProfile));
  const contractHighRiskResult = await runAssessment("contract-high-risk.json");
  test("assess: material influence without consequence or subject abstains on impact",
    assessSystemResponseSchema.safeParse(influenceOnlyResult).success &&
    influenceOnlyResult.impact.status === "undetermined" &&
    influenceOnlyResult.missing_facts.some((fact) =>
      fact.missing_fact_id === "missing.impact.consequence" && fact.decisive));
  test("assess: abstaining on impact leaves the legal classification unchanged",
    canonicalize(influenceOnlyResult.legal_classification) ===
      canonicalize(contractHighRiskResult.legal_classification));

  let internalFailureMessage = "";
  try {
    await callTool("euaiact_assess_system", null);
  } catch (error) {
    internalFailureMessage = error.message;
  }
  test("assess: an unexpected exception is reported as a server defect, not a bare runtime error",
    internalFailureMessage.includes("internal server error") &&
    internalFailureMessage.includes("not a finding about the described system") &&
    internalFailureMessage.includes("Detail:"));

  const determinismHashes = [];
  for (let run = 0; run < 10; run++) {
    determinismHashes.push(canonicalResponseHash(await runAssessment("contract-high-risk.json")));
  }
  test("assess: same normalized profile has one canonical hash across 10 runs",
    new Set(determinismHashes).size === 1 &&
    determinismHashes[0] === hashes.goldens[0].canonical_sha256);

  const compatibility = loadJson("tests/fixtures/compatibility/atomic-tools-1.5-baseline.json");
  const RealDate = Date;
  const fixedInstant = compatibility.fixed_instant;
  globalThis.Date = class FixedDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(fixedInstant);
      else super(...args);
    }
    static now() { return RealDate.parse(fixedInstant); }
  };
  try {
    for (const fixture of compatibility.fixtures) {
      const actual = await callTool(fixture.tool_name, fixture.input);
      const serialized = JSON.stringify(actual);
      test(`atomic compatibility: ${fixture.tool_name}`,
        Buffer.byteLength(serialized, "utf8") === fixture.baseline_bytes &&
        createHash("sha256").update(serialized, "utf8").digest("hex") === fixture.baseline_sha256);
    }
  } finally {
    globalThis.Date = RealDate;
  }
}

// ─── SITE LINKS ─────────────────────────────────────────────────────────────
// 1.5.0 shipped 23 lexbeam.com links to pages that do not exist. This runs offline: it
// holds src/ to an allowlist of known live pages. scripts/check-links.mjs requests the
// same pages over the network during release verification.
console.log("\n🔗 SITE LINKS");
{
  const { collectSiteUrls } = await import("./scripts/site-links.mjs");
  const { faqDatabase } = await import("./dist/knowledge/faq-database.js");
  const knownLive = new Set(
    JSON.parse(readFileSync("tests/fixtures/site/known-live-urls.json", "utf8")).urls,
  );
  const inSource = collectSiteUrls(["src"], [".ts"]);
  const unknown = [...inSource.keys()].filter((url) => !knownLive.has(url));
  if (unknown.length > 0) console.log(`     not in known-live-urls.json: ${unknown.join(", ")}`);
  test("site links: every lexbeam.com URL in src/ is a known live page", unknown.length === 0);
  test("site links: the scan sees literal URLs and BRANDING.baseUrl templates alike",
    inSource.has("https://lexbeam.com/kontakt") &&
    inSource.has("https://lexbeam.com/de/wissen/ki-verordnung-klassifizierung"));
  test("site links: all 24 FAQ entries link to a known live page",
    faqDatabase.length === 24 && faqDatabase.every((entry) => knownLive.has(entry.lexbeamUrl)));
}

// ─── SUMMARY ────────────────────────────────────────────────────────────────
console.log(`\n${"=".repeat(50)}`);
console.log(`RESULTS: ${pass} passed, ${fail} failed out of ${pass + fail} tests`);
if (fail === 0) {
  console.log("🎉 ALL TESTS PASS");
} else {
  console.log("⚠️ FAILURES DETECTED - FIX BEFORE SHIP");
}
process.exit(fail > 0 ? 1 : 0);
