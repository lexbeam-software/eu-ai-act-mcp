/**
 * Shared server setup - registers all tools, resources, and prompts.
 * Used by both stdio (index.ts) and HTTP (http.ts) entry points.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerClassifyTool } from "./tools/classify.js";
import { registerDeadlinesTool } from "./tools/deadlines.js";
import { registerObligationsTool } from "./tools/obligations.js";
import { registerFaqTool } from "./tools/faq.js";
import { registerPenaltiesTool } from "./tools/penalties.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "lexbeam-eu-ai-act-mcp-server",
    version: "1.0.1",
  });

  // ── Tools ──
  registerClassifyTool(server);
  registerDeadlinesTool(server);
  registerObligationsTool(server);
  registerFaqTool(server);
  registerPenaltiesTool(server);

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
          source: "Lexbeam Software - lexbeam.com",
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
          source: "Lexbeam Software - lexbeam.com",
        }, null, 2),
      }],
    })
  );

  // ── Prompts ──
  server.prompt(
    "classify-my-system",
    "Classify an AI system under the EU AI Act risk framework. Provide a description and the tool will determine if it's prohibited, high-risk, limited risk, or minimal risk.",
    { system_description: z.string().describe("Describe the AI system and its intended use case") },
    async ({ system_description }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Please classify this AI system under the EU AI Act using the euaiact_classify_system tool:\n\nSystem: ${system_description}\n\nProvide the risk classification, relevant articles, and obligations summary.`,
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
          text: `I have a ${risk_level} AI system and I am the ${role}. Using the euaiact_get_obligations tool, list all my compliance obligations with deadlines, then summarize as an actionable checklist.`,
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
          text: `Calculate the potential penalty for a ${violation_type} violation of the EU AI Act. The company's annual turnover is EUR ${annual_turnover}. Use the euaiact_calculate_penalty tool and explain the penalty tiers.`,
        },
      }],
    })
  );

  return server;
}
