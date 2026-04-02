export function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
export function calculateKeywordOverlap(text, keywords) {
    const normalized = normalizeText(text);
    const matches = keywords.filter(kw => normalized.includes(kw.toLowerCase()));
    return keywords.length > 0 ? matches.length / keywords.length : 0;
}
export function findBestMatch(text, items, keywordField) {
    let bestScore = 0;
    let bestItem = null;
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
//# sourceMappingURL=matching.js.map