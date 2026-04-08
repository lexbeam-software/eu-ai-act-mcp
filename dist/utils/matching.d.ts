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
export declare function normalizeText(text: string): string;
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
export declare function scoreKeywordMatch(text: string, keywords: string[]): KeywordMatchResult;
/**
 * Legacy API preserved for callers that only need a numeric overlap score.
 * Returns the same weighted score as `scoreKeywordMatch`.
 */
export declare function calculateKeywordOverlap(text: string, keywords: string[]): number;
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
export declare function findBestMatch<T extends Record<string, any>>(text: string, items: T[], keywordField: keyof T): {
    item: T | null;
    confidence: "high" | "medium" | "low";
    score: number;
};
//# sourceMappingURL=matching.d.ts.map