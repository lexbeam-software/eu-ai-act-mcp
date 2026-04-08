# MCP Server Quality Audit

## v1.1.0 — 2026-04-08

Agent-driven black-box probing on the live Smithery deployment surfaced three
classes of issues. All are fixed in v1.1.0 with regression tests.

### 🔴 Fixed: Classifier false positive (chatbot → Art. 5(1)(f) prohibited)

**Repro (v1.0.1):**
```
euaiact_classify_system {
  "description": "AI chatbot for customer support that handles returns",
  "use_case": "E-commerce customer service"
}
→ risk_classification: "prohibited", relevant_articles: ["Art. 5", "Art. 5(1)(f)"]
```

**Root cause:** `src/utils/matching.ts::calculateKeywordOverlap` had a fallback
path that ran `stem.startsWith(tw) || tw.startsWith(stem)` with the full
multi-word keyword as `stem`. When the input text contained a single-character
token — `"e"` from `"e-commerce"` after punctuation stripping — the check
`"emotion recognition workplace".startsWith("e")` returned true. Multi-word
keywords `"emotion recognition workplace"` and `"emotion detection school"`
both started with `"e"`, giving 2/4 matches = 0.5, which crossed the prohibited
threshold.

**Fix:** Rewrote matching.ts with `scoreKeywordMatch`. Multi-word keywords now
only match if **every** word of the keyword is present in the text (stem
tolerance). The broken fallback path was removed entirely. Stem matches also
require a minimum shared stem length of 3 characters, preventing runaway
prefix matches. See regression tests `chatbot text does NOT match Art. 5(1)(f)`
and `chatbot text → limited risk` in `test.mjs`.

### 🔴 Fixed: Classifier false negative (recruitment → minimal risk)

**Repro (v1.0.1):**
```
euaiact_classify_system {
  "description": "AI system that screens CVs and ranks candidates for hiring decisions",
  "use_case": "Recruitment"
}
→ risk_classification: "minimal", confidence: "low", annex_iii_category: null
```

**Root cause:** `calculateKeywordOverlap` returned `matches / total_keywords`.
Annex III(4) employment had 14 keywords. A realistic recruitment description
only hit 3 of them (`recruitment`, `hiring`, `CV screening`), scoring 0.21 —
well below the 0.3 threshold the classifier used. The textbook Annex III(4)
case, the most-cited example in all AI Act discourse, was mis-classified as
minimal risk.

**Fix:** The rewritten classifier now uses absolute match counts with
strong/weak weighting. A category is a hit if there is at least one strong
match or two weak matches, regardless of how many total keywords are on the
list. Confidence scales with strong-match count: 2+ = high, 1 = medium, soft
fallback = low. See regression test `recruitment text → high-risk Annex III(4)`.

### 🟠 Fixed: Real-time RBI classified as high-risk Annex III(1) instead of prohibited Art. 5(1)(h)

**Repro (v1.0.1):**
```
euaiact_classify_system {
  "description": "real-time facial recognition in public spaces for law enforcement",
  "use_case": "Police identifying suspects"
}
→ On first probe: risk_classification: "prohibited", Art. 5(1)(e)  ← wrong sub-letter
  On re-phrasing: risk_classification: "prohibited", Art. 5(1)(h)  ← correct
```

**Root cause:** The Art. 5(1)(h) prohibited practice had only 4 keywords, none
of which matched the natural phrasing used by agents. Annex III(1) Biometrics
had the much more common `"facial recognition"` keyword, so the classifier
preferred the high-risk path even though the scenario is textbook prohibited.

**Fix:** Expanded Art. 5(1)(h) keywords to include the phrasing agents actually
use: `real time facial recognition`, `facial recognition public spaces`,
`law enforcement biometric identification`, etc. Regression test
`real-time RBI cites Art. 5(1)(h) NOT 5(1)(e)` locks this in.

### 🟡 Fixed: Penalty tool internal contradiction (SME + prohibited)

**Repro (v1.0.1):**
```
euaiact_calculate_penalty { "violation_type": "prohibited", "annual_turnover_eur": 50000000, "is_sme": true }
→ max_fine.explanation:    "...whichever is LOWER (SME/startup protection under Art. 99(6))."
  tier_details.description: "...up to 7% of total worldwide annual turnover, whichever is higher."
```

Same response, two different rules.

**Root cause:** `tier.description` was baked into the knowledge base with the
"whichever is higher" phrasing (correct for large undertakings) and was never
overridden when `is_sme === true`.

**Fix:** `src/tools/penalties.ts` now applies `descriptionForSme` to rewrite
`whichever is higher` → `whichever is lower (Art. 99(6) SME/startup protection)`
when the SME flag is set. The response also carries a new `comparative` block
showing the non-SME vs SME amounts and the absolute reduction, so agents can
explain the SME protection to the user without a second call. Regression test
`SME response: tier_details.description says 'lower'`.

### 🟡 Fixed: FAQ search drift

**Repro (v1.0.1):** *"Do I need a FRIA if I deploy an AI system for credit
scoring?"* returned a generic FRIA explanation that never engaged with credit
scoring. *"What is the FLOPs threshold for systemic risk GPAI?"* returned a
high-risk documentation answer — completely missing the 10²⁵ FLOPs threshold
from Art. 51(2).

**Root cause:** `findBestMatch` used `matched / queryWords.length` as the
score. Long, specific queries were penalised because every additional term
added to the denominator even when the FAQ entry was clearly relevant.
Additionally, there was no FAQ entry for the FLOPs threshold at all.

**Fix:** (1) `findBestMatch` now uses symmetric overlap
`matched / min(query_words, item_words)`, which rewards any tight subset
match. (2) The search is performed against `question + keywords` rather than
just `question`. (3) Added four new FAQ entries: `faq-21-gpai-flops-threshold`,
`faq-22-fria-credit-scoring`, `faq-23-chatbot-disclosure`,
`faq-24-minimal-risk-examples`. (4) The existing `faq-20-art6-3-exception`
entry was expanded to flag the profiling block. Regression tests
`FAQ search: FRIA credit scoring hits faq-22` and `FAQ search: FLOPs threshold
hits faq-21`.

### ➕ Added: 4 new tools + 2 new resources + 1 new prompt

Agent-grounding gaps surfaced during the same probe session:

- `euaiact_get_article` — retrieves an operational summary and EUR-Lex URL for
  27 of the most-cited articles. Lets agents quote primary source instead of
  paraphrasing via the FAQ.
- `euaiact_check_gpai_systemic_risk` — evaluates the 10²⁵ FLOPs threshold per
  Art. 51(2), returns the Art. 53 baseline + Art. 55 systemic-risk obligations
  and the Art. 52 notification duty (within two weeks of crossing the
  threshold). Unblocks GPAI-specific conversations.
- `euaiact_assess_art6_3_exception` — walks through the Art. 6(3) "no
  significant risk" exception, with explicit handling of the profiling block
  (Art. 6(3) second subparagraph). Critical: the exception does NOT apply if
  the system performs profiling of natural persons, regardless of whether one
  of the four conditions would otherwise be met. Also reminds about the
  Art. 6(4) documentation duty and the Art. 49(2) EU database registration.
- `euaiact_annex_iv_checklist` — returns all nine Annex IV items (general
  description, detailed elements + development process, monitoring/functioning/
  control, performance metrics, risk management, lifecycle changes, harmonised
  standards, EU declaration, post-market monitoring plan). Optionally emits a
  markdown checklist and an SME-simplified note.
- Resources: `euaiact://annex/iii` (full categories) and `euaiact://annex/iv`
  (full technical-documentation items). Public-domain EU text under
  Commission Decision 2011/833/EU.
- Prompt: `ground-citation` — guides agents to retrieve article text and
  EUR-Lex URL before quoting.

### ➕ Added: Structured classifier signals

`euaiact_classify_system` now accepts an optional `signals` object with
fields like `domain`, `uses_biometrics`, `biometric_realtime`,
`biometric_law_enforcement`, `is_safety_component_of_regulated_product`,
`generates_synthetic_content`, `interacts_with_natural_persons`, and
`performs_emotion_recognition_workplace_or_school`.

Signals take precedence over text matching. An agent that already knows
"this is a credit scoring system, the deployer is a bank" can pass
`{ signals: { domain: "essential_services" } }` and get a deterministic
Annex III(5) answer at `confidence: "high"` without paying the text-matching
uncertainty tax. The output also returns `matched_signals`, `missing_signals`,
and `next_questions` so the agent can explain itself and know what to ask the
user next.

### ➕ Slim per-response branding

The `disclaimer`, `source`, and `last_updated` fields were moved off every
tool response and into `McpServer.instructions` — shown once on initialize.
`lexbeam_url` is kept only where it adds deep-dive value (FAQ, obligations,
classifier). Measured impact: a typical `get_obligations` response is now
~10% shorter and a `check_deadlines` response ~5% shorter.

### 🧪 Tests

- 54 tests → **108 tests** (all passing)
- Every bug fixed above has at least one regression test
- Each of the 4 new tools has schema + behaviour tests
- New tests cover: matching bug regressions, signals path for every rule,
  missing/matched/next_questions output, branding slim (no disclaimer/source
  fields in tool responses), EUR-Lex URL shape, Art. 6(3) profiling block,
  GPAI threshold edge cases, Annex IV checklist format output

---

## v1.0.1 — 2026-04-03 (legacy audit)

## 1. REGULATORY ACCURACY (verified against content/EU-AI-ACT-TIMELINE.md)

### Deadlines (deadlines.ts)
- [x] Entry into force: 2024-08-01 ✅
- [x] Prohibited practices + AI literacy: 2025-02-02 ✅
- [x] GPAI obligations: 2025-08-02 ✅
- [x] High-risk Annex III: 2026-08-02 ✅
- [x] Annex I regulated products: 2027-08-02 ✅
- [x] Digital Omnibus correctly flagged as PROPOSAL ONLY ✅
- [x] Status field correctly marks first 3 as "in_effect", last 2 as "upcoming" ✅

### Penalties (penalties.ts)
- [x] Prohibited: EUR 35M / 7% ✅ (Art. 99(3))
- [x] High-risk: EUR 15M / 3% ✅ (Art. 99(4))
- [x] False info: EUR 7.5M / 1% ✅ (Art. 99(5))
- [x] SME rule: whichever is LOWER ✅ (Art. 99(6))
- [x] Large entity rule: whichever is HIGHER ✅

### Annex III categories (annex-iii.ts)
- [x] 8 categories ✅ (correct count per Annex III)
- [x] Category names match regulation ✅
- [x] Prohibited practices cover all Art. 5(1)(a)-(h) ✅
