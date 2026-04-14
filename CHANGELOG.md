# Changelog

All notable changes to `@lexbeam-software/eu-ai-act-mcp` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Moved repository to the `lexbeam-software` GitHub organization. Updated `repository` and `bugs` fields in `package.json`. Old `PicoWorx/eu-ai-act-mcp` URLs continue to redirect.
- Added `SECURITY.md`, `CONTRIBUTING.md`, issue templates, pull request template, and a CI workflow that runs the full test suite on every push and pull request.

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
