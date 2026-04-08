// Direct function tests for the EU AI Act MCP server.
// Run `npm run build` first so dist/ is up to date.
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
import { getMilestonesWithDaysRemaining, digitalOmnibus } from "./dist/knowledge/deadlines.js";
import {
  providerHighRiskObligations,
  deployerHighRiskObligations,
  limitedRiskTransparencyObligations,
  providerGPAIObligations,
  universalObligations,
} from "./dist/knowledge/obligations.js";
import { calculateMaxFine, getPenaltyTier } from "./dist/knowledge/penalties.js";
import { faqDatabase } from "./dist/knowledge/faq-database.js";
import { articles, findArticle } from "./dist/knowledge/articles.js";
import { annexIVItems } from "./dist/knowledge/annex-iv.js";
import { BRANDING, SERVER_INSTRUCTIONS } from "./dist/constants.js";
import { createServer } from "./dist/server.js";

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

  registerClassifyTool(fakeServer);
  registerDeadlinesTool(fakeServer);
  registerObligationsTool(fakeServer);
  registerFaqTool(fakeServer);
  registerPenaltiesTool(fakeServer);
  registerArticleTool(fakeServer);
  registerGpaiSystemicTool(fakeServer);
  registerArt6ExceptionTool(fakeServer);
  registerAnnexIvTool(fakeServer);

  const handler = registered[toolName];
  if (!handler) throw new Error(`Tool not registered: ${toolName}`);
  return handler(input);
}

// ─── SCHEMAS ────────────────────────────────────────────────────────────────
console.log("\n📋 SCHEMA VALIDATION");
test("classify: empty input (signals-only ok)", classifyInputSchema.safeParse({}).success);
test("classify: description+use_case", classifyInputSchema.safeParse({ description: "x", use_case: "y" }).success);
test("classify: signals only", classifyInputSchema.safeParse({ signals: { domain: "employment" } }).success);
test("obligations input parses", obligationsInputSchema.safeParse({ role: "provider", risk_level: "high-risk" }).success);
test("obligations gpai", obligationsInputSchema.safeParse({ role: "provider", risk_level: "gpai" }).success);
test("penalties input parses", penaltiesInputSchema.safeParse({ violation_type: "prohibited", annual_turnover_eur: 1000000 }).success);
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
  signalsRbi: { signals: { uses_biometrics: true, biometric_realtime: true, biometric_law_enforcement: true } },
  signalsEmployment: { signals: { domain: "employment" } },
  signalsSocialScoring: { signals: { performs_social_scoring_by_public_authority: true } },
  signalsChatbot: { signals: { interacts_with_natural_persons: true } },
  signalsSynthetic: { signals: { generates_synthetic_content: true } },
  signalsAnnexI: { signals: { is_safety_component_of_regulated_product: true } },
  signalsEmotionWorkplace: { signals: { performs_emotion_recognition_workplace_or_school: true } },
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
  "spellchecker text → minimal risk",
  structured(classifyResults.spellchecker).risk_classification === "minimal",
);

// Signals path
test(
  "signals RBI → prohibited Art. 5(1)(h) high confidence",
  structured(classifyResults.signalsRbi).risk_classification === "prohibited" &&
    structured(classifyResults.signalsRbi).confidence === "high" &&
    structured(classifyResults.signalsRbi).basis === "signals",
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
  "signals emotion recognition workplace → prohibited Art. 5(1)(f)",
  structured(classifyResults.signalsEmotionWorkplace).risk_classification === "prohibited",
);

// matched_signals + next_questions populated
test(
  "chatbot result includes matched_signals array",
  Array.isArray(structured(classifyResults.chatbot).matched_signals),
);
test(
  "empty-input classify returns follow-up questions",
  (await callTool("euaiact_classify_system", {})).structuredContent.next_questions.length > 0,
);
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
test("5 milestones total", milestones.length === 5);
test("Entry into force is past", milestones[0].isPast === true);
test("Aug 2026 is upcoming", milestones[3].isPast === false);
test("Aug 2027 is upcoming", milestones[4].isPast === false);
test("Digital Omnibus is proposal_only", digitalOmnibus.status === "proposal_only");

// Tool-level: only_upcoming filter
{
  const r = await callTool("euaiact_check_deadlines", { only_upcoming: true });
  test("deadlines only_upcoming filter drops past entries", structured(r).milestones.every((m) => !m.is_past));
  test("deadlines next_milestone shortcut populated", structured(r).next_milestone !== null);
}

// ─── OBLIGATIONS ────────────────────────────────────────────────────────────
console.log("\n📜 OBLIGATIONS");
test("Provider high-risk: 13 obligations", providerHighRiskObligations.length === 13);
test("Deployer high-risk: 8 obligations", deployerHighRiskObligations.length === 8);
test("Limited risk transparency: 4 obligations", limitedRiskTransparencyObligations.length === 4);
test("GPAI obligations: 8 obligations", providerGPAIObligations.length === 8);
test("Universal obligations: 1 (AI literacy)", universalObligations.length === 1);
{
  const r = await callTool("euaiact_get_obligations", { role: "provider", risk_level: "high-risk" });
  test("obligations tool has no `disclaimer` field", !("disclaimer" in structured(r)));
  test("obligations tool has no `source` field", !("source" in structured(r)));
  test("obligations tool includes lexbeam_url", typeof structured(r).lexbeam_url === "string");
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

// ─── NEW TOOLS (v1.1.0) ────────────────────────────────────────────────────
console.log("\n🆕 NEW TOOLS");

// get_article
test("articles corpus has Art. 5", articles.some((a) => a.number === "5"));
test("findArticle('5') returns Art. 5", findArticle("5")?.number === "5");
test("findArticle('Art. 99') returns Art. 99", findArticle("Art. 99")?.number === "99");
{
  const r = await callTool("euaiact_get_article", { article: "5" });
  const p = structured(r);
  test("get_article(5): available=true", p.available === true);
  test("get_article(5): has EUR-Lex URL", p.eurlex_url.includes("CELEX:32024R1689"));
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
