/**
 * The two documents the hosted endpoint serves for a reader instead of a tool call: GET / (the front page) and
 * GET /llms.txt (the same facts as plain text for software and agents that look a server up before connecting).
 *
 * The page is one self-contained document: style, script and fonts are inline and nothing is loaded from another
 * origin, which the Content-Security-Policy in frontPageHeaders() enforces. Every number comes from EVIDENCE with its
 * source and date; the call in the hero console comes from RECORDED_CALL, which the behaviour suite runs again
 * against the tool, and TOOLS is kept equal to the server's own tool list by the same suite.
 */

import { createHash } from "node:crypto";
import { BRANDING, SERVER_VERSION } from "../constants.js";
import { articles } from "../knowledge/articles.js";
import { JETBRAINS_MONO_WOFF2, SCHIBSTED_GROTESK_WOFF2 } from "./fonts.js";
import { PAGE_SCRIPT_TEMPLATE } from "./page-script.js";
import { PAGE_STYLE } from "./page-style.js";

export const SITE_URL = "https://mcp.lexbeam.com/";
export const ENDPOINT_URL = `${SITE_URL}mcp`;
export const DIRECTORY_URL = "https://claude.ai/directory/lexbeam-eu-ai-act";
export const REPOSITORY_URL = "https://github.com/lexbeam-software/eu-ai-act-mcp";
export const NPM_PACKAGE = "@lexbeam-software/eu-ai-act-mcp";
export const NPM_URL = `https://www.npmjs.com/package/${NPM_PACKAGE}`;
export const SMITHERY_URL = "https://smithery.ai/servers/lexbeam-software/eu-ai-act";
export const PRIVACY_URL = `${REPOSITORY_URL}/blob/main/PRIVACY.md`;
export const IMPRINT_URL = "https://www.lexbeam.com/de/impressum";
export const DATA_PROTECTION_URL = "https://www.lexbeam.com/de/datenschutz";
export const TERMS_URL = "https://www.lexbeam.com/de/agb";
export const INSTALL_COMMAND = `npx -y ${NPM_PACKAGE}`;
const CLAUDE_DESKTOP_CONFIG = `{ "mcpServers": { "eu-ai-act": { "command": "npx", "args": ["-y", "${NPM_PACKAGE}"] } } }`;

/** What the hosted endpoint costs: the one price on the page, in /llms.txt and in the JSON-LD offer. */
export const PRICE = { label: "Free", amount: "0", currency: "EUR", access: "No key, no account" } as const;

/** The pinned law the claim matrix checks against; the behaviour suite keeps it equal to law/manifest.json. */
export const LAW = { celex: "02024R1689-20260727", sealed: "2026-10-20" } as const;

export interface ToolEntry {
  name: string;
  /** Plain text; `code` and 10^25 are rendered as markup on the page. */
  returns: string;
  restsOn: string;
}

/** The ten tools in the order tools/list returns them. The behaviour suite keeps the names equal to the server's list. */
export const TOOLS: readonly ToolEntry[] = [
  { name: "euaiact_classify_system", returns: "Risk class from structured signals or a description: prohibited, high-risk, limited, minimal, or `insufficient_information` with the facts that are missing.", restsOn: "Art. 5, 6, 50, Annex I and III" },
  { name: "euaiact_check_deadlines", returns: "The milestones of the amended timeline, the next one and the days left.", restsOn: "Art. 113, Reg. (EU) 2026/1744" },
  { name: "euaiact_get_obligations", returns: "The duties of a provider or a deployer at a given risk level.", restsOn: "Art. 4, 9 to 27, 43 to 50, 53 to 55, 72, 73" },
  { name: "euaiact_answer_question", returns: "Curated answers to common questions with article references; says `no_match` instead of guessing.", restsOn: "FAQ with article references" },
  { name: "euaiact_calculate_penalty", returns: "The maximum fine by violation type and worldwide turnover, with the SME and small mid-cap rules.", restsOn: "Art. 99, 101" },
  { name: "euaiact_get_article", returns: `An operational summary of one of the ${articles.length} articles it covers, with its EUR-Lex link.`, restsOn: "Consolidated text, EUR-Lex" },
  { name: "euaiact_check_gpai_systemic_risk", returns: "Whether a general-purpose AI model is presumed to carry systemic risk at 10^25 training FLOPs, and the duties that follow.", restsOn: "Art. 51 to 53, 55, 56" },
  { name: "euaiact_assess_art6_3_exception", returns: "Walks the Art. 6(3) exception for Annex III systems; profiling of natural persons rules it out.", restsOn: "Art. 6(3), 6(4), 49(2)" },
  { name: "euaiact_annex_iv_checklist", returns: "The nine items of the Annex IV technical documentation as a checklist.", restsOn: "Art. 11, Annex IV" },
  { name: "euaiact_assess_system", returns: "One system profile in; legal classification, impact and implementation readiness out, as separate blocks with their provenance.", restsOn: "Pinned consolidated text" },
];

export interface EvidenceEntry {
  measure: string;
  /** The number set large in the value cell, if the row has one. */
  figure?: string;
  value: string;
  source: string;
  asOf: string;
}

/** Every number the page states, with its source and date. Update with the release that changes it. */
export const EVIDENCE: readonly EvidenceEntry[] = [
  { measure: "Law text", value: `Regulation (EU) 2024/1689 as amended by Regulation (EU) 2026/1744: consolidated text CELEX ${LAW.celex}, pinned by SHA-256 together with Commission Implementing Decision (EU) 2026/2274, the first harmonised standard reference. A consolidated text is a documentation tool without legal effect`, source: "law/manifest.json", asOf: LAW.sealed },
  { measure: "Coverage", figure: "10", value: "tools, 6 resources, 4 prompts", source: "tools/list, resources/list and prompts/list on mcp.lexbeam.com", asOf: "2026-10-20" },
  { measure: "Claim checks", figure: "77", value: "legal claims, each checked twice: against the pinned text and against what the server serves (154 checks)", source: "npm run verify", asOf: "2026-10-20" },
  { measure: "Behaviour tests", figure: "732", value: "passed, none failed", source: "npm run verify", asOf: "2026-10-20" },
  { measure: "Determinism", figure: "120", value: "identical hashes: 12 assessment profiles, 10 runs each", source: "npm run verify", asOf: "2026-10-12" },
  { measure: "Schema checks", figure: "49", value: "passed", source: "npm run verify", asOf: "2026-10-20" },
  { measure: "Downloads", figure: "838", value: "from npm in 30 days", source: "npm registry", asOf: "2026-09-12 to 2026-10-11" },
  { measure: "Listings", value: "Claude's connectors directory since 2026-10-07, Smithery", source: "listing pages", asOf: "2026-10-12" },
];

/** The call the hero console shows, recorded on mcp.lexbeam.com. The behaviour suite runs it again in-process. */
export const RECORDED_CALL = {
  tool: "euaiact_classify_system",
  arguments: {
    description: "Our ATS screens incoming CVs against the job spec and auto-rejects anyone missing the right keywords before a recruiter looks.",
    signals: { domain: "employment" },
  },
  recordedOn: "2026-10-12",
  recordedVersion: "1.7.0",
  response: {
    basis: "signals",
    matched_signals: ["domain=employment → Annex III(4) Employment, workers management, and access to self-employment"],
    annex_iii_category: { number: 4, name: "Employment, workers management, and access to self-employment" },
    relevant_articles: ["Annex III(4)", "Art. 6(2)", "Art. 26(7)", "Art. 27"],
    confidence: "high",
    risk_classification: "high-risk",
    caveat: "Art. 6(3) exception may apply if the system performs only a narrow procedural task with no material influence on decision-making AND does not perform profiling of natural persons. Use euaiact_assess_art6_3_exception to evaluate.",
  },
} as const;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** JSON for an inline script or a JSON-LD block: "<" escaped, so no value can close the element. */
function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** Plain copy with `code` spans and 10^n powers, as escaped markup. */
function inline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/10\^(\d+)/g, "10<sup>$1</sup>");
}

function plain(text: string): string {
  return text.replace(/10\^(\d+)/g, "10^$1");
}

const ICON_OUT = '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5"/></svg>';
const ICON_COPY = '<svg class="i ic-copy" viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 3.5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6.5a1 1 0 0 0 1 1h.5"/></svg>';
const ICON_DONE = '<svg class="i ic-done" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5 6.5 11.5 12.5 4.5"/></svg>';
const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23141415'/%3E%3Cpath d='M9 8v16h14' fill='none' stroke='%23f35b22' stroke-width='3.2'/%3E%3C/svg%3E";
const DESCRIPTION = "Classify an AI system and find its duties, deadlines and fines under the EU AI Act as amended, from inside your AI agent. Ten deterministic MCP tools with article references. Free hosted endpoint, open source. General guidance, not legal advice.";
const SHARE_DESCRIPTION = "Ten deterministic tools that classify AI systems and their duties under the EU AI Act as amended, with article references. Free hosted endpoint, open source.";

function copyButton(text: string, copied: string, label: string): string {
  return `<button class="icon-btn" type="button" hidden data-copy="${escapeHtml(text)}" data-copied="${escapeHtml(copied)}" aria-label="${escapeHtml(label)}">${ICON_COPY}${ICON_DONE}</button>`;
}

/** The request arguments as a coloured JSON block (string values and one level of nesting). */
function requestHtml(args: Record<string, unknown>): string {
  const key = (name: string) => `<span class="k1">${escapeHtml(JSON.stringify(name))}</span>`;
  const value = (raw: unknown): string =>
    typeof raw === "object" && raw !== null
      ? `{ ${Object.entries(raw).map(([k, v]) => `${key(k)}: ${value(v)}`).join(", ")} }`
      : `<span class="s1">${escapeHtml(JSON.stringify(raw))}</span>`;
  const lines = Object.entries(args).map(([k, v]) => `  ${key(k)}: ${value(v)}`);
  return `{\n${lines.join(",\n")}\n}`;
}

function jsonLd(): string {
  return scriptJson({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "EU AI Act MCP Server",
    alternateName: NPM_PACKAGE,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any MCP client; Node.js 20 or later for a local install",
    softwareVersion: SERVER_VERSION,
    description: "Ten deterministic Model Context Protocol tools that classify AI systems and their duties under Regulation (EU) 2024/1689 as amended by Regulation (EU) 2026/1744, with article references. General guidance, not legal advice.",
    url: SITE_URL,
    downloadUrl: NPM_URL,
    license: "https://opensource.org/licenses/MIT",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: PRICE.amount, priceCurrency: PRICE.currency },
    publisher: { "@type": "Organization", name: "Lexbeam Software", url: "https://lexbeam.com" },
    sameAs: [REPOSITORY_URL, NPM_URL, SMITHERY_URL, DIRECTORY_URL],
  });
}

function fontFaces(): string {
  return [
    "/* Schibsted Grotesk and JetBrains Mono, SIL Open Font License 1.1 (src/site/fonts.ts) */",
    `@font-face{font-family:"Schibsted Grotesk";src:url(data:font/woff2;base64,${SCHIBSTED_GROTESK_WOFF2}) format("woff2");font-weight:400 900;font-style:normal;font-display:swap}`,
    `@font-face{font-family:"JetBrains Mono";src:url(data:font/woff2;base64,${JETBRAINS_MONO_WOFF2}) format("woff2");font-weight:400;font-style:normal;font-display:swap}`,
  ].join("\n");
}

function consoleHtml(): string {
  const r = RECORDED_CALL.response;
  const chips = r.relevant_articles.map((article) => `<span class="chip">${escapeHtml(article)}</span>`).join("");
  const caveat = escapeHtml(r.caveat).replace("euaiact_assess_art6_3_exception", "<code>euaiact_assess_art6_3_exception</code>");
  return `<figure class="module run" id="console" aria-labelledby="console-src">
        <div class="console">
          <div class="c-head"><span class="c-pill">tools/call</span><span class="c-tool">${escapeHtml(RECORDED_CALL.tool)}</span><span class="c-route">POST /mcp</span></div>
<p class="vh">Request arguments</p>
<pre class="c-req">${requestHtml(RECORDED_CALL.arguments)}</pre>
          <div class="c-split"><span class="sweep"><b>200 OK</b> · response, selected fields</span></div>
          <dl class="c-rows">
            <div class="c-row"><dt>basis</dt><dd>${escapeHtml(r.basis)}</dd></div>
            <div class="c-row"><dt>matched_signals</dt><dd>${escapeHtml(r.matched_signals.join("; "))}</dd></div>
            <div class="c-row"><dt>annex_iii_category</dt><dd>${r.annex_iii_category.number} · ${escapeHtml(r.annex_iii_category.name)}</dd></div>
            <div class="c-row"><dt>relevant_articles</dt><dd><span class="chips">${chips}</span></dd></div>
            <div class="c-row"><dt>confidence</dt><dd><span class="ok">${escapeHtml(r.confidence)}</span></dd></div>
          </dl>
          <dl class="verdict"><dt>risk_classification</dt><dd><span class="risk">${escapeHtml(r.risk_classification)}</span><span class="why">decided on the structured signals</span></dd></dl>
          <p class="c-caveat">caveat: "${caveat}"</p>
        </div>
        <figcaption class="m-foot">
          <span class="src" id="console-src">Recorded from mcp.lexbeam.com on ${RECORDED_CALL.recordedOn}, version ${RECORDED_CALL.recordedVersion}. Same input, same output.</span>
          <button class="btn btn-default" type="button" id="run-live" hidden>
            <svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7-4.5z"/></svg>Run it live</button>
          <span class="live" id="live-status" role="status" aria-live="polite"></span>
        </figcaption>
      </figure>`;
}

function toolRows(): string {
  return TOOLS.map((tool) =>
    `<li class="row"><span class="name"><span class="vh">Tool: </span>${escapeHtml(tool.name)}</span><span class="what"><span class="vh">Returns: </span>${inline(tool.returns)}</span><span class="basis"><span class="vh">Rests on: </span>${escapeHtml(tool.restsOn)}</span></li>`,
  ).join("\n          ");
}

function evidenceRows(): string {
  return EVIDENCE.map((row) => {
    const value = row.figure ? `<strong>${escapeHtml(row.figure)}</strong> ${escapeHtml(row.value)}` : escapeHtml(row.value);
    return `<li class="row"><span class="m"><span class="vh">Measure: </span>${escapeHtml(row.measure)}</span><span class="v">${value}</span><span class="s"><span class="vh">Source: </span>${escapeHtml(row.source)}</span><span class="d"><span class="vh">As of </span>${escapeHtml(row.asOf)}</span></li>`;
  }).join("\n        ");
}

function pageScript(): string {
  // Function replacements, so a "$" in a value can never act as a replacement pattern.
  return PAGE_SCRIPT_TEMPLATE
    .replace("__RECORDED__", () => scriptJson({ tool: RECORDED_CALL.tool, response: RECORDED_CALL.response }))
    .replace("__ARGUMENTS__", () => scriptJson(RECORDED_CALL.arguments));
}

function buildPage(): { html: string; style: string; script: string } {
  const style = `${fontFaces()}\n${PAGE_STYLE}`;
  const script = pageScript();
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>EU AI Act MCP Server by Lexbeam: ten deterministic tools for AI agents</title>
<meta name="description" content="${escapeHtml(DESCRIPTION)}">
<link rel="canonical" href="${SITE_URL}">
<meta name="theme-color" content="#fafaf8">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Lexbeam">
<meta property="og:title" content="EU AI Act MCP Server by Lexbeam">
<meta property="og:description" content="${escapeHtml(SHARE_DESCRIPTION)}">
<meta property="og:url" content="${SITE_URL}">
<meta property="og:locale" content="en_GB">
<meta name="twitter:card" content="summary">
<link rel="alternate" type="text/plain" href="/llms.txt" title="The same facts as plain text">
<link rel="icon" href="${FAVICON}">
<script type="application/ld+json">${jsonLd()}</script>
<style>${style}</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="bar">
  <div class="wrap">
    <a class="mark" href="/" aria-label="Lexbeam EU AI Act MCP Server, home">
      <svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#141415"/><path d="M9 8v16h14" fill="none" stroke="#f35b22" stroke-width="3.2"/></svg>
      Lexbeam <span>EU AI Act MCP Server</span>
    </a>
    <nav class="nav" aria-label="Sections">
      <a href="#tools">Tools</a><a href="#connect">Connect</a><a href="#evidence">Evidence</a><a href="${REPOSITORY_URL}">GitHub</a>
    </nav>
    <a class="btn btn-primary" href="${DIRECTORY_URL}">Add to Claude</a>
  </div>
</header>

<main id="main">
  <section class="hero" aria-labelledby="h1">
    <div class="wrap">
      <div class="pitch">
        <h1 id="h1">Classify AI systems under the EU AI Act, from inside your agent.</h1>
        <p class="lead">Ten deterministic tools over the Model Context Protocol, for developers and for legal and compliance teams who work with AI agents. Risk class, duties, deadlines and fines under Regulation (EU) 2024/1689 as amended by Regulation (EU) 2026/1744, with article references.</p>
        <p class="note"><svg class="i" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5"/><path d="M8 7.2v4M8 4.9v.1"/></svg>
          <span><strong>${escapeHtml(BRANDING.disclaimer)}</strong> Check the cited articles before you rely on an answer.</span></p>
        <dl class="spec">
          <div><dt>Price</dt><dd>${escapeHtml(PRICE.label)}</dd></div>
          <div><dt>Access</dt><dd>${escapeHtml(PRICE.access)}</dd></div>
          <div><dt>Source</dt><dd>Open, MIT license</dd></div>
        </dl>
        <div class="actions">
          <a class="btn btn-primary" href="${DIRECTORY_URL}">Add to Claude
            ${ICON_OUT}</a>
          <a class="btn btn-default" href="#connect">Other ways to connect</a>
        </div>
        <dl class="strings">
          <div><dt>Endpoint</dt><dd><code>${escapeHtml(ENDPOINT_URL)}</code>
            ${copyButton(ENDPOINT_URL, "Endpoint copied", "Copy the endpoint URL")}</dd></div>
          <div><dt>Local</dt><dd><code>${escapeHtml(INSTALL_COMMAND)}</code>
            ${copyButton(INSTALL_COMMAND, "Install command copied", "Copy the npx command")}</dd></div>
        </dl>
      </div>

      ${consoleHtml()}
    </div>
  </section>

  <section class="block" id="tools" aria-labelledby="tools-h">
    <div class="wrap split">
      <div>
        <h2 id="tools-h">Ten tools. No model in the loop.</h2>
        <p class="intro">Each tool is plain code, checked against a pinned copy of the regulation. The same input returns the same output, a schema rejects arguments it does not name, and sparse input fails closed: classification answers <code>insufficient_information</code> and names the facts that are missing.</p>
        <a class="more" href="${REPOSITORY_URL}#readme">Tool reference on GitHub ${ICON_OUT}</a>
      </div>
      <div>
        <ul class="sheet tools" role="list" aria-label="The ten tools">
          <li class="row head" aria-hidden="true"><span>Tool</span><span>Returns</span><span>Rests on</span></li>
          ${toolRows()}
        </ul>
        <p class="extra">Also served: six resources (timeline, risk levels, Annex III, Annex IV, the Digital Omnibus, harmonised standards and guidance) and four prompts.</p>
      </div>
    </div>
  </section>

  <section class="block" id="connect" aria-labelledby="connect-h">
    <div class="wrap">
      <h2 id="connect-h">Connect in one step</h2>
      <div class="connect-grid">
        <div class="way">
          <h3>Claude</h3>
          <p>Open the listing in Claude's connectors directory and connect. It works in claude.ai and the Claude apps. No Lexbeam account, no API key.</p>
          <a class="btn btn-primary" href="${DIRECTORY_URL}">Open the listing ${ICON_OUT}</a>
        </div>
        <div class="way">
          <h3>Any MCP client</h3>
          <p>Add the hosted endpoint as a remote server: Streamable HTTP, POST, no authentication. The status check is <a href="/health">/health</a>.</p>
          <div class="snip"><code>${escapeHtml(ENDPOINT_URL)}</code>${copyButton(ENDPOINT_URL, "Endpoint copied", "Copy the endpoint URL")}</div>
        </div>
        <div class="way">
          <h3>On your machine</h3>
          <p>Run it over stdio with Node.js 20 or later. Nothing reaches Lexbeam. For Claude Desktop, in <code>claude_desktop_config.json</code>:</p>
<div class="snip"><pre>{ "mcpServers": { "eu-ai-act": {
  "command": "npx",
  "args": ["-y", "${escapeHtml(NPM_PACKAGE)}"] } } }</pre>${copyButton(CLAUDE_DESKTOP_CONFIG, "Configuration copied", "Copy the Claude Desktop configuration")}</div>
        </div>
      </div>
      <p class="first">A first call to try: <code>euaiact_check_deadlines</code> with <code>{}</code> returns the next milestone and the days left.</p>
    </div>
  </section>

  <section class="block" id="evidence" aria-labelledby="evidence-h">
    <div class="wrap split">
      <div>
        <h2 id="evidence-h">Check it yourself</h2>
        <p class="intro">The code, the tests and the pinned law text are public. Every number here has a source and a date.</p>
        <a class="more" href="${REPOSITORY_URL}">Source on GitHub ${ICON_OUT}</a>
      </div>
      <ul class="sheet evidence" role="list" aria-label="Evidence with sources and dates">
        <li class="row head" aria-hidden="true"><span>Measure</span><span>Value</span><span>Source</span><span>As of</span></li>
        ${evidenceRows()}
      </ul>
    </div>
  </section>

  <section class="block" id="disclaimer" aria-labelledby="fine-h">
    <h2 id="fine-h" class="vh">Disclaimer and privacy</h2>
    <div class="wrap fine">
      <div class="disc">
        <h3>${escapeHtml(BRANDING.disclaimer)}</h3>
        <p>The tools return first-pass guidance on the EU AI Act. They do not decide how the Act applies to your system and do not replace legal counsel; consult counsel for definitive classification and compliance decisions. An article summary is not statutory text: follow the EUR-Lex link and check the official provision before you quote it.</p>
      </div>
      <div>
        <h3>Privacy</h3>
        <p>The hosted endpoint runs statelessly. It receives the tool arguments your assistant sends and the request data (IP address, time, URL, user agent), stores no tool arguments or results, sets no cookies and runs no analytics. It is hosted by Railway. Leave personal or confidential information out of what you send; a local install sends nothing to Lexbeam. This page loads nothing from other servers. <a href="${PRIVACY_URL}">Privacy policy</a></p>
      </div>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">
    <div class="who">
      <p><strong>Lexbeam Software</strong>, Werner Plutat, Düsseldorf, Germany. <a href="mailto:info@lexbeam.com">info@lexbeam.com</a></p>
      <p>EU AI Act MCP Server ${escapeHtml(SERVER_VERSION)}. Code under the MIT license. Regulation texts from EUR-Lex, © European Union.</p>
    </div>
    <nav aria-labelledby="f-product"><h2 id="f-product">Product</h2><ul role="list">
      <li><a href="${REPOSITORY_URL}">GitHub</a></li>
      <li><a href="${NPM_URL}">npm</a></li>
      <li><a href="${SMITHERY_URL}">Smithery</a></li>
      <li><a href="/llms.txt">llms.txt</a></li>
      <li><a href="/health">Status</a></li>
    </ul></nav>
    <nav aria-labelledby="f-legal"><h2 id="f-legal">Legal</h2><ul role="list">
      <li><a href="${IMPRINT_URL}" lang="de">Impressum</a></li>
      <li><a href="${PRIVACY_URL}">Privacy policy, endpoint</a></li>
      <li><a href="${DATA_PROTECTION_URL}" lang="de">Datenschutzerklärung</a></li>
      <li><a href="${TERMS_URL}" lang="de">AGB</a></li>
    </ul></nav>
  </div>
</footer>
<p id="copy-status" class="vh" role="status" aria-live="polite"></p>
<script>${script}</script>
</body>
</html>
`;
  return { html, style, script };
}

const sha256 = (text: string) => `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`;

let built: { html: string; headers: Record<string, string> } | undefined;

/** The front page and its headers, built once per process: the content depends only on the release. */
function frontPage(): { html: string; headers: Record<string, string> } {
  if (!built) {
    const { html, style, script } = buildPage();
    const policy = [
      "default-src 'none'",
      `script-src ${sha256(script)}`,
      `style-src ${sha256(style)}`,
      "font-src data:",
      "img-src data:",
      "connect-src 'self'",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
    ].join("; ");
    built = {
      html,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        "Content-Security-Policy": policy,
        "X-Content-Type-Options": "nosniff",
      },
    };
  }
  return built;
}

export function frontPageHtml(): string {
  return frontPage().html;
}

export function frontPageHeaders(): Record<string, string> {
  return { ...frontPage().headers };
}

/** The same facts as plain text, for software and agents that look a server up before connecting. */
export function llmsText(): string {
  return [
    "# Lexbeam EU AI Act MCP Server",
    "",
    "> Ten deterministic Model Context Protocol tools for the EU AI Act, Regulation (EU) 2024/1689 as amended by Regulation (EU) 2026/1744: classification, obligations, deadlines, penalties, article summaries with EUR-Lex links and one bounded system assessment, with article references. No LLM in the loop. Free hosted endpoint, no key, no account. Open source under the MIT license.",
    "",
    `${BRANDING.disclaimer} Always consult legal counsel for definitive classification and compliance decisions.`,
    "",
    "## Connect",
    "",
    `- MCP endpoint: ${ENDPOINT_URL} (Streamable HTTP, POST, no authentication)`,
    `- Claude: ${DIRECTORY_URL} (connectors directory; no Lexbeam account, no API key)`,
    `- Local install: ${INSTALL_COMMAND} (Node.js 20 or later; nothing reaches Lexbeam)`,
    `- Status: ${SITE_URL}health`,
    "- A first call: euaiact_check_deadlines with {} returns the next milestone and the days left.",
    "",
    "## Tools",
    "",
    ...TOOLS.map((tool) => `- ${tool.name}: ${plain(tool.returns).replace(/`/g, "")} Rests on: ${tool.restsOn}.`),
    "",
    "## How to call",
    "",
    "- Derive the structured signals from the description and pass them with it: the result is decided on the signals, while free text alone is only matched against keywords.",
    "- Annex III regulates listed uses, not sectors: set signals.domain only when the system itself performs a use listed there.",
    "- Every tool rejects arguments its schema does not name.",
    "- Sparse input fails closed: classification answers insufficient_information and names the facts that are missing.",
    "",
    "## Resources and prompts",
    "",
    "- Resources: euaiact://timeline, euaiact://risk-levels, euaiact://annex/iii, euaiact://annex/iv, euaiact://omnibus, euaiact://standards",
    "- Prompts: classify-my-system, compliance-checklist, penalty-risk-assessment, ground-citation",
    "",
    "## Evidence",
    "",
    ...EVIDENCE.map((row) => `- ${row.measure}: ${row.figure ? `${row.figure} ` : ""}${row.value}. Source: ${row.source}, as of ${row.asOf}.`),
    `- Source code: ${REPOSITORY_URL}`,
    `- npm: ${NPM_URL}`,
    "",
    "## Price",
    "",
    `- ${PRICE.label}: ${PRICE.currency} ${PRICE.amount}, ${PRICE.access.toLowerCase()}.`,
    "",
    "## Privacy and legal",
    "",
    "- The hosted endpoint runs statelessly: it receives the tool arguments and the request data (IP address, time, URL, user agent), stores no tool arguments or results, sets no cookies and runs no analytics. It is hosted by Railway.",
    `- Privacy policy: ${PRIVACY_URL}`,
    `- Imprint: ${IMPRINT_URL}`,
    "",
    `Version ${SERVER_VERSION}. Documentation: ${SITE_URL}`,
    "",
  ].join("\n");
}
