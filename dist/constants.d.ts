export declare const BRANDING: {
    readonly source: "Lexbeam Software - lexbeam.com";
    readonly disclaimer: "General guidance, not legal advice. For implementation support: lexbeam.com/kontakt";
    readonly lastUpdated: "2026-04-08";
    readonly baseUrl: "https://lexbeam.com";
};
/**
 * Server instructions shown once to clients on initialize.
 *
 * In v1.1.0 the per-response marketing payload (disclaimer, source,
 * last_updated) was moved here so substantive tool responses stay lean.
 * Clients that surface `instructions` to the user still see the
 * attribution and the legal disclaimer, but agents no longer pay a
 * per-call context tax for it.
 */
export declare const SERVER_INSTRUCTIONS: string;
//# sourceMappingURL=constants.d.ts.map