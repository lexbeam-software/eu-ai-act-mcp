/**
 * Shared server setup - registers all tools, resources, and prompts.
 * Used by both stdio (index.ts) and HTTP (http.ts) entry points.
 *
 * v1.1.0:
 *  - 4 new tools: get_article, check_gpai_systemic_risk, assess_art6_3_exception, annex_iv_checklist
 *  - New resources: Annex III (full categories), Annex IV (full documentation items)
 *  - Per-response branding moved into server instructions
 *  - Classifier correctness fixes (see src/utils/matching.ts, src/tools/classify.ts)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SERVER_INSTRUCTIONS } from "./constants.js";
import { registerClassifyTool } from "./tools/classify.js";
import { registerDeadlinesTool } from "./tools/deadlines.js";
import { registerObligationsTool } from "./tools/obligations.js";
import { registerFaqTool } from "./tools/faq.js";
import { registerPenaltiesTool } from "./tools/penalties.js";
import { registerArticleTool } from "./tools/article.js";
import { registerGpaiSystemicTool } from "./tools/gpai-systemic.js";
import { registerArt6ExceptionTool } from "./tools/art6-exception.js";
import { registerAnnexIvTool } from "./tools/annex-iv.js";
import { registerAssessSystemTool } from "./tools/assess-system.js";
import { annexIIICategories } from "./knowledge/annex-iii.js";
import { annexIVItems } from "./knowledge/annex-iv.js";
import {
  digitalOmnibusPack,
  getMilestonesWithDaysRemaining,
  getEffectiveSourceRegistry,
  isOmnibusEnacted,
  omnibusStatusLine,
  resolveOmnibusStatus,
} from "./knowledge/deadlines.js";
import { SOURCE_STATUS_LABELS } from "./knowledge/sources.js";
import { SERVER_VERSION } from "./constants.js";

export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: "lexbeam-eu-ai-act-mcp-server",
      version: SERVER_VERSION,
    },
    {
      instructions: SERVER_INSTRUCTIONS,
    },
  );

  // ── Tools ──
  registerClassifyTool(server);
  registerDeadlinesTool(server);
  registerObligationsTool(server);
  registerFaqTool(server);
  registerPenaltiesTool(server);
  registerArticleTool(server);
  registerGpaiSystemicTool(server);
  registerArt6ExceptionTool(server);
  registerAnnexIvTool(server);
  registerAssessSystemTool(server);

  // ── Resources ──
  server.resource(
    "EU AI Act Timeline",
    "euaiact://timeline",
    { description: "Key implementation milestones and deadlines of the EU AI Act (Regulation 2024/1689).", mimeType: "application/json" },
    async () => ({
      contents: [{
        uri: "euaiact://timeline",
        mimeType: "application/json",
        text: JSON.stringify({
          regulation: "EU AI Act (Regulation 2024/1689)",
          milestones: getMilestonesWithDaysRemaining().map((m) => ({
            date: m.date,
            event: m.name,
            description: m.description,
            status: m.status,
            articles: m.articles,
            key_obligations: m.keyObligations,
            days_remaining: m.daysRemaining,
            is_past: m.isPast,
          })),
          digital_omnibus: {
            status: resolveOmnibusStatus(),
            enacted: isOmnibusEnacted(),
            note: `${omnibusStatusLine()} See the euaiact://omnibus resource, or euaiact_check_deadlines with include_pending_omnibus, for the changes and dates.`,
            resource: "euaiact://omnibus",
          },
        }, null, 2),
      }],
    })
  );

  server.resource(
    "EU AI Act Risk Levels",
    "euaiact://risk-levels",
    { description: "Overview of the four AI Act risk categories: prohibited, high-risk, limited risk, and minimal risk.", mimeType: "application/json" },
    async () => ({
      contents: [{
        uri: "euaiact://risk-levels",
        mimeType: "application/json",
        text: JSON.stringify({
          risk_levels: [
            { level: "prohibited", description: "Banned outright (Art. 5), including: social scoring, real-time remote biometric identification for law enforcement (with exceptions), manipulation of vulnerable groups, emotion recognition in workplace/education, untargeted facial scraping; from 2 December 2026 also the generation of non-consensual intimate imagery (Art. 5(1)(ba)) and CSAM (Art. 5(1)(bb)), added by the Digital Omnibus.", articles: ["Art. 5"] },
            { level: "high-risk", description: "Strict obligations (Art. 6, Annex III): biometrics, critical infrastructure, education, employment, essential services, law enforcement, migration, justice.", articles: ["Art. 6", "Annex III"] },
            { level: "limited_risk", description: "Art. 50 contains paragraph-specific duties for providers of systems that interact directly with natural persons, providers marking synthetic audio, image, video, or text output in a machine-readable format, deployers of emotion-recognition or biometric-categorisation systems, and deployers disclosing deepfakes or specified public-interest text. Apply the actor, scope, and exceptions in the relevant paragraph.", articles: ["Art. 50"] },
            { level: "minimal", description: "No higher-tier obligation is identified from this risk label alone. Art. 4 and any other independently triggered provisions still require separate review. Art. 95 codes of conduct are voluntary.", articles: ["Art. 4", "Art. 95"] },
          ],
          universal: { obligation: "Take measures to support the development of AI literacy (Art. 4 as replaced from 27 July 2026; no guaranteed level of literacy is required)", article: "Art. 4", applies_to: "all providers and deployers", enforceable_since: "2025-02-02" },
        }, null, 2),
      }],
    })
  );

  server.resource(
    "EU AI Act Annex III - High-Risk Categories",
    "euaiact://annex/iii",
    {
      description: "Full Annex III high-risk AI system categories (1-8) with descriptions, examples, and relevant articles. Source: Regulation (EU) 2024/1689 as amended, Annex III; reused under Commission Decision 2011/833/EU conditions.",
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: "euaiact://annex/iii",
          mimeType: "application/json",
          text: JSON.stringify(
            {
              annex: "III",
              title: "High-risk AI systems referred to in Article 6(2)",
              categories: annexIIICategories.map((c) => ({
                number: c.number,
                name: c.name,
                description: c.description,
                examples: c.examples,
                relevant_articles: c.relevantArticles,
              })),
              note: "Providers may rely on the Art. 6(3) exception to classify an Annex III system as not high-risk under specific conditions - see euaiact_assess_art6_3_exception. The exception does NOT apply to systems performing profiling of natural persons.",
              eurlex_url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02024R1689-20260727#anx_III",
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.resource(
    "EU AI Act Annex IV - Technical Documentation",
    "euaiact://annex/iv",
    {
      description: "The nine titles and descriptions summarise Annex IV. `sub_items` are non-binding implementation prompts, are not verbatim Annex IV text, and do not create additional legal requirements. Under Article 11(1), SMEs, including start-ups, and SMCs may provide the Annex IV elements in a simplified manner only by using the Commission form referred to in that paragraph.",
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: "euaiact://annex/iv",
          mimeType: "application/json",
          text: JSON.stringify(
            {
              annex: "IV",
              title: "Technical documentation referred to in Article 11(1)",
              items: annexIVItems,
              guidance_note: "The nine titles and descriptions summarise Annex IV. `sub_items` are non-binding implementation prompts, are not verbatim Annex IV text, and do not create additional legal requirements. Under Article 11(1), SMEs, including start-ups, and SMCs may provide the Annex IV elements in a simplified manner only by using the Commission form referred to in that paragraph.",
              relevant_articles: ["Art. 11"],
              eurlex_url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02024R1689-20260727#anx_IV",
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.resource(
    "EU AI Act Digital Omnibus",
    "euaiact://omnibus",
    {
      description: `Source-state-aware view of the Digital Omnibus on AI (COM(2025) 836; political agreement 2026-05-07; adopted by the European Parliament 2026-06-16 and the Council 2026-06-29). Current status: ${SOURCE_STATUS_LABELS[resolveOmnibusStatus()]}. Each item carries its source status. Includes the source registry.`,
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: "euaiact://omnibus",
          mimeType: "application/json",
          text: JSON.stringify(
            {
              disclaimer: isOmnibusEnacted()
                ? "Enacted: the Digital Omnibus on AI has been published in the Official Journal and is in force; the amended dates are reflected in the milestone timeline. Item-level stage labels (proposal / political agreement) are provenance, not current status. Verify exact wording against the OJ text."
                : "NOT yet in force. Current binding law is Regulation (EU) 2024/1689 as published in the OJ. The Digital Omnibus on AI has been formally adopted by both co-legislators (European Parliament 2026-06-16, Council 2026-06-29) but awaits Official Journal publication. The items below are surfaced for planning only and labelled with their source status. Re-verify the consolidated OJ text on publication.",
              digital_omnibus: digitalOmnibusPack,
              sources: getEffectiveSourceRegistry(),
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  // ── Prompts ──
  server.prompt(
    "classify-my-system",
    "Classify an AI system under the EU AI Act risk framework. Provide a description and the tool will determine if it's prohibited, high-risk, limited risk, or minimal risk. Provide structured signals (domain, uses_biometrics, etc.) for deterministic classification on canonical cases.",
    { system_description: z.string().describe("Describe the AI system and its intended use case") },
    async ({ system_description }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Please classify this AI system under the EU AI Act using the euaiact_classify_system tool. If you can infer structured signals (domain, uses_biometrics, biometric_realtime, generates_synthetic_content, interacts_with_natural_persons, etc.), pass them in the signals field for a deterministic result. Only set signals supported by the description; leave unknown facts out. signals.domain identifies a LISTED Annex III use, never merely the sector: a payroll check or school timetable uses other, while applicant ranking uses employment. Read the domain field definition. missing_signals includes optional context; relay next_questions rather than asking for every omitted field. A matched route does not rule out every other route.\n\nSystem: ${system_description}\n\nProvide the risk classification, relevant articles, obligations summary, matched signals, and follow-up questions to ask the user if anything is missing.`,
        },
      }],
    })
  );

  server.prompt(
    "compliance-checklist",
    "Generate a compliance checklist for an AI system based on its risk level and your role (provider or deployer).",
    {
      risk_level: z.string().describe("Risk level: high-risk, limited, gpai, or minimal"),
      role: z.string().describe("Your role: provider or deployer"),
    },
    async ({ risk_level, role }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `I have a ${risk_level} AI system and I am the ${role}. Using the euaiact_get_obligations tool, list all my compliance obligations with deadlines, then summarize as an actionable checklist. If the system is high-risk, also call euaiact_annex_iv_checklist to produce the Annex IV technical documentation checklist.`,
        },
      }],
    })
  );

  server.prompt(
    "penalty-risk-assessment",
    "Calculate potential fines for EU AI Act non-compliance based on violation type and company size.",
    {
      violation_type: z.string().describe("Type: prohibited, high_risk, or false_info"),
      annual_turnover: z.string().describe("Company annual turnover in EUR (e.g. 50000000)"),
    },
    async ({ violation_type, annual_turnover }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Calculate the potential penalty for a ${violation_type} violation of the EU AI Act. The company's annual turnover is EUR ${annual_turnover}. Use the euaiact_calculate_penalty tool and explain the penalty tiers. If the company is an SME, mention the Art. 99(6) protection and compare both amounts from the comparative block.`,
        },
      }],
    })
  );

  server.prompt(
    "ground-citation",
    "Ground a citation to a specific EU AI Act article by retrieving an operational summary and EUR-Lex URL, then verifying definitive wording in the official source.",
    {
      article: z.string().describe("Article number (e.g. '5', '50', '99')"),
    },
    async ({ article }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Use the euaiact_get_article tool to fetch the operational summary and EUR-Lex URL for Art. ${article}. Do not quote the summary as statutory text. Follow the EUR-Lex URL, read the official provision, and quote only wording verified there. Include the URL so the user can verify it.`,
        },
      }],
    }),
  );

  return server;
}
