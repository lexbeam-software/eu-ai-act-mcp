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
 *    (21%) - well below the 0.3 threshold - so the textbook Annex III(4) case
 *    was mis-classified as minimal risk.
 *
 * Revised in v1.5.1 for a third root cause, a wide class of false positives:
 *
 * 3. Raw substring matching: the first check was `normalized.includes(keyword)`, which
 *    ignores word boundaries and marked every hit "strong", single words included. One
 *    strong hit classifies, so "for example" contained "exam" and returned high-risk
 *    education, "determination" contained "termination" and returned high-risk
 *    employment, "menu selection" contained "election", and the whole words in
 *    "fix minor layout bugs" and "children's shoes" returned a PROHIBITED practice.
 *    Matching now runs on whole tokens only, and a single-word keyword is weak evidence
 *    unless the caller names it as decisive: a term of art that denotes the regulated
 *    function by itself ("proctoring", "polygraph"), as opposed to an everyday or
 *    sector word ("minor", "court", "visa", "migration").
 *
 * The new API returns *per-keyword* match information plus a strong/weak signal,
 * and the classifier consumes absolute match counts rather than a fraction.
 * Not a replacement for legal analysis - first-pass grounding only.
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
export function scoreKeywordMatch(
  text: string,
  keywords: string[],
  decisiveSingleWords: ReadonlySet<string> = new Set(),
): KeywordMatchResult {
  if (keywords.length === 0) {
    return { matches: [], strongCount: 0, weakCount: 0, score: 0 };
  }

  const textWords = normalizeText(text).split(" ").filter(Boolean);
  const matches: KeywordMatch[] = [];

  for (const rawKw of keywords) {
    const kw = normalizeText(rawKw);
    if (!kw) continue;

    const kwWords = kw.split(" ").filter(Boolean);

    if (kwWords.length > 1) {
      // 1. Multi-word keyword: require ALL words present as whole tokens (stem-tolerant).
      //    A contiguous phrase satisfies this too, so no separate phrase check is needed.
      const allPresent = kwWords.every((word) => textWords.some((tw) => stemMatches(tw, word)));
      if (allPresent) matches.push({ keyword: rawKw, strength: "strong" });
      continue;
    }

    // 2. Single-word keyword: a whole token that equals it or shares a stem of length ≥ 3.
    //    Strong only for a decisive term of art; an everyday or sector word stays weak and
    //    needs company before it classifies anything.
    const hit = textWords.some((tw) => stemMatches(tw, kw));
    if (hit) matches.push({ keyword: rawKw, strength: decisiveSingleWords.has(kw) ? "strong" : "weak" });
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
 * Previously: `matched / queryWords.length` - a specific query like
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
  let bestMatchCount = 0;
  let secondScore = 0;

  for (const item of items) {
    const itemWords = meaningfulWords(String(item[keywordField] ?? ""));
    if (itemWords.length === 0) continue;

    let matchCount = 0;
    for (const qw of queryWords) {
      if (itemWords.some((iw) => stemMatches(iw, qw))) matchCount++;
    }

    const denominator = Math.min(queryWords.length, itemWords.length);
    const score = matchCount / denominator;

    // Ties break on absolute match count, so an entry matching more of the
    // query beats an equal-ratio entry that matched fewer words. Without this,
    // the first array entry won every tie and became a magnet for loosely
    // related queries.
    if (score > bestScore || (score === bestScore && matchCount > bestMatchCount)) {
      if (bestItem && bestItem !== item) secondScore = bestScore;
      bestScore = score;
      bestMatchCount = matchCount;
      bestItem = item;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  // A near-tie between different entries is ambiguity, not confidence: cap at
  // medium so a wrong-but-plausible match can never be served as "high".
  const margin = bestScore - secondScore;
  let confidence: "high" | "medium" | "low" =
    bestScore >= 0.6 ? "high" : bestScore >= 0.3 ? "medium" : "low";
  if (confidence === "high" && margin < 0.15) confidence = "medium";
  return { item: bestItem, confidence, score: bestScore };
}

function meaningfulWords(text: string): string[] {
  // Drop very short words and common stop words that don't carry topical weight.
  const stop = new Set([
    "the", "and", "for", "are", "you", "but", "not", "with", "from",
    "what", "who", "why", "how", "this", "that", "when", "where", "does",
    "can", "will", "have", "has", "was", "were", "been", "about", "into",
    "a", "an", "i", "is", "it", "to", "in", "on", "of", "or", "be", "my", "do", "we",
    // Corpus-generic tokens: they appear in nearly every EU AI Act question, so
    // they carry no topical weight and let connective overlap beat the topic
    // word ("deadlines under the EU AI Act" must match on "deadlines", not "under act").
    "under", "act", "need",
  ]);
  return normalizeText(text)
    .split(" ")
    .filter((w) => w.length >= 3 && !stop.has(w));
}
