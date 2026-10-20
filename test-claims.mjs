/**
 * CLAIM MATRIX - every load-bearing legal fact the server serves, checked on
 * BOTH sides:
 *
 *   law side:     the pinned corpus (law/) must contain the supporting text.
 *                 If the law moves and the corpus is re-pinned, these fail
 *                 loudly instead of the product drifting silently.
 *   served side:  the built knowledge/tools must state the same fact.
 *                 If code drifts from the corpus, these fail.
 *
 * Run: node test-claims.mjs   (CI runs it after test.mjs)
 */
import { readFileSync } from "node:fs";

let pass = 0;
let fail = 0;
function check(id, side, ok) {
  if (ok) {
    pass++;
  } else {
    fail++;
    console.error(`  ❌ ${id} [${side}]`);
  }
}

// Normalised corpus: whitespace collapsed so needles match across line breaks.
const norm = (s) => s.replace(/\s+/g, " ");
const CONSOLIDATED = norm(readFileSync("law/celex-02024R1689-20260727-consolidated.txt", "utf8"));
const OMNIBUS = norm(readFileSync("law/celex-32026R1744-omnibus.txt", "utf8"));
const DECISION_2274 = norm(readFileSync("law/celex-32026D2274-harmonised-standards.txt", "utf8"));
const inLaw = (needle, corpus = CONSOLIDATED) => corpus.includes(norm(needle));
// Article-bounded slice: needles must hold WITHIN the article they claim, not
// anywhere in the corpus (cross-model round 3: global includes() let unrelated
// passages satisfy a claim while the claimed passage changed meaning).
const sliceBetween = (start, end, corpus = CONSOLIDATED) => {
  const i = corpus.indexOf(start);
  if (i < 0) return "";
  const j = corpus.indexOf(end, i + start.length);
  return j < 0 ? corpus.slice(i) : corpus.slice(i, j);
};
// Two needles within `span` chars of each other inside a slice.
const nearAnchor = (hay, anchor, needle, span = 400) => {
  let i = hay.indexOf(anchor);
  while (i >= 0) {
    if (hay.slice(Math.max(0, i - span), i + anchor.length + span).includes(needle)) return true;
    i = hay.indexOf(anchor, i + 1);
  }
  return false;
};
const ART99 = sliceBetween("Article 99 Penalties", "Article 100 Administrative fines");
const ART100 = sliceBetween("Article 100 Administrative fines", "Article 101 Fines");
const ART101 = sliceBetween("Article 101 Fines for providers", "Article 102");
const ART73 = sliceBetween("Article 73 Reporting of serious incidents", "Article 74");
const ART111 = sliceBetween("Article 111 AI systems already placed", "Article 112 Evaluation");
const ART10 = sliceBetween("Article 10 Data and data governance", "Article 11");
const ART2 = sliceBetween("Article 2 Scope", "Article 3 Definitions");
const ART5 = sliceBetween("Article 5 Prohibited AI practices", "Article 6 Classification rules");
const ART50 = sliceBetween("Article 50 Transparency obligations", "Article 51 Classification");
const ART51 = sliceBetween("Article 51 Classification of general-purpose AI models", "Article 52");
const ART52 = sliceBetween("Article 52 Procedure", "Article 53 Obligations");
const ART6 = sliceBetween("Article 6 Classification rules", "Article 7 Amendments");
const ART17 = sliceBetween("Article 17 Quality management system", "Article 18 Documentation keeping");
const ART40 = sliceBetween("Article 40 Harmonised standards", "Article 41 Common specifications");
const ART43 = sliceBetween("Article 43 Conformity assessment", "Article 44");
const ART63 = sliceBetween("Article 63 Derogations for specific operators", "CHAPTER VII");
const ANNEX_IV = sliceBetween("ANNEX IV Technical documentation referred to in Article 11(1)", "ANNEX V");
const ANNEX_VI = sliceBetween("ANNEX VI Conformity assessment procedure based on internal control", "ANNEX VII");

// Served-side sources
const { getMilestonesWithDaysRemaining, getOperativeHighRiskDates } = await import("./dist/knowledge/deadlines.js");
const { omnibusEnactment } = await import("./dist/knowledge/digital-omnibus.js");
const { getPenaltyTier, calculateMaxFine } = await import("./dist/knowledge/penalties.js");
const { articles } = await import("./dist/knowledge/articles.js");
const { annexIIICategories, prohibitedPractices } = await import("./dist/knowledge/annex-iii.js");
const { faqDatabase } = await import("./dist/knowledge/faq-database.js");
const { buildStandardsPayload } = await import("./dist/knowledge/standards.js");
const { annexIVItems } = await import("./dist/knowledge/annex-iv.js");
const STANDARDS = buildStandardsPayload();
const EN18286 = STANDARDS.cited_harmonised_standards.find((x) => x.reference === "EN 18286:2026");
const SERVER_BUNDLE = norm(readFileSync("dist/server.js", "utf8"));
const ARTICLE_TOOL_BUNDLE = norm(readFileSync("dist/tools/article.js", "utf8"));
const ASSESSMENT_BUNDLE = norm(readFileSync("dist/decision-contract/assess-system.js", "utf8"));
const README = norm(readFileSync("README.md", "utf8"));
const CHANGELOG = norm(readFileSync("CHANGELOG.md", "utf8"));

const milestones = getMilestonesWithDaysRemaining();
const dates = getOperativeHighRiskDates();
const art = (n) => articles.find((a) => a.number === n);
const milestone = (d) => milestones.find((m) => m.date === d);
const faq = (id) => faqDatabase.find((entry) => entry.id === id)?.answer ?? "";

function toolHandler(registerFn) {
  let h;
  registerFn({ registerTool: (n, m, f) => { h = f; } });
  return h;
}

console.log("CLAIM MATRIX: law side = pinned corpus, served side = built dist\n");

// ── Application dates ────────────────────────────────────────────────────────

check("D1 general application 2 Aug 2026 (Art. 113, 2nd para)", "law",
  inLaw("It shall apply from 2 August 2026"));
check("D1", "served", milestone("2026-08-02") !== undefined);

check("D2 prohibitions + literacy from 2 Feb 2025 (Art. 113(3)(a))", "law",
  inLaw("Chapters I and II shall apply from 2 February 2025"));
check("D2", "served", milestone("2025-02-02")?.articles.includes("Art. 5"));

check("D3 new prohibitions (ba)/(bb) + 5(1a)/(1b) from 2 Dec 2026", "law",
  inLaw("points (ba) and (bb), and Article 5(1a) and (1b) which shall apply from 2 December 2026"));
check("D3", "served", milestone("2026-12-02")?.articles.includes("Art. 5(1)(ba)"));

check("D4 GPAI/governance/Ch. XII except 101 from 2 Aug 2025 (Art. 113(3)(b))", "law",
  inLaw("Chapter III Section 4, Chapter V, Chapter VII and Chapter XII and Article 78 shall apply from 2 August 2025, with the exception of Article 101"));
check("D4", "served", milestone("2025-08-02")?.articles.includes("Art. 99") && milestone("2025-08-02")?.articles.includes("Art. 100"));

check("D5 Arts. 99-100 NOT dated 2026 on the served timeline", "served",
  !milestone("2026-08-02")?.articles.includes("Art. 99") && !milestone("2026-08-02")?.articles.includes("Art. 100"));

check("D6 Annex III high-risk from 2 Dec 2027 (Art. 113(3)(c)(i))", "law",
  inLaw("2 December 2027 as regards AI systems classified as high-risk pursuant to Article 6(2)"));
check("D6", "served", dates.annexIiiHighRisk === "2027-12-02" && milestone("2027-12-02") !== undefined);

check("D7 Annex I high-risk from 2 Aug 2028 (Art. 113(3)(c)(ii))", "law",
  inLaw("2 August 2028 as regards AI systems classified as high-risk pursuant to Article 6(1)"));
check("D7", "served", dates.annexIHighRisk === "2028-08-02" && milestone("2028-08-02") !== undefined);

check("D8 the deferral covers Chapter III Sections 1-3 except Art. 6(5)", "law",
  inLaw("Chapter III, Sections 1, 2, and 3, with the exception of Article 6(5), shall apply from"));
check("D8 2027 milestone articles stay within Sections 1-3", "served",
  ["Art. 43", "Art. 47", "Art. 49", "Art. 72", "Art. 73"].every((a) => !milestone("2027-12-02")?.articles.includes(a)));

check("D9 Arts. 102-110 from 27 July 2026 (Art. 113(3)(d))", "law",
  inLaw("Articles 102 to 110 shall apply from 27 July 2026"));

check("D10 legacy GPAI until 2 Aug 2027 (Art. 111(3))", "law",
  nearAnchor(ART111, "general-purpose AI models", "2 August 2027", 500));
check("D10", "served", dates.legacyGpaiCompliance === "2027-08-02" && milestone("2027-08-02") !== undefined);

check("D11 legacy synthetic-content Art. 50(2) by 2 Dec 2026 (Art. 111(4))", "law",
  inLaw("comply with Article 50(2) by 2 December 2026"));
check("D11", "served", milestone("2026-12-02")?.articles.includes("Art. 111(4)"));

check("D12 Omnibus entry into force: third day after publication (Art. 4)", "law",
  inLaw("shall enter into force on the third day following that of its publication in the Official Journal", OMNIBUS));
check("D12 served enactment record", "served",
  omnibusEnactment.celex === "32026R1744" && omnibusEnactment.ojPublicationDate === "2026-07-24" && omnibusEnactment.entryIntoForce === "2026-07-27");

// ── Thresholds and amounts ───────────────────────────────────────────────────

check("T1 GPAI systemic-risk presumption: statutory text is strictly greater than 10^25 FLOPs", "law",
  ART51.includes("measured in floating point operations is greater than 10") && nearAnchor(ART51, "greater than 10", "25", 12));
{
  const h = toolHandler((await import("./dist/tools/gpai-systemic.js")).registerGpaiSystemicTool);
  const at = (await h({ training_flops: 1e25 })).structuredContent;
  const over = (await h({ training_flops: 1.0000001e25 })).structuredContent;
  check("T1 adjudicated conservative product boundary", "served",
    at.crosses_flops_threshold === true && over.crosses_flops_threshold === true);
}

check("P1 Art. 99(3): EUR 35 000 000 / 7 %, whichever higher", "law",
  nearAnchor(ART99, "35 000 000", "7 %", 400) && nearAnchor(ART99, "35 000 000", "whichever is higher", 400));
check("P1", "served", (() => { const t = getPenaltyTier("prohibited"); return t.maxFineEUR === 35000000 && t.globalTurnoverPercentage === 7; })());

check("P2 Art. 99(4): EUR 15 000 000 / 3 %, incl. new point (da)", "law",
  nearAnchor(ART99, "15 000 000", "3 %", 400) && nearAnchor(ART99, "(da)", "Article 25(2) and (4)", 200));
check("P2", "served", (() => { const t = getPenaltyTier("high_risk"); return t.maxFineEUR === 15000000 && t.globalTurnoverPercentage === 3; })());

check("P3 Art. 99(5): EUR 7 500 000 / 1 %", "law",
  nearAnchor(ART99, "7 500 000", "1 %", 400) && nearAnchor(ART99, "7 500 000", "incorrect, incomplete or misleading information", 400));
check("P3", "served", (() => { const t = getPenaltyTier("false_info"); return t.maxFineEUR === 7500000 && t.globalTurnoverPercentage === 1; })());

check("P4 Art. 99(6) SME lower-of covers paragraphs 3, 4 and 5", "law",
  inLaw("in the case of SMEs, including start-ups, each fine referred to in paragraphs 3, 4 and 5") || inLaw("In the case of SMEs, including start-ups, each fine referred to in this Article"));
check("P4", "served", calculateMaxFine("prohibited", 1e9, true).applicableFine === 35000000);

check("P5 Art. 99(6a) SMC lower-of covers paragraphs 4 and 5 ONLY", "law",
  inLaw("In the case of SMCs, each fine referred to in paragraphs 4 and 5"));
{
  const h = toolHandler((await import("./dist/tools/penalties.js")).registerPenaltiesTool);
  const smcHigh = (await h({ violation_type: "high_risk", annual_turnover_eur: 1e9, is_sme: false, is_smc: true })).structuredContent;
  const smcPro = (await h({ violation_type: "prohibited", annual_turnover_eur: 1e9, is_sme: false, is_smc: true })).structuredContent;
  check("P5", "served", smcHigh.max_fine.applicable_fine_eur === 15000000 && smcPro.max_fine.applicable_fine_eur === 70000000);
}

check("P6 Art. 101: 3 % or EUR 15 000 000, whichever higher, no SME rule", "law",
  ART101.includes("15 000 000") && ART101.includes("3 %") && ART101.includes("whichever is higher") && !ART101.includes("SMC") && !ART101.includes("SMEs"));
check("P6", "served", (() => { const t = getPenaltyTier("gpai"); return t.maxFineEUR === 15000000 && t.smeLowerApplies === false; })());

check("P7 Art. 100 EDPS: EUR 1 500 000 (Art. 5) / EUR 750 000", "law",
  ART100.includes("1 500 000") && ART100.includes("750 000"));
check("P7", "served", /1,500,000|1\.5 million|EUR 1,500,000/.test(art("100")?.summary ?? "") || /1 500 000/.test(art("100")?.summary ?? ""));

check("N1 Art. 52(1): notify without delay, within two weeks", "law",
  inLaw("in any event within two weeks"));
check("N1", "served", /two weeks/.test(JSON.stringify((await (toolHandler((await import("./dist/tools/gpai-systemic.js")).registerGpaiSystemicTool))({ training_flops: 2e25 })).structuredContent.notification_duty)));

// ── Exceptions, carve-outs and structural rules ──────────────────────────────

check("E1 Annex III(1)(a) verification exclusion", "law",
  inLaw("verification the sole purpose of which is to confirm that a specific natural person is the person he or she claims to be"));
check("E1", "served", (() => {
  const d = annexIIICategories.find((c) => c.number === 1)?.description ?? "";
  // Semantic, not lexical: the exclusion must be STATED as an exclusion.
  return /verification/i.test(d) && /exclu/i.test(d) && !/verification[^.]{0,80}(is|are)[^.]{0,40}high-risk/i.test(d);
})());

check("E2 Annex III(5)(b) financial-fraud carve-out", "law",
  inLaw("with the exception of AI systems used for the purpose of detecting financial fraud"));
check("E2", "served", /detecting financial fraud/.test(annexIIICategories.find((c) => c.number === 5)?.description ?? ""));

check("E3 Annex III(7)(d) travel-document verification scope", "law",
  inLaw("with the exception of the verification of travel documents"));
check("E3", "served", /travel[- ]document/i.test(annexIIICategories.find((c) => c.number === 7)?.description ?? "") || /travel documents/i.test(JSON.stringify(annexIIICategories.find((c) => c.number === 7) ?? {})));

check("E4 Art. 6(3) profiling override sits in the THIRD subparagraph", "law",
  // Art. 6(6) empowers amending "paragraph 3, second subparagraph" = the conditions list,
  // so the profiling sentence is the third. Both facts must be in the corpus.
  inLaw("Notwithstanding the first subparagraph, an AI system referred to in Annex III shall always be considered to be high-risk where the AI system performs profiling") && inLaw("paragraph 3, second subparagraph"));
{
  const h = toolHandler((await import("./dist/tools/art6-exception.js")).registerArt6ExceptionTool);
  const r = (await h({ performs_profiling: true, narrow_procedural_task: true, no_significant_risk_to_health_safety_fundamental_rights: true })).structuredContent;
  check("E4", "served", /third subparagraph/.test(JSON.stringify(r)) && !/second subparagraph/.test(JSON.stringify(r)));
}

check("E5 Art. 6(1a) non-safety assistance not a safety component", "law",
  inLaw("solely used for non-safety related aspects of user assistance"));
check("E5", "served", /6\(1a\)/.test(art("6")?.summary ?? ""));

check("E6 Art. 6(1c) radio-spectrum conformity does not fulfil 6(1)(b)", "law",
  inLaw("risks relating to the distribution of radio spectrum"));
check("E6", "served", /radio spectrum/.test(art("6")?.summary ?? ""));

check("E7 Art. 10(5) deleted; special-category processing moved to Art. 4a", "law",
  inLaw("Processing of special categories of personal data for bias detection and correction") && ART10.includes("\u2014".repeat(5)));
check("E7", "served", /deleted/.test(art("10")?.summary ?? "") && art("4a") !== undefined);

check("E8 Art. 4a safeguards + paragraph 2 + no-obligation sentence", "law",
  inLaw("including synthetic or anonymised data") && inLaw("deleted once the bias has been corrected") && inLaw("Providers and deployers of other AI systems and models") && inLaw("does not create any obligation to conduct such bias detection"));
check("E8", "served", /synthetic or anonymised/.test(art("4a")?.summary ?? "") && /delet/i.test(art("4a")?.summary ?? "") && /other AI systems and models/i.test(art("4a")?.summary ?? "") && /does not create any obligation/.test(art("4a")?.summary ?? ""));

check("E9 Art. 5(1)(ba) consent standard", "law",
  inLaw("freely-given, specific, informed, unambiguous and explicit consent"));
check("E9", "served", /freely[- ]given, specific, informed, unambiguous and explicit consent/.test(art("5")?.summary ?? ""));

check("E10 Art. 5(1)(bb) CSAM full clause incl. the without-right defence", "law",
  inLaw("within the meaning of Article 2, points (c) and (e), of Directive 2011/93/EU, except where a \u2018without right\u2019 defence applies under national law"));
check("E10", "served", /2011\/93/.test(art("5")?.summary ?? "") && /without right.{0,15}defence applies under national law/.test(art("5")?.summary ?? ""));
check("E10b Art. 5(1b) qualifies point (ba) only", "law",
  inLaw("For the purposes of paragraph 1, first subparagraph, point (ba), an AI system that manipulates material in a way that does not increase the exposure"));
check("E10b", "served", /\(1b\) qualifies point \(ba\) ONLY/i.test(art("5")?.summary ?? ""));

check("MIG2-A Article 2(1) contains the three relevant territorial nexus routes", "law",
  ART2.includes("placing on the market") &&
  ART2.includes("deployers of AI systems that have their place of establishment") &&
  ART2.includes("where the output produced by the AI system is used in the Union"));
check("MIG2-A", "served",
  ASSESSMENT_BUNDLE.includes("Article 2(1)") &&
  ASSESSMENT_BUNDLE.includes("2026-08-02") &&
  ASSESSMENT_BUNDLE.includes("explicitNegativeEUNexus"));

check("MIG2-B Article 5(1a) separates provider and deployer purpose gates", "law",
  ART5.includes("that generation or manipulation is the intended purpose") &&
  ART5.includes("the deployer uses the system for the purpose of generating or manipulating"));
check("MIG2-B", "served",
  ASSESSMENT_BUNDLE.includes("Article 5(1a)(a)(i)") &&
  ASSESSMENT_BUNDLE.includes("Article 5(1a)(a)(ii)") &&
  ASSESSMENT_BUNDLE.includes("Article 5(1a)(b)"));

check("MIG2-C Article 5(1b) is the point (ba)-only manipulation exclusion", "law",
  ART5.includes("point (ba)") &&
  ART5.includes("does not increase the exposure") &&
  ART5.includes("alter the nature of any depicted sexually explicit activities"));
check("MIG2-C", "served",
  ASSESSMENT_BUNDLE.includes("Article 5(1b)") &&
  ASSESSMENT_BUNDLE.includes("Article 5(1)(ba) does not apply"));

check("MIG2-D Article 50(2) excludes standard editing and non-substantial alteration", "law",
  ART50.includes("assistive function for standard editing") &&
  ART50.includes("do not substantially alter the input data"));
check("MIG2-D", "served",
  ASSESSMENT_BUNDLE.includes("standard_editing_assistive_function") &&
  ASSESSMENT_BUNDLE.includes("substantially_alters_input_or_semantics") &&
  ASSESSMENT_BUNDLE.includes("Article 50(2) does not apply"));

check("MIG2-E Article 51(1)(a) and 51(2) support the compute presumption", "law",
  ART51.includes("high impact capabilities") &&
  ART51.includes("pursuant to paragraph 1, point (a)"));
check("MIG2-E", "served",
  ASSESSMENT_BUNDLE.includes("Article 51(1)(a)") &&
  ASSESSMENT_BUNDLE.includes("Article 51(2)"));

check("MIG2-F Article 52 carries notification and exceptional rebuttal", "law",
  ART52.includes("within two weeks") &&
  ART52.includes("sufficiently substantiated arguments") &&
  ART52.includes("exceptionally"));
check("MIG2-F", "served",
  ASSESSMENT_BUNDLE.includes("Article 52(1)") &&
  ASSESSMENT_BUNDLE.includes("Article 52(2)"));

check("E11 Art. 49(1) registration: Annex III except point 2", "law",
  inLaw("with the exception of high-risk AI systems referred to in point 2 of Annex III"));

check("E12 Art. 73 windows: 15 days / 2 days / 10 days", "law",
  ART73.includes("not later than 15 days") && ART73.includes("not later than two days") && ART73.includes("not later than 10 days"));
check("E12", "served", /15 days/.test(art("73")?.summary ?? "") && /10 days/.test(art("73")?.summary ?? "") && /(2|two) days/.test(art("73")?.summary ?? ""));

check("E13 verification exclusion served as SCOPED, never minimal/high-risk", "served", await (async () => {
  const h = toolHandler((await import("./dist/tools/classify.js")).registerClassifyTool);
  const r = (await h({ signals: { uses_biometrics: true, biometric_sole_purpose_verification: true } })).structuredContent;
  return /Not high-risk under Annex III\(1\)\(a\)/.test(r.obligations_summary) && r.risk_classification !== "minimal" && r.risk_classification !== "high-risk";
})());

// ── Audited truth corrections ───────────────────────────────────────────────
// Every audit row has a corpus assertion and a served-surface assertion.

check("A-M015 Art. 50 duties are paragraph- and actor-specific", "law",
  inLaw("Providers shall ensure that AI systems intended to interact directly with natural persons") &&
  inLaw("Providers of AI systems, including general-purpose AI systems, generating synthetic audio, image, video or text content") &&
  inLaw("Deployers of an emotion recognition system or a biometric categorisation system") &&
  inLaw("Deployers of an AI system that generates or manipulates image, audio or video content constituting a deep fake"));
check("A-M015", "served",
  SERVER_BUNDLE.includes("Art. 50 contains paragraph-specific duties") &&
  SERVER_BUNDLE.includes("Apply the actor, scope, and exceptions in the relevant paragraph") &&
  !SERVER_BUNDLE.includes("chatbots, emotion recognition, deepfakes, AI-generated content must be disclosed"));

check("A-M016 minimal label does not displace Art. 4 and Art. 95 is voluntary", "law",
  inLaw("Providers and deployers of AI systems shall take measures to support the development of AI literacy") &&
  inLaw("voluntary application to AI systems, other than high-risk AI systems"));
check("A-M016", "served",
  SERVER_BUNDLE.includes("No higher-tier obligation is identified from this risk label alone") &&
  SERVER_BUNDLE.includes("Art. 4 and any other independently triggered provisions still require separate review") &&
  SERVER_BUNDLE.includes("Art. 95 codes of conduct are voluntary"));

check("A-M029 Art. 5(1a) covers ba and bb; 5(1b) covers ba only", "law",
  inLaw("For the purposes of paragraph 1, first subparagraph, points (ba) and (bb)") &&
  inLaw("For the purposes of paragraph 1, first subparagraph, point (ba), an AI system that manipulates material"));
check("A-M029", "served", (() => {
  const description = prohibitedPractices.find((practice) => practice.id === "art5-1bb")?.description ?? "";
  return description.includes("Art. 5(1a) applies") &&
    description.includes("Art. 5(1b) does not apply to point (bb)") &&
    description.includes("it qualifies point (ba) only");
})());

check("A-M061 penalties attach to the exact Art. 99 tiers", "law",
  nearAnchor(ART99, "Article 5", "35 000 000", 300) &&
  nearAnchor(ART99, "obligations of providers pursuant to Article 16", "15 000 000", 700) &&
  nearAnchor(ART99, "incorrect, incomplete or misleading information", "7 500 000", 300) &&
  ART99.includes("In the case of SMCs, each fine referred to in paragraphs 4 and 5"));
check("A-M061", "served", (() => {
  const answer = faq("faq-16-penalties");
  return answer.includes("violations enumerated in Art. 99(4)") &&
    answer.includes("For an undertaking the higher ceiling applies") &&
    answer.includes("small mid-caps only for paragraphs 4 and 5") &&
    !answer.includes("High-risk and other obligation violations");
})());

check("A-M062 Art. 49 registration has three bounded routes", "law",
  inLaw("high-risk AI system listed in Annex III, with the exception of high-risk AI systems referred to in point 2 of Annex III") &&
  inLaw("AI system for which the provider has concluded that it is not high-risk according to Article 6(3)") &&
  inLaw("deployers that are public authorities, Union institutions, bodies, offices or agencies or persons acting on their behalf"));
check("A-M062", "served", (() => {
  const answer = faq("faq-19-registration");
  return answer.includes("Registration applies only where Art. 49 says so") &&
    answer.includes("except a system in Annex III point 2") &&
    answer.includes("Art. 6(3) non-high-risk determination") &&
    answer.includes("not a blanket registration rule for every high-risk system");
})());

check("A-M063 healthcare high-risk status requires a statutory route", "law",
  inLaw("is intended to be used as a safety component of a product, or the AI system is itself a product") &&
  inLaw("is required to undergo a third-party conformity assessment") &&
  inLaw("emergency healthcare patient triage systems") &&
  inLaw("Notwithstanding the first subparagraph, an AI system referred to in Annex III shall always be considered to be high-risk where the AI system performs profiling"));
check("A-M063", "served", (() => {
  const answer = faq("faq-15-healthcare");
  return answer.includes("Art. 6(1), Annex I, product-law, third-party-conformity") &&
    answer.includes("Annex III(5)(d)") &&
    answer.includes("subject to Art. 6(3)") &&
    answer.includes("not high-risk merely because they are used in healthcare");
})());

check("A-M064 national legal-services status must be verified", "law",
  inLaw("This text is meant purely as a documentation tool and has no legal effect") &&
  inLaw("The authentic versions of the relevant acts, including their preambles, are those published in the Official Journal"));
check("A-M064", "served",
  README.includes("must be verified against current official sources") &&
  README.includes("qualified local counsel") &&
  !README.includes("not Rechtsberatung im Sinne"));

check("A-M073 deferred high-risk dates are unconditional", "law",
  inLaw("2 December 2027 as regards AI systems classified as high-risk pursuant to Article 6(2)") &&
  inLaw("2 August 2028 as regards AI systems classified as high-risk pursuant to Article 6(1)"));
check("A-M073", "served",
  CHANGELOG.includes("Enacted Art. 113, third paragraph, point (c), makes both dates unconditional") &&
  !CHANGELOG.includes("Both are backstop dates; a Commission decision on support measures can bring them forward"));

check("A-M074 changelog preserves the Art. 5 qualifier split", "law",
  inLaw("For the purposes of paragraph 1, first subparagraph, points (ba) and (bb)") &&
  inLaw("For the purposes of paragraph 1, first subparagraph, point (ba), an AI system that manipulates material"));
check("A-M074", "served",
  CHANGELOG.includes("Art. 5(1a) applies to both points; Art. 5(1b) qualifies point (ba) only") &&
  !CHANGELOG.includes("with the Art. 5(1a) and (1b) qualifications"));

check("A-M078 profiling override is the Art. 6(3) third subparagraph", "law",
  inLaw("Notwithstanding the first subparagraph, an AI system referred to in Annex III shall always be considered to be high-risk where the AI system performs profiling") &&
  inLaw("paragraph 3, second subparagraph"));
check("A-M078", "served",
  CHANGELOG.includes("profiling block (Art. 6(3), third subparagraph)") &&
  !CHANGELOG.includes("profiling block (Art. 6(3) second subparagraph)"));

check("A-M080 Annex IV is the statutory minimum as applicable", "law",
  inLaw("The technical documentation referred to in Article 11(1) shall contain at least the following information, as applicable to the relevant AI system"));
check("A-M080", "served", await (async () => {
  const h = toolHandler((await import("./dist/tools/annex-iv.js")).registerAnnexIvTool);
  const output = (await h({ format: "checklist" })).structuredContent;
  return output.guidance_note === "The nine titles and descriptions summarise Annex IV. `sub_items` are non-binding implementation prompts, are not verbatim Annex IV text, and do not create additional legal requirements. Under Article 11(1), SMEs, including start-ups, and SMCs may provide the Annex IV elements in a simplified manner only by using the Commission form referred to in that paragraph." &&
    output.checklist_markdown.includes(output.guidance_note) &&
    SERVER_BUNDLE.includes(output.guidance_note);
})());

check("A-M081 Annex IV simplified form covers SMEs, start-ups and SMCs", "law",
  inLaw("SMEs, including start-ups, and SMCs, may provide the elements of the technical documentation specified in Annex IV in a simplified manner") &&
  inLaw("Where an SME, including a start-up, or an SMC, opts to provide the information required in Annex IV in a simplified manner, it shall use the form referred to in this paragraph"));
check("A-M081", "served", await (async () => {
  const h = toolHandler((await import("./dist/tools/annex-iv.js")).registerAnnexIvTool);
  const output = (await h({ format: "checklist", sme_simplified: true })).structuredContent;
  return output.guidance_note === "The nine titles and descriptions summarise Annex IV. `sub_items` are non-binding implementation prompts, are not verbatim Annex IV text, and do not create additional legal requirements. Under Article 11(1), SMEs, including start-ups, and SMCs may provide the Annex IV elements in a simplified manner only by using the Commission form referred to in that paragraph." &&
    output.sme_note === output.guidance_note &&
    art("11")?.summary.includes("SMEs, including start-ups, and SMCs");
})());

check("A-M082 Art. 73 two-day route incorporates Art. 3(49)(b)", "law",
  ART73.includes("a serious incident as defined in Article 3, point (49)(b)") &&
  inLaw("a serious and irreversible disruption of the management or operation of critical infrastructure"));
check("A-M082", "served",
  /serious and irreversible disruption of the management or operation of critical infrastructure under Art\. 3\(49\)\(b\).{0,100}(2|two) days/.test(art("73")?.summary ?? "") &&
  !/incidents involving widespread infringement or affecting critical infrastructure/.test(art("73")?.summary ?? ""));

check("A-M083 Art. 73 provider investigation and Art. 26 deployer cooperation stay separate", "law",
  ART73.includes("Following the reporting of a serious incident pursuant to paragraph 1, the provider shall, without delay, perform the necessary investigations") &&
  ART73.includes("This shall include a risk assessment of the incident, and corrective action") &&
  ART73.includes("where relevant with the notified body concerned") &&
  inLaw("Deployers shall cooperate with the relevant competent authorities in any action those authorities take in relation to the high-risk AI system"));
check("A-M083", "served",
  art("73")?.summary.endsWith("Following a report, the provider must investigate, take corrective action, and cooperate with the competent authorities and, where relevant, the notified body under Article 73(6). Deployers have the separate Article 26(12) duty to cooperate with relevant competent authorities in actions concerning the high-risk system.") &&
  !art("73")?.summary.includes("competent authorities and the Commission in any investigation"));

check("A-GROUND operational summaries are not official statutory text", "law",
  inLaw("This text is meant purely as a documentation tool and has no legal effect") &&
  inLaw("authentic versions of the relevant acts"));
check("A-GROUND", "served",
  ARTICLE_TOOL_BUNDLE.includes("The summary is not statutory text") &&
  ARTICLE_TOOL_BUNDLE.includes("verify the official provision before quoting it") &&
  !ARTICLE_TOOL_BUNDLE.includes("quote article text with a link") &&
  SERVER_BUNDLE.includes("Do not quote the summary as statutory text") &&
  SERVER_BUNDLE.includes("quote only wording verified there") &&
  !SERVER_BUNDLE.includes("fetch the text and EUR-Lex URL") &&
  README.includes("verify definitive wording in the official source before quoting"));

// ── Run-2 adjudicated fixes (blind run 2, ADJUDICATION-2-RUN2) ───────────────

const ANNEXI = sliceBetween("ANNEX I List of Union harmonisation legislation", "ANNEX II");
const { ANNEX_I_INSTRUMENTS, matchAnnexIInstrument, assessAnnexIListing } =
  await import("./dist/decision-contract/annex-i-instruments.js");

check("R2-F3a Art. 6(1)(a) conditions the Annex I route on the listed acts", "law",
  inLaw("covered by the Union harmonisation legislation listed in Annex I") &&
  inLaw("that AI system shall be considered to be high-risk where both of the following conditions are fulfilled"));
check("R2-F3a", "served",
  ASSESSMENT_BUNDLE.includes("Union harmonisation legislation listed in Annex I") &&
  ASSESSMENT_BUNDLE.includes("finding.legal.high-risk.annex-i.not-listed.001"));

check("R2-F3b every pinned instrument sits at its Annex I point in the corpus", "law",
  ANNEXI.length > 0 &&
  ANNEX_I_INSTRUMENTS.every((item) => ANNEXI.includes(`${item.annex_point}. ${item.citation}`)));
check("R2-F3b", "served",
  ANNEX_I_INSTRUMENTS.length === 20 &&
  ANNEX_I_INSTRUMENTS.map((item) => item.annex_point).join(",") ===
    "2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21" &&
  matchAnnexIInstrument("Regulation (EU) 2017/745").entry?.annex_point === 11 &&
  matchAnnexIInstrument("32017R0745").entry?.annex_point === 11);

check("R2-F3c Annex I Section A point 1 is deleted by M1", "law", (() => {
  const sectionAHead = sliceBetween(
    "based on the New Legislative Framework",
    "2. Directive 2009/48/EC",
    ANNEXI,
  );
  return sectionAHead.length > 0 && !/\d\.\s+(Directive|Regulation)/.test(sectionAHead);
})());
check("R2-F3c", "served",
  !ANNEX_I_INSTRUMENTS.some((item) => item.annex_point === 1));

check("R2-F3d 1223/2009 appears once in the act, only inside the point 11 title", "law",
  CONSOLIDATED.split("1223/2009").length === 2 &&
  nearAnchor(ANNEXI, "Regulation (EU) 2017/745", "1223/2009", 300));
check("R2-F3d", "served",
  matchAnnexIInstrument("Regulation (EC) No 1223/2009 on cosmetic products").status === "not_listed" &&
  matchAnnexIInstrument("Directive 2001/83/EC").status === "not_listed" &&
  assessAnnexIListing(["Regulation (EC) No 1223/2009 on cosmetic products"]).refuted === true &&
  assessAnnexIListing(["Regulation (EU) 2017/745"]).refuted === false);

check("R2-F3e machinery Regulation (EU) 2023/1230 is Annex I point 21 (M1)", "law",
  ANNEXI.includes("21. Regulation (EU) 2023/1230") &&
  nearAnchor(ANNEXI, "21. Regulation (EU) 2023/1230", "on machinery", 200));
check("R2-F3e", "served",
  matchAnnexIInstrument("Regulation (EU) 2023/1230 on machinery").entry?.annex_point === 21);

check("R2-F3f a refuted listing yields the negative Article 6(1) boundary at the regime date", "law",
  inLaw("2 August 2028 as regards AI systems classified as high-risk pursuant to Article 6(1)"));
check("R2-F3f", "served", await (async () => {
  const { assessSystem } = await import("./dist/decision-contract/assess-system.js");
  const fact = (fact_id, value) => ({
    fact_id,
    value,
    origin: "explicit_structured_input",
    verification: "caller_asserted",
    evidence_reference_ids: [],
  });
  const out = await assessSystem({
    profile_version: "1.0",
    intended_use: {
      intended_purpose: fact("fact.purpose", "Recommend cosmetic shade formulations to laboratory technicians"),
      reasonably_foreseeable_uses: [],
    },
    role_facts: { roles: [fact("fact.role.provider", "provider")] },
    geography: {
      jurisdictions: [fact("fact.geo.eu", "EU")],
      used_in_eu: fact("fact.geo.used", true),
      affected_person_groups: [fact("fact.geo.group", "Cosmetics consumers")],
    },
    decision_context: { decision_consequence: fact("fact.decision", "Suggestions reviewed by laboratory staff") },
    annex_i: {
      product_or_safety_component: fact("fact.annex-i.product", true),
      annex_i_legislation: [
        fact("fact.annex-i.cosmetics", "Regulation (EC) No 1223/2009 on cosmetic products"),
      ],
      third_party_conformity_assessment_required: fact("fact.annex-i.conformity", true),
    },
  });
  return out.legal_classification.routes.map((route) => route.route).join(",") === "minimal" &&
    out.findings.some((finding) =>
      finding.determination === "does_not_apply" &&
      finding.provenance.some((item) =>
        item.exact_provision === "Article 6(1)" && item.operative_date === "2028-08-02")) &&
    !out.findings.some((finding) =>
      finding.determination === "applies" &&
      finding.provenance.some((item) => item.exact_provision.includes("Article 6(1)")));
})());

check("R2-F2a Annex III routes are intended-purpose predicates (Art. 3(12), Annex III point 4)", "law",
  inLaw("‘intended purpose’ means the use for which an AI system is intended by the provider") &&
  inLaw("AI systems intended to be used for the recruitment or selection of natural persons") &&
  inLaw("to allocate tasks based on individual behaviour or personal traits or characteristics or to monitor and evaluate the performance and behaviour of persons in such relationships"));
check("R2-F2a", "served", await (async () => {
  const { assessSystem } = await import("./dist/decision-contract/assess-system.js");
  const fact = (fact_id, value) => ({
    fact_id,
    value,
    origin: "explicit_structured_input",
    verification: "caller_asserted",
    evidence_reference_ids: [],
  });
  const out = await assessSystem({
    profile_version: "1.0",
    role_facts: { roles: [fact("fact.role.provider", "provider")] },
    annex_iii: {
      domain: fact("fact.annex-iii.domain", "employment"),
      purpose: fact("fact.annex-iii.purpose", "Scoring pilot for workforce evaluation across teams"),
    },
  });
  const decisive = out.missing_facts.filter((item) => item.decisive);
  return out.status === "undetermined" &&
    out.legal_classification.routes.length === 0 &&
    decisive.some((item) => item.profile_path === "/intended_use/intended_purpose") &&
    decisive.some((item) =>
      item.missing_fact_id === "missing.legal.jurisdiction" &&
      [
        "/geography/placed_on_eu_market",
        "/geography/used_in_eu",
        "/geography/output_used_in_eu",
        "/geography/jurisdictions",
      ].includes(item.profile_path));
})());

check("R2-F2b the territorial nexus is an Article 2(1) predicate served at leaf level", "law",
  ART2.includes("providers placing on the market or putting into service AI systems") &&
  ART2.includes("deployers of AI systems that have their place of establishment or are located within the Union") &&
  ART2.includes("where the output produced by the AI system is used in the Union"));
check("R2-F2b", "served",
  ASSESSMENT_BUNDLE.includes("/geography/placed_on_eu_market") &&
  ASSESSMENT_BUNDLE.includes("/geography/used_in_eu") &&
  ASSESSMENT_BUNDLE.includes("/geography/output_used_in_eu") &&
  ASSESSMENT_BUNDLE.includes("Which fact establishes the Union nexus"));

// ── Harmonised standards (1.7.3): law side = Implementing Decision (EU) 2026/2274 and the consolidated act ──

check("HS1 EN 18286:2026 reference published by Implementing Decision (EU) 2026/2274 of 12 October 2026, OJ 14.10.2026", "law",
  DECISION_2274.includes("COMMISSION IMPLEMENTING DECISION (EU) 2026/2274 of 12 October 2026") &&
  DECISION_2274.includes("14.10.2026") &&
  DECISION_2274.includes("EN 18286:2026 Artificial intelligence – Quality management system for EU AI Act regulatory purposes"));
check("HS1", "served",
  EN18286?.oj_publication.celex === "32026D2274" && EN18286?.oj_publication.adopted === "2026-10-12" &&
  EN18286?.oj_publication.published === "2026-10-14" && EN18286?.oj_publication.status === "enacted_oj" &&
  EN18286?.title === "Artificial intelligence - Quality management system for EU AI Act regulatory purposes" &&
  STANDARDS.cited_harmonised_standards.length === 1);

check("HS2 in force on publication; presumption from the publication of the reference", "law",
  DECISION_2274.includes("This Decision shall enter into force on the day of its publication") &&
  DECISION_2274.includes("from the date of publication of the reference of such standard in the Official Journal"));
check("HS2", "served",
  EN18286?.oj_publication.entry_into_force === "2026-10-14" && EN18286?.presumption_of_conformity_from === "2026-10-14");

check("HS3 the Annex lists the reference without a restriction", "law",
  sliceBetween("ANNEX No Reference and title of the harmonised standard", "ELI:", DECISION_2274).length > 0 &&
  !/restrict/i.test(sliceBetween("ANNEX No Reference and title of the harmonised standard", "ELI:", DECISION_2274)));
check("HS3", "served", EN18286?.oj_publication.restriction === null);

check("HS4 standardisation request C(2025) 3871, Annex I point 9: QMS including post-market monitoring", "law",
  DECISION_2274.includes("Implementing Decision C(2025) 3871 of 23 June 2025") &&
  DECISION_2274.includes("point 9 of Annex I") &&
  DECISION_2274.includes("quality management systems for providers of AI systems, including post-market monitoring processes"));
check("HS4", "served",
  /C\(2025\) 3871/.test(EN18286?.standardisation_request ?? "") && /point 9/.test(EN18286?.standardisation_request ?? "") &&
  STANDARDS.standardisation_request.areas.filter((a) => a.oj_reference !== null).length === 1);

check("A40-1 presumption scope: Chapter III Section 2 or Chapter V Sections 2 and 3, to the extent covered", "law",
  ART40.includes("shall be presumed to be in conformity with the requirements set out in Section 2 of this Chapter") &&
  ART40.includes("Chapter V, Sections 2 and 3") &&
  ART40.includes("to the extent that those standards cover those requirements or obligations"));
check("A40-1", "served",
  /Chapter III, Section 2/.test(art("40")?.summary ?? "") && /Chapter V, Sections 2 and 3/.test(art("40")?.summary ?? "") &&
  /to the extent the standards cover them/.test(art("40")?.summary ?? ""));

check("A40-2 the Omnibus request covers Chapter III, Sections 2 and 3", "law",
  ART40.includes("presumption of conformity with the requirements or obligations set out in Chapter III, Sections 2 and 3"));
check("A40-2", "served",
  /Chapter III, Sections 2 and 3/.test(art("40")?.summary ?? "") && /Sections 2 and 3/.test(EN18286?.presumption_basis ?? ""));

check("A43-1 biometrics: Annex VII where no harmonised standard or common specification is applied for Section 2", "law",
  ART43.includes("in demonstrating the compliance of a high-risk AI system with the requirements set out in Section 2, the provider has applied harmonised standards referred to in Article 40") &&
  ART43.includes("harmonised standards referred to in Article 40 do not exist, and common specifications referred to in Article 41 are not available"));
check("A43-1", "served",
  /do not exist and common specifications are not available/.test(art("43")?.summary ?? "") &&
  /must follow Annex VII/.test(art("43")?.summary ?? "") &&
  /does not on its own open the Annex VI route/.test(art("43")?.summary ?? ""));

check("A43-3 Annex I Section A route includes the Art. 17 QMS assessment", "law",
  ART43.includes("Assessment of the quality management system set out in Article 17 shall also be undertaken"));
check("A43-3", "served", /Art\. 17 quality management system is assessed as well/.test(art("43")?.summary ?? ""));

check("A17-2 proportionality names SMEs, start-ups and SMCs", "law",
  ART17.includes("proportionate to the size of the provider’s organisation, in particular, if the provider is an SME, including a start-up, or an SMC"));
check("A17-2", "served", /SME, including a start-up, or an SMC/.test(art("17")?.summary ?? ""));

check("A17-4 financial institutions take harmonised standards into account", "law",
  ART17.includes("any harmonised standards referred to in Article 40 shall be taken into account"));
check("A17-4", "served", /taking harmonised standards referred to in Art\. 40 into account/.test(art("17")?.summary ?? ""));

check("A63-1 SMEs without partner or linked enterprises: simplified QMS elements", "law",
  ART63.includes("may comply with certain elements of the quality management system required by Article 17 in a simplified manner") &&
  ART63.includes("partner enterprises or linked enterprises"));
check("A63-1", "served", /Art\. 63\(1\)/.test(art("17")?.summary ?? "") && /simplified manner/.test(art("17")?.summary ?? ""));

check("A6-5 Art. 6(5) guidelines due no later than 2 February 2026", "law",
  ART6.includes("no later than 2 February 2026, provide guidelines"));
check("A6-5", "served",
  /no later than 2 February 2026/.test(art("6")?.summary ?? "") &&
  STANDARDS.commission_guidance.find((g) => g.id === "guidelines_high_risk_classification_draft")?.status === "commission_guideline_draft");

check("A50-7 code adequacy is assessed for Art. 50(2) and (4) under Art. 50(7)", "law",
  ART50.includes("adequate to ensure compliance with the obligations laid down in paragraphs 2 and 4 of this Article"));
check("A50-7", "served",
  STANDARDS.commission_guidance.find((g) => g.id === "code_transparency_ai_generated_content")?.status === "code_adequate_voluntary_tool" &&
  STANDARDS.commission_guidance.find((g) => g.id === "code_transparency_ai_generated_content")?.ai_act_provisions.includes("Art. 50(7)"));

check("AX4-7 Annex IV point 7: list cited standards, else describe the Section 2 solutions", "law",
  ANNEX_IV.includes("A list of the harmonised standards applied in full or in part the references of which have been published in the Official Journal") &&
  ANNEX_IV.includes("a detailed description of the solutions adopted to meet the requirements set out in Chapter III, Section 2"));
check("AX4-7", "served",
  annexIVItems.find((i) => i.number === 7)?.sub_items.some((x) => /EN 18286:2026/.test(x)) &&
  annexIVItems.find((i) => i.number === 7)?.sub_items.some((x) => /Chapter III, Section 2/.test(x)));

check("AX6-2 internal control verifies the QMS against Art. 17", "law",
  ANNEX_VI.includes("The provider verifies that the established quality management system is in compliance with the requirements of Article 17"));
check("AX6-2", "served", EN18286?.where_it_matters.some((x) => /Annex VI point 2/.test(x)));

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\nCLAIM MATRIX RESULTS: ${pass} passed, ${fail} failed out of ${pass + fail} checks`);
if (fail > 0) process.exit(1);
