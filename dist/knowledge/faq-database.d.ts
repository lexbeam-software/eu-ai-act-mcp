/**
 * EU AI Act - FAQ Database
 *
 * 20 frequently asked questions based on top ICP queries.
 * Each answer references specific articles from Regulation (EU) 2024/1689.
 *
 * URLs point to lexbeam.com/de/wissen/[slug] for German-language knowledge base.
 */
export interface FAQEntry {
    id: string;
    question: string;
    answer: string;
    articleReferences: string[];
    keywords: string[];
    lexbeamUrl: string;
    category: string;
}
export declare const faqDatabase: FAQEntry[];
//# sourceMappingURL=faq-database.d.ts.map