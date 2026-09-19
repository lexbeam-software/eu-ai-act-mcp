import { createRequire } from "node:module";
import { omnibusStatusLine } from "./knowledge/digital-omnibus.js";

/**
 * Single source of truth for the served version. Read from package.json rather
 * than hardcoded, because the version previously lived in three places
 * (package.json, the MCP handshake in server.ts, the health endpoint in
 * http.ts) and drifted: a release bumped package.json while the running server
 * kept introducing itself with the old number.
 */
const require = createRequire(import.meta.url);
export const SERVER_VERSION: string = require("../package.json").version;

export const BRANDING = {
  source: "Lexbeam Software - lexbeam.com",
  disclaimer: "General guidance, not legal advice. For implementation support: lexbeam.com/kontakt",
  lastUpdated: "2026-07-07",
  baseUrl: "https://lexbeam.com",
} as const;

/**
 * Server instructions shown once to clients on initialize.
 *
 * In v1.1.0 the per-response marketing payload (disclaimer, source,
 * last_updated) was moved here so substantive tool responses stay lean.
 * Clients that surface `instructions` to the user still see the
 * attribution and the legal disclaimer, but agents no longer pay a
 * per-call context tax for it.
 */
export const SERVER_INSTRUCTIONS = [
  "EU AI Act Compliance MCP Server - by Lexbeam Software (https://lexbeam.com).",
  "",
  "This server provides first-pass guidance on the EU AI Act (Regulation 2024/1689) via",
  "10 tools and curated resources exposing Annex III, Annex IV, the timeline, risk levels,",
  "operational article summaries, and one bounded system assessment. Use euaiact_assess_system",
  "with a normalized profile",
  "for separate legal-classification, impact, and implementation-readiness blocks.",
  "Derive structured `signals` from the user's description yourself and pass them to",
  "euaiact_classify_system: the result is decided deterministically on them, while free text",
  "alone is only keyword-matched. Annex III regulates listed uses, never a sector: name an",
  "Annex III area in `signals.domain` or in an assessment profile only when the system itself",
  "performs a use listed for it. Use euaiact_get_article to ground",
  "citations in EUR-Lex. Use euaiact_assess_art6_3_exception before relying on the",
  "exception - note Art. 6(3) does not apply to systems performing profiling of natural",
  "persons. Use euaiact_check_gpai_systemic_risk for GPAI threshold analysis (1e25 FLOPs).",
  "",
  "Operative law is the default in every answer. " + omnibusStatusLine(),
  "The Digital Omnibus details are available via the euaiact://omnibus resource and",
  "euaiact_check_deadlines with include_pending_omnibus, labelled by source status. Non-OJ",
  "content must not be treated as current law until published in the Official Journal.",
  "",
  "Disclaimer: General guidance, not legal advice. Always consult legal counsel for",
  "definitive classification and compliance decisions. For implementation support:",
  "https://lexbeam.com/kontakt",
  "",
  "Source: Regulation (EU) 2024/1689 as amended by Regulation (EU) 2026/1744. EUR-Lex content reused under the Commission Decision 2011/833/EU reuse conditions: attribution preserved, meaning not distorted.",
].join("\n");
