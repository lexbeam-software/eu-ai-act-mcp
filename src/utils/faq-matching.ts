import { faqDatabase } from "../knowledge/faq-database.js";
import { findBestMatch } from "./matching.js";

// Match complete questions, with bounded role and article qualifiers. A topic
// mention alone does not establish that the literacy FAQ answers the question.
const directLiteracyForms = [
  /^(?:what is|was ist|was bedeutet) literacy_topic$/,
  /^what does article_ref require for literacy_topic$/,
  /^what (?:are (?:the )?)?literacy_topic (?:duties|obligations|requirements)(?:(?: for| apply to) (?:a |the )?(?:providers?|deployers?)(?: and (?:providers?|deployers?))?)?(?: under article_ref)?$/,
  /^what are (?:the )?(?:duties|obligations|requirements) (?:for|on) literacy_topic(?: for (?:a |the )?(?:providers?|deployers?))?(?: under article_ref)?$/,
  /^welche (?:pflichten|anforderungen) (?:zur|für(?: die)?) literacy_topic(?: gelten)?(?: für (?:anbieter|betreiber)(?: und (?:anbieter|betreiber))?)?(?: nach article_ref)?$/,
  /^do (?:we|our (?:employees|staff)) need literacy_topic training$/,
  /^brauchen (?:wir|unsere (?:beschäftigten|mitarbeitenden|mitarbeiter|mitarbeiterinnen)) literacy_training$/,
  /^(?:ab wann|seit wann) gilt (?:die )?literacy_topic(?:[ -]pflicht)?$/,
  /^since when is literacy_topic (?:required|mandatory)$/,
  /^since when does (?:the )?literacy_topic (?:duty|obligation|requirement) apply$/,
  /^(?:since when|when) do literacy_topic (?:duties|obligations|requirements) apply$/,
];

/**
 * Narrow query aliases for the existing literacy FAQ. Keep this separate from
 * classifier keyword matching: spelling and language aliases are not risk rules.
 * Explicit references to another article must not be swallowed by Article 4.
 */
export function findFaqMatch(question: string) {
  const normalized = question.toLowerCase().normalize("NFKC").replace(/\s+/g, " ").trim();
  const references = [...normalized.matchAll(/\b(?:article|artikel|art)\.?\s*(\d+[a-z]?)(?![\w])/g)]
    .map((match) => match[1]);
  const literacyTopic = /\b(?:ai[\s-]+(?:literacy|competenc(?:e|y))|ki[\s-]*(?:kompetenz|schulung(?:en)?))\b/.test(normalized);
  const onlyArticleFour = references.length > 0 && references.every((article) => article === "4");
  const referencePattern = /\b(?:article|artikel|art)\.?\s*4\b/g;
  const genericQuestion = normalized.replace(referencePattern, "article_ref")
    .replace(/\b(?:ai[\s-]+(?:literacy|competenc(?:e|y))|ki[\s-]*kompetenz)\b/g, "literacy_topic")
    .replace(/\bki[\s-]*schulung(?:en)?\b/g, "literacy_training")
    .replace(/[?!.]+$/, "").trim();
  const directLookup = /^(?:article_ref|what does article_ref (?:say|require)|what is article_ref|was (?:regelt|verlangt|besagt) article_ref)$/.test(genericQuestion);
  const directLiteracyQuestion = directLiteracyForms.some((form) => form.test(genericQuestion));
  if ((onlyArticleFour && directLookup) || ((references.length === 0 || onlyArticleFour) && literacyTopic && directLiteracyQuestion)) {
    const item = faqDatabase.find((entry) => entry.id === "faq-08-ai-literacy")!;
    return { item, confidence: "high" as const, score: 1 };
  }

  return findBestMatch(
    question,
    faqDatabase.map((entry) => ({ ...entry, _search: `${entry.question} ${entry.keywords.join(" ")}` })),
    "_search",
  );
}
