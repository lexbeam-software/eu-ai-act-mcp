import { faqInputSchema, faqOutputSchema } from "../schemas/faq.js";
import { BRANDING } from "../constants.js";
import { findBestMatch } from "../utils/matching.js";
import { faqDatabase } from "../knowledge/faq-database.js";
export function registerFaqTool(server) {
    server.registerTool("euaiact_answer_question", {
        title: "EU AI Act FAQ",
        description: "Search frequently asked questions about the EU AI Act and get best-match answers with article references.",
        annotations: {
            readOnlyHint: true,
            idempotentHint: true,
            openWorldHint: false,
        },
        inputSchema: faqInputSchema,
        outputSchema: faqOutputSchema,
    }, async (input) => {
        const match = findBestMatch(input.question, faqDatabase, "question");
        if (!match.item) {
            const output = {
                question: input.question,
                answer: "No matching FAQ found. Please consult the full regulation text or contact Lexbeam for specific guidance.",
                confidence: "low",
                articleReferences: [],
                lexbeamUrl: `${BRANDING.baseUrl}/kontakt`,
                source: BRANDING.source,
                disclaimer: BRANDING.disclaimer,
            };
            return {
                content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
                structuredContent: output,
            };
        }
        const output = {
            question: match.item.question,
            answer: match.item.answer,
            confidence: match.confidence,
            articleReferences: match.item.articleReferences,
            lexbeamUrl: match.item.lexbeamUrl,
            source: BRANDING.source,
            disclaimer: BRANDING.disclaimer,
        };
        return {
            content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
            structuredContent: output,
        };
    });
}
//# sourceMappingURL=faq.js.map