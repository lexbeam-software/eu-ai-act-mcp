# EU AI Act MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@lexbeam-software/eu-ai-act-mcp)](https://www.npmjs.com/package/@lexbeam-software/eu-ai-act-mcp)
[![smithery badge](https://smithery.ai/badge/lexbeam-software/eu-ai-act)](https://smithery.ai/servers/lexbeam-software/eu-ai-act)

An open-source [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that gives LLMs structured intelligence about the EU AI Act (Regulation (EU) 2024/1689).

Built by [Lexbeam Software](https://lexbeam.com) — an agentic AI implementation boutique for regulated workflows.

## What's new in 1.1.0

- **Structured classifier signals.** `euaiact_classify_system` now accepts optional `signals` (domain, `uses_biometrics`, `biometric_realtime`, `is_safety_component_of_regulated_product`, `generates_synthetic_content`, `interacts_with_natural_persons`, etc.). Signals take precedence over text matching and give deterministic, high-confidence answers on canonical Art. 5 / Annex III / Art. 50 cases.
- **Matched signals + follow-up questions.** Every classification now returns `matched_signals`, `missing_signals`, and `next_questions` so the calling agent can explain *why* and ask the user what's still needed.
- **Classifier correctness fixes.** Rewrote `src/utils/matching.ts` to eliminate a multi-word-keyword false-positive bug (where a single-character token like `"e"` in `"e-commerce"` could match keywords starting with `"e"`) and a fractional-denominator false-negative (where realistic recruitment descriptions scored below threshold on Annex III(4)). See `AUDIT.md` for root-cause detail.
- **4 new tools:**
  - `euaiact_get_article` — retrieve operational summaries of the most-cited articles (Art. 3, 4, 5, 6, 9-17, 26, 27, 43, 47, 49, 50, 51, 53, 55, 72, 73, 99, 100, 113) plus stable EUR-Lex URLs for grounded citations.
  - `euaiact_check_gpai_systemic_risk` — determine whether a GPAI model crosses the Art. 51(2) 10²⁵ FLOPs threshold and return Art. 53 baseline + Art. 55 systemic-risk obligations with the Art. 52 notification duty.
  - `euaiact_assess_art6_3_exception` — walk through the Art. 6(3) "no significant risk" exception with explicit handling of the profiling block (Art. 6(3) second subparagraph) and the Art. 6(4) documentation reminder + Art. 49(2) registration duty.
  - `euaiact_annex_iv_checklist` — return all nine Annex IV technical-documentation items, optionally as a markdown checklist, with an SME-simplified note.
- **2 new resources:** `euaiact://annex/iii` (full Annex III categories) and `euaiact://annex/iv` (full Annex IV checklist), joining the existing `euaiact://timeline` and `euaiact://risk-levels`.
- **New prompt:** `ground-citation` — guides the agent to call `euaiact_get_article` and quote with an EUR-Lex URL.
- **5 new FAQ entries:** FLOPs threshold for systemic-risk GPAI, FRIA for credit scoring, chatbot disclosure under Art. 50(1), minimal-risk spellchecker/recommender examples, and an expanded Art. 6(3) exception entry with the profiling caveat.
- **Penalty fix.** When `is_sme: true` the `tier_details.description` now correctly says *"whichever is lower (Art. 99(6) SME/startup protection)"* instead of contradicting the `max_fine.explanation`. A new `comparative` block shows the SME reduction alongside the non-SME amount.
- **Better deadlines tool.** New `only_upcoming` filter and a `next_milestone` shortcut at the top of the response.
- **Improved FAQ search.** `findBestMatch` uses symmetric overlap (`matched / min(query_words, item_words)`), so specific multi-word queries like *"FRIA for credit scoring"* no longer drop to generic answers.
- **Slim per-response branding.** `disclaimer`, `source`, and `last_updated` were moved into the MCP `serverInfo.instructions` shown once on initialize. Agents no longer pay a per-call context tax for attribution. `lexbeam_url` is kept only where it adds deep-dive value (FAQ, obligations, classifier).
- **Comprehensive test suite.** 108 tests (up from 54), including regression tests for every bug fixed in this release.

## Tools

| Tool | Description |
|------|-------------|
| `euaiact_classify_system` | Classify an AI system's risk level (prohibited / high-risk / limited / minimal) from free text **or** structured signals. Returns matched signals, missing signals, and follow-up questions. |
| `euaiact_check_deadlines` | Implementation milestones with days remaining, `next_milestone` shortcut, `only_upcoming` filter, and the Digital Omnibus proposal status. |
| `euaiact_get_obligations` | Specific compliance obligations by role (provider/deployer) and risk level, including GPAI (Art. 51-56) and universal AI literacy (Art. 4). |
| `euaiact_answer_question` | Semantic FAQ search across 24 curated EU AI Act questions with article references. |
| `euaiact_calculate_penalty` | Calculate maximum fines by violation type, turnover, and SME status (Art. 99) with a comparative non-SME vs SME block. |
| `euaiact_get_article` **(new)** | Retrieve an operational summary and EUR-Lex URL for a specific article (Art. 3-113). |
| `euaiact_check_gpai_systemic_risk` **(new)** | Check whether a GPAI model crosses the 10²⁵ FLOPs threshold and return Art. 53 + Art. 55 obligations plus the Art. 52 notification duty. |
| `euaiact_assess_art6_3_exception` **(new)** | Walk through the Art. 6(3) "no significant risk" exception with explicit profiling block and Art. 6(4) / Art. 49(2) reminders. |
| `euaiact_annex_iv_checklist` **(new)** | Return all nine Annex IV technical-documentation items, optionally as a markdown checklist. |

## Resources

| URI | Description |
|-----|-------------|
| `euaiact://timeline` | Key implementation milestones of the EU AI Act. |
| `euaiact://risk-levels` | Overview of the four risk categories. |
| `euaiact://annex/iii` **(new)** | Full Annex III high-risk AI categories (1-8) with descriptions, examples, and article references. |
| `euaiact://annex/iv` **(new)** | Full Annex IV technical-documentation items (1-9). |

## Prompts

- `classify-my-system` — guided classification using `euaiact_classify_system` with signal inference
- `compliance-checklist` — risk-level + role obligations checklist, including Annex IV for high-risk
- `penalty-risk-assessment` — penalty calculation with SME comparative
- `ground-citation` **(new)** — retrieve article text + EUR-Lex URL for grounded citations

## Quick Start

### npx (no install)

```bash
npx -y @lexbeam-software/eu-ai-act-mcp
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "eu-ai-act": {
      "command": "npx",
      "args": ["-y", "@lexbeam-software/eu-ai-act-mcp"]
    }
  }
}
```

### Smithery

```bash
npx -y @smithery/cli@latest mcp add lexbeam-software/eu-ai-act
```

Direct MCP endpoint: `https://eu-ai-act--lexbeam-software.run.tools`.

### From source

```bash
git clone https://github.com/PicoWorx/eu-ai-act-mcp.git
cd eu-ai-act-mcp
npm install
npm run build
npm start        # stdio transport
npm run start:http  # streamable HTTP (for Smithery/Railway)
```

## Knowledge Base

Curated, structured data covering:

- **8 Annex III high-risk categories** with keyword matching and examples
- **8 prohibited AI practices** (Art. 5 (1) (a)-(h))
- **Art. 6(3) exception conditions** with the profiling block rule
- **Art. 50 transparency triggers** (chatbots, deepfakes, emotion recognition, machine-readable marking)
- **5 implementation milestones** with dynamic days-remaining calculation
- **Digital Omnibus proposal** status and impact assessment
- **Provider obligations** (13 for high-risk, 8 for GPAI including Art. 53 + Art. 55)
- **Deployer obligations** (8 for high-risk)
- **Limited-risk transparency obligations** (4 under Art. 50)
- **Universal AI literacy** (Art. 4)
- **Penalty framework** with SME protection logic (Art. 99)
- **24 FAQ entries** with article references and Lexbeam knowledge-base links
- **27 article summaries** with EUR-Lex URLs *(new in 1.1.0)*
- **Annex IV (9 documentation items)** *(new in 1.1.0)*

All dates, articles, and obligations verified against the regulation text.

## Regulatory Accuracy

This server tracks the current state of the EU AI Act as published (Regulation 2024/1689). The Digital Omnibus proposal (December 2025) is included but clearly marked as `proposal_only` — not yet adopted law.

Key dates verified:
- **2 Feb 2025** — Prohibited practices + AI literacy (in effect)
- **2 Aug 2025** — GPAI model obligations (in effect)
- **2 Aug 2026** — High-risk Annex III obligations (upcoming)
- **2 Aug 2027** — Annex I regulated products (upcoming)

## Development

```bash
npm install
npm run build        # typescript -> dist/
node test.mjs        # run the 108-test suite
npm run dev          # stdio dev server
npm run dev:http     # HTTP dev server
```

## Disclaimer

The information provided by this MCP server constitutes general guidance and not legal advice. For implementation support, visit [lexbeam.com/kontakt](https://lexbeam.com/kontakt).

## License

MIT. See [LICENSE](LICENSE). Regulation text summarised in `src/knowledge/articles.ts` and `src/knowledge/annex-iv.ts` is derived from Regulation (EU) 2024/1689, which is public-domain under Commission Decision 2011/833/EU.

## About Lexbeam

[Lexbeam Software](https://lexbeam.com) builds agentic AI for compliance, legal operations, internal audit, and risk workflows.

*Give us one ugly, regulation-heavy workflow. We'll turn it into a working AI system fast.*
