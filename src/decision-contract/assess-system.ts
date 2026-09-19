import { SERVER_VERSION } from "../constants.js";
import type { ClassifyOutput } from "../schemas/classify.js";
import { assessAnnexIListing } from "./annex-i-instruments.js";
import {
  invokeArt6Exception,
  invokeClassifier,
  invokeGpaiSystemic,
  invokeObligations,
} from "../tools/invoke-atomic.js";
import { compareUnicodeCodePoints } from "../utils/canonical-json.js";
import {
  assessSystemResponseSchema,
  type AssessSystemResponse,
} from "./envelope.js";
import type { Finding } from "./finding.js";
import { normalizeSystemProfile, type NormalizedProfile } from "./normalize-profile.js";
import type { SystemProfile } from "./profile.js";
import {
  CONSOLIDATED_SOURCE_ID,
  CONSOLIDATED_URL,
  SEALED_CORPUS,
} from "./corpus.js";
import { DECISION_CONTRACT_VERSION } from "./shared.js";

type FactUsed = AssessSystemResponse["facts_used"][number];
type MissingFact = AssessSystemResponse["missing_facts"][number];
type Warning = AssessSystemResponse["warnings"][number];
type RecommendedCall = AssessSystemResponse["recommended_next_calls"][number];
type ActorRole = Finding["scope"]["actors"][number];
type LegalRoute = AssessSystemResponse["legal_classification"]["routes"][number]["route"];
type Provenance = Finding["provenance"][number];

const SOURCE_STATUS = "official_consolidated_snapshot_non_authentic" as const;
const VERIFICATION_LEVEL = "consolidated_snapshot_integrity_verified" as const;
const AUTHORITY_SOURCE_IDS = [
  "source.oj.2024.1689.original",
  "source.oj.2026.1744",
] as const;

const TERRITORIAL_SCOPE_LIMITATION =
  "The supplied geography label does not establish territorial scope. Determine Article 2(1)'s actor, establishment, market-placement, deployment-location, or Union-output condition and test all applicable Article 2 limitations and exclusions separately.";
const HIGH_RISK_DATE_LIMITATION =
  "The stated date is the general application date for the statutory route. It does not determine the treatment of a system already placed on the market or put into service. Apply Article 111 to the system's market date, type, model and later design changes.";
const BOUNDED_NEGATIVE_LIMITATION =
  "No route was identified among the predicates explicitly supplied and tested. This is a bounded routing result, not a determination that the Regulation is inapplicable or that no other Union or national rule applies. Missing, untested, or inaccurate facts can change the result.";

const BLOCK_ORDER = {
  legal_classification: 0,
  impact: 1,
  implementation_readiness: 2,
} as const;

const ROUTE_ORDER: Record<LegalRoute, number> = {
  prohibited: 0,
  high_risk: 1,
  transparency_duty: 2,
  gpai: 3,
  minimal: 4,
};

const TOOL_ORDER: Record<RecommendedCall["tool_name"], number> = {
  euaiact_annex_iv_checklist: 0,
  euaiact_answer_question: 1,
  euaiact_assess_art6_3_exception: 2,
  euaiact_calculate_penalty: 3,
  euaiact_check_deadlines: 4,
  euaiact_check_gpai_systemic_risk: 5,
  euaiact_classify_system: 6,
  euaiact_get_article: 7,
  euaiact_get_obligations: 8,
};

function sortStrings(values: readonly string[]): string[] {
  return [...new Set(values)].sort(compareUnicodeCodePoints);
}

function slug(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return normalized || "unspecified";
}

function factAt(normalized: NormalizedProfile, path: string): FactUsed | undefined {
  return normalized.facts_by_path.get(path);
}

function factsUnder(normalized: NormalizedProfile, path: string): FactUsed[] {
  return normalized.facts.filter(
    (fact) => fact.profile_path === path || fact.profile_path.startsWith(`${path}/`),
  );
}

function factValue<T>(normalized: NormalizedProfile, path: string): T | undefined {
  return factAt(normalized, path)?.value as T | undefined;
}

function provenance(
  exactProvision: string,
  operativeDate: Provenance["operative_date"],
  anchor: string,
): Provenance {
  return {
    instrument_id: "regulation-eu-2024-1689",
    exact_provision: exactProvision,
    instrument_status: "enacted",
    source_id: CONSOLIDATED_SOURCE_ID,
    authority_source_ids: [...AUTHORITY_SOURCE_IDS],
    official_url: `${CONSOLIDATED_URL}#${anchor}`,
    operative_date: operativeDate,
    source_status: SOURCE_STATUS,
    verification_level: VERIFICATION_LEVEL,
  };
}

function actorsFromProfile(profile: SystemProfile): ActorRole[] {
  const actors = profile.role_facts?.roles.map((fact) => fact.value) ?? [];
  return actors.length > 0
    ? ([...new Set(actors)].sort(compareUnicodeCodePoints) as ActorRole[])
    : ["unknown"];
}

function jurisdictionsFromProfile(profile: SystemProfile): string[] {
  const jurisdictions = profile.geography?.jurisdictions.map((fact) => fact.value) ?? [];
  return jurisdictions.length > 0 ? sortStrings(jurisdictions) : ["unspecified"];
}

function systemScope(profile: SystemProfile): string {
  return (
    profile.identity?.system_name?.value ??
    profile.intended_use?.intended_purpose?.value ??
    "System described in the supplied profile"
  );
}

interface AssessmentContext {
  normalized: NormalizedProfile;
  used_fact_ids: Set<string>;
  missing: Map<string, MissingFact>;
  findings: Finding[];
  warnings: Warning[];
  recommendations: Map<RecommendedCall["tool_name"], RecommendedCall>;
  actors: ActorRole[];
  jurisdictions: string[];
  scope: string;
}

function markFacts(context: AssessmentContext, factIds: readonly string[]): string[] {
  const resolved = sortStrings(
    factIds.filter((factId) => context.normalized.facts_by_id.has(factId)),
  );
  resolved.forEach((factId) => context.used_fact_ids.add(factId));
  return resolved;
}

function addMissing(context: AssessmentContext, missing: MissingFact): void {
  context.missing.set(missing.missing_fact_id, {
    ...missing,
    affected_blocks: sortStrings(missing.affected_blocks) as MissingFact["affected_blocks"],
  });
}

function addRecommendation(context: AssessmentContext, call: RecommendedCall): void {
  const existing = context.recommendations.get(call.tool_name);
  if (existing) {
    existing.input_fact_ids = sortStrings([
      ...existing.input_fact_ids,
      ...call.input_fact_ids,
    ]);
    return;
  }
  context.recommendations.set(call.tool_name, {
    ...call,
    input_fact_ids: sortStrings(call.input_fact_ids),
  });
}

function addFinding(context: AssessmentContext, finding: Finding): void {
  const factIds = markFacts(context, finding.fact_ids);
  context.findings.push({
    ...finding,
    scope: {
      ...finding.scope,
      actors: [...finding.scope.actors].sort(compareUnicodeCodePoints),
      jurisdictions: sortStrings(finding.scope.jurisdictions),
    },
    fact_ids: factIds,
    assumption_ids: sortStrings(finding.assumption_ids),
    missing_fact_ids: sortStrings(finding.missing_fact_ids),
    provenance: [...finding.provenance].sort(
      (left, right) =>
        compareUnicodeCodePoints(left.source_id, right.source_id) ||
        compareUnicodeCodePoints(left.exact_provision, right.exact_provision) ||
        compareUnicodeCodePoints(left.operative_date, right.operative_date),
    ),
  });
}

function intendedPurposeFacts(normalized: NormalizedProfile): FactUsed[] {
  return [
    ...factsUnder(normalized, "/intended_use/intended_purpose"),
    ...factsUnder(normalized, "/intended_use/reasonably_foreseeable_uses"),
  ];
}

function intendedPurposeText(profile: SystemProfile): string {
  return [
    profile.intended_use?.intended_purpose?.value,
    ...(profile.intended_use?.reasonably_foreseeable_uses.map((fact) => fact.value) ?? []),
  ]
    .filter((value): value is string => Boolean(value))
    .join(". ");
}

function mapDomain(
  domain: NonNullable<SystemProfile["annex_iii"]>["domain"] extends infer Fact
    ? Fact extends { value: infer Value }
      ? Value | undefined
      : undefined
    : undefined,
):
  | "employment"
  | "education"
  | "biometrics"
  | "critical_infrastructure"
  | "law_enforcement"
  | "migration"
  | "justice"
  | "essential_services"
  | "other"
  | undefined {
  const mapping: Record<string, ReturnType<typeof mapDomain>> = {
    biometrics: "biometrics",
    critical_infrastructure: "critical_infrastructure",
    education: "education",
    employment: "employment",
    essential_services: "essential_services",
    law_enforcement: "law_enforcement",
    migration_asylum_border_control: "migration",
    justice_and_democratic_processes: "justice",
    other: "other",
    unknown: undefined,
  };
  return domain ? mapping[domain] : undefined;
}

function classifierRole(actors: readonly ActorRole[]): "provider" | "deployer" | "unknown" {
  if (actors.includes("provider")) return "provider";
  if (actors.includes("deployer")) return "deployer";
  return "unknown";
}

function buildClassifierInput(profile: SystemProfile, actors: ActorRole[]) {
  const practices = profile.biometric_and_practices;
  return {
    description: intendedPurposeText(profile) || undefined,
    use_case: profile.annex_iii?.purpose?.value,
    role: classifierRole(actors),
    signals: {
      domain: mapDomain(profile.annex_iii?.domain?.value),
      uses_biometrics: practices?.uses_biometrics?.value,
      biometric_sole_purpose_verification:
        practices?.sole_purpose_identity_verification?.value,
      biometric_remote_identification: practices?.remote_biometric_identification?.value,
      biometric_realtime: practices?.realtime_operation?.value,
      biometric_law_enforcement: practices?.law_enforcement_use?.value,
      biometric_publicly_accessible_space: practices?.publicly_accessible_space?.value,
      is_safety_component_of_regulated_product:
        profile.annex_i?.product_or_safety_component?.value,
      requires_third_party_conformity_assessment:
        profile.annex_i?.third_party_conformity_assessment_required?.value,
      generates_synthetic_content:
        profile.transparency?.generates_or_manipulates_synthetic_content?.value,
      interacts_with_natural_persons:
        profile.transparency?.interacts_with_natural_persons?.value,
      performs_emotion_recognition_workplace_or_school:
        practices?.emotion_recognition_workplace_or_education?.value,
      performs_social_scoring: practices?.social_scoring?.value,
      social_scoring_unrelated_context:
        practices?.social_scoring_unrelated_context?.value,
      social_scoring_unjustified_or_disproportionate:
        practices?.social_scoring_unjustified_or_disproportionate?.value,
    },
  };
}

function legalSignalFactIds(normalized: NormalizedProfile): string[] {
  const prefixes = [
    "/intended_use",
    "/role_facts/roles",
    "/geography/jurisdictions",
    "/annex_i",
    "/annex_iii",
    "/biometric_and_practices",
    "/article_5_prohibitions",
    "/transparency",
    "/gpai",
  ];
  return normalized.facts
    .filter((fact) => prefixes.some((prefix) => fact.profile_path.startsWith(prefix)))
    .map((fact) => fact.fact_id);
}

function positiveFactIds(normalized: NormalizedProfile, prefixes: string[]): string[] {
  return normalized.facts
    .filter(
      (fact) =>
        prefixes.some((prefix) => fact.profile_path.startsWith(prefix)) &&
        fact.value !== false &&
        fact.value !== "unknown",
    )
    .map((fact) => fact.fact_id);
}

function scopeFactIds(normalized: NormalizedProfile): string[] {
  return [
    ...factsUnder(normalized, "/role_facts/roles"),
    ...factsUnder(normalized, "/geography/jurisdictions"),
  ].map((fact) => fact.fact_id);
}

interface LegalResult {
  block: AssessSystemResponse["legal_classification"];
  classification: ClassifyOutput | null;
  route_fact_ids: string[];
  high_risk_source?: "annex_i" | "annex_iii";
  annex_iii_point?: number;
  gpai_systemic_risk?: boolean;
  impact_outside_regulation?: boolean;
}

async function assessLegalClassification(
  context: AssessmentContext,
): Promise<LegalResult> {
  const { profile } = context.normalized;
  const definitionFacts = [
    factAt(context.normalized, "/identity/machine_based_system"),
    factAt(context.normalized, "/identity/infers_from_inputs_how_to_generate_outputs"),
  ].filter((fact): fact is FactUsed => Boolean(fact));
  const negativeDefinitionFact = definitionFacts.find((fact) => fact.value === false);
  if (negativeDefinitionFact) {
    const findingId = "finding.legal.ai-system-definition.001";
    addFinding(context, {
      finding_id: findingId,
      finding_basis: "legal_proposition",
      block: "legal_classification",
      summary:
        "The supplied definition fact does not establish an AI system within Article 3(1).",
      scope: {
        actors: context.actors,
        jurisdictions: context.jurisdictions,
        system_scope: context.scope,
      },
      fact_ids: [negativeDefinitionFact.fact_id],
      assumption_ids: [],
      missing_fact_ids: [],
      provenance: [provenance("Article 3(1)", "2025-02-02", "art_3")],
      determination: "does_not_apply",
    });
    return {
      classification: null,
      route_fact_ids: [negativeDefinitionFact.fact_id],
      block: {
        schema_version: "1.0",
        status: "not_applicable",
        routes: [],
        annex_iii_categories: [],
        actor_roles: context.actors,
        finding_ids: [findingId],
        limitations: [
          "This non-applicability result is bounded to the supplied AI-system definition fact.",
          TERRITORIAL_SCOPE_LIMITATION,
        ],
      },
    };
  }

  const jurisdictionFacts = factsUnder(context.normalized, "/geography/jurisdictions");
  const geography = profile.geography;
  const hasEUNexus =
    jurisdictionFacts.some((fact) =>
      /(^|[^a-z])(eu|european union)([^a-z]|$)/i.test(String(fact.value)),
    ) ||
    geography?.placed_on_eu_market?.value === true ||
    geography?.used_in_eu?.value === true ||
    geography?.output_used_in_eu?.value === true;
  const explicitNegativeEUNexus =
    jurisdictionFacts.length > 0 &&
    factsUnder(context.normalized, "/role_facts/roles").length > 0 &&
    geography?.placed_on_eu_market?.value === false &&
    geography?.used_in_eu?.value === false &&
    geography?.output_used_in_eu?.value === false;
  if (!hasEUNexus && explicitNegativeEUNexus) {
    const nexusFacts = [
      factAt(context.normalized, "/geography/placed_on_eu_market"),
      factAt(context.normalized, "/geography/used_in_eu"),
      factAt(context.normalized, "/geography/output_used_in_eu"),
    ].filter((fact): fact is FactUsed => Boolean(fact));
    const findingId = "finding.legal.territorial-scope.article-2.001";
    addFinding(context, {
      finding_id: findingId,
      finding_basis: "legal_proposition",
      block: "legal_classification",
      summary:
        "All supplied Article 2(1) nexus predicates are expressly false. The Regulation does not apply to the described non-Union deployment.",
      scope: {
        actors: context.actors,
        jurisdictions: context.jurisdictions,
        system_scope: context.scope,
      },
      fact_ids: sortStrings([
        ...nexusFacts.map((fact) => fact.fact_id),
        ...scopeFactIds(context.normalized),
      ]),
      assumption_ids: [],
      missing_fact_ids: [],
      provenance: [provenance("Article 2(1)", "2026-08-02", "art_2")],
      determination: "not_applicable",
    });
    return {
      classification: null,
      route_fact_ids: nexusFacts.map((fact) => fact.fact_id),
      impact_outside_regulation: true,
      block: {
        schema_version: "1.0",
        status: "not_applicable",
        routes: [],
        annex_iii_categories: [],
        actor_roles: context.actors,
        finding_ids: [findingId],
        limitations: [
          "This non-applicability result is bounded to the supplied Article 2(1) nexus facts and described deployment.",
        ],
      },
    };
  }
  if (!hasEUNexus) {
    // The territorial-nexus gap is reported at leaf level so the caller knows
    // which schema field to supply. Any one of the four geography leaves
    // resolves the gap; the first absent leaf in schema order is named.
    const nexusLeafPath =
      geography?.placed_on_eu_market === undefined
        ? "/geography/placed_on_eu_market"
        : geography.used_in_eu === undefined
          ? "/geography/used_in_eu"
          : geography.output_used_in_eu === undefined
            ? "/geography/output_used_in_eu"
            : "/geography/jurisdictions";
    addMissing(context, {
      missing_fact_id: "missing.legal.jurisdiction",
      profile_path: nexusLeafPath,
      question:
        "Which fact establishes the Union nexus: placed_on_eu_market, used_in_eu, output_used_in_eu, or an EU entry in jurisdictions?",
      reason:
        "A supplied non-EU jurisdiction alone does not establish EU AI Act territorial scope. Supplying any one of the named geography facts resolves this gap.",
      decisive: true,
      affected_blocks: ["legal_classification", "implementation_readiness"],
    });
  }

  const purposeFacts = intendedPurposeFacts(context.normalized);
  const practices = profile.biometric_and_practices;
  const article5 = profile.article_5_prohibitions;
  const hasArticle5StructuredContext = article5 !== undefined;
  const hasStandardEditingExclusion =
    profile.transparency?.standard_editing_assistive_function?.value === true &&
    profile.transparency?.substantially_alters_input_or_semantics?.value === false;
  const directPositive = Boolean(
    practices?.social_scoring?.value ||
      practices?.emotion_recognition_workplace_or_education?.value ||
      (practices?.uses_biometrics?.value &&
        practices.remote_biometric_identification?.value &&
        practices.realtime_operation?.value &&
        practices.law_enforcement_use?.value &&
        practices.publicly_accessible_space?.value) ||
      (profile.annex_iii?.domain?.value &&
        profile.annex_iii.domain.value !== "unknown" &&
        (profile.annex_iii.purpose?.value || purposeFacts.length > 0)) ||
      (profile.annex_i?.product_or_safety_component?.value &&
        profile.annex_i.third_party_conformity_assessment_required?.value === true) ||
      profile.transparency?.interacts_with_natural_persons?.value ||
      profile.transparency?.generates_or_manipulates_synthetic_content?.value ||
      profile.transparency?.deep_fake_content?.value ||
      profile.transparency?.public_interest_text?.value ||
      practices?.emotion_recognition?.value ||
      practices?.biometric_categorisation?.value ||
      profile.gpai?.is_gpai_model?.value ||
      hasArticle5StructuredContext ||
      hasStandardEditingExclusion
  );

  const annexILegislationFacts = factsUnder(
    context.normalized,
    "/annex_i/annex_i_legislation",
  );
  const annexIListing = assessAnnexIListing(
    annexILegislationFacts.map((fact) => String(fact.value)),
  );
  // Article 6(1), point (a), conditions the Annex I route on coverage by the
  // Union harmonisation legislation listed in Annex I. List membership is
  // decided against the pinned closed list by instrument identity, never by
  // keyword or substring presence in Annex I text. When every caller-cited
  // instrument is outside the list, the asserted listing is refuted and
  // Article 6(1) fails on point (a) independently of the point (b) fact.
  const annexIListingRefuted = annexILegislationFacts.length > 0 && annexIListing.refuted;
  if (profile.annex_i?.product_or_safety_component?.value === true) {
    const conformity = profile.annex_i.third_party_conformity_assessment_required;
    if (!conformity && !annexIListingRefuted) {
      addMissing(context, {
        missing_fact_id: "missing.annex-i.third-party-conformity",
        profile_path: "/annex_i/third_party_conformity_assessment_required",
        question:
          "Does the applicable Annex I product law require third-party conformity assessment?",
        reason: "Article 6(1) requires this fact in addition to Annex I product coverage.",
        decisive: true,
        affected_blocks: ["legal_classification", "implementation_readiness"],
      });
    }
    if (annexILegislationFacts.length > 0 && !annexIListing.any_citation) {
      addMissing(context, {
        missing_fact_id: "missing.annex-i.instrument-identity",
        profile_path: "/annex_i/annex_i_legislation",
        question:
          "Which Union harmonisation instrument listed in Annex I covers the product? Supply its exact citation, for example Regulation (EU) 2017/745, or its CELEX number.",
        reason:
          "Article 6(1), point (a), requires coverage by the Union harmonisation legislation listed in Annex I. The supplied legislation name does not identify an instrument, so list membership cannot be verified against the pinned corpus.",
        decisive: true,
        affected_blocks: ["legal_classification", "implementation_readiness"],
      });
    }
  }
  if (
    profile.annex_iii?.domain?.value &&
    profile.annex_iii.domain.value !== "unknown" &&
    !profile.annex_iii.purpose &&
    purposeFacts.length === 0
  ) {
    addMissing(context, {
      missing_fact_id: "missing.annex-iii.purpose",
      profile_path: "/annex_iii/purpose",
      question: "What Annex III purpose does the system perform in the stated domain?",
      reason: "A sector label alone does not establish the exact Annex III use case.",
      decisive: true,
      affected_blocks: ["legal_classification", "implementation_readiness"],
    });
  }
  if (
    practices?.uses_biometrics?.value === true &&
    practices.sole_purpose_identity_verification === undefined &&
    practices.remote_biometric_identification === undefined &&
    practices.biometric_categorisation === undefined &&
    practices.emotion_recognition === undefined
  ) {
    addMissing(context, {
      missing_fact_id: "missing.biometric-purpose",
      profile_path: "/biometric_and_practices",
      question:
        "Is the biometric use verification, remote identification, categorisation, or emotion recognition?",
      reason: "Biometric processing alone does not determine the Article 5 or Annex III route.",
      decisive: true,
      affected_blocks: ["legal_classification", "implementation_readiness"],
    });
  }
  if (
    practices?.social_scoring?.value === true &&
    practices.social_scoring_unrelated_context?.value !== true &&
    practices.social_scoring_unjustified_or_disproportionate?.value !== true
  ) {
    addMissing(context, {
      missing_fact_id: "missing.social-scoring.treatment-limb",
      profile_path: "/biometric_and_practices",
      question:
        "Does the social score cause detrimental or unfavourable treatment in an unrelated context, or treatment that is unjustified or disproportionate?",
      reason:
        "Article 5(1)(c) requires at least one of its two detrimental-treatment limbs in addition to social scoring.",
      decisive: true,
      affected_blocks: ["legal_classification", "implementation_readiness"],
    });
  }
  if (!directPositive && purposeFacts.length === 0) {
    addMissing(context, {
      missing_fact_id: "missing.intended-purpose",
      profile_path: "/intended_use/intended_purpose",
      question:
        "What is the system intended to do, for whom, and in which operational context?",
      reason:
        "Intended purpose is decisive for prohibited-practice, Annex III, and transparency routes.",
      decisive: true,
      affected_blocks: [
        "legal_classification",
        "impact",
        "implementation_readiness",
      ],
    });
  }

  // Complete decisive-gap enumeration on abstention. When any decisive legal
  // gap exists and the Article 3(12) intended purpose is absent, the missing
  // purpose is enumerated as an independent decisive gap at leaf level, in
  // addition to the other gaps and never collapsed into one representative.
  // Every Annex III route predicate is an "intended to be used" predicate, so
  // the intended purpose is decisive independently of the territorial nexus,
  // and structured area vocabulary cannot substitute for it. Profiles whose
  // complete structured predicates determine every route without abstention
  // are unaffected.
  const hasDecisiveLegalGap = [...context.missing.values()].some(
    (missing) =>
      missing.decisive && missing.affected_blocks.includes("legal_classification"),
  );
  if (
    hasDecisiveLegalGap &&
    purposeFacts.length === 0 &&
    !context.missing.has("missing.intended-purpose")
  ) {
    addMissing(context, {
      missing_fact_id: "missing.intended-purpose",
      profile_path: "/intended_use/intended_purpose",
      question:
        "What is the system intended to do, for whom, and in which operational context?",
      reason:
        "The Article 3(12) intended purpose is decisive for prohibited-practice, Annex III, and transparency routes and is missing independently of the other enumerated gaps.",
      decisive: true,
      affected_blocks: [
        "legal_classification",
        "impact",
        "implementation_readiness",
      ],
    });
  }

  const legalMissing = [...context.missing.values()].filter(
    (missing) =>
      missing.decisive && missing.affected_blocks.includes("legal_classification"),
  );
  if (legalMissing.length > 0) {
    const missingIds = legalMissing.map((missing) => missing.missing_fact_id);
    const abstentionFactIds = sortStrings([
      ...purposeFacts.map((fact) => fact.fact_id),
      ...scopeFactIds(context.normalized),
    ]);
    const findingId = "finding.legal.abstention.missing-facts.001";
    addFinding(context, {
      finding_id: findingId,
      finding_basis: "tool_state_abstention",
      block: "legal_classification",
      summary: "Legal classification cannot be determined from the supplied decisive facts.",
      scope: {
        actors: context.actors,
        jurisdictions: context.jurisdictions,
        system_scope: context.scope,
      },
      fact_ids: abstentionFactIds,
      assumption_ids: [],
      missing_fact_ids: missingIds,
      provenance: [],
      determination: "undetermined",
      reason_for_abstention:
        "One or more decisive legal predicates are missing. Guessing would create an unsupported legal conclusion.",
    });
    addRecommendation(context, {
      tool_name: "euaiact_classify_system",
      reason: "Re-run the atomic classifier after supplying the enumerated decisive facts.",
      input_fact_ids: abstentionFactIds,
    });
    return {
      classification: null,
      route_fact_ids: abstentionFactIds,
      block: {
        schema_version: "1.0",
        status: "undetermined",
        routes: [],
        annex_iii_categories: [],
        actor_roles: context.actors,
        finding_ids: [findingId],
        limitations: ["Decisive facts are listed in missing_facts."],
      },
    };
  }

  const classifierInput = buildClassifierInput(profile, context.actors);
  if (annexIListingRefuted) {
    // The asserted Annex I coverage is refuted against the pinned list, so the
    // annex_i signals must not reach the classifier as grounds for the
    // Article 6(1) route. Every other supplied predicate routes normally.
    classifierInput.signals.is_safety_component_of_regulated_product = undefined;
    classifierInput.signals.requires_third_party_conformity_assessment = undefined;
  }
  const classification = await invokeClassifier(classifierInput);
  const highRiskProbe = await invokeClassifier({
    description: profile.annex_iii?.purpose?.value,
    use_case: profile.annex_iii?.purpose?.value,
    role: classifierRole(context.actors),
    signals: {
      domain: classifierInput.signals.domain,
      uses_biometrics: classifierInput.signals.uses_biometrics,
      biometric_sole_purpose_verification:
        classifierInput.signals.biometric_sole_purpose_verification,
      biometric_remote_identification:
        classifierInput.signals.biometric_remote_identification,
      biometric_realtime: classifierInput.signals.biometric_realtime,
      biometric_law_enforcement:
        classifierInput.signals.biometric_law_enforcement,
      biometric_publicly_accessible_space:
        classifierInput.signals.biometric_publicly_accessible_space,
      is_safety_component_of_regulated_product:
        classifierInput.signals.is_safety_component_of_regulated_product,
      requires_third_party_conformity_assessment:
        classifierInput.signals.requires_third_party_conformity_assessment,
    },
  });
  // A structured minimal result is terminal for high-risk recovery. The probe
  // may recover an independent route after other positive results, but it must
  // not reintroduce vocabulary over complete structured negative facts.
  const highRiskClassification =
    classification.risk_classification === "high-risk"
      ? classification
      : classification.risk_classification === "minimal"
        ? null
        : highRiskProbe.risk_classification === "high-risk"
          ? highRiskProbe
          : null;
  const allLegalFactIds = legalSignalFactIds(context.normalized);
  const routes: AssessSystemResponse["legal_classification"]["routes"] = [];
  const legalFindingIds: string[] = [];
  const annexCategories: number[] = [];
  let highRiskSource: LegalResult["high_risk_source"];
  let annexPoint: number | undefined;
  const legalLimitations: string[] = [];
  const boundaryNegativeFindingIds: string[] = [];
  let requiresHumanReview = false;

  const article5Facts = factsUnder(context.normalized, "/article_5_prohibitions");
  const operation = profile.article_5_prohibitions?.operation;
  const providerIntended =
    profile.article_5_prohibitions
      ?.provider_generation_or_manipulation_is_intended_purpose;
  const providerForeseeable =
    profile.article_5_prohibitions
      ?.provider_foreseeable_and_reproducible_outcome_without_significant_modification;
  const providerSafeguards =
    profile.article_5_prohibitions
      ?.provider_reasonable_and_adequate_safeguards_present;
  const deployerPurpose =
    profile.article_5_prohibitions
      ?.deployer_uses_for_generation_or_manipulation_purpose;
  const providerTrigger =
    providerIntended?.value === true ||
    (providerForeseeable?.value === true && providerSafeguards?.value === false);
  const providerTriggerProvision = providerIntended?.value === true
    ? "Article 5(1a)(a)(i)"
    : "Article 5(1a)(a)(ii)";

  const baMaterial =
    profile.article_5_prohibitions
      ?.ba_realistic_intimate_or_sexually_explicit_material_of_identifiable_person;
  const baConsent = profile.article_5_prohibitions?.ba_required_consent_present;
  const baIncreasesExposure =
    profile.article_5_prohibitions?.ba_manipulation_increases_intimate_exposure;
  const baAltersActivity =
    profile.article_5_prohibitions?.ba_manipulation_alters_sexually_explicit_activity;
  const baExclusionApplies =
    operation?.value === "manipulation" &&
    baIncreasesExposure?.value === false &&
    baAltersActivity?.value === false;
  const baConditionsMet =
    baMaterial?.value === true &&
    baConsent?.value === false &&
    operation !== undefined &&
    !baExclusionApplies;

  if (operation?.value === "manipulation" && baExclusionApplies) {
    const findingId = "finding.legal.article-5.ba.excluded-by-1b.001";
    addFinding(context, {
      finding_id: findingId,
      finding_basis: "legal_proposition",
      block: "legal_classification",
      summary:
        "Article 5(1b) applies as an editing exclusion, so Article 5(1)(ba) does not apply to this manipulation.",
      scope: {
        actors: context.actors,
        jurisdictions: context.jurisdictions,
        system_scope: context.scope,
      },
      fact_ids: sortStrings([
        operation.fact_id,
        baIncreasesExposure.fact_id,
        baAltersActivity.fact_id,
        ...scopeFactIds(context.normalized),
      ]),
      assumption_ids: [],
      missing_fact_ids: [],
      provenance: [
        provenance("Article 5(1)(ba)", "2026-12-02", "art_5"),
        provenance("Article 5(1b)", "2026-12-02", "art_5"),
      ],
      determination: "does_not_apply",
    });
    boundaryNegativeFindingIds.push(findingId);
    legalFindingIds.push(findingId);
  } else if (baConditionsMet) {
    const qualifierFindingId = "finding.legal.article-5.ba.qualifier-1b.001";
    const qualifierFactIds = sortStrings([
      operation.fact_id,
      ...(baIncreasesExposure ? [baIncreasesExposure.fact_id] : []),
      ...(baAltersActivity ? [baAltersActivity.fact_id] : []),
      ...scopeFactIds(context.normalized),
    ]);
    addFinding(context, {
      finding_id: qualifierFindingId,
      finding_basis: "legal_proposition",
      block: "legal_classification",
      summary: operation.value === "generation"
        ? "Article 5(1b) does not exclude generation because it is limited to qualifying manipulation under point (ba)."
        : "Article 5(1b) does not exclude this manipulation because it increases intimate exposure or alters the nature of sexually explicit activity.",
      scope: {
        actors: context.actors,
        jurisdictions: context.jurisdictions,
        system_scope: context.scope,
      },
      fact_ids: qualifierFactIds,
      assumption_ids: [],
      missing_fact_ids: [],
      provenance: [provenance("Article 5(1b)", "2026-12-02", "art_5")],
      determination: "does_not_apply",
    });
    legalFindingIds.push(qualifierFindingId);

    const baFindingIds: string[] = [];
    const baActors: ActorRole[] = [];
    if (context.actors.includes("provider") && providerTrigger) {
      const findingId = "finding.legal.article-5.ba.provider.001";
      addFinding(context, {
        finding_id: findingId,
        finding_basis: "legal_proposition",
        block: "legal_classification",
        summary:
          "The supplied conditions meet the provider-side Article 5(1)(ba) boundary. The prohibition applies prospectively from 2 December 2026.",
        scope: {
          actors: ["provider"],
          jurisdictions: context.jurisdictions,
          system_scope: context.scope,
        },
        fact_ids: sortStrings([
          ...article5Facts.map((fact) => fact.fact_id),
          ...roleFactsFor(context, "provider"),
          ...factsUnder(context.normalized, "/geography/jurisdictions").map(
            (fact) => fact.fact_id,
          ),
        ]),
        assumption_ids: [],
        missing_fact_ids: [],
        provenance: [
          provenance("Article 5(1)(ba)", "2026-12-02", "art_5"),
          provenance(providerTriggerProvision, "2026-12-02", "art_5"),
        ],
        determination: "applies",
      });
      baFindingIds.push(findingId);
      baActors.push("provider");
      legalFindingIds.push(findingId);
    }
    if (context.actors.includes("deployer") && deployerPurpose?.value === true) {
      const findingId = "finding.legal.article-5.ba.deployer.001";
      addFinding(context, {
        finding_id: findingId,
        finding_basis: "legal_proposition",
        block: "legal_classification",
        summary:
          "The supplied conditions meet the deployer-side Article 5(1)(ba) purpose boundary. The prohibition applies prospectively from 2 December 2026.",
        scope: {
          actors: ["deployer"],
          jurisdictions: context.jurisdictions,
          system_scope: context.scope,
        },
        fact_ids: sortStrings([
          ...article5Facts.map((fact) => fact.fact_id),
          ...roleFactsFor(context, "deployer"),
          ...factsUnder(context.normalized, "/geography/jurisdictions").map(
            (fact) => fact.fact_id,
          ),
        ]),
        assumption_ids: [],
        missing_fact_ids: [],
        provenance: [
          provenance("Article 5(1)(ba)", "2026-12-02", "art_5"),
          provenance("Article 5(1a)(b)", "2026-12-02", "art_5"),
        ],
        determination: "applies",
      });
      baFindingIds.push(findingId);
      baActors.push("deployer");
      legalFindingIds.push(findingId);
    }
    if (baFindingIds.length > 0) {
      routes.push({
        route: "prohibited",
        finding_ids: baFindingIds,
        actor_roles: baActors,
      });
    }
  }

  const bbCategory = profile.article_5_prohibitions?.bb_directive_2011_93_category;
  const bbDefence =
    profile.article_5_prohibitions
      ?.bb_without_right_defence_applies_under_national_law;
  const bbCovered =
    operation !== undefined &&
    bbCategory !== undefined &&
    bbCategory.value !== "none" &&
    bbCategory.value !== "unknown";
  const callerAssertedDefence =
    bbDefence?.verification === "caller_asserted";
  if (bbCovered) {
    const bbFindingIds: string[] = [];
    const bbActors: ActorRole[] = [];
    if (context.actors.includes("provider") && providerTrigger) {
      const findingId = "finding.legal.article-5.bb.provider.001";
      addFinding(context, {
        finding_id: findingId,
        finding_basis: "legal_proposition",
        block: "legal_classification",
        summary:
          "The supplied conditions meet the provider-side Article 5(1)(bb) boundary. The prohibition applies prospectively from 2 December 2026.",
        scope: {
          actors: ["provider"],
          jurisdictions: context.jurisdictions,
          system_scope: context.scope,
        },
        fact_ids: sortStrings([
          ...article5Facts.map((fact) => fact.fact_id),
          ...roleFactsFor(context, "provider"),
          ...factsUnder(context.normalized, "/geography/jurisdictions").map(
            (fact) => fact.fact_id,
          ),
        ]),
        assumption_ids: [],
        missing_fact_ids: [],
        provenance: [
          provenance("Article 5(1)(bb)", "2026-12-02", "art_5"),
          provenance(providerTriggerProvision, "2026-12-02", "art_5"),
        ],
        determination: "applies",
      });
      bbFindingIds.push(findingId);
      bbActors.push("provider");
      legalFindingIds.push(findingId);
    }
    if (context.actors.includes("deployer") && deployerPurpose?.value === true) {
      const findingId = "finding.legal.article-5.bb.deployer.001";
      addFinding(context, {
        finding_id: findingId,
        finding_basis: "legal_proposition",
        block: "legal_classification",
        summary:
          "The supplied conditions meet the deployer-side Article 5(1)(bb) purpose boundary. The prohibition applies prospectively from 2 December 2026.",
        scope: {
          actors: ["deployer"],
          jurisdictions: context.jurisdictions,
          system_scope: context.scope,
        },
        fact_ids: sortStrings([
          ...article5Facts.map((fact) => fact.fact_id),
          ...roleFactsFor(context, "deployer"),
          ...factsUnder(context.normalized, "/geography/jurisdictions").map(
            (fact) => fact.fact_id,
          ),
        ]),
        assumption_ids: [],
        missing_fact_ids: [],
        provenance: [
          provenance("Article 5(1)(bb)", "2026-12-02", "art_5"),
          provenance("Article 5(1a)(b)", "2026-12-02", "art_5"),
        ],
        determination: "applies",
      });
      bbFindingIds.push(findingId);
      bbActors.push("deployer");
      legalFindingIds.push(findingId);
    }
    if (bbFindingIds.length > 0) {
      routes.push({
        route: "prohibited",
        finding_ids: bbFindingIds,
        actor_roles: bbActors,
      });
      requiresHumanReview = true;
      context.warnings.push({
        warning_id: "warning.legal-review.article-5-bb-national-law.001",
        code: "LEGAL_REVIEW_REQUIRED",
        message: callerAssertedDefence
          ? "A caller assertion about the national-law without-right defence cannot remove the Article 5(1)(bb) prohibition route. Human review of the applicable national law is required."
          : "The Article 5(1)(bb) national-law without-right defence requires human review and cannot be resolved by this corpus.",
        finding_ids: bbFindingIds,
      });
    }
  }

  if (
    classification.risk_classification === "prohibited" &&
    !routes.some((route) => route.route === "prohibited") &&
    !(
      profile.article_5_prohibitions !== undefined &&
      classification.relevant_articles.some((article) => /\(ba\)|\(bb\)/.test(article))
    )
  ) {
    const factIds = sortStrings([
      ...positiveFactIds(context.normalized, [
        "/biometric_and_practices",
        "/intended_use",
      ]),
      ...scopeFactIds(context.normalized),
    ]);
    const exactProvision =
      classification.relevant_articles.find((article) => /^Art\. 5\(1\)/.test(article)) ??
      "Article 5(1)";
    const operativeDate = /\(ba\)|\(bb\)/.test(exactProvision)
      ? "2026-12-02"
      : "2025-02-02";
    const findingId = `finding.legal.prohibited.${slug(exactProvision)}.001`;
    addFinding(context, {
      finding_id: findingId,
      finding_basis: "legal_proposition",
      block: "legal_classification",
      summary:
        "The existing Article 5 classifier identifies a prohibited-practice route from the supplied facts.",
      scope: {
        actors: context.actors,
        jurisdictions: context.jurisdictions,
        system_scope: context.scope,
      },
      fact_ids: factIds,
      assumption_ids: [],
      missing_fact_ids: [],
      provenance: [provenance(exactProvision.replace("Art.", "Article"), operativeDate, "art_5")],
      determination: "applies",
    });
    routes.push({ route: "prohibited", finding_ids: [findingId], actor_roles: context.actors });
    legalFindingIds.push(findingId);
    context.warnings.push({
      warning_id: "warning.legal-review.prohibited.001",
      code: "LEGAL_REVIEW_REQUIRED",
      message:
        "A prohibited-practice route requires legal review, including any narrow statutory exception.",
      finding_ids: [findingId],
    });
    addRecommendation(context, {
      tool_name: "euaiact_get_article",
      reason: "Review the operational Article 5 summary and verify the official provision.",
      input_fact_ids: factIds,
    });
  }

  if (
    routes.some((route) => route.route === "prohibited") &&
    !context.warnings.some(
      (warning) => warning.warning_id === "warning.legal-review.prohibited.001",
    )
  ) {
    const prohibitedFindingIds = routes
      .filter((route) => route.route === "prohibited")
      .flatMap((route) => route.finding_ids);
    context.warnings.push({
      warning_id: "warning.legal-review.prohibited.001",
      code: "LEGAL_REVIEW_REQUIRED",
      message:
        "A prohibited-practice route requires legal review, including any narrow statutory exception and its application date.",
      finding_ids: sortStrings(prohibitedFindingIds),
    });
  }

  if (
    annexIListingRefuted &&
    profile.annex_i?.product_or_safety_component?.value === true
  ) {
    const findingId = "finding.legal.high-risk.annex-i.not-listed.001";
    addFinding(context, {
      finding_id: findingId,
      finding_basis: "legal_proposition",
      block: "legal_classification",
      summary:
        "Article 6(1) does not apply. Article 6(1), point (a), conditions the high-risk route on coverage by the Union harmonisation legislation listed in Annex I, and no caller-cited instrument is among the listed acts of the pinned Annex I, Section A, points 2 to 12, or Section B, points 13 to 21. An instrument whose number appears only inside another listed entry's title is not listed. The caller-asserted Annex I facts are retained with caller_asserted verification.",
      scope: {
        actors: context.actors,
        jurisdictions: context.jurisdictions,
        system_scope: context.scope,
      },
      fact_ids: sortStrings([
        ...factsUnder(context.normalized, "/annex_i").map((fact) => fact.fact_id),
        ...scopeFactIds(context.normalized),
      ]),
      assumption_ids: [],
      missing_fact_ids: [],
      provenance: [provenance("Article 6(1)", "2028-08-02", "art_6")],
      determination: "does_not_apply",
    });
    boundaryNegativeFindingIds.push(findingId);
    legalFindingIds.push(findingId);
  }

  if (highRiskClassification) {
    annexPoint =
      profile.annex_iii?.annex_iii_point?.value ??
      highRiskClassification.annex_iii_category?.number;
    highRiskSource = highRiskClassification.relevant_articles.includes("Art. 6(1)")
      ? "annex_i"
      : "annex_iii";
    const factIds = sortStrings([
      ...positiveFactIds(context.normalized, [
        highRiskSource === "annex_i" ? "/annex_i" : "/annex_iii",
        "/intended_use",
        "/decision_context",
        "/biometric_and_practices",
      ]),
      ...scopeFactIds(context.normalized),
    ]);
    const exactProvision =
      highRiskSource === "annex_i"
        ? "Article 6(1) and Annex I"
        : `Article 6(2) and Annex III${annexPoint ? `, point ${annexPoint}` : ""}`;
    const operativeDate = highRiskSource === "annex_i" ? "2028-08-02" : "2027-12-02";
    const findingId = `finding.legal.high-risk.${highRiskSource}${
      annexPoint ? `.${annexPoint}` : ""
    }.001`;
    addFinding(context, {
      finding_id: findingId,
      finding_basis: "legal_proposition",
      block: "legal_classification",
      summary:
        "The existing Article 6 classifier identifies a high-risk route from the supplied facts.",
      scope: {
        actors: context.actors,
        jurisdictions: context.jurisdictions,
        system_scope: context.scope,
      },
      fact_ids: factIds,
      assumption_ids: [],
      missing_fact_ids: [],
      provenance: [
        provenance(
          exactProvision,
          operativeDate,
          highRiskSource === "annex_i" ? "art_6" : "anx_III",
        ),
        ...(highRiskSource === "annex_i"
          ? [provenance("Article 6(1a) to (1c)", operativeDate, "art_6")]
          : []),
      ],
      determination: "applies",
    });
    routes.push({ route: "high_risk", finding_ids: [findingId], actor_roles: context.actors });
    legalFindingIds.push(findingId);
    if (annexPoint) annexCategories.push(annexPoint);
    if (highRiskSource === "annex_i") {
      addRecommendation(context, {
        tool_name: "euaiact_get_obligations",
        reason: "Retrieve duties for the Article 6(1) high-risk route.",
        input_fact_ids: factIds,
      });
    } else {
      const profiling = profile.annex_iii?.performs_profiling;
      if (profiling) {
        const exceptionResult = await invokeArt6Exception({
          annex_iii_number: annexPoint,
          performs_profiling: profiling.value,
          narrow_procedural_task: profile.annex_iii?.narrow_procedural_task?.value,
          improves_prior_human_activity:
            profile.annex_iii?.improves_prior_human_activity?.value,
          detects_patterns_without_replacing_human_review:
            profile.annex_iii?.detects_patterns_without_replacing_human_review?.value,
          preparatory_task: profile.annex_iii?.preparatory_task?.value,
        });
        markFacts(context, [profiling.fact_id]);
        legalLimitations.push(
          exceptionResult.profiling_blocks_exception
            ? "The existing Article 6(3) evaluator confirms that profiling blocks the exception."
            : "The frozen profile has no no-significant-risk predicate, so the existing Article 6(3) evaluator cannot establish the exception in this call.",
        );
      } else {
        legalLimitations.push(
          "Article 6(3) exception routing requires the missing profiling fact and a separate no-significant-risk assessment.",
        );
      }
      addRecommendation(context, {
        tool_name: "euaiact_assess_art6_3_exception",
        reason:
          "Assess the Article 6(3) route separately. The frozen profile cannot establish the no-significant-risk predicate on its own.",
        input_fact_ids: factIds,
      });
    }
  }

  const standardEditingFact = factAt(
    context.normalized,
    "/transparency/standard_editing_assistive_function",
  );
  const substantialAlterationFact = factAt(
    context.normalized,
    "/transparency/substantially_alters_input_or_semantics",
  );
  if (
    standardEditingFact?.value === true &&
    substantialAlterationFact?.value === false
  ) {
    const findingId = "finding.legal.transparency.article-50-2.standard-editing.001";
    addFinding(context, {
      finding_id: findingId,
      finding_basis: "legal_proposition",
      block: "legal_classification",
      summary:
        "Article 50(2) does not apply because the supplied facts establish an assistive standard-editing function that does not substantially alter the input or its semantics.",
      scope: {
        actors: context.actors.includes("provider") ? ["provider"] : context.actors,
        jurisdictions: context.jurisdictions,
        system_scope: context.scope,
      },
      fact_ids: sortStrings([
        standardEditingFact.fact_id,
        substantialAlterationFact.fact_id,
        ...scopeFactIds(context.normalized),
      ]),
      assumption_ids: [],
      missing_fact_ids: [],
      provenance: [provenance("Article 50(2)", "2026-08-02", "art_50")],
      determination: "does_not_apply",
    });
    boundaryNegativeFindingIds.push(findingId);
    legalFindingIds.push(findingId);
  }

  const transparencyFindingIds: string[] = [];
  const transparencyActors = new Set<ActorRole>();
  const transparencyFacts: Array<{
    path: string;
    provision: string;
    summary: string;
    actor: "provider" | "deployer";
  }> = [
    {
      path: "/transparency/interacts_with_natural_persons",
      provision: "Article 50(1)",
      summary: "Direct interaction with natural persons triggers the Article 50(1) route.",
      actor: "provider",
    },
    {
      path: "/transparency/generates_or_manipulates_synthetic_content",
      provision: "Article 50(2)",
      summary: "Synthetic content generation triggers the Article 50(2) marking route.",
      actor: "provider",
    },
    {
      path: "/transparency/deep_fake_content",
      provision: "Article 50(4)",
      summary: "Deep-fake content triggers the Article 50(4) disclosure route.",
      actor: "deployer",
    },
    {
      path: "/transparency/public_interest_text",
      provision: "Article 50(4)",
      summary: "Public-interest synthetic text triggers the Article 50(4) disclosure route.",
      actor: "deployer",
    },
    {
      path: "/biometric_and_practices/emotion_recognition",
      provision: "Article 50(3)",
      summary: "Emotion recognition triggers the Article 50(3) information route.",
      actor: "deployer",
    },
    {
      path: "/biometric_and_practices/biometric_categorisation",
      provision: "Article 50(3)",
      summary: "Biometric categorisation triggers the Article 50(3) information route.",
      actor: "deployer",
    },
  ];
  for (const trigger of transparencyFacts) {
    const fact = factAt(context.normalized, trigger.path);
    if (
      fact?.value !== true ||
      (trigger.provision === "Article 50(2)" &&
        standardEditingFact?.value === true &&
        substantialAlterationFact?.value === false)
    ) continue;
    const findingId = `finding.legal.transparency.${slug(trigger.provision)}.${slug(
      fact.fact_id,
    )}`;
    addFinding(context, {
      finding_id: findingId,
      finding_basis: "legal_proposition",
      block: "legal_classification",
      summary: trigger.summary,
      scope: {
        actors: [trigger.actor],
        jurisdictions: context.jurisdictions,
        system_scope: context.scope,
      },
      fact_ids: sortStrings([fact.fact_id, ...scopeFactIds(context.normalized)]),
      assumption_ids: [],
      missing_fact_ids: [],
      provenance: [provenance(trigger.provision, "2026-08-02", "art_50")],
      determination: "applies",
    });
    transparencyFindingIds.push(findingId);
    transparencyActors.add(trigger.actor);
    legalFindingIds.push(findingId);
    if (trigger.provision === "Article 50(2)") {
      legalLimitations.push(
        "The profile does not establish whether Article 111(4) moves the provider's Article 50(2) compliance deadline to 2 December 2026 for a system placed on the market before 2 August 2026.",
      );
    }
  }
  if (transparencyFindingIds.length > 0) {
    routes.push({
      route: "transparency_duty",
      finding_ids: transparencyFindingIds,
      actor_roles: [...transparencyActors],
    });
    addRecommendation(context, {
      tool_name: "euaiact_get_obligations",
      reason: "Retrieve the actor-specific Article 50 duties.",
      input_fact_ids: transparencyFacts
        .map((trigger) => factAt(context.normalized, trigger.path))
        .filter((fact): fact is FactUsed => fact?.value === true)
        .map((fact) => fact.fact_id),
    });
  }

  const gpaiFact = factAt(context.normalized, "/gpai/is_gpai_model");
  let gpaiSystemicRisk = false;
  if (gpaiFact?.value === true) {
    const findingId = "finding.legal.gpai.model.001";
    addFinding(context, {
      finding_id: findingId,
      finding_basis: "legal_proposition",
      block: "legal_classification",
      summary:
        "The supplied fact identifies a general-purpose AI model route. This does not classify a downstream AI system.",
      scope: {
        actors: context.actors,
        jurisdictions: context.jurisdictions,
        system_scope: context.scope,
      },
      fact_ids: sortStrings([gpaiFact.fact_id, ...scopeFactIds(context.normalized)]),
      assumption_ids: [],
      missing_fact_ids: [],
      provenance: [provenance("Article 3(63)", "2025-02-02", "art_3")],
      determination: "applies",
    });
    const gpaiFindingIds = [findingId];
    legalFindingIds.push(findingId);
    const systemic = await invokeGpaiSystemic({
      model_name: profile.gpai?.model_name?.value,
      training_flops: profile.gpai?.training_flops?.value,
      commission_designated: profile.gpai?.commission_designated_systemic_risk?.value,
    });
    if (systemic.is_gpai_with_systemic_risk === true) {
      gpaiSystemicRisk = true;
      const systemicFindingId = "finding.legal.gpai.systemic-risk.001";
      const systemicFactIds = factsUnder(context.normalized, "/gpai")
        .filter(
          (fact) =>
            fact.profile_path.endsWith("/training_flops") ||
            fact.profile_path.endsWith("/commission_designated_systemic_risk"),
        )
        .map((fact) => fact.fact_id);
      const thresholdBasis = systemic.crosses_flops_threshold === true;
      addFinding(context, {
        finding_id: systemicFindingId,
        finding_basis: "legal_proposition",
        block: "legal_classification",
        summary: thresholdBasis
          ? "Training compute at or above the adjudicated 10^25 FLOPs product boundary creates the Article 51(2) presumption route. Classification remains subject to the Article 52 procedure, including the provider's exceptional substantiated rebuttal route and the Commission's decision."
          : "The supplied fact records a Commission designation of the model as a GPAI model with systemic risk under Article 51(1)(b).",
        scope: {
          actors: context.actors,
          jurisdictions: context.jurisdictions,
          system_scope: context.scope,
        },
        fact_ids: sortStrings([...systemicFactIds, ...scopeFactIds(context.normalized)]),
        assumption_ids: [],
        missing_fact_ids: [],
        provenance: thresholdBasis
          ? [
              provenance("Article 51(1)(a)", "2025-08-02", "art_51"),
              provenance("Article 51(2)", "2025-08-02", "art_51"),
              provenance("Article 52(1)", "2025-08-02", "art_52"),
              provenance("Article 52(2)", "2025-08-02", "art_52"),
            ]
          : [provenance("Article 51(1)(b)", "2025-08-02", "art_51")],
        determination: "applies",
      });
      gpaiFindingIds.push(systemicFindingId);
      legalFindingIds.push(systemicFindingId);
    }
    routes.push({ route: "gpai", finding_ids: gpaiFindingIds, actor_roles: context.actors });
    addRecommendation(context, {
      tool_name: "euaiact_check_gpai_systemic_risk",
      reason: "Assess the separate GPAI systemic-risk route from compute or designation facts.",
      input_fact_ids: factsUnder(context.normalized, "/gpai").map((fact) => fact.fact_id),
    });
  }

  if (routes.length === 0 && boundaryNegativeFindingIds.length > 0) {
    routes.push({
      route: "minimal",
      finding_ids: sortStrings(boundaryNegativeFindingIds),
      actor_roles: context.actors,
    });
    context.warnings.push({
      warning_id: "warning.legal-review.negative-boundary.001",
      code: "LEGAL_REVIEW_REQUIRED",
      message:
        "The minimal route rests on express statutory exclusions and remains bounded to the supplied negative facts.",
      finding_ids: sortStrings(boundaryNegativeFindingIds),
    });
  }

  if (
    classification.risk_classification === "minimal" &&
    routes.length === 0
  ) {
    const factIds = allLegalFactIds;
    const findingId = "finding.legal.minimal.bounded.001";
    addFinding(context, {
      finding_id: findingId,
      finding_basis: "legal_proposition",
      block: "legal_classification",
      summary:
        BOUNDED_NEGATIVE_LIMITATION,
      scope: {
        actors: context.actors,
        jurisdictions: context.jurisdictions,
        system_scope: context.scope,
      },
      fact_ids: factIds,
      assumption_ids: [],
      missing_fact_ids: [],
      provenance: [
        provenance("Article 5(1)(c)", "2025-02-02", "art_5"),
        provenance("Article 5(1)(f)", "2025-02-02", "art_5"),
        provenance("Article 5(1)(h)", "2025-02-02", "art_5"),
        provenance("Article 6(1) and Annex I", "2028-08-02", "art_6"),
        provenance("Article 6(2) and Annex III", "2027-12-02", "art_6"),
        provenance("Article 50(1)", "2026-08-02", "art_50"),
        provenance("Article 50(2)", "2026-08-02", "art_50"),
      ],
      determination: "does_not_apply",
    });
    routes.push({ route: "minimal", finding_ids: [findingId], actor_roles: context.actors });
    legalFindingIds.push(findingId);
    context.warnings.push({
      warning_id: "warning.legal-review.negative-conclusion.001",
      code: "LEGAL_REVIEW_REQUIRED",
      message:
        "The bounded minimal route is a negative legal conclusion and depends on the completeness and accuracy of supplied facts.",
      finding_ids: [findingId],
    });
  }

  if (routes.length === 0) {
    addMissing(context, {
      missing_fact_id: "missing.classification-context",
      profile_path: "/intended_use",
      question:
        "Which Article 5 practice, Article 6 high-risk use, Article 50 interaction, or complete exclusion facts describe the system?",
      reason: "The existing classifier abstained on the supplied structured facts.",
      decisive: true,
      affected_blocks: ["legal_classification", "implementation_readiness"],
    });
    const findingId = "finding.legal.abstention.classification-context.001";
    addFinding(context, {
      finding_id: findingId,
      finding_basis: "tool_state_abstention",
      block: "legal_classification",
      summary: "The existing classifier did not resolve a legal route.",
      scope: {
        actors: context.actors,
        jurisdictions: context.jurisdictions,
        system_scope: context.scope,
      },
      fact_ids: allLegalFactIds,
      assumption_ids: [],
      missing_fact_ids: ["missing.classification-context"],
      provenance: [],
      determination: "undetermined",
      reason_for_abstention:
        "The supplied facts do not satisfy a decisive route and are not complete enough for the bounded minimal route.",
    });
    return {
      classification,
      route_fact_ids: allLegalFactIds,
      block: {
        schema_version: "1.0",
        status: "undetermined",
        routes: [],
        annex_iii_categories: [],
        actor_roles: context.actors,
        finding_ids: [findingId],
        limitations: ["The existing classifier abstained rather than guessing."],
      },
    };
  }

  routes.sort((left, right) => ROUTE_ORDER[left.route] - ROUTE_ORDER[right.route]);
  for (const route of routes) {
    route.finding_ids = sortStrings(route.finding_ids);
    route.actor_roles = [...route.actor_roles].sort(compareUnicodeCodePoints);
  }
  return {
    classification,
    route_fact_ids: allLegalFactIds,
    high_risk_source: highRiskSource,
    annex_iii_point: annexPoint,
    gpai_systemic_risk: gpaiSystemicRisk,
    block: {
      schema_version: "1.0",
      status: requiresHumanReview ? "human_review_required" : "determined",
      routes,
      annex_iii_categories: [...new Set(annexCategories)].sort((a, b) => a - b),
      actor_roles: context.actors,
      finding_ids: sortStrings(legalFindingIds),
      limitations: [
        "Routes are independent. Impact and implementation readiness are reported separately.",
        TERRITORIAL_SCOPE_LIMITATION,
        ...(routes.some((route) => route.route === "high_risk")
          ? [HIGH_RISK_DATE_LIMITATION]
          : []),
        ...(routes.some((route) => route.route === "minimal")
          ? [BOUNDED_NEGATIVE_LIMITATION]
          : []),
        ...legalLimitations,
      ],
    },
  };
}

function impactCategories(profile: SystemProfile): AssessSystemResponse["impact"]["inherent_impact"] extends infer Statement
  ? Statement extends { categories: infer Categories }
    ? Categories
    : never
  : never {
  const categories = new Set<
    NonNullable<AssessSystemResponse["impact"]["inherent_impact"]>["categories"][number]
  >();
  const domain = profile.annex_iii?.domain?.value;
  const byDomain: Record<string, Array<
    NonNullable<AssessSystemResponse["impact"]["inherent_impact"]>["categories"][number]
  >> = {
    biometrics: ["privacy_and_data_protection", "non_discrimination"],
    critical_infrastructure: ["health", "safety"],
    education: ["education", "non_discrimination"],
    employment: ["employment_and_work", "non_discrimination"],
    essential_services: ["access_to_essential_services", "non_discrimination"],
    law_enforcement: ["due_process_and_effective_remedy", "non_discrimination"],
    migration_asylum_border_control: [
      "due_process_and_effective_remedy",
      "non_discrimination",
    ],
    justice_and_democratic_processes: [
      "due_process_and_effective_remedy",
      "freedom_of_expression_and_information",
    ],
    other: ["other_fundamental_rights"],
    unknown: ["other_fundamental_rights"],
  };
  for (const category of domain ? byDomain[domain] ?? [] : []) categories.add(category);
  if (profile.biometric_and_practices?.uses_biometrics?.value) {
    categories.add("privacy_and_data_protection");
  }
  if (profile.decision_context?.materially_influences_decision?.value) {
    categories.add("due_process_and_effective_remedy");
  }
  if (categories.size === 0) categories.add("other_fundamental_rights");
  return [...categories].sort(compareUnicodeCodePoints) as ReturnType<typeof impactCategories>;
}

/**
 * The inherent-impact sentence, or undefined when the supplied decision facts give
 * it nothing to describe. Material influence on its own names no effect: it needs a
 * consequence or a decision subject beside it. Only an explicit statement that the
 * output does not materially influence the decision stands alone.
 */
function inherentImpactDescription(
  consequenceFact: FactUsed | undefined,
  decisionSubjectFact: FactUsed | undefined,
  materialInfluenceFact: FactUsed | undefined,
): string | undefined {
  if (materialInfluenceFact?.value === false) {
    return "The supplied facts describe limited decision influence. This impact statement does not change any legal classification route.";
  }
  if (consequenceFact) return `The supplied consequence is: ${String(consequenceFact.value)}.`;
  if (decisionSubjectFact) {
    return `The supplied decision subject is: ${String(decisionSubjectFact.value)}.`;
  }
  return undefined;
}

function assessImpact(
  context: AssessmentContext,
  legal: LegalResult,
): AssessSystemResponse["impact"] {
  if (
    legal.block.status === "not_applicable" &&
    legal.impact_outside_regulation !== true
  ) {
    return {
      schema_version: "1.0",
      status: "not_applicable",
      inherent_impact: null,
      relevant_affected_groups: [],
      current_controls: [],
      residual_impact: null,
      finding_ids: [],
      limitations: [
        "No AI Act impact result is produced for the bounded non-applicability conclusion.",
      ],
      does_not_alter_legal_classification: true,
    };
  }

  const groupFacts = factsUnder(context.normalized, "/geography/affected_person_groups");
  const consequenceFact = factAt(
    context.normalized,
    "/decision_context/decision_consequence",
  );
  const materialInfluenceFact = factAt(
    context.normalized,
    "/decision_context/materially_influences_decision",
  );
  const decisionSubjectFact = factAt(
    context.normalized,
    "/decision_context/decision_subject",
  );
  const impactSignalFacts = [
    ...groupFacts,
    ...factsUnder(context.normalized, "/annex_iii/domain"),
    ...factsUnder(context.normalized, "/biometric_and_practices"),
    ...(consequenceFact ? [consequenceFact] : []),
    ...(materialInfluenceFact ? [materialInfluenceFact] : []),
    ...(decisionSubjectFact ? [decisionSubjectFact] : []),
  ];

  if (groupFacts.length === 0) {
    addMissing(context, {
      missing_fact_id: "missing.impact.affected-groups",
      profile_path: "/geography/affected_person_groups",
      question: "Which natural-person groups may be affected by the system or its outputs?",
      reason: "Affected groups are decisive for a bounded impact statement.",
      decisive: true,
      affected_blocks: ["impact"],
    });
  }
  const inherentDescription = inherentImpactDescription(
    consequenceFact,
    decisionSubjectFact,
    materialInfluenceFact,
  );
  if (inherentDescription === undefined) {
    addMissing(context, {
      missing_fact_id: "missing.impact.consequence",
      profile_path: "/decision_context/decision_consequence",
      question: "What consequence can the system or its output have for affected persons?",
      reason: "An impact statement requires a supplied effect or decision consequence.",
      decisive: true,
      affected_blocks: ["impact"],
    });
  }

  const controls = (context.normalized.profile.controls_and_evidence?.controls ?? []).map(
    (control) => {
      markFacts(context, [control.description.fact_id, control.implementation_state.fact_id]);
      return {
        control_id: control.control_id,
        description: control.description.value,
        implementation_state: control.implementation_state.value,
        evidence_reference_ids: sortStrings(control.evidence_reference_ids),
        fact_ids: sortStrings([
          control.description.fact_id,
          control.implementation_state.fact_id,
        ]),
      };
    },
  );
  controls.sort((left, right) => compareUnicodeCodePoints(left.control_id, right.control_id));

  if (groupFacts.length === 0 || inherentDescription === undefined) {
    return {
      schema_version: "1.0",
      status: "undetermined",
      inherent_impact: null,
      relevant_affected_groups: [],
      current_controls: controls,
      residual_impact: null,
      finding_ids: [],
      limitations: ["Decisive affected-group or consequence facts are missing."],
      does_not_alter_legal_classification: true,
    };
  }

  const inheritedImpactMissing = [...context.missing.values()].filter(
    (missing) =>
      missing.decisive && missing.affected_blocks.includes("impact"),
  );
  if (inheritedImpactMissing.length > 0) {
    return {
      schema_version: "1.0",
      status: "undetermined",
      inherent_impact: null,
      relevant_affected_groups: [],
      current_controls: controls,
      residual_impact: null,
      finding_ids: [],
      limitations: ["Decisive facts affecting impact are listed in missing_facts."],
      does_not_alter_legal_classification: true,
    };
  }

  const groups = groupFacts.map((fact) => ({
    group_id: `group.${slug(fact.fact_id)}`,
    label: String(fact.value),
    fact_ids: markFacts(context, [fact.fact_id]),
  }));
  groups.sort((left, right) => compareUnicodeCodePoints(left.group_id, right.group_id));
  const categories = impactCategories(context.normalized.profile);
  const impactFactIds = markFacts(
    context,
    impactSignalFacts.map((fact) => fact.fact_id),
  );
  const testedControls = controls.filter((control) => control.implementation_state === "tested");
  const residualDescription =
    testedControls.length > 0
      ? "Tested controls are supplied, but this assessment does not quantify or erase the inherent impact."
      : controls.length > 0
        ? "Controls are supplied, but no tested-control conclusion is inferred from planned or implemented state alone."
        : "No supplied tested-control evidence reduces the described inherent impact.";
  const findingId = "finding.impact.supplied-context.001";
  addFinding(context, {
    finding_id: findingId,
    finding_basis: "caller_supplied_impact",
    block: "impact",
    summary: inherentDescription,
    scope: {
      actors: context.actors,
      jurisdictions: context.jurisdictions,
      system_scope: context.scope,
    },
    fact_ids: impactFactIds,
    assumption_ids: [],
    missing_fact_ids: [],
    provenance: [],
    determination: "applies",
  });

  return {
    schema_version: "1.0",
    status: "determined",
    inherent_impact: {
      description: inherentDescription,
      categories,
      affected_group_ids: groups.map((group) => group.group_id),
      fact_ids: impactFactIds,
    },
    relevant_affected_groups: groups,
    current_controls: controls,
    residual_impact: {
      description: residualDescription,
      categories,
      affected_group_ids: groups.map((group) => group.group_id),
      fact_ids: impactFactIds,
    },
    finding_ids: [findingId],
    limitations: [
      "Impact is qualitative and contains no aggregate or numeric score.",
      "Controls cannot alter legal classification.",
    ],
    does_not_alter_legal_classification: true,
  };
}

function articleAnchor(article: string): string {
  const match = article.match(/(?:Art\.|Article)\s*(\d+[a-z]?)/i);
  return match ? `art_${match[1]!.toLowerCase()}` : "art_1";
}

function canonicalProvisionLabel(article: string): string {
  return article.replace(/^Art\.\s*/i, "Article ");
}

function roleFactsFor(context: AssessmentContext, actor: ActorRole): string[] {
  return factsUnder(context.normalized, "/role_facts/roles")
    .filter((fact) => fact.value === actor)
    .map((fact) => fact.fact_id);
}

async function assessReadiness(
  context: AssessmentContext,
  legal: LegalResult,
): Promise<AssessSystemResponse["implementation_readiness"]> {
  if (legal.block.status === "not_applicable") {
    return {
      schema_version: "1.0",
      status: "not_applicable",
      readiness_state: "not_applicable",
      applicable_duties: [],
      evidence_status: [],
      control_gaps: [],
      owners: [],
      finding_ids: [],
      limitations: ["No AI Act implementation duties are selected from this bounded result."],
      is_regulatory_approval: false,
    };
  }
  if (legal.block.status === "undetermined") {
    return {
      schema_version: "1.0",
      status: "undetermined",
      readiness_state: "undetermined",
      applicable_duties: [],
      evidence_status: [],
      control_gaps: [],
      owners: [],
      finding_ids: [],
      limitations: ["Applicable duties cannot be selected before legal classification."],
      is_regulatory_approval: false,
    };
  }

  const supportedActors = context.actors.filter(
    (actor): actor is "provider" | "deployer" | "gpai_provider" =>
      actor === "provider" || actor === "deployer" || actor === "gpai_provider",
  );
  const hasProhibited = legal.block.routes.some((route) => route.route === "prohibited");
  const routeNames = new Set(legal.block.routes.map((route) => route.route));
  const needsSystemOperator = ["high_risk", "transparency_duty", "minimal"].some(
    (route) => routeNames.has(route as LegalRoute),
  );
  const hasSystemOperator = supportedActors.some(
    (actor) => actor === "provider" || actor === "deployer",
  );
  const needsGpaiOperator = routeNames.has("gpai");
  const hasGpaiOperator = supportedActors.some(
    (actor) => actor === "provider" || actor === "gpai_provider",
  );
  if (
    (needsSystemOperator && !hasSystemOperator) ||
    (needsGpaiOperator && !hasGpaiOperator) ||
    (supportedActors.length === 0 && !hasProhibited)
  ) {
    addMissing(context, {
      missing_fact_id: "missing.readiness.actor-role",
      profile_path: "/role_facts/roles",
      question: "Which operator role applies: provider, deployer, or GPAI provider?",
      reason: "Implementation duties are actor-specific.",
      decisive: true,
      affected_blocks: ["implementation_readiness"],
    });
    context.warnings.push({
      warning_id: "warning.unsupported-actor.001",
      code: "UNSUPPORTED_ACTOR",
      message:
        "System duties require a provider or deployer role. GPAI duties require a provider or GPAI-provider role.",
      finding_ids: [],
    });
    return {
      schema_version: "1.0",
      status: "undetermined",
      readiness_state: "undetermined",
      applicable_duties: [],
      evidence_status: [],
      control_gaps: [],
      owners: [],
      finding_ids: [],
      limitations: ["An actor role supported by the atomic obligations tool is required."],
      is_regulatory_approval: false,
    };
  }

  const dutyInputs: Array<{
    actor: ActorRole;
    title: string;
    article: string;
    deadline: string;
    category: string;
  }> = [];
  const routes = routeNames;
  const triggeredArticle50Paragraphs = new Set(
    context.findings
      .filter(
        (finding) =>
          finding.block === "legal_classification" &&
          legal.block.finding_ids.includes(finding.finding_id),
      )
      .flatMap((finding) => finding.provenance)
      .map((entry) => entry.exact_provision.match(/Article 50\((\d)\)/)?.[1])
      .filter((paragraph): paragraph is string => paragraph !== undefined),
  );

  for (const actor of supportedActors) {
    const atomicRole = actor === "provider" || actor === "deployer" ? actor : null;
    if (routes.has("high_risk") && atomicRole) {
      const output = await invokeObligations({
        role: atomicRole,
        risk_level: "high-risk",
        high_risk_source: legal.high_risk_source ?? "unknown",
        annex_iii_point: legal.annex_iii_point,
      });
      output.obligations.forEach((duty) =>
        dutyInputs.push({
          actor,
          title: duty.obligation,
          article: duty.article,
          deadline: duty.deadline,
          category: duty.category,
        }),
      );
    }
    if (routes.has("transparency_duty") && atomicRole) {
      const output = await invokeObligations({
        role: atomicRole,
        risk_level: "limited",
        high_risk_source: "unknown",
      });
      output.obligations.forEach((duty) => {
        const paragraph = duty.article.match(/Art\. 50\((\d)\)/)?.[1];
        if (
          duty.article === "Art. 4" ||
          (paragraph && triggeredArticle50Paragraphs.has(paragraph))
        ) {
          dutyInputs.push({
            actor,
            title: duty.obligation,
            article: duty.article,
            deadline: duty.deadline,
            category: duty.category,
          });
        }
      });
    }
    if (routes.has("minimal") && atomicRole) {
      const output = await invokeObligations({
        role: atomicRole,
        risk_level: "minimal",
        high_risk_source: "unknown",
      });
      output.obligations.forEach((duty) =>
        dutyInputs.push({
          actor,
          title: duty.obligation,
          article: duty.article,
          deadline: duty.deadline,
          category: duty.category,
        }),
      );
    }
    if (routes.has("gpai") && (actor === "gpai_provider" || actor === "provider")) {
      const modelDate = context.normalized.profile.gpai?.model_placed_on_market_date?.value;
      const output = await invokeObligations({
        role: "provider",
        risk_level: "gpai",
        high_risk_source: "unknown",
        gpai_model_placed_on_market_before_2025_08_02:
          modelDate !== undefined ? modelDate < "2025-08-02" : undefined,
      });
      output.obligations
        .filter(
          (duty) =>
            !duty.article.startsWith("Art. 55") ||
            legal.gpai_systemic_risk === true,
        )
        .forEach((duty) =>
          dutyInputs.push({
            actor,
            title: duty.obligation,
            article: canonicalProvisionLabel(duty.article),
            deadline: duty.deadline,
            category: duty.category,
          }),
        );
      if (legal.gpai_systemic_risk === true) {
        dutyInputs.push({
          actor,
          title: "Notify the Commission of the Article 51(1)(a) condition without delay and within two weeks",
          article: "Article 52(1)",
          deadline: "2025-08-02",
          category: "notification",
        });
      }
    }
  }

  if (hasProhibited) {
    const exactProhibitedProvision = context.findings
      .find((finding) => legal.block.routes.some(
        (route) => route.route === "prohibited" && route.finding_ids.includes(finding.finding_id),
      ))
      ?.provenance[0]?.exact_provision ?? "Article 5";
    dutyInputs.push({
      actor: context.actors[0] ?? "unknown",
      title: "Do not deploy or place the prohibited practice on the market",
      article: exactProhibitedProvision,
      deadline: /\(ba\)|\(bb\)/.test(exactProhibitedProvision)
        ? "2026-12-02"
        : "2025-02-02",
      category: "prohibited_practice",
    });
  }

  const deduplicated = new Map<string, (typeof dutyInputs)[number]>();
  for (const duty of dutyInputs) {
    deduplicated.set(`${duty.actor}|${duty.article}|${duty.title}`, duty);
  }
  const duties = [...deduplicated.values()];
  const controls = context.normalized.profile.controls_and_evidence?.controls ?? [];
  const evidenceReferences =
    context.normalized.profile.controls_and_evidence?.evidence_references ?? [];
  const evidenceById = new Map(
    evidenceReferences.map((reference) => [reference.evidence_id, reference]),
  );
  const ownerFact = factAt(context.normalized, "/identity/owner");
  const owners: AssessSystemResponse["implementation_readiness"]["owners"] = ownerFact
    ? [
        {
          owner_id: "owner.profile",
          label: String(ownerFact.value),
          responsibility: "Own the supplied implementation evidence and remediation plan.",
        },
      ]
    : [
        {
          owner_id: "owner.unassigned",
          label: "Unassigned",
          responsibility: "Assign accountable ownership for applicable duties and evidence.",
        },
      ];
  if (ownerFact) markFacts(context, [ownerFact.fact_id]);
  const ownerIds = owners.map((owner) => owner.owner_id);
  const readinessDuties: AssessSystemResponse["implementation_readiness"]["applicable_duties"] = [];
  const evidenceStatus = new Map<
    string,
    AssessSystemResponse["implementation_readiness"]["evidence_status"][number]
  >();
  const gaps: AssessSystemResponse["implementation_readiness"]["control_gaps"] = [];
  const findingIds: string[] = [];

  // One shared readiness finding per actor keeps every duty's exact provision
  // and operative date as a provenance anchor pair while eliminating the
  // repeated per-duty provenance boilerplate, scope, and fact-ID blocks that
  // pushed rich dual-route envelopes over the 64 KiB response bound.
  // Duty-level detail stays complete in applicable_duties, and every duty
  // references its actor's shared finding, which the readiness duty schema
  // expressly allows. The prohibited-practice duty keeps its own dedicated
  // finding so the prospective Article 5 anchor stays date-homogeneous inside
  // one finding, as MIGRATION-002 pinned it.
  interface ActorReadinessAggregate {
    actor: ActorRole;
    count: number;
    documented: number;
    partial: number;
    missing: number;
    provenance: Map<string, Provenance>;
  }
  const sharedReadinessFindings = new Map<ActorRole, ActorReadinessAggregate>();
  const readinessFindingId = (actor: ActorRole): string =>
    `finding.readiness.${slug(actor)}.001`;
  for (const duty of duties) {
    const dutyId = `duty.${slug(duty.actor)}.${slug(duty.article)}.${slug(duty.category)}`;
    const categoryTerms = duty.category
      .replace(/_/g, " ")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((term) => term.length >= 4);
    const matchingControls = controls.filter((control) => {
      const description = control.description.value.toLowerCase();
      return (
        categoryTerms.length > 0 &&
        categoryTerms.every((term) => description.includes(term))
      );
    });
    const matchingEvidenceIds = sortStrings(
      matchingControls.flatMap((control) => control.evidence_reference_ids),
    ).filter((evidenceId) => evidenceById.has(evidenceId));
    const hasTestedControl = matchingControls.some(
      (control) => control.implementation_state.value === "tested",
    );
    const hasImplementedControl = matchingControls.some((control) =>
      ["implemented", "tested"].includes(control.implementation_state.value),
    );
    const evidenceState =
      hasTestedControl && matchingEvidenceIds.length > 0
        ? "documented"
        : hasImplementedControl || matchingEvidenceIds.length > 0
          ? "partial"
          : "missing";
    const isProhibitedDuty = duty.category === "prohibited_practice";
    const findingId = isProhibitedDuty
      ? `finding.readiness.${slug(dutyId)}`
      : readinessFindingId(duty.actor);
    if (isProhibitedDuty) {
      addFinding(context, {
        finding_id: findingId,
        finding_basis: "legal_proposition",
        block: "implementation_readiness",
        summary: `${duty.title} is selected from the existing obligations tool; supplied evidence state is ${evidenceState}.`,
        scope: {
          actors: [duty.actor],
          jurisdictions: context.jurisdictions,
          system_scope: context.scope,
        },
        fact_ids: sortStrings([
          ...legal.route_fact_ids,
          ...roleFactsFor(context, duty.actor),
        ]),
        assumption_ids: [],
        missing_fact_ids: [],
        provenance: [
          provenance(duty.article, duty.deadline, articleAnchor(duty.article)),
        ],
        determination: "applies",
      });
      findingIds.push(findingId);
    } else {
      const aggregate = sharedReadinessFindings.get(duty.actor) ?? {
        actor: duty.actor,
        count: 0,
        documented: 0,
        partial: 0,
        missing: 0,
        provenance: new Map<string, Provenance>(),
      };
      aggregate.count += 1;
      aggregate[evidenceState] += 1;
      const provenanceKey = `${duty.article} ${duty.deadline}`;
      if (!aggregate.provenance.has(provenanceKey)) {
        aggregate.provenance.set(
          provenanceKey,
          provenance(duty.article, duty.deadline, articleAnchor(duty.article)),
        );
      }
      sharedReadinessFindings.set(duty.actor, aggregate);
    }
    readinessDuties.push({
      duty_id: dutyId,
      title: duty.title,
      actor_roles: [duty.actor],
      exact_provision: duty.article,
      operative_date: duty.deadline,
      evidence_state: evidenceState,
      owner_ids: ownerIds,
      finding_ids: [findingId],
    });

    if (matchingEvidenceIds.length === 0) {
      evidenceStatus.set(`evidence.missing.${slug(dutyId)}`, {
        evidence_id: `evidence.missing.${slug(dutyId)}`,
        duty_ids: [dutyId],
        state: "missing",
        note: "No evidence reference was matched to this duty in the supplied profile.",
      });
    } else {
      for (const evidenceId of matchingEvidenceIds) {
        const existing = evidenceStatus.get(evidenceId);
        if (existing) {
          existing.duty_ids = sortStrings([...existing.duty_ids, dutyId]);
        } else {
          evidenceStatus.set(evidenceId, {
            evidence_id: evidenceId,
            duty_ids: [dutyId],
            state: "provided",
            note:
              "The reference is supplied and linked to a matching control. Its contents are not independently verified by this call.",
          });
        }
      }
    }
    if (evidenceState !== "documented") {
      gaps.push({
        gap_id: `gap.${slug(dutyId)}`,
        duty_ids: [dutyId],
        description: "Supply documented evidence for this duty.",
        owner_ids: ownerIds,
        target_date: duty.deadline,
      });
    }
  }

  for (const aggregate of [...sharedReadinessFindings.values()].sort(
    (left, right) => compareUnicodeCodePoints(left.actor, right.actor),
  )) {
    const findingId = readinessFindingId(aggregate.actor);
    addFinding(context, {
      finding_id: findingId,
      finding_basis: "legal_proposition",
      block: "implementation_readiness",
      summary: `Applicable duties for the ${aggregate.actor} role: ${aggregate.count} (evidence documented ${aggregate.documented}, partial ${aggregate.partial}, missing ${aggregate.missing}). The duties are selected from the existing obligations tool; per-duty titles, exact provisions, operative dates, and evidence states are listed in applicable_duties.`,
      scope: {
        actors: [aggregate.actor],
        jurisdictions: context.jurisdictions,
        system_scope: context.scope,
      },
      fact_ids: sortStrings([
        ...legal.route_fact_ids,
        ...roleFactsFor(context, aggregate.actor),
      ]),
      assumption_ids: [],
      missing_fact_ids: [],
      provenance: [...aggregate.provenance.values()],
      determination: "applies",
    });
    findingIds.push(findingId);
  }

  readinessDuties.sort((left, right) => compareUnicodeCodePoints(left.duty_id, right.duty_id));
  const evidenceArray = [...evidenceStatus.values()].sort((left, right) =>
    compareUnicodeCodePoints(left.evidence_id, right.evidence_id),
  );
  gaps.sort((left, right) => compareUnicodeCodePoints(left.gap_id, right.gap_id));
  owners.sort((left, right) => compareUnicodeCodePoints(left.owner_id, right.owner_id));
  const documentedCount = readinessDuties.filter((duty) =>
    ["documented", "verified"].includes(duty.evidence_state),
  ).length;
  const readinessState =
    readinessDuties.length > 0 && documentedCount === readinessDuties.length
      ? "evidence_complete"
      : documentedCount > 0 || readinessDuties.some((duty) => duty.evidence_state === "partial")
        ? "evidence_partial"
        : "evidence_missing";

  return {
    schema_version: "1.0",
    status: "determined",
    readiness_state: readinessState,
    applicable_duties: readinessDuties,
    evidence_status: evidenceArray,
    control_gaps: gaps,
    owners,
    finding_ids: sortStrings(findingIds),
    limitations: [
      "Readiness reports only whether the supplied evidence was mapped to the duties identified in this output. It does not establish that all applicable duties were identified, that the evidence is legally sufficient, or that the provider or deployer complies with the Regulation.",
      "This output is not certification, approval, or regulatory assurance.",
      ...(routes.has("high_risk") ? [HIGH_RISK_DATE_LIMITATION] : []),
    ],
    is_regulatory_approval: false,
  };
}

function sortResponse(context: AssessmentContext): void {
  context.findings.sort(
    (left, right) =>
      BLOCK_ORDER[left.block] - BLOCK_ORDER[right.block] ||
      compareUnicodeCodePoints(left.finding_id, right.finding_id),
  );
  context.warnings.sort(
    (left, right) =>
      compareUnicodeCodePoints(left.code, right.code) ||
      compareUnicodeCodePoints(left.warning_id, right.warning_id),
  );
}

export async function assessSystem(input: unknown): Promise<AssessSystemResponse> {
  const normalized = normalizeSystemProfile(input);
  const context: AssessmentContext = {
    normalized,
    used_fact_ids: new Set(),
    missing: new Map(),
    findings: [],
    warnings: [],
    recommendations: new Map(),
    actors: actorsFromProfile(normalized.profile),
    jurisdictions: jurisdictionsFromProfile(normalized.profile),
    scope: systemScope(normalized.profile),
  };

  const freeText = normalized.profile.free_text;
  if (freeText) {
    markFacts(context, [freeText.fact_id]);
    context.warnings.push({
      warning_id: "warning.unverified-free-text.001",
      code: "UNVERIFIED_FREE_TEXT",
      message:
        "Caller free text is retained as unverified context and does not satisfy a decisive legal predicate.",
      finding_ids: [],
    });
  }

  const legal = await assessLegalClassification(context);
  const impact = assessImpact(context, legal);
  const implementationReadiness = await assessReadiness(context, legal);
  sortResponse(context);

  context.warnings.push({
    warning_id: "warning.not-legal-advice.001",
    code: "OUTPUT_NOT_LEGAL_ADVICE",
    message:
      "This bounded technical output is not legal advice, certification, or regulatory approval.",
    finding_ids: sortStrings(context.findings.map((finding) => finding.finding_id)),
  });
  context.warnings.push({
    warning_id: "warning.summary-only.001",
    code: "SUMMARY_ONLY",
    message:
      "Finding summaries and duty titles are bounded operational summaries, not statutory text. Verify every conclusion against the linked official provision.",
    finding_ids: sortStrings(context.findings.map((finding) => finding.finding_id)),
  });
  context.warnings.push({
    warning_id: "warning.non-binding-source.001",
    code: "NON_BINDING_SOURCE",
    message:
      "Corpus verification confirms only the identity and integrity of the pinned files. It does not establish that the consolidated snapshot has legal effect, that the corpus is current or complete for the facts, that an interpretation is correct, or that a system is compliant, certified, approved, or has passed a conformity assessment.",
    finding_ids: sortStrings(context.findings.map((finding) => finding.finding_id)),
  });
  sortResponse(context);

  const missingFacts = [...context.missing.values()].sort(
    (left, right) =>
      compareUnicodeCodePoints(left.profile_path, right.profile_path) ||
      compareUnicodeCodePoints(left.missing_fact_id, right.missing_fact_id),
  );
  const factsUsed = normalized.facts.filter((fact) =>
    context.used_fact_ids.has(fact.fact_id),
  );
  const recommendations = [...context.recommendations.values()].sort(
    (left, right) => TOOL_ORDER[left.tool_name] - TOOL_ORDER[right.tool_name],
  );
  const status: AssessSystemResponse["status"] =
    legal.block.status === "not_applicable"
      ? "not_applicable"
      : legal.block.status === "undetermined" ||
          impact.status === "undetermined" ||
          implementationReadiness.status === "undetermined"
        ? "undetermined"
        : legal.block.status === "human_review_required"
          ? "human_review_required"
          : "determined";

  const response: AssessSystemResponse = {
    contract_version: DECISION_CONTRACT_VERSION,
    server_version: SERVER_VERSION,
    corpus: SEALED_CORPUS,
    status,
    facts_used: factsUsed,
    assumptions: [],
    missing_facts: missingFacts,
    findings: context.findings,
    warnings: context.warnings,
    recommended_next_calls: recommendations,
    legal_classification: legal.block,
    impact,
    implementation_readiness: implementationReadiness,
  };
  return assessSystemResponseSchema.parse(response);
}
