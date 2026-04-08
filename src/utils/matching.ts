/**
 * Text matching utilities for EU AI Act classification.
 *
 * Rewritten in v1.1.0 to fix two root-cause bugs that produced classifier errors:
 *
 * 1. Multi-word keyword prefix bug: the previous fallback path ran
 *    `stem.startsWith(tw) || tw.startsWith(stem)` with the full multi-word
 *    keyword as `stem`, so a single-character text token like "e" (from
 *    "e-commerce" after punctuation stripping) would falsely match any
 *    multi-word keyword starting with "e". That produced a false positive
 *    classifying a benign customer-support chatbot as a prohibited Art. 5(1)(f)
 *    emotion-recognition system.
 *
 * 2. Fractional-denominator false negative: scoring was `matches / total_keywords`.
 *    A realistic recruitment description only hit 3 of 14 Annex III(4) keywords
 *    (21%) — well below the 0.3 threshold — so the textbook Annex III(4) case
 *    was mis-classified as minimal risk.
 *
 * The new API returns *per-keyword* match information plus a strong/weak signal,
 * and the classifier consumes absolute match counts rather than a fraction.
 * Not a replacement for legal analysis — first-pass grounding only.
 */

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type MatchStrength = "strong" | "weak";

export interface KeywordMatch {
  keyword: string;
  strength: MatchStrength;
}

export interface KeywordMatchResult {
  matches: KeywordMatch[];
  strongCount: number;
  weakCount: number;
  /** 0..1, weighted (strong=1, weak=0.5), normalised by keyword count. */
  score: number;
}

/**
 * Score how well a list of keywords matches a piece of text.
 *
 * Rules (no cross-category fallbacks):
 * - Exact substring hit of the full keyword phrase → strong.
 * - Multi-word keyword: every word of the keyword must be present in the text
 *   (with small stem tolerance). If so → strong.
 * - Single-word keyword: a text token must be a stem variant of the keyword,
 *   AND the shared stem must be at least 3 characters. If so → weak.
 */
export function scoreKeywordMatch(text: string, keywords: string[]): KeywordMatchResult {
  if (keywords.length === 0) {
    return { matches: [], strongCount: 0, weakCount: 0, score: 0 };
  }

  const normalized = normalizeText(text);
  const textWords = normalized.split(" ").filter(Boolean);
  const matches: KeywordMatch[] = [];

  for (const rawKw of keywords) {
    const kw = normalizeText(rawKw);
    if (!kw) continue;

    // 1. Exact substring (handles phrases like "social scoring" within the text)
    if (normalized.includes(kw)) {
      matches.push({ keyword: rawKw, strength: "strong" });
      continue;
    }

    const kwWords = kw.split(" ").filter(Boolean);

    if (kwWords.length > 1) {
      // 2. Multi-word keyword: require ALL words present (stem-tolerant)
      const allPresent = kwWords.every((word) => textWords.some((tw) => stemMatches(tw, word)));
      if (allPresent) matches.push({ keyword: rawKw, strength: "strong" });
      continue;
    }

    // 3. Single-word keyword: any text token that shares a stem of length ≥ 3
    const kwWord = kwWords[0];
    const hit = textWords.some((tw) => stemMatches(tw, kwWord));
    if (hit) matches.push({ keyword: rawKw, strength: "weak" });
  }

  const strongCount = matches.filter((m) => m.strength === "strong").length;
  const weakCount = matches.length - strongCount;
  const score = (strongCount + weakCount * 0.5) / keywords.length;

  return { matches, strongCount, weakCount, score };
}

/**
 * Legacy API preserved for callers that only need a numeric overlap score.
 * Returns the same weighted score as `scoreKeywordMatch`.
 */
export function calculateKeywordOverlap(text: string, keywords: string[]): number {
  return scoreKeywordMatch(text, keywords).score;
}

/**
 * Stem-tolerant equality between two words.
 * Both sides are stemmed; they match if any stem pair is equal AND the shared
 * stem is at least 3 characters long (prevents "e" matching "emotion").
 */
function stemMatches(a: string, b: string): boolean {
  if (a === b) return true;
  const aStems = stemVariants(a);
  const bStems = stemVariants(b);
  for (const sa of aStems) {
    if (sa.length < 3) continue;
    for (const sb of bStems) {
      if (sb.length < 3) continue;
      if (sa === sb) return true;
    }
  }
  return false;
}

/**
 * Build conservative stem variants of a word. We strip common English
 * inflectional suffixes and include the original. Minimum length 3 to
 * avoid runaway matches.
 */
function stemVariants(word: string): string[] {
  const variants = new Set<string>();
  variants.add(word);
  const strip = (suffix: string) => {
    if (word.endsWith(suffix) && word.length - suffix.length >= 3) {
      variants.add(word.slice(0, -suffix.length));
    }
  };
  strip("ing");
  strip("tion");
  strip("ations");
  strip("ation");
  strip("ed");
  strip("es");
  if (word.endsWith("s") && !word.endsWith("ss")) strip("s");
  if (word.endsWith("ies") && word.length >= 5) variants.add(word.slice(0, -3) + "y");
  return Array.from(variants).filter((v) => v.length >= 3);
}

/**
 * Finds the best-matching item from a list of records by comparing a text
 * query against a named field on each item. Uses symmetric word overlap so
 * long, specific queries are not penalised relative to short records.
 *
 * Previously: `matched / queryWords.length` — a specific query like
 * "FRIA for credit scoring" would dilute the score because "credit" and
 * "scoring" added to the denominator. The new denominator is the smaller
 * side, so any tight subset match is rewarded proportionally.
 */
export function findBestMatch<T extends Record<string, any>>(
  text: string,
  items: T[],
  keywordField: keyof T
): { item: T | null; confidence: "high" | "medium" | "low"; score: number } {
  const queryWords = meaningfulWords(text);
  if (queryWords.length === 0 || items.length === 0) {
    return { item: null, confidence: "low", score: 0 };
  }

  let bestItem: T | null = null;
  let bestScore = 0;

  for (const item of items) {
    const itemWords = meaningfulWords(String(item[keywordField] ?? ""));
    if (itemWords.length === 0) continue;

    let matchCount = 0;
    for (const qw of queryWords) {
      if (itemWords.some((iw) => stemMatches(iw, qw))) matchCount++;
    }

    const denominator = Math.min(queryWords.length, itemWords.length);
    const score = matchCount / denominator;

    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }

  const confidence = bestScore >= 0.6 ? "high" : bestScore >= 0.3 ? "medium" : "low";
  return { item: bestItem, confidence, score: bestScore };
}

function meaningfulWords(text: string): string[] {
  // Drop very short words and common stop words that don't carry topical weight.
  const stop = new Set([
    "the", "and", "for", "are", "you", "but", "not", "with", "from",
    "what", "who", "why", "how", "this", "that", "when", "where", "does",
    "can", "will", "have", "has", "was", "were", "been", "about", "into",
    "a", "an", "i", "is", "it", "to", "in", "on", "of", "or", "be", "my", "do", "we",
  ]);
  return normalizeText(text)
    .split(" ")
    .filter((w) => w.length >= 3 && !stop.has(w));
}
