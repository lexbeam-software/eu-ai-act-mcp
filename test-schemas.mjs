/**
 * GATE 3 - POST-SERIALIZATION SCHEMA VALIDATION
 *
 * Every tool's structuredContent is round-tripped through JSON
 * (JSON.parse(JSON.stringify(x))) and then validated against the tool's own
 * advertised outputSchema. The round-trip is the point: values can be valid
 * in memory and invalid on the wire (Infinity serialises to null), and the
 * SDK does not re-validate outputs. Resources get inline structural schemas
 * and the same treatment.
 *
 * Run: node test-schemas.mjs   (CI runs it after the claim matrix)
 */
import { z } from "zod";

let pass = 0;
let fail = 0;
function check(id, ok, detail = "") {
  if (ok) pass++;
  else {
    fail++;
    console.error(`  ❌ ${id}${detail ? ` :: ${detail}` : ""}`);
  }
}

const schemas = await import("./dist/schemas/" + "classify.js");
const { classifyOutputSchema } = schemas;
const { deadlinesOutputSchema } = await import("./dist/schemas/deadlines.js");
const { obligationsOutputSchema } = await import("./dist/schemas/obligations.js");
const { faqOutputSchema } = await import("./dist/schemas/faq.js");
const { penaltiesOutputSchema } = await import("./dist/schemas/penalties.js");
const { articleOutputSchema } = await import("./dist/schemas/article.js");
const { gpaiSystemicOutputSchema } = await import("./dist/schemas/gpai-systemic.js");
const { art6ExceptionOutputSchema } = await import("./dist/schemas/art6.js");
const { annexIvOutputSchema } = await import("./dist/schemas/annex-iv.js");

// Capture every tool handler through a stub server.
const registered = {};
const stub = { registerTool: (name, meta, handler) => { registered[name] = { meta, handler }; } };
for (const mod of [
  "classify", "deadlines", "obligations", "faq", "penalties",
  "article", "gpai-systemic", "art6-exception", "annex-iv",
]) {
  const m = await import(`./dist/tools/${mod}.js`);
  const fn = Object.values(m).find((v) => typeof v === "function" && v.name.startsWith("register"));
  fn(stub);
}

const roundTrip = (x) => JSON.parse(JSON.stringify(x));

async function validate(tool, schema, input, label) {
  const { meta, handler } = registered[tool];
  let out;
  try {
    // Mirror production: the SDK parses input against inputSchema (applying
    // defaults) BEFORE the handler runs. Bypassing this made defaults vanish.
    const parsedInput = meta.inputSchema?.safeParse ? meta.inputSchema.parse(input) : input;
    out = (await handler(parsedInput)).structuredContent;
  } catch (e) {
    check(`${tool} ${label}`, false, `handler threw: ${e.message}`);
    return;
  }
  const wire = roundTrip(out);
  const parsed = schema.safeParse(wire);
  check(
    `${tool} ${label}`,
    parsed.success,
    parsed.success ? "" : parsed.error.issues.slice(0, 2).map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
  );
}

console.log("GATE 3: post-serialization output validation, 9 tools\n");

// classify - including edge shapes (empty, all-false, exclusion, prohibited)
await validate("euaiact_classify_system", classifyOutputSchema, { description: "AI system that screens CVs for recruitment", signals: { domain: "employment" } }, "annex-iii");
await validate("euaiact_classify_system", classifyOutputSchema, {}, "empty input");
await validate("euaiact_classify_system", classifyOutputSchema, { signals: { performs_social_scoring: true } }, "prohibited");
await validate("euaiact_classify_system", classifyOutputSchema, { signals: { uses_biometrics: true, biometric_sole_purpose_verification: true } }, "verification exclusion");
await validate("euaiact_classify_system", classifyOutputSchema, {
  description: "email spam filter",
  signals: {
    domain: "other", uses_biometrics: false, biometric_sole_purpose_verification: false,
    biometric_remote_identification: false, biometric_realtime: false, biometric_law_enforcement: false,
    biometric_publicly_accessible_space: false, is_safety_component_of_regulated_product: false,
    requires_third_party_conformity_assessment: false, affects_fundamental_rights: false,
    targets_children_or_vulnerable: false, generates_synthetic_content: false,
    interacts_with_natural_persons: false, performs_emotion_recognition_workplace_or_school: false,
    performs_social_scoring: false, social_scoring_unrelated_context: false,
    social_scoring_unjustified_or_disproportionate: false,
    performs_social_scoring_by_public_authority: false,
  },
}, "minimal (all-false)");

// deadlines - default, filtered, pending pack
await validate("euaiact_check_deadlines", deadlinesOutputSchema, {}, "default");
await validate("euaiact_check_deadlines", deadlinesOutputSchema, { only_upcoming: true }, "only_upcoming");
await validate("euaiact_check_deadlines", deadlinesOutputSchema, { include_pending_omnibus: true }, "pending pack");

// obligations - roles x levels incl. the empty-result path
await validate("euaiact_get_obligations", obligationsOutputSchema, { role: "provider", risk_level: "high-risk", high_risk_source: "annex_iii" }, "provider hr annex-iii");
await validate("euaiact_get_obligations", obligationsOutputSchema, { role: "provider", risk_level: "high-risk", high_risk_source: "annex_i" }, "provider hr annex-i");
await validate("euaiact_get_obligations", obligationsOutputSchema, { role: "deployer", risk_level: "high-risk", high_risk_source: "annex_iii" }, "deployer hr");
await validate("euaiact_get_obligations", obligationsOutputSchema, { role: "provider", risk_level: "gpai", gpai_model_placed_on_market_before_2025_08_02: true }, "gpai legacy");
await validate("euaiact_get_obligations", obligationsOutputSchema, { role: "deployer", risk_level: "minimal" }, "minimal");
await validate("euaiact_get_obligations", obligationsOutputSchema, { role: "provider", risk_level: "limited" }, "limited");
await validate("euaiact_get_obligations", obligationsOutputSchema, { role: "provider", risk_level: "high-risk", high_risk_source: "annex_iii", annex_iii_point: 2, filter_keyword: "FRIA" }, "empty-result path");

// faq - match and abstention
await validate("euaiact_answer_question", faqOutputSchema, { question: "What are the deadlines under the EU AI Act?" }, "match");
await validate("euaiact_answer_question", faqOutputSchema, { question: "completely unrelated question about bananas" }, "abstention");

// penalties - each tier x protection flags (valid inputs; invalid are schema-rejected upstream)
for (const vt of ["prohibited", "high_risk", "gpai", "false_info"]) {
  await validate("euaiact_calculate_penalty", penaltiesOutputSchema, { violation_type: vt, annual_turnover_eur: 1e9, is_sme: false, is_smc: false }, `${vt} plain`);
  await validate("euaiact_calculate_penalty", penaltiesOutputSchema, { violation_type: vt, annual_turnover_eur: 1e9, is_sme: true, is_smc: false }, `${vt} sme`);
  await validate("euaiact_calculate_penalty", penaltiesOutputSchema, { violation_type: vt, annual_turnover_eur: 1e9, is_sme: false, is_smc: true }, `${vt} smc`);
}
await validate("euaiact_calculate_penalty", penaltiesOutputSchema, { violation_type: "prohibited", annual_turnover_eur: 0 }, "zero turnover");

// article - present, new 4a, and the unavailable shape
await validate("euaiact_get_article", articleOutputSchema, { article: "113" }, "113");
await validate("euaiact_get_article", articleOutputSchema, { article: "4a" }, "4a");
await validate("euaiact_get_article", articleOutputSchema, { article: "999" }, "unavailable shape");

// gpai - undetermined, boundary, over, designated
await validate("euaiact_check_gpai_systemic_risk", gpaiSystemicOutputSchema, {}, "undetermined");
await validate("euaiact_check_gpai_systemic_risk", gpaiSystemicOutputSchema, { training_flops: 1e25 }, "at threshold");
await validate("euaiact_check_gpai_systemic_risk", gpaiSystemicOutputSchema, { training_flops: 3e25 }, "over threshold");
await validate("euaiact_check_gpai_systemic_risk", gpaiSystemicOutputSchema, { commission_designated: true }, "designated");

// art6-exception - profiling veto, condition met, nothing met
await validate("euaiact_assess_art6_3_exception", art6ExceptionOutputSchema, { performs_profiling: true, narrow_procedural_task: true, no_significant_risk_to_health_safety_fundamental_rights: true }, "profiling veto");
await validate("euaiact_assess_art6_3_exception", art6ExceptionOutputSchema, { performs_profiling: false, narrow_procedural_task: true, no_significant_risk_to_health_safety_fundamental_rights: true }, "condition met");
await validate("euaiact_assess_art6_3_exception", art6ExceptionOutputSchema, { performs_profiling: false }, "nothing met");

// annex-iv - default and markdown format
await validate("euaiact_annex_iv_checklist", annexIvOutputSchema, {}, "default");
await validate("euaiact_annex_iv_checklist", annexIvOutputSchema, { format: "checklist" }, "checklist");
await validate("euaiact_annex_iv_checklist", annexIvOutputSchema, { format: "checklist", sme_simplified: true }, "checklist sme");

// ── Resources: capture via a stub McpServer covering resource+prompt+tool ────
console.log("\nGATE 3: resource payloads, 6 resources\n");
const resources = {};
const serverStub = {
  registerTool: () => {},
  resource: (name, uri, meta, handler) => { resources[uri] = handler; },
  prompt: () => {},
};
const { createServer } = await import("./dist/server.js");
// createServer builds a real McpServer; re-register against our stub instead:
const serverModule = await import("./dist/server.js");
try {
  // The exported createServer instantiates the SDK server. To capture
  // resources without the SDK, re-run its body against the stub via the
  // registration functions is not possible from outside; so instead we
  // instantiate the real server and read its internals if available, falling
  // back to direct handler invocation through the SDK instance.
  const real = serverModule.createServer();
  const reg = real._registeredResources ?? real["_registeredResources"];
  if (reg) {
    for (const [uri, entry] of Object.entries(reg)) {
      resources[uri] = entry.readCallback ?? entry.handler ?? entry;
    }
  }
} catch (e) {
  console.error("  (could not introspect SDK server:", e.message + ")");
}

const RESOURCE_SCHEMAS = {
  "euaiact://timeline": z.object({
    regulation: z.string(),
    milestones: z.array(z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      event: z.string(),
      description: z.string(),
      status: z.enum(["in_effect", "upcoming", "proposal_only"]),
      articles: z.array(z.string()),
      key_obligations: z.array(z.string()),
      days_remaining: z.number().int(),
      is_past: z.boolean(),
    })).min(8),
    digital_omnibus: z.object({ status: z.string(), enacted: z.boolean(), note: z.string(), resource: z.string() }),
  }),
  "euaiact://risk-levels": z.object({
    risk_levels: z.array(z.object({ level: z.string(), description: z.string(), articles: z.array(z.string()) })).length(4),
    universal: z.object({ obligation: z.string(), article: z.string(), applies_to: z.string(), enforceable_since: z.string() }),
  }),
  "euaiact://annex/iii": z.object({
    annex: z.literal("III"),
    title: z.string(),
    categories: z.array(z.object({
      number: z.number().int().min(1).max(8),
      name: z.string(),
      description: z.string(),
      examples: z.array(z.string()),
      relevant_articles: z.array(z.string()),
    })).length(8),
    note: z.string(),
    eurlex_url: z.string().includes("02024R1689-20260727"),
  }),
  "euaiact://annex/iv": z.object({
    annex: z.literal("IV"),
    title: z.string(),
    items: z.array(z.any()).length(9),
    guidance_note: z.string().includes("non-binding implementation prompts"),
    relevant_articles: z.array(z.string()),
    eurlex_url: z.string().includes("02024R1689-20260727"),
  }),
  "euaiact://omnibus": z.object({}).passthrough(), // structure asserted loosely; content is claim-matrix territory
  "euaiact://standards": z.object({
    reviewed_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    summary: z.string(),
    cited_harmonised_standards: z.array(z.object({
      reference: z.string(),
      title: z.string(),
      developed_by: z.string(),
      ai_act_provisions_covered: z.array(z.string()).min(1),
      not_covered: z.string(),
      oj_publication: z.object({
        act: z.string(),
        status: z.literal("enacted_oj"),
        celex: z.string(),
        adopted: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        published: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        entry_into_force: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        eli: z.string().startsWith("http://data.europa.eu/eli/"),
        restriction: z.string().nullable(),
      }).strict(),
      presumption_of_conformity_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      presumption_basis: z.string(),
      standardisation_request: z.string(),
      design: z.string(),
      where_it_matters: z.array(z.string()).min(1),
    }).strict()).min(1),
    standardisation_request: z.object({
      act: z.string(),
      addressees: z.string(),
      areas: z.array(z.object({ area: z.string(), ai_act_provisions: z.array(z.string()), oj_reference: z.string().nullable() }).strict()).length(10),
    }).strict(),
    not_harmonised_under_the_ai_act: z.array(z.object({ reference: z.string(), note: z.string() }).strict()),
    commission_guidance: z.array(z.object({
      id: z.string(),
      title: z.string(),
      status: z.enum(["commission_guideline_draft", "commission_guideline_final", "code_under_assessment", "code_adequate_voluntary_tool", "commission_study"]),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      url: z.string().startsWith("https://"),
      ai_act_provisions: z.array(z.string()),
      note: z.string(),
    }).strict()),
    sources: z.array(z.object({ title: z.string(), url: z.string() }).strict()).min(1),
    caveat: z.string(),
  }).strict(),
};

for (const [uri, schema] of Object.entries(RESOURCE_SCHEMAS)) {
  const handler = resources[uri];
  if (typeof handler !== "function") {
    check(`resource ${uri}`, false, "handler not captured from SDK server internals");
    continue;
  }
  try {
    const result = await handler();
    const text = result.contents?.[0]?.text;
    const parsed = JSON.parse(text); // wire round-trip is inherent: resources serve strings
    const v = schema.safeParse(parsed);
    check(`resource ${uri}`, v.success, v.success ? "" : v.error.issues.slice(0, 2).map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  } catch (e) {
    check(`resource ${uri}`, false, e.message);
  }
}

console.log(`\nGATE 3 RESULTS: ${pass} passed, ${fail} failed out of ${pass + fail} checks`);
if (fail > 0) process.exit(1);
