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
import { annexIIICategories } from "./knowledge/annex-iii.js";
import { annexIVItems } from "./knowledge/annex-iv.js";

export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: "lexbeam-eu-ai-act-mcp-server",
      version: "1.1.0",
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
          milestones: [
            { date: "2024-08-01", event: "Entry into force", status: "past" },
            { date: "2025-02-02", event: "Prohibited AI practices ban + AI literacy obligation", status: "past" },
            { date: "2025-08-02", event: "GPAI model obligations apply", status: "past" },
            { date: "2026-08-02", event: "Most provisions apply (high-risk, transparency, governance)", status: "upcoming" },
            { date: "2027-08-02", event: "High-risk AI in Annex I (EU harmonisation legislation) fully applies", status: "upcoming" },
          ],
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
            { level: "prohibited", description: "Banned outright (Art. 5): social scoring, real-time biometrics (with exceptions), manipulation of vulnerable groups, emotion recognition in workplace/education.", articles: ["Art. 5"] },
            { level: "high-risk", description: "Strict obligations (Art. 6, Annex III): biometrics, critical infrastructure, education, employment, essential services, law enforcement, migration, justice.", articles: ["Art. 6", "Annex III"] },
            { level: "limited_risk", description: "Transparency obligations (Art. 50): chatbots, emotion recognition, deepfakes, AI-generated content must be disclosed.", articles: ["Art. 50"] },
            { level: "minimal", description: "No specific obligations. Voluntary codes of conduct encouraged (Art. 95).", articles: ["Art. 95"] },
          ],
          universal: { obligation: "AI literacy", article: "Art. 4", applies_to: "all providers and deployers", enforceable_since: "2025-02-02" },
        }, null, 2),
      }],
    })
  );

  server.resource(
    "EU AI Act Annex III — High-Risk Categories",
    "euaiact://annex/iii",
    {
      description: "Full Annex III high-risk AI system categories (1-8) with descriptions, examples, and relevant articles. Source: Regulation (EU) 2024/1689, Annex III (public domain).",
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
              note: "Providers may rely on the Art. 6(3) exception to classify an Annex III system as not high-risk under specific conditions — see euaiact_assess_art6_3_exception. The exception does NOT apply to systems performing profiling of natural persons.",
              eurlex_url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689#anx_III",
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.resource(
    "EU AI Act Annex IV — Technical Documentation",
    "euaiact://annex/iv",
    {
      description: "Full Annex IV technical documentation requirements (items 1-9) that providers of high-risk AI systems must prepare under Art. 11. Public-domain EU text.",
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
              relevant_articles: ["Art. 11"],
              eurlex_url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689#anx_IV",
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
          text: `Please classify this AI system under the EU AI Act using the euaiact_classify_system tool. If you can infer structured signals (domain, uses_biometrics, biometric_realtime, generates_synthetic_content, interacts_with_natural_persons, etc.), pass them in the signals field for a deterministic result.\n\nSystem: ${system_description}\n\nProvide the risk classification, relevant articles, obligations summary, matched signals, and follow-up questions to ask the user if anything is missing.`,
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
    "Ground a citation to a specific EU AI Act article by retrieving the article text and EUR-Lex URL.",
    {
      article: z.string().describe("Article number (e.g. '5', '50', '99')"),
    },
    async ({ article }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Use the euaiact_get_article tool to fetch the text and EUR-Lex URL for Art. ${article}, then quote the relevant part and include the URL so the user can verify on eur-lex.europa.eu.`,
        },
      }],
    }),
  );

  return server;
}
