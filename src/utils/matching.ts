export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function calculateKeywordOverlap(text: string, keywords: string[]): number {
  const normalized = normalizeText(text);
  const matches = keywords.filter(kw => normalized.includes(kw.toLowerCase()));
  return keywords.length > 0 ? matches.length / keywords.length : 0;
}

export function findBestMatch<T extends Record<string, any>>(
  text: string,
  items: T[],
  keywordField: keyof T
): { item: T | null; confidence: "high" | "medium" | "low" } {
  let bestScore = 0;
  let bestItem: T | null = null;

  for (const item of items) {
    const itemText = String(item[keywordField]);
    const normalized = normalizeText(text);
    const itemNormalized = normalizeText(itemText);
    
    const words = normalized.split(" ");
    const itemWords = itemNormalized.split(" ");
    
    const commonWords = words.filter(w => itemWords.includes(w));
    const score = commonWords.length / Math.max(words.length, itemWords.length);

    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }

  const confidence = bestScore > 0.6 ? "high" : bestScore > 0.3 ? "medium" : "low";
  
  return { item: bestItem, confidence };
}
