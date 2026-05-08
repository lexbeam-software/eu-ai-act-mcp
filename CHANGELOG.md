# Changelog

All notable changes to `@lexbeam-software/eu-ai-act-mcp` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Moved repository to the `lexbeam-software` GitHub organization. Updated `repository` and `bugs` fields in `package.json`. Old `PicoWorx/eu-ai-act-mcp` URLs continue to redirect.
- Added `SECURITY.md`, `CONTRIBUTING.md`, issue templates, pull request template, and a CI workflow that runs the full test suite on every push and pull request.

## [1.1.4] - 2026-05-08

### Changed

- **Digital Omnibus block** in `euaiact_check_deadlines` updated to reflect the 2026-05-07 Council/Parliament provisional political agreement on the AI Act portion of the Digital Omnibus Simplification Package. The agreement is NOT yet adopted law (procedure 2025/0359(COD) still awaiting Parliament's position in 1st reading per EP Legislative Observatory). Current-law dates remain authoritative for compliance advice until formal adoption plus Official Journal publication.
  - `status` flips from `"proposal_only"` to `"provisional_agreement"`.
  - `description` and `keyChanges` rewritten to enumerate the specific provisional shifts (Annex III to 2 Dec 2027, Annex I to 2 Aug 2028, Article 50 watermarking to 2 Dec 2026, prohibited-practices expansion with CSAM and non-consensual intimate content, registration mandate preserved, sensitive-data bias detection broadened) and explicitly mark what is UNCHANGED (GPAI obligations, Commission GPAI enforcement on 2 Aug 2026, legacy GPAI on 2 Aug 2027).
  - `impactOnAIAct` retains the "plan against current law" guidance with refreshed status framing and source citations.
- **FAQ entry `faq-18-digital-omnibus`** rewritten to mirror the same content. References both the December 2025 Commission proposal and the 2026-05-07 provisional agreement.

### Notes

- Schema unchanged. The `digital_omnibus` block keeps the same shape (`name`, `status`, `proposal_date`, `description`, `key_changes`, `impact_on_ai_act`); only string content is updated. Existing clients of `euaiact_check_deadlines` see updated text without breaking changes.
- Sources: Council press release 2026-05-07, European Parliament press release 2026-05-07, EP Legislative Observatory procedure 2025/0359(COD), AI Act Service Desk timeline.
- A future v1.2.0 release will add a structured two-track API (`current_law` and `provisional_omnibus_agreement_2026_05_07` separately, with `legal_status` flag and source URLs per response) and a new `euaiact_omnibus_impact_assessment` tool. The 1.1.4 patch covers hygiene; 1.2.0 ships the product-feature differentiator.

## [1.1.1] - 2026-04-13

### Changed

- Strengthened README disclaimer to reference § 2 RDG explicitly.

## [1.1.0] - 2026-04

### Added

- **Structured classifier signals.** `euaiact_classify_system` now accepts optional `signals` (`domain`, `uses_biometrics`, `biometric_realtime`, `is_safety_component_of_regulated_product`, `generates_synthetic_content`, `interacts_with_natural_persons`, and others). Signals take precedence over text matching and give deterministic, high-confidence answers on canonical Art. 5 / Annex III / Art. 50 cases.
- **Matched signals and follow-up questions.** Every classification now returns `matched_signals`, `missing_signals`, and `next_questions` so the calling agent can explain why and ask the user what is still needed.
- **`euaiact_get_article`** to retrieve operational summaries of the most-cited articles plus stable EUR-Lex URLs for grounded citations.
- **`euaiact_check_gpai_systemic_risk`** to determine whether a GPAI model crosses the Art. 51(2) 10²⁵ FLOPs threshold and return Art. 53 baseline plus Art. 55 systemic-risk obligations with the Art. 52 notification duty.
- **`euaiact_assess_art6_3_exception`** to walk through the Art. 6(3) "no significant risk" exception with explicit handling of the profiling block (Art. 6(3) second subparagraph) and the Art. 6(4) documentation reminder plus Art. 49(2) registration duty.
- **`euaiact_annex_iv_checklist`** to return all nine Annex IV technical-documentation items, optionally as a markdown checklist, with an SME-simplified note.
- **Resources** `euaiact://annex/iii` (full Annex III categories) and `euaiact://annex/iv` (full Annex IV checklist).
- **Prompt** `ground-citation` to guide the agent to call `euaiact_get_article` and quote with an EUR-Lex URL.
- 5 new FAQ entries covering the FLOPs threshold for systemic-risk GPAI, FRIA for credit scoring, chatbot disclosure under Art. 50(1), minimal-risk spellchecker and recommender examples, and an expanded Art. 6(3) exception entry with the profiling caveat.
- `comparative` block in `euaiact_calculate_penalty` showing the SME reduction alongside the non-SME amount.
- `only_upcoming` filter and a `next_milestone` shortcut in `euaiact_check_deadlines`.
- 27 article summaries with EUR-Lex URLs.
- Annex IV (9 documentation items) as a structured resource.

### Fixed

- **Classifier correctness.** Rewrote `src/utils/matching.ts` to eliminate a multi-word-keyword false-positive bug (where a single-character token like `"e"` in `"e-commerce"` could match keywords starting with `"e"`) and a fractional-denominator false-negative (where realistic recruitment descriptions scored below threshold on Annex III(4)). See `AUDIT.md` for root-cause detail.
- **Penalty description.** When `is_sme: true` the `tier_details.description` now correctly says "whichever is lower (Art. 99(6) SME/startup protection)" instead of contradicting the `max_fine.explanation`.
- **FAQ search.** `findBestMatch` uses symmetric overlap (`matched / min(query_words, item_words)`), so specific multi-word queries like "FRIA for credit scoring" no longer drop to generic answers.

### Changed

- **Slim per-response branding.** `disclaimer`, `source`, and `last_updated` were moved into the MCP `serverInfo.instructions` shown once on initialize. Agents no longer pay a per-call context tax for attribution. `lexbeam_url` is kept only where it adds deep-dive value (FAQ, obligations, classifier).
- **Test suite** expanded from 54 to 108 tests, including regression tests for every bug fixed in this release.
