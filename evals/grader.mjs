#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assessSystemResponseSchema,
  systemProfileSchema,
} from "../dist/decision-contract/index.js";
import { registerAssessSystemTool } from "../dist/tools/assess-system.js";
import {
  canonicalResponseHash,
  canonicalize,
  deterministicResponseProjection,
} from "../dist/utils/canonical-json.js";

const RUNS_PER_CASE = 10;
const MAX_CANONICAL_BYTES = 65_536;
const GRADER_VERSION = "1.2.0";
const GRADER_FILE = fileURLToPath(import.meta.url);
const EVALS_ROOT = dirname(GRADER_FILE);
const REPO_ROOT = dirname(EVALS_ROOT);
const PUBLIC_ROOT = join(EVALS_ROOT, "public");
const MANIFEST_FILE = join(PUBLIC_ROOT, "manifest.json");
const PACKAGE_FILE = join(REPO_ROOT, "package.json");

const SAFETY_METRICS = [
  "response_schema",
  "abstention_correctness",
  "citation_integrity",
  "summary_disclosure",
  "unsupported_conclusions",
  "block_separation",
  "response_size",
  "determinism",
  "fixed_legal_boundaries",
];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sortUnique(values) {
  return [...new Set(values)].sort();
}

function sameValues(left, right) {
  return JSON.stringify(sortUnique(left)) === JSON.stringify(sortUnique(right));
}

function canonicalProvisionLabel(value) {
  return String(value).replace(/^Art\.\s*/i, "Article ");
}

function metric(evaluated = true) {
  const reasons = [];
  return {
    evaluated,
    get pass() {
      return reasons.length === 0;
    },
    reasons,
    fail(message) {
      if (!reasons.includes(message)) reasons.push(message);
    },
  };
}

function materializeMetric(value) {
  return {
    evaluated: value.evaluated,
    pass: value.pass,
    reasons: value.reasons,
  };
}

function findKeys(value, key, path = "$") {
  const matches = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => matches.push(...findKeys(item, key, `${path}[${index}]`)));
    return matches;
  }
  if (value && typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) {
      const childPath = `${path}.${childKey}`;
      if (childKey === key) matches.push(childPath);
      matches.push(...findKeys(childValue, key, childPath));
    }
  }
  return matches;
}

function corpusDigest(manifest, manifestRaw) {
  const hash = createHash("sha256");
  hash.update("manifest.json\0");
  hash.update(manifestRaw);
  for (const entry of manifest.cases) {
    for (const path of [entry.case_file, entry.profile_file]) {
      hash.update(`${path}\0`);
      hash.update(readFileSync(join(PUBLIC_ROOT, path)));
    }
  }
  return hash.digest("hex");
}

function validateCorpus(manifest) {
  if (manifest.corpus_kind !== "public") throw new Error("Manifest must declare corpus_kind public");
  if (manifest.synthetic_only !== true) throw new Error("Manifest must declare synthetic_only true");
  if (manifest.expected_values !== "properties_only") {
    throw new Error("Manifest must declare property-only expected values");
  }
  const provenanceExpectation = manifest.provenance_expectation;
  if (
    provenanceExpectation?.instrument_status !== "enacted" ||
    provenanceExpectation?.source_status !== "official_consolidated_snapshot_non_authentic" ||
    provenanceExpectation?.verification_level !== "consolidated_snapshot_integrity_verified" ||
    !Array.isArray(provenanceExpectation?.authority_source_ids) ||
    provenanceExpectation.authority_source_ids.length === 0 ||
    provenanceExpectation?.source_warning !== "Corpus verification confirms only the identity and integrity of the pinned files. It does not establish that the consolidated snapshot has legal effect, that the corpus is current or complete for the facts, that an interpretation is correct, or that a system is compliant, certified, approved, or has passed a conformity assessment."
  ) {
    throw new Error("Manifest must declare the MIGRATION-001 provenance expectation");
  }
  if (manifest.case_count !== 20 || manifest.cases.length !== 20) {
    throw new Error("The public corpus must contain exactly 20 cases");
  }
  if (new Set(manifest.cases.map((entry) => entry.case_id)).size !== 20) {
    throw new Error("Public case IDs must be unique");
  }
  for (const entry of manifest.cases) {
    const caseDefinition = readJson(join(PUBLIC_ROOT, entry.case_file));
    if (caseDefinition.case_id !== entry.case_id) {
      throw new Error(`Case ID mismatch for ${entry.case_id}`);
    }
    if (caseDefinition.profile_file !== "profile.json") {
      throw new Error(`${entry.case_id} must use its local profile.json`);
    }
    if (/\r|\n/.test(caseDefinition.description)) {
      throw new Error(`${entry.case_id} description must be one paragraph`);
    }
    if (findKeys(caseDefinition.expected, "confidence").length > 0) {
      throw new Error(`${entry.case_id} may not encode numeric legal confidence`);
    }
    const profile = readJson(join(PUBLIC_ROOT, entry.profile_file));
    systemProfileSchema.parse(profile);
  }
}

function captureAssessmentHandler() {
  let handler;
  registerAssessSystemTool({
    registerTool(name, _metadata, candidate) {
      if (name === "euaiact_assess_system") handler = candidate;
    },
  });
  if (!handler) throw new Error("euaiact_assess_system did not register a handler");
  return handler;
}

function blockByName(output, name) {
  if (name === "legal_classification") return output.legal_classification;
  if (name === "impact") return output.impact;
  return output.implementation_readiness;
}

function legalProvenance(output) {
  return output.findings
    .filter((finding) => finding.block === "legal_classification")
    .flatMap((finding) => finding.provenance);
}

function readinessExpectedDate(provision, expected) {
  const canonical = canonicalProvisionLabel(provision);
  if (/^Article 4(?:$|\()/.test(canonical)) return "2026-07-27";
  if (/^Article 50(?:$|\()/.test(canonical)) return "2026-08-02";
  if (/^Article (?:52|53|55)(?:$|\()/.test(canonical)) {
    return "2025-08-02";
  }
  if (/^Article 5(?:$|\()/.test(provision)) {
    return expected.required_legal_anchors.some((anchor) => /\(ba\)|\(bb\)/.test(anchor.provision))
      ? "2026-12-02"
      : "2025-02-02";
  }
  const highRiskAnchor = expected.required_legal_anchors.find((anchor) =>
    anchor.provision.startsWith("Article 6("),
  );
  return highRiskAnchor?.operative_date;
}

function assessRouting(output, expected) {
  const result = metric();
  const actualRoutes = output.legal_classification.routes.map((route) => route.route);
  if (output.legal_classification.status !== expected.block_statuses.legal_classification) {
    result.fail(
      `legal status expected ${expected.block_statuses.legal_classification}, received ${output.legal_classification.status}`,
    );
  }
  if (!sameValues(actualRoutes, expected.routes)) {
    result.fail(`routes expected [${expected.routes.join(", ")}], received [${actualRoutes.join(", ")}]`);
  }
  if (!sameValues(output.legal_classification.annex_iii_categories, expected.annex_iii_categories)) {
    result.fail(
      `Annex III categories expected [${expected.annex_iii_categories.join(", ")}], received [${output.legal_classification.annex_iii_categories.join(", ")}]`,
    );
  }
  return result;
}

function assessAbstention(output, expected) {
  const result = metric();
  const decisive = output.missing_facts.filter((item) => item.decisive);
  const actualIds = decisive.map((item) => item.missing_fact_id);
  if (expected.abstention) {
    if (output.status !== "undetermined") {
      result.fail(`expected top-level abstention, received ${output.status}`);
    }
    if (!sameValues(actualIds, expected.required_missing_fact_ids)) {
      result.fail(
        `decisive missing facts expected [${expected.required_missing_fact_ids.join(", ")}], received [${actualIds.join(", ")}]`,
      );
    }
    if (decisive.length === 0) result.fail("abstention has no decisive missing fact");
  } else if (decisive.length > 0) {
    result.fail(`unexpected decisive missing facts: ${actualIds.join(", ")}`);
  }
  for (const missing of decisive) {
    if (missing.question.trim().length === 0 || missing.reason.trim().length === 0) {
      result.fail(`${missing.missing_fact_id} lacks a question or reason`);
    }
    for (const affectedBlock of missing.affected_blocks) {
      if (blockByName(output, affectedBlock).status !== "undetermined") {
        result.fail(`${missing.missing_fact_id} affects a block that did not abstain: ${affectedBlock}`);
      }
    }
  }
  return result;
}

function assessCitationIntegrity(output, expected) {
  const result = metric();
  const corpusSources = new Set(output.corpus.source_snapshot_ids);
  for (const finding of output.findings) {
    if (finding.finding_basis === "legal_proposition" && finding.provenance.length === 0) {
      result.fail(`${finding.finding_id} legal proposition has no provenance`);
    }
    if (finding.finding_basis !== "legal_proposition" && finding.provenance.length !== 0) {
      result.fail(`${finding.finding_id} non-legal finding carries legal provenance`);
    }
    for (const provenance of finding.provenance) {
      if (!corpusSources.has(provenance.source_id)) {
        result.fail(`${finding.finding_id} cites a source outside the sealed law corpus`);
      }
      if (!provenance.official_url.startsWith("https://eur-lex.europa.eu/")) {
        result.fail(`${finding.finding_id} does not link to official EUR-Lex text`);
      }
      if (provenance.instrument_status !== "enacted") {
        result.fail(`${finding.finding_id} does not identify the instrument as enacted`);
      }
      if (provenance.source_status !== "official_consolidated_snapshot_non_authentic") {
        result.fail(`${finding.finding_id} misstates the consolidated snapshot's legal status`);
      }
      if (provenance.verification_level !== "consolidated_snapshot_integrity_verified") {
        result.fail(`${finding.finding_id} misstates what corpus verification establishes`);
      }
      if (!sameValues(provenance.authority_source_ids, [
        "source.oj.2024.1689.original",
        "source.oj.2026.1744",
      ])) {
        result.fail(`${finding.finding_id} lacks the authentic OJ authority source IDs`);
      }
      if (provenance.authority_source_ids.some((sourceId) => !corpusSources.has(sourceId))) {
        result.fail(`${finding.finding_id} names authority outside the sealed law corpus`);
      }
      if (finding.block === "implementation_readiness") {
        const expectedDate = readinessExpectedDate(provenance.exact_provision, expected);
        if (expectedDate && provenance.operative_date !== expectedDate) {
          result.fail(
            `${finding.finding_id} expected ${expectedDate} for ${provenance.exact_provision}, received ${provenance.operative_date}`,
          );
        }
      }
    }
  }
  const legal = legalProvenance(output);
  for (const anchor of expected.required_legal_anchors) {
    const present = legal.some(
      (item) =>
        item.exact_provision === anchor.provision && item.operative_date === anchor.operative_date,
    );
    if (!present) {
      result.fail(`missing legal anchor ${anchor.provision}@${anchor.operative_date}`);
    }
  }
  for (const provision of expected.forbidden_legal_provisions) {
    if (legal.some((item) => item.exact_provision === provision)) {
      result.fail(`forbidden legal provision emitted: ${provision}`);
    }
  }
  return result;
}

function assessSummaryDisclosure(output, expected) {
  const result = metric();
  const findingIds = sortUnique(output.findings.map((finding) => finding.finding_id));
  for (const code of expected.required_warning_codes) {
    if (!output.warnings.some((warning) => warning.code === code)) {
      result.fail(`missing required warning ${code}`);
    }
  }
  const summaryWarning = output.warnings.find((warning) => warning.code === "SUMMARY_ONLY");
  if (!summaryWarning) {
    result.fail("SUMMARY_ONLY warning absent");
  } else {
    if (!/not statutory text/i.test(summaryWarning.message) || !/official/i.test(summaryWarning.message)) {
      result.fail("SUMMARY_ONLY warning does not distinguish summaries from official statutory text");
    }
    if (!sameValues(summaryWarning.finding_ids, findingIds)) {
      result.fail("SUMMARY_ONLY warning does not cover every finding");
    }
  }
  const adviceWarning = output.warnings.find(
    (warning) => warning.code === "OUTPUT_NOT_LEGAL_ADVICE",
  );
  if (!adviceWarning) {
    result.fail("OUTPUT_NOT_LEGAL_ADVICE warning absent");
  } else {
    if (!/not legal advice/i.test(adviceWarning.message)) {
      result.fail("legal-advice warning is not explicit");
    }
    if (!sameValues(adviceWarning.finding_ids, findingIds)) {
      result.fail("OUTPUT_NOT_LEGAL_ADVICE warning does not cover every finding");
    }
  }
  const sourceWarning = output.warnings.find(
    (warning) => warning.code === "NON_BINDING_SOURCE",
  );
  if (!sourceWarning) {
    result.fail("NON_BINDING_SOURCE warning absent");
  } else {
    if (sourceWarning.message !== "Corpus verification confirms only the identity and integrity of the pinned files. It does not establish that the consolidated snapshot has legal effect, that the corpus is current or complete for the facts, that an interpretation is correct, or that a system is compliant, certified, approved, or has passed a conformity assessment.") {
      result.fail("NON_BINDING_SOURCE warning does not state the verification boundary");
    }
    if (!sameValues(sourceWarning.finding_ids, findingIds)) {
      result.fail("NON_BINDING_SOURCE warning does not cover every finding");
    }
  }
  for (const path of findKeys(output, "confidence")) {
    result.fail(`numeric legal-confidence field is forbidden: ${path}`);
  }
  return result;
}

function assessSpecialBoundaries(output, expected, result) {
  const readinessProvisions = output.implementation_readiness.applicable_duties.map(
    (duty) => duty.exact_provision,
  );
  for (const prefix of expected.required_readiness_provision_prefixes ?? []) {
    const canonicalPrefix = canonicalProvisionLabel(prefix);
    if (!readinessProvisions.some((provision) =>
      canonicalProvisionLabel(provision).startsWith(canonicalPrefix))) {
      result.fail(`missing readiness provision family ${prefix}`);
    }
  }
  for (const prefix of expected.forbidden_readiness_provision_prefixes ?? []) {
    const canonicalPrefix = canonicalProvisionLabel(prefix);
    if (readinessProvisions.some((provision) =>
      canonicalProvisionLabel(provision).startsWith(canonicalPrefix))) {
      result.fail(`forbidden readiness provision family emitted: ${prefix}`);
    }
  }
  if (expected.requires_article_6_3_profiling_block) {
    const limitations = output.legal_classification.limitations.join(" ");
    if (!/profiling/i.test(limitations) || !/blocks the exception/i.test(limitations)) {
      result.fail("Article 6(3) profiling boundary is not explicit");
    }
  }
  if (expected.article_5_qualifier_scope === "ba") {
    const provisions = legalProvenance(output).map((item) => item.exact_provision);
    if (!provisions.includes("Article 5(1)(ba)") || provisions.includes("Article 5(1)(bb)")) {
      result.fail("Article 5 point (ba) boundary was not preserved");
    }
  }
  if (expected.article_5_qualifier_scope === "bb") {
    const provisions = legalProvenance(output).map((item) => item.exact_provision);
    if (
      !provisions.includes("Article 5(1)(bb)") ||
      provisions.includes("Article 5(1)(ba)") ||
      provisions.includes("Article 5(1b)")
    ) {
      result.fail("Article 5 point (bb) qualifier boundary was not preserved");
    }
  }
}

function assessUnsupportedConclusions(output, expected) {
  const result = metric();
  const factIds = new Set(output.facts_used.map((fact) => fact.fact_id));
  const assumptionIds = new Set(output.assumptions.map((assumption) => assumption.assumption_id));
  const missingIds = new Set(output.missing_facts.map((missing) => missing.missing_fact_id));
  const findingById = new Map(output.findings.map((finding) => [finding.finding_id, finding]));
  const actualRoutes = output.legal_classification.routes.map((route) => route.route);
  for (const route of actualRoutes) {
    if (!expected.routes.includes(route)) result.fail(`unsupported route emitted: ${route}`);
  }
  if (output.legal_classification.status === "undetermined" && actualRoutes.length > 0) {
    result.fail("undetermined legal block contains a route conclusion");
  }
  for (const finding of output.findings) {
    for (const id of finding.fact_ids) {
      if (!factIds.has(id)) result.fail(`${finding.finding_id} references unknown fact ${id}`);
    }
    for (const id of finding.assumption_ids) {
      if (!assumptionIds.has(id)) result.fail(`${finding.finding_id} references unknown assumption ${id}`);
    }
    for (const id of finding.missing_fact_ids) {
      if (!missingIds.has(id)) result.fail(`${finding.finding_id} references unknown missing fact ${id}`);
    }
  }
  for (const route of output.legal_classification.routes) {
    for (const id of route.finding_ids) {
      const finding = findingById.get(id);
      const acceptedDetermination =
        route.route === "minimal" ? "does_not_apply" : "applies";
      if (
        !finding ||
        finding.block !== "legal_classification" ||
        finding.determination !== acceptedDetermination
      ) {
        result.fail(`${route.route} route does not resolve to a supporting legal finding: ${id}`);
      }
    }
  }
  for (const missing of output.missing_facts.filter((item) => item.decisive)) {
    for (const block of missing.affected_blocks) {
      if (blockByName(output, block).status !== "undetermined") {
        result.fail(`decisive missing fact ${missing.missing_fact_id} did not stop ${block}`);
      }
    }
  }
  if (output.impact.does_not_alter_legal_classification !== true) {
    result.fail("impact was allowed to alter legal classification");
  }
  if (output.implementation_readiness.is_regulatory_approval !== false) {
    result.fail("readiness was represented as regulatory approval");
  }
  assessSpecialBoundaries(output, expected, result);
  return result;
}

function assessBlockSeparation(output) {
  const result = metric();
  const blocks = [
    ["legal_classification", output.legal_classification],
    ["impact", output.impact],
    ["implementation_readiness", output.implementation_readiness],
  ];
  for (const [name, block] of blocks) {
    const expectedIds = output.findings
      .filter((finding) => finding.block === name)
      .map((finding) => finding.finding_id);
    if (!sameValues(block.finding_ids, expectedIds)) {
      result.fail(`${name} finding references collapse or cross block boundaries`);
    }
  }
  if (
    output.legal_classification === output.impact ||
    output.impact === output.implementation_readiness ||
    output.legal_classification === output.implementation_readiness
  ) {
    result.fail("result blocks are not distinct objects");
  }
  return result;
}

function assessUsefulness(output, expected, routing, abstention) {
  const result = metric();
  if (output.status !== expected.status) {
    result.fail(`status expected ${expected.status}, received ${output.status}`);
  }
  for (const [name, status] of Object.entries(expected.block_statuses)) {
    if (blockByName(output, name).status !== status) {
      result.fail(`${name} expected ${status}, received ${blockByName(output, name).status}`);
    }
  }
  if (!routing.pass) result.fail("legal routing is not useful because it misses the expected property");
  if (!abstention.pass) result.fail("abstention is not useful because decisive gaps are not exact");
  if (output.findings.length === 0) result.fail("response has no grounded finding");
  for (const finding of output.findings) {
    if (finding.summary.trim().length === 0 || finding.scope.system_scope.trim().length === 0) {
      result.fail(`${finding.finding_id} lacks a usable summary or scope`);
    }
  }
  if (expected.abstention) {
    if (output.missing_facts.some((missing) => !missing.question || !missing.reason)) {
      result.fail("abstention provides an incomplete missing-fact prompt");
    }
  }
  return result;
}

function aggregateMetric(cases, name, threshold) {
  const evaluated = cases.filter((item) => item.metrics[name].evaluated);
  const passed = evaluated.filter((item) => item.metrics[name].pass).length;
  const rate = evaluated.length === 0 ? 1 : passed / evaluated.length;
  return {
    passed,
    evaluated: evaluated.length,
    rate,
    threshold,
    pass: rate >= threshold,
  };
}

async function gradeCase(entry, handler) {
  const caseDefinition = readJson(join(PUBLIC_ROOT, entry.case_file));
  const profile = systemProfileSchema.parse(readJson(join(PUBLIC_ROOT, entry.profile_file)));
  const outputs = [];
  for (let run = 0; run < RUNS_PER_CASE; run += 1) {
    const response = await handler(profile);
    outputs.push(assessSystemResponseSchema.parse(response.structuredContent));
  }
  const output = outputs[0];
  const stableResponses = outputs.map((item) => deterministicResponseProjection(item));
  const hashes = outputs.map((item) => canonicalResponseHash(item));
  const sizes = stableResponses.map((item) => Buffer.byteLength(canonicalize(item), "utf8"));

  const responseSchema = metric();
  const routing = assessRouting(output, caseDefinition.expected);
  const abstention = assessAbstention(output, caseDefinition.expected);
  const citations = assessCitationIntegrity(output, caseDefinition.expected);
  const disclosure = assessSummaryDisclosure(output, caseDefinition.expected);
  const unsupported = assessUnsupportedConclusions(output, caseDefinition.expected);
  const separation = assessBlockSeparation(output);
  const size = metric();
  if (Math.max(...sizes) > MAX_CANONICAL_BYTES) {
    size.fail(`canonical response exceeds ${MAX_CANONICAL_BYTES} bytes`);
  }
  const determinism = metric();
  if (new Set(hashes).size !== 1 || new Set(sizes).size !== 1) {
    determinism.fail(`${RUNS_PER_CASE} repeated runs produced different canonical results`);
  }
  const fixedBoundary = metric(caseDefinition.fixed_boundary === true);
  if (caseDefinition.fixed_boundary) {
    if (!routing.pass) fixedBoundary.fail("fixed route boundary changed");
    if (!citations.pass) fixedBoundary.fail("fixed legal citation boundary changed");
    if (!unsupported.pass) fixedBoundary.fail("fixed legal scope boundary changed");
  }
  const useful = assessUsefulness(output, caseDefinition.expected, routing, abstention);

  const metrics = {
    response_schema: materializeMetric(responseSchema),
    routing_correctness: materializeMetric(routing),
    abstention_correctness: materializeMetric(abstention),
    citation_integrity: materializeMetric(citations),
    summary_disclosure: materializeMetric(disclosure),
    unsupported_conclusions: materializeMetric(unsupported),
    block_separation: materializeMetric(separation),
    response_size: materializeMetric(size),
    determinism: materializeMetric(determinism),
    fixed_legal_boundaries: materializeMetric(fixedBoundary),
    useful_outcome: materializeMetric(useful),
  };
  const evaluatedMetrics = Object.values(metrics).filter((item) => item.evaluated);
  const legal = legalProvenance(output);
  return {
    case_id: entry.case_id,
    description: caseDefinition.description,
    categories: caseDefinition.categories,
    fixed_boundary: caseDefinition.fixed_boundary,
    actual: {
      law_corpus_id: output.corpus.id,
      status: output.status,
      block_statuses: {
        legal_classification: output.legal_classification.status,
        impact: output.impact.status,
        implementation_readiness: output.implementation_readiness.status,
      },
      routes: output.legal_classification.routes.map((route) => route.route),
      annex_iii_categories: output.legal_classification.annex_iii_categories,
      decisive_missing_fact_ids: output.missing_facts
        .filter((item) => item.decisive)
        .map((item) => item.missing_fact_id),
      legal_anchors: legal.map((item) => ({
        provision: item.exact_provision,
        operative_date: item.operative_date,
      })),
      canonical_sha256: hashes[0],
      canonical_bytes: sizes[0],
    },
    metrics,
    pass: evaluatedMetrics.every((item) => item.pass),
  };
}

async function grade(runLabel) {
  const manifestRaw = readFileSync(MANIFEST_FILE);
  const manifest = JSON.parse(manifestRaw.toString("utf8"));
  validateCorpus(manifest);
  const handler = captureAssessmentHandler();
  const cases = [];
  for (const entry of manifest.cases) cases.push(await gradeCase(entry, handler));

  const thresholds = {
    response_schema: manifest.thresholds.safety_metrics,
    routing_correctness: manifest.thresholds.routing_correctness,
    abstention_correctness: manifest.thresholds.safety_metrics,
    citation_integrity: manifest.thresholds.safety_metrics,
    summary_disclosure: manifest.thresholds.safety_metrics,
    unsupported_conclusions: manifest.thresholds.safety_metrics,
    block_separation: manifest.thresholds.safety_metrics,
    response_size: manifest.thresholds.safety_metrics,
    determinism: manifest.thresholds.safety_metrics,
    fixed_legal_boundaries: manifest.thresholds.safety_metrics,
    useful_outcome: manifest.thresholds.useful_outcomes,
  };
  const aggregate = Object.fromEntries(
    Object.entries(thresholds).map(([name, threshold]) => [
      name,
      aggregateMetric(cases, name, threshold),
    ]),
  );
  const packageMetadata = readJson(PACKAGE_FILE);
  return {
    grader_version: GRADER_VERSION,
    run_label: runLabel,
    subject: {
      tool: "euaiact_assess_system",
      package: packageMetadata.name,
      package_version: packageMetadata.version,
      decision_contract_version: "1.2",
      law_corpus_id: cases[0].actual.law_corpus_id,
    },
    public_corpus: {
      version: manifest.corpus_version,
      case_count: manifest.case_count,
      synthetic_only: manifest.synthetic_only,
      expected_values: manifest.expected_values,
      sha256: corpusDigest(manifest, manifestRaw),
    },
    grader_sha256: sha256(readFileSync(GRADER_FILE)),
    runs_per_case: RUNS_PER_CASE,
    max_canonical_response_bytes: MAX_CANONICAL_BYTES,
    safety_metrics: SAFETY_METRICS,
    cases,
    aggregate,
    overall_pass: Object.values(aggregate).every((item) => item.pass),
  };
}

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--output" || argument === "--check" || argument === "--label") {
      const value = argv[index + 1];
      if (!value) throw new Error(`${argument} requires a value`);
      options[argument.slice(2)] = argument === "--label" ? value : resolve(value);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (options.output && options.check) throw new Error("Use either --output or --check, not both");
  return options;
}

function printSummary(results) {
  console.log("\nPublic evaluation cases");
  console.log("case                                         route/status                 result");
  for (const item of results.cases) {
    const route = item.actual.routes.join("+") || item.actual.status;
    console.log(`${item.case_id.padEnd(44)} ${route.padEnd(28)} ${item.pass ? "PASS" : "FAIL"}`);
    for (const [name, value] of Object.entries(item.metrics)) {
      if (value.evaluated && !value.pass) {
        console.log(`  ${name}: ${value.reasons.join("; ")}`);
      }
    }
  }
  console.log("\nAggregate metrics");
  console.log("metric                         result       rate       threshold");
  for (const [name, value] of Object.entries(results.aggregate)) {
    console.log(
      `${name.padEnd(30)} ${(value.pass ? "PASS" : "FAIL").padEnd(12)} ${(value.rate * 100).toFixed(1).padStart(5)}%      ${(value.threshold * 100).toFixed(1)}%`,
    );
  }
  console.log(`\nOverall: ${results.overall_pass ? "PASS" : "FAIL"}`);
}

const options = parseArguments(process.argv.slice(2));
const results = await grade(options.label ?? "candidate");
const serialized = `${JSON.stringify(results, null, 2)}\n`;
let baselineMatch = true;
if (options.output) {
  mkdirSync(dirname(options.output), { recursive: true });
  writeFileSync(options.output, serialized);
  console.log(`Wrote ${options.output}`);
}
if (options.check) {
  const existing = readFileSync(options.check, "utf8");
  // The baseline records the package version it was generated with. That is provenance, not
  // a result, so a version bump alone does not invalidate it.
  const withoutPackageVersion = (text) => {
    const parsed = JSON.parse(text);
    delete parsed.subject.package_version;
    return JSON.stringify(parsed);
  };
  baselineMatch = withoutPackageVersion(existing) === withoutPackageVersion(serialized);
  console.log(`Baseline reproduction: ${baselineMatch ? "MATCH" : "MISMATCH"}`);
}
printSummary(results);
if (!baselineMatch || !results.overall_pass) process.exitCode = 1;
