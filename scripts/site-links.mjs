// Finds every lexbeam.com URL a set of files can emit, in both spellings the source uses:
// a literal "https://lexbeam.com/..." and a template built on BRANDING.baseUrl. Shared by
// the offline allowlist test in test.mjs and the network gate in check-links.mjs, so the
// two cannot drift apart on what counts as a link.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

export const SITE_ORIGIN = "https://lexbeam.com";

const LITERAL = /https?:\/\/(?:www\.)?lexbeam\.com[^\s"'`<>()[\]{},\\]*/g;
const FROM_BASE_URL = /\$\{BRANDING\.baseUrl\}([^\s"'`<>()[\]{},\\$]*)/g;

function normalize(url) {
  return url.replace(/[.;:!?]+$/, "").replace(/\/$/, "");
}

export function siteUrlsInText(text) {
  const urls = new Set();
  for (const match of text.matchAll(LITERAL)) urls.add(normalize(match[0]));
  for (const match of text.matchAll(FROM_BASE_URL)) urls.add(normalize(`${SITE_ORIGIN}${match[1]}`));
  return urls;
}

/** `targets` are files or directories; directories are walked for the given extensions. */
export function collectSiteUrls(targets, extensions) {
  const found = new Map();
  const visit = (path) => {
    if (statSync(path).isDirectory()) {
      for (const entry of readdirSync(path)) visit(join(path, entry));
      return;
    }
    if (extensions && !extensions.includes(extname(path))) return;
    for (const url of siteUrlsInText(readFileSync(path, "utf8"))) {
      if (!found.has(url)) found.set(url, []);
      found.get(url).push(path);
    }
  };
  for (const target of targets) visit(target);
  return found;
}
