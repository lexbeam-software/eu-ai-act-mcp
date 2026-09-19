#!/usr/bin/env node

// Release gate: every lexbeam.com URL this package publishes must resolve. Covers the
// compiled server (what a caller receives), the package metadata and README, and the
// allowlist the offline suite trusts. Needs the network, so it belongs to
// verify-release.mjs and never to the canonical offline verify.
//
// Out of scope on purpose: CHANGELOG.md, which quotes retired URLs as history, and
// third-party hosts such as EUR-Lex, which answer scripted requests with a challenge
// page rather than a status that says anything about the link.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { collectSiteUrls } from "./site-links.mjs";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ATTEMPTS = 3;
const TIMEOUT_MS = 20_000;

const dist = join(REPO_ROOT, "dist");
if (!existsSync(dist)) throw new Error("dist/ is missing; build before checking links");

const published = ["README.md", "package.json", "smithery.yaml", "server.json"]
  .map((name) => join(REPO_ROOT, name))
  .filter(existsSync);
const found = collectSiteUrls([dist], [".js"]);
for (const [url, files] of collectSiteUrls(published)) {
  found.set(url, [...(found.get(url) ?? []), ...files]);
}
const allowlist = JSON.parse(
  readFileSync(join(REPO_ROOT, "tests", "fixtures", "site", "known-live-urls.json"), "utf8"),
);
for (const url of allowlist.urls) {
  found.set(url, [...(found.get(url) ?? []), "tests/fixtures/site/known-live-urls.json"]);
}

async function statusOf(url) {
  let lastError;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "user-agent": "lexbeam-eu-ai-act-mcp-link-check" },
      });
      if (response.status < 500) return { status: response.status, finalUrl: response.url };
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
  }
  return { status: 0, finalUrl: url, error: lastError?.message ?? "request failed" };
}

const urls = [...found.keys()].sort();
const results = await Promise.all(urls.map(async (url) => ({ url, ...(await statusOf(url)) })));
const dead = results.filter((result) => result.status !== 200);

for (const result of results) {
  console.log(`${result.status === 200 ? "ok  " : "DEAD"} ${result.status || "ERR"} ${result.url}`);
}
if (dead.length > 0) {
  for (const result of dead) {
    const sources = [...new Set(found.get(result.url))]
      .map((path) => (path.startsWith(REPO_ROOT) ? relative(REPO_ROOT, path) : path))
      .slice(0, 4);
    console.error(`  ${result.url} -> ${result.error ?? `HTTP ${result.status}`} (in ${sources.join(", ")})`);
  }
  throw new Error(`${dead.length} of ${results.length} lexbeam.com URLs do not resolve`);
}
console.log(`${results.length} lexbeam.com URLs resolve`);
