import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { classifyInputSchema, classifyOutputSchema, type ClassifyInput, type ClassifyOutput } from "../schemas/classify.js";
import { BRANDING } from "../constants.js";
import { normalizeText, calculateKeywordOverlap } from "../utils/matching.js";
import { applyBranding } from "../utils/branding.js";

import { prohibitedPractices, annexIIICategories, transparencyTriggers } from "../knowledge/annex-iii.js";

export function registerClassifyTool(server: McpServer): void {
  server.registerTool("euaiact_classify_system", {
    title: "Classify AI System Under EU AI Act",
    description: "Classify an AI system's risk level under the EU AI Act (Regulation 2024/1689). Returns risk classification, applicable Annex III category, provider/deployer determination, and key obligations.",
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: classifyInputSchema,
    outputSchema: classifyOutputSchema,
  }, async (input: ClassifyInput): Promise<any> => {
    const combined = `${input.description} ${input.use_case}`.toLowerCase();
    
    // Step 1: Check for prohibited practices (Art. 5)
    for (const practice of prohibitedPractices) {
      const score = calculateKeywordOverlap(combined, practice.keywords);
      if (score > 0.6) {
        const result: ClassifyOutput = {
          risk_classification: "prohibited",
          confidence: score > 0.8 ? "high" : "medium",
          annex_iii_category: null,
          relevant_articles: ["Art. 5"],
          role_determination: "uncertain",
          obligations_summary: "This system appears to fall under prohibited AI practices. Deployment is not permitted under the EU AI Act.",
          caveat: "This is an automated assessment. Consult legal counsel for definitive classification.",
          lexbeam_url: `${BRANDING.baseUrl}/tools/mcp`,
          source: BRANDING.source,
          disclaimer: BRANDING.disclaimer,
          last_updated: BRANDING.lastUpdated,
        };
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], structuredContent: result };
      }
    }

    // Step 2: Check Annex III high-risk categories
    for (const category of annexIIICategories) {
      const score = calculateKeywordOverlap(combined, category.keywords);
      if (score > 0.5) {
        // Check Art. 6(3) exception
        const isException = false; // Art. 6(3) requires documented justification - flag but don't auto-apply

        if (isException) {
          const result: ClassifyOutput = {
            risk_classification: "minimal",
            confidence: "medium",
            annex_iii_category: {
              number: category.number,
              name: category.name,
            },
            relevant_articles: ["Art. 6(3)", ...category.relevantArticles],
            role_determination: input.role === "unknown" ? "uncertain" : input.role,
            obligations_summary: "System matches Annex III category but qualifies for Art. 6(3) exception (narrow procedural task, no significant risk).",
            caveat: "Exception applies only if the system performs a narrow procedural task with no material influence on decision-making.",
            lexbeam_url: `${BRANDING.baseUrl}/tools/mcp`,
            source: BRANDING.source,
            disclaimer: BRANDING.disclaimer,
            last_updated: BRANDING.lastUpdated,
          };
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], structuredContent: result };
        }

        const result: ClassifyOutput = {
          risk_classification: "high-risk",
          confidence: score > 0.7 ? "high" : "medium",
          annex_iii_category: {
            number: category.number,
            name: category.name,
          },
          relevant_articles: [...category.relevantArticles, "Art. 6(2)"],
          role_determination: input.role === "unknown" ? "both" : input.role,
          obligations_summary: input.role === "provider" 
            ? "Providers must ensure conformity assessment, technical documentation, logging, transparency, human oversight, accuracy, and cybersecurity."
            : "Deployers must ensure human oversight, monitor system operation, and conduct fundamental rights impact assessments.",
          caveat: null,
          lexbeam_url: `${BRANDING.baseUrl}/tools/mcp`,
          source: BRANDING.source,
          disclaimer: BRANDING.disclaimer,
          last_updated: BRANDING.lastUpdated,
        };
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], structuredContent: result };
      }
    }

    // Step 3: Check Art. 50 limited risk (transparency obligations)
    for (const trigger of transparencyTriggers) {
      const score = calculateKeywordOverlap(combined, trigger.keywords);
      if (score > 0.6) {
        const result: ClassifyOutput = {
          risk_classification: "limited",
          confidence: score > 0.75 ? "high" : "medium",
          annex_iii_category: null,
          relevant_articles: ["Art. 50"],
          role_determination: input.role === "unknown" ? "uncertain" : input.role,
          obligations_summary: "System must comply with transparency obligations (Art. 50). Users must be informed they are interacting with AI.",
          caveat: null,
          lexbeam_url: `${BRANDING.baseUrl}/tools/mcp`,
          source: BRANDING.source,
          disclaimer: BRANDING.disclaimer,
          last_updated: BRANDING.lastUpdated,
        };
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], structuredContent: result };
      }
    }

    // Step 4: Default to minimal risk
    const result: ClassifyOutput = {
      risk_classification: "minimal",
      confidence: "low",
      annex_iii_category: null,
      relevant_articles: ["Art. 6(1)"],
      role_determination: input.role === "unknown" ? "uncertain" : input.role,
      obligations_summary: "System appears to be minimal risk. General product safety and consumer protection laws apply, but no specific AI Act obligations beyond voluntary codes of conduct.",
      caveat: "This classification is based on limited information. A detailed assessment may reveal higher risk classification.",
      lexbeam_url: `${BRANDING.baseUrl}/tools/mcp`,
      source: BRANDING.source,
      disclaimer: BRANDING.disclaimer,
      last_updated: BRANDING.lastUpdated,
    };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], structuredContent: result };
  });
}
