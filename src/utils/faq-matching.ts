import { faqDatabase } from "../knowledge/faq-database.js";
import { findBestMatch } from "./matching.js";

/**
 * Narrow query aliases for the existing literacy FAQ. Keep this separate from
 * classifier keyword matching: spelling and language aliases are not risk rules.
 * Explicit references to another article must not be swallowed by Article 4.
 */
export function findFaqMatch(question: string) {
  const normalized = question.toLowerCase().normalize("NFKC");
  const references = [...normalized.matchAll(/\b(?:article|artikel|art)\.?\s*(\d+[a-z]?)(?![\w])/g)]
    .map((match) => match[1]);
  const literacyTopic = /\b(?:ai[\s-]+(?:literacy|competenc(?:e|y))|ki[\s-]*(?:kompetenz|schulung(?:en)?))\b/.test(normalized);
  const onlyArticleFour = references.length > 0 && references.every((article) => article === "4");
  const referencePattern = /\b(?:article|artikel|art)\.?\s*4\b/g;
  const genericQuestion = normalized.replace(referencePattern, "article_ref").trim();
  const directLookup = /^(?:article_ref|what does article_ref (?:say|require)|what is article_ref|was (?:regelt|verlangt|besagt) article_ref)[?!.]*$/.test(genericQuestion);
  // The literacy answer does not establish sanctions or exemption eligibility.
  // A mention of Article 4 alone must not swallow those distinct questions.
  const differentFocus = /\b(?:fine(?:s)?|penalt(?:y|ies)|sanction(?:s)?|exempt(?:ion|ions)?|bußgeld(?:er|es)?|bussgeld(?:er|es)?|strafen?|sanktionen?|ausnahmen?)\b/.test(normalized);
  if (!differentFocus && ((onlyArticleFour && directLookup) || ((references.length === 0 || onlyArticleFour) && literacyTopic))) {
    const item = faqDatabase.find((entry) => entry.id === "faq-08-ai-literacy")!;
    return { item, confidence: "high" as const, score: 1 };
  }

  return findBestMatch(
    question,
    faqDatabase.map((entry) => ({ ...entry, _search: `${entry.question} ${entry.keywords.join(" ")}` })),
    "_search",
  );
}
