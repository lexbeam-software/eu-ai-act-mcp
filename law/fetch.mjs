#!/usr/bin/env node
/**
 * law/fetch.mjs v2 - CLI for this repo's pinned legal corpus (EUR-Lex).
 *
 *   node law/fetch.mjs verify            offline gate: hashes, derivation, titles, markers
 *   node law/fetch.mjs fetch [CELEX]     re-download (all docs, or one), atomic, paced
 *   node law/fetch.mjs seal              recompute manifest.json from current files
 *   node law/fetch.mjs freshness         network monitor: FAILS CLOSED when undeterminable
 *
 * verify is the build/CI gate and needs no network. freshness is a scheduled
 * monitor, not a build step: it exits 1 when it cannot determine the newest
 * consolidation (throttle, page change) and 2 when the law has moved.
 *
 * KNOWN LIMIT: the post-validation swap renames files per document pair, not
 * atomically across the corpus; a crash mid-swap can leave a mixed state. The
 * offline `verify` (hash + derivation) detects any such partial state before
 * the corpus is used, and `seal` restores canonical txt from html.
 *
 * The corpus is an evidence snapshot of the consolidated text, which EUR-Lex
 * labels a documentation tool without legal effect; authentic OJ acts are the
 * legal authority. PINNED_CONSOLIDATED is bumped deliberately, never implicitly.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const TMP = join(DIR, ".tmp");
export const PINNED_CONSOLIDATED = "20260727";
const TOOL_VERSION = "fetch.mjs@2";
// EUR-Lex serves an empty 202 to non-browser user agents; a browser UA is required.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const PACE_MS = 10_000; // EUR-Lex throttles bursts with an empty 202
const RETRY_AFTER_MS = 30_000;

// titleMustContain pins document identity; markers pin content identity.
const DOCS = [
  {
    celex: `02024R1689-${PINNED_CONSOLIDATED}`,
    file: `celex-02024R1689-${PINNED_CONSOLIDATED}-consolidated`,
    role: "evidence snapshot: the AI Act as amended by Reg. (EU) 2026/1744 (documentation tool, no legal effect)",
    titleMustContain: ["Consolidated TEXT: 32024R1689", "27.07.2026"],
    markers: [
      ["2 December 2027", 1], // amended Art. 113(3)(c)(i)
      ["2 December 2026", 2], // Art. 111(4) legacy transition + Art. 113(3)(a)
      ["point (ba)", 1], // enacted new prohibition, NCII
      ["Annex III", 10],
      ["Article 75a", 1], // inserted AI Office powers article
    ],
  },
  {
    celex: "32026R1744",
    file: "celex-32026R1744-omnibus",
    role: "authentic amending act: Digital Omnibus on AI, OJ 2026-07-24, in force 2026-07-27",
    titleMustContain: ["L_202601744EN"],
    markers: [
      ["third day following", 1],
      ["Done at Strasbourg", 1],
    ],
  },
  {
    celex: "32024R1689",
    file: "celex-32024R1689-original",
    role: "authentic original act, superseded in parts; kept to label pre-amendment text",
    titleMustContain: ["L_202401689EN"],
    markers: [["2 August 2027", 1]],
  },
  {
    celex: "52025PC0836",
    file: "celex-52025PC0836-proposal-SUPERSEDED",
    role: "SUPERSEDED Commission proposal; source of the deleted '6 months' trigger. NOT LAW.",
    titleMustContain: ["COM%282025%29836"],
    markers: [
      ["6 months", 1],
      ["Digital Omnibus", 1],
    ],
  },
  {
    // A two-article decision is far below the 100 kB floor that catches EUR-Lex's
    // empty throttle bodies, so it carries its own floor. EUR-Lex answers curl with
    // an empty 202 for this act; the Publications Office Cellar serves the same OJ
    // manifestation (L_202602274EN.000101.fmx.xml) by CELEX content negotiation.
    celex: "32026D2274",
    file: "celex-32026D2274-harmonised-standards",
    role: "authentic implementing act: publishes the reference of EN 18286:2026 (Art. 17 quality management system), OJ 2026-10-14, in force 2026-10-14",
    url: "https://publications.europa.eu/resource/celex/32026D2274",
    headers: ["Accept: application/xhtml+xml", "Accept-Language: eng"],
    minBytes: 10_000,
    titleMustContain: ["L_202602274EN"],
    markers: [
      ["EN 18286:2026", 4], // recitals 3 to 5 and the Annex
      ["Quality management system for EU AI Act regulatory purposes", 1],
      ["Article 10(6)", 1],
      ["shall enter into force on the day of its publication", 1],
    ],
  },
];

const srcUrl = (doc) =>
  doc.url ?? `https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:${doc.celex}`;

function htmlToText(h) {
  h = h.replace(/<(script|style)[\s\S]*?<\/\1>/gi, "");
  h = h.replace(/<br\s*\/?>/gi, "\n");
  h = h.replace(/<\/(p|div|td|tr|li|h[1-6])>/gi, "\n");
  let t = h.replace(/<[^>]+>/g, " ");
  t = t
    .replace(/&#x([0-9a-f]+);/gi, (_, x) => String.fromCodePoint(parseInt(x, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;/g, "’")
    .replace(/&amp;/g, "&");
  t = t.replace(/[ \t ]+/g, " ").replace(/\n\s*\n+/g, "\n\n");
  return t;
}

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// curl transport (node fetch gets empty 200s from EUR-Lex). --fail turns HTTP
// errors into exceptions; status+type are captured on stdout, body goes to file.
function curlToFile(u, outPath, headers = []) {
  const meta = execFileSync(
    "curl",
    ["-sL", "--fail", "-A", UA, ...headers.flatMap((h) => ["-H", h]), "--max-time", "90", "-o", outPath, "-w", "%{http_code} %{content_type}", u],
    { encoding: "utf8" }
  );
  const [code, ...typeParts] = meta.trim().split(" ");
  return { code: Number(code), contentType: typeParts.join(" ") };
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1] : "";
}

// Full validation of a candidate body BEFORE it may replace corpus files.
function validateBody(doc, html) {
  const errs = [];
  const minBytes = doc.minBytes ?? 100_000;
  if (html.length < minBytes)
    errs.push(`${doc.celex}: body only ${html.length} bytes, floor ${minBytes} (EUR-Lex throttle serves empty 202s; retry later)`);
  const title = extractTitle(html);
  for (const s of doc.titleMustContain)
    if (!title.includes(s)) errs.push(`${doc.celex}: title "${title}" lacks required "${s}"`);
  const txt = htmlToText(html);
  for (const [needle, min] of doc.markers) {
    const n = txt.split(needle).length - 1;
    if (n < min) errs.push(`${doc.celex}: marker "${needle}" ${n}x < ${min}`);
  }
  return { errs, txt };
}

function readManifest() {
  const p = join(DIR, "manifest.json");
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

function buildManifest(fetchedAt = {}) {
  const prev = readManifest();
  const documents = DOCS.map((d) => {
    const html = readFileSync(join(DIR, `${d.file}.html`));
    const txt = readFileSync(join(DIR, `${d.file}.txt`));
    const prevDoc = prev?.documents?.find((x) => x.celex === d.celex);
    return {
      celex: d.celex,
      file: d.file,
      role: d.role,
      source_url: srcUrl(d),
      html_sha256: sha256(html),
      txt_sha256: sha256(txt),
      html_bytes: html.length,
      txt_bytes: txt.length,
      fetched_at: fetchedAt[d.celex] ?? prevDoc?.fetched_at ?? null,
    };
  });
  return {
    schema: 2,
    tool_version: TOOL_VERSION,
    pinned_consolidated: PINNED_CONSOLIDATED,
    sealed_at: new Date().toISOString(),
    documents,
  };
}

function writeManifests(manifest) {
  writeFileSync(join(DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  const rows = manifest.documents.map(
    (d) => `| ${d.celex} | ${d.file} | ${d.html_sha256.slice(0, 16)} | ${d.txt_sha256.slice(0, 16)} | ${d.html_bytes} / ${d.txt_bytes} |`
  );
  const md = [
    "# Legal corpus manifest (human view; manifest.json is the machine record)",
    "",
    `Pinned consolidation date: **${PINNED_CONSOLIDATED}**. Sealed: ${manifest.sealed_at}.`,
    "Commands: `verify` (offline gate), `fetch [CELEX]` (atomic re-download), `seal`, `freshness` (network monitor, fails closed).",
    "",
    "| CELEX | File | sha256(html) | sha256(txt) | bytes html/txt |",
    "|---|---|---|---|---|",
    ...rows,
    "",
    "The consolidated text is an evidence snapshot; EUR-Lex labels it a documentation tool",
    "without legal effect. Authentic OJ acts are the legal authority.",
    "",
    "Reuse of EUR-Lex content is permitted subject to the applicable EUR-Lex and Commission",
    "reuse conditions (Commission Decision 2011/833/EU): preserve attribution and do not",
    "distort the meaning of the source.",
  ].join("\n");
  writeFileSync(join(DIR, "MANIFEST.md"), md);
}

// verify: hashes vs manifest, txt re-derived from html, titles, markers. Offline.
function verify() {
  const manifest = readManifest();
  const errs = [];
  if (!manifest) errs.push("manifest.json missing; run: node law/fetch.mjs seal");
  if (manifest && manifest.pinned_consolidated !== PINNED_CONSOLIDATED)
    errs.push(`manifest pinned ${manifest.pinned_consolidated} != code ${PINNED_CONSOLIDATED}`);
  for (const d of DOCS) {
    const hp = join(DIR, `${d.file}.html`);
    const tp = join(DIR, `${d.file}.txt`);
    if (!existsSync(hp) || !existsSync(tp)) {
      errs.push(`${d.celex}: file(s) missing`);
      continue;
    }
    const html = readFileSync(hp, "utf8");
    const txt = readFileSync(tp, "utf8");
    const m = manifest?.documents?.find((x) => x.celex === d.celex);
    if (!m) errs.push(`${d.celex}: not in manifest.json`);
    if (m && sha256(html) !== m.html_sha256) errs.push(`${d.celex}: html sha256 mismatch vs manifest`);
    if (m && sha256(txt) !== m.txt_sha256) errs.push(`${d.celex}: txt sha256 mismatch vs manifest`);
    if (sha256(htmlToText(html)) !== sha256(txt))
      errs.push(`${d.celex}: txt is not the derivation of html (regenerate with seal)`);
    const { errs: bodyErrs } = validateBody(d, html);
    errs.push(...bodyErrs);
  }
  return errs;
}

async function fetchDocs(targets) {
  mkdirSync(TMP, { recursive: true });
  const staged = [];
  const fetchedAt = {};
  try {
    for (let i = 0; i < targets.length; i++) {
      const d = targets[i];
      const tmpHtml = join(TMP, `${d.file}.html`);
      let attempt = 0;
      for (;;) {
        attempt++;
        try {
          const { code, contentType } = curlToFile(srcUrl(d), tmpHtml, d.headers);
          if (!/html|xml/.test(contentType))
            throw new Error(`${d.celex}: unexpected content-type "${contentType}"`);
          const html = readFileSync(tmpHtml, "utf8");
          const { errs, txt } = validateBody(d, html);
          if (errs.length) throw new Error(errs.join("; "));
          writeFileSync(join(TMP, `${d.file}.txt`), txt);
          staged.push(d);
          fetchedAt[d.celex] = new Date().toISOString();
          console.log(`fetched ${d.celex} (http ${code})`);
          break;
        } catch (e) {
          if (attempt >= 2) throw e;
          console.log(`retrying ${d.celex} in ${RETRY_AFTER_MS / 1000}s: ${e.message}`);
          await sleep(RETRY_AFTER_MS);
        }
      }
      if (i < targets.length - 1) await sleep(PACE_MS);
    }
    // All targets validated: swap into place together, then reseal.
    for (const d of staged) {
      renameSync(join(TMP, `${d.file}.html`), join(DIR, `${d.file}.html`));
      renameSync(join(TMP, `${d.file}.txt`), join(DIR, `${d.file}.txt`));
    }
    writeManifests(buildManifest(fetchedAt));
  } finally {
    rmSync(TMP, { recursive: true, force: true });
  }
}

async function freshness() {
  let page;
  try {
    const tmp = join(DIR, ".freshness.html");
    curlToFile("https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX:32024R1689", tmp);
    page = readFileSync(tmp, "utf8");
    rmSync(tmp, { force: true });
  } catch (e) {
    console.error(`freshness: UNDETERMINED - could not query EUR-Lex (${e.message}). Retry later; do not treat as fresh.`);
    return 1;
  }
  const dates = [...page.matchAll(/02024R1689-(\d{8})/g)].map((m) => m[1]);
  if (!dates.length) {
    console.error("freshness: UNDETERMINED - no consolidated-version references found (throttle or page change). Do not treat as fresh.");
    return 1;
  }
  const newest = dates.sort().at(-1);
  if (newest > PINNED_CONSOLIDATED) {
    console.error(`freshness: LAW MOVED - newer consolidated version ${newest} exists (pinned ${PINNED_CONSOLIDATED}).`);
    return 2;
  }
  console.log(`freshness: pinned ${PINNED_CONSOLIDATED} is the newest consolidated version (${dates.length} refs seen).`);
  return 0;
}

const cmd = process.argv[2] ?? "verify";
const only = process.argv[3];
if (cmd === "verify") {
  const errs = verify();
  if (errs.length) {
    console.error(errs.join("\n"));
    process.exit(1);
  }
  console.log(`corpus verified: ${DOCS.length} documents (hashes, derivation, titles, markers)`);
} else if (cmd === "fetch") {
  const targets = only ? DOCS.filter((d) => d.celex === only) : DOCS;
  if (!targets.length) {
    console.error(`unknown celex: ${only}`);
    process.exit(2);
  }
  await fetchDocs(targets);
  const errs = verify();
  if (errs.length) {
    console.error(errs.join("\n"));
    process.exit(1);
  }
  console.log("corpus verified after fetch");
} else if (cmd === "seal") {
  // Migration/restore path: trusts current html, regenerates txt, validates, seals.
  for (const d of DOCS) {
    const html = readFileSync(join(DIR, `${d.file}.html`), "utf8");
    const { errs, txt } = validateBody(d, html);
    if (errs.length) {
      console.error(errs.join("\n"));
      process.exit(1);
    }
    writeFileSync(join(DIR, `${d.file}.txt`), txt);
  }
  writeManifests(buildManifest());
  console.log("sealed: txt regenerated from html, manifest.json + MANIFEST.md written");
} else if (cmd === "freshness") {
  process.exit(await freshness());
} else {
  console.error(`unknown command: ${cmd} (use verify | fetch [CELEX] | seal | freshness)`);
  process.exit(2);
}
