# EU AI Act MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@lexbeam-software/eu-ai-act-mcp)](https://www.npmjs.com/package/@lexbeam-software/eu-ai-act-mcp)
[Smithery listing](https://smithery.ai/servers/lexbeam-software/eu-ai-act)
[![Test](https://github.com/lexbeam-software/eu-ai-act-mcp/actions/workflows/test.yml/badge.svg)](https://github.com/lexbeam-software/eu-ai-act-mcp/actions/workflows/test.yml)

An open-source [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that gives LLMs structured intelligence about the EU AI Act (Regulation (EU) 2024/1689, as amended by the Digital Omnibus, Regulation (EU) 2026/1744).

Built by [Lexbeam Software](https://lexbeam.com) - an agentic AI implementation boutique for regulated workflows.

## Listed use, not sector

Annex III regulates uses, not sectors. Set `signals.domain` to an Annex III area only when
the system itself performs a use listed there; a system that merely operates in that sector
gets `"other"`. Two calls to `euaiact_classify_system`, both for systems in the employment sector:

**In the sector, not a listed use.** Returns `limited` (Art. 50(1) transparency).

```json
{
  "description": "An HR chatbot answers employees' questions about the holiday policy and where to find the travel expense form.",
  "signals": { "domain": "other", "interacts_with_natural_persons": true }
}
```

**A listed use.** Returns `high-risk` (Annex III(4)).

```json
{
  "description": "Our ATS screens incoming CVs against the job spec and auto-rejects anyone missing the right keywords before a recruiter looks.",
  "signals": { "domain": "employment" }
}
```

The classifier trusts the signal: the same chatbot sent with `"domain": "employment"` comes
back `high-risk`. Leave `domain` out when the description does not tell you which it is.

## What's new in 1.6.0

Version 1.6.0 corrects what a calling agent is told, and measures what it then does.

- **Listed uses, not sectors:** `signals.domain` names an Annex III area only when the
  system itself performs a use Annex III lists for it. Until now the field read as the
  sector a system operates in, and an agent that filled it faithfully got a school
  timetable, a payroll check and a court budgeting tool back as high-risk. Measured with
  one agent model on 358 descriptions: 46 of 106 non-regulated systems were wrongly
  regulated under the old tool definition and none under the new one, while recognition
  of regulated systems held (181 and 179 of 252). See [evals/front-door](evals/front-door).
- **Signals first:** the tool description tells the agent to derive the structured
  signals from the user's description itself. Free text alone is only keyword-matched.
- **A callable assessment:** the `euaiact_assess_system` description states the fact
  shape and a useful minimum profile.
- **Releases with two human steps and no token:** a GitHub release stages the package on
  npm over trusted publishing, and it becomes public only when a maintainer approves it
  with 2FA. A weekly job checks every lexbeam.com link the server publishes, and a version
  bump no longer moves a pinned hash.

Full release history: [CHANGELOG.md](CHANGELOG.md).

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

Direct MCP endpoint: `https://mcp.lexbeam.com/mcp` (health check at `/health`). Open, no auth required.

The Smithery-hosted endpoint `https://eu-ai-act--lexbeam-software.run.tools` requires Smithery authentication and returns 401 without it.

### From source

```bash
git clone https://github.com/lexbeam-software/eu-ai-act-mcp.git
cd eu-ai-act-mcp
npm install
npm run build
npm start        # stdio transport
npm run start:http  # streamable HTTP (for Smithery/Railway)
```

## Tools

| Tool | Description |
|------|-------------|
| `euaiact_classify_system` | Classify an AI system's risk level (prohibited / high-risk / limited / minimal) from structured signals that the calling agent derives from the user's description; free text alone is a keyword fallback. Returns matched signals, missing signals, and follow-up questions. |
| `euaiact_check_deadlines` | Implementation milestones with days remaining, `next_milestone` shortcut, `only_upcoming` filter, and the enacted Digital Omnibus (Regulation (EU) 2026/1744) status. |
| `euaiact_get_obligations` | Specific compliance obligations by role (provider/deployer) and risk level, including GPAI (Art. 51-56) and universal AI literacy (Art. 4). |
| `euaiact_answer_question` | Keyword FAQ search (lexical matching with stopword filtering, tie handling and abstention) across 24 curated EU AI Act questions; echoes your question and names the matched entry. |
| `euaiact_calculate_penalty` | Calculate maximum fines by violation type, turnover, SME status (Art. 99(6)) and SMC status (Art. 99(6a), tiers 99(4)-(5) only), with a comparative non-SME vs SME block. |
| `euaiact_get_article` | Retrieve an operational summary and EUR-Lex URL for a specific article. Covers 28 curated articles between Art. 3 and Art. 113 (including the new Art. 4a), not the full act. |
| `euaiact_check_gpai_systemic_risk` | Check whether a GPAI model crosses the 10²⁵ FLOPs threshold and return Art. 53 + Art. 55 obligations plus the Art. 52 notification duty. |
| `euaiact_assess_art6_3_exception` | Walk through the Art. 6(3) "no significant risk" exception with explicit profiling block and Art. 6(4) / Art. 49(2) reminders. |
| `euaiact_annex_iv_checklist` | Return all nine Annex IV technical-documentation items, optionally as a markdown checklist. |
| `euaiact_assess_system` | Assess a normalized system profile with separate legal-classification, qualitative-impact, and evidence-readiness blocks. Sparse decisive facts fail closed; every finding carries fact IDs and official provenance. |

## Resources

| URI | Description |
|-----|-------------|
| `euaiact://timeline` | Key implementation milestones of the EU AI Act. |
| `euaiact://risk-levels` | Overview of the four risk categories. |
| `euaiact://annex/iii` | Full Annex III high-risk AI categories (1-8) with descriptions, examples, and article references. |
| `euaiact://annex/iv` | Full Annex IV technical-documentation items (1-9). |
| `euaiact://omnibus` | The Digital Omnibus on AI (Regulation (EU) 2026/1744) as enacted: amended dates, deltas, and source status per item. |

## Prompts

- `classify-my-system` - guided classification using `euaiact_classify_system` with signal inference
- `compliance-checklist` - risk-level + role obligations checklist, including Annex IV for high-risk
- `penalty-risk-assessment` - penalty calculation with SME comparative
- `ground-citation` - retrieve an operational summary + EUR-Lex URL, then verify definitive wording in the official source before quoting

## Knowledge Base

Curated, structured data covering:

- **8 Annex III high-risk categories** with keyword matching and examples
- **10 prohibited AI practices**: Art. 5(1)(a)-(h), plus (ba) and (bb) applying from 2 December 2026
- **Art. 6(3) exception conditions** with the profiling block rule
- **Art. 50 transparency triggers** (chatbots, deepfakes, emotion recognition, machine-readable marking)
- **8 implementation milestones** with dynamic days-remaining calculation
- **Digital Omnibus (enacted)** status and impact assessment
- **Provider obligations** (13 for high-risk, 8 for GPAI including Art. 53 + Art. 55)
- **Deployer obligations** (9 for high-risk)
- **Limited-risk transparency obligations** (4 under Art. 50)
- **Universal AI literacy** (Art. 4)
- **Penalty framework** with SME protection logic (Art. 99)
- **24 FAQ entries** with article references and Lexbeam knowledge-base links
- **28 article summaries** with EUR-Lex URLs to the consolidated text
- **Annex IV (9 documentation items)** *(new in 1.1.0)*

Load-bearing dates, thresholds, amounts and exceptions are checked on every build by a claim matrix (`test-claims.mjs`) against a pinned, hash-verified copy of the consolidated act (`law/`). Coverage is the matrix, not a blanket claim.

## Regulatory Accuracy

This server tracks the current state of the EU AI Act (Regulation 2024/1689) **as amended by the Digital Omnibus on AI**, Regulation (EU) 2026/1744, published in the Official Journal on 24 July 2026 and in force from 27 July 2026. The amended application dates are served as operative law. Article-level wording was verified against the enacted OJ text on 26 and 27 July 2026, delta by delta against the 43 numbered amendments in Article 1 of the amending act. No Omnibus delta was left unresolved in that reconciliation. The Art. 49 registration duty for self-assessed not-high-risk systems, previously carried as unresolved, SURVIVES: the enacted act does not amend Art. 49 and deletes only Annex VIII Section B points 7 and 9.

Operative dates as amended:
- **2 Feb 2025** - Prohibited practices (Art. 5) + AI literacy (Art. 4), in effect
- **2 Aug 2025** - GPAI model obligations, in effect
- **2 Aug 2026** - Art. 50 transparency, and Commission GPAI enforcement powers and fines. **Not deferred**
- **2 Dec 2026** - The two new Art. 5 prohibitions (non-consensual intimate material, CSAM), and the Art. 111(4) deadline for synthetic-content systems already on the market to meet Art. 50(2)
- **2 Aug 2027** - Legacy GPAI models (Art. 111(3)), unchanged
- **2 Dec 2027** - High-risk Annex III obligations. Deferred from 2 Aug 2026
- **2 Aug 2028** - High-risk Annex I regulated products. Deferred from 2 Aug 2027

## Development

```bash
npm install
npm run build        # typescript -> dist/
node test.mjs         # full suite incl. ten agent journeys
node test-claims.mjs  # 124-check matrix: pinned law corpus vs served facts
node test-schemas.mjs # post-serialization output-schema gate
node law/fetch.mjs verify # verify all 4 pinned legal documents
npm --prefix compiler test # deterministic compiler: 6 tests
node evals/front-door/score.mjs evals/front-door/agent-args-1.6.0.json # the front door, measured
npm run dev          # stdio dev server
npm run dev:http     # HTTP dev server
```

## Disclaimer

This MCP server is a structured information tool that returns references to and summaries of Regulation (EU) 2024/1689. It provides general information only and does not constitute legal advice. Whether a service falls within a national regulated legal-services regime must be verified against current official sources and, where necessary, with qualified local counsel. This tool cannot replace that review, and its use does not establish a lawyer-client relationship. For implementation support, visit [lexbeam.com/kontakt](https://lexbeam.com/kontakt).

## License

MIT. See [LICENSE](LICENSE). Regulation text summarised in `src/knowledge/articles.ts` and `src/knowledge/annex-iv.ts` is derived from Regulation (EU) 2024/1689 as amended; EUR-Lex content is reused under the conditions of Commission Decision 2011/833/EU (preserve attribution, do not distort the meaning of the source).

## About Lexbeam

[Lexbeam Software](https://lexbeam.com) builds agentic AI for compliance, legal operations, internal audit, and risk workflows.

*Give us one ugly, regulation-heavy workflow. We'll turn it into a working AI system fast.*
