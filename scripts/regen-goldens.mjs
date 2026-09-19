#!/usr/bin/env node

// Regenerates the twelve golden contract responses and tests/golden/hashes.json from the
// built server. It is a guarded tool, not a convenience: by default it refuses to write when
// a response differs from its committed golden in anything the pinned hash speaks for, and
// prints the differing paths instead. A real contract change is a reviewed decision; pass
// --allow-content-changes once the printed differences are the intended ones.
//
//   npm run build && node scripts/regen-goldens.mjs [--allow-content-changes]

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { registerAssessSystemTool } from "../dist/tools/assess-system.js";
import {
  canonicalResponseHash,
  canonicalize,
  deterministicResponseProjection,
} from "../dist/utils/canonical-json.js";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const FIXTURE_ROOT = join(REPO_ROOT, "tests", "fixtures", "assess-system");
const GOLDEN_ROOT = join(REPO_ROOT, "tests", "golden");
const allowContentChanges = process.argv.includes("--allow-content-changes");

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

let handler;
registerAssessSystemTool({
  registerTool(name, _metadata, candidate) {
    if (name === "euaiact_assess_system") handler = candidate;
  },
});
if (!handler) throw new Error("euaiact_assess_system did not register a handler");

function flatten(value, prefix = "", out = new Map()) {
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) flatten(child, `${prefix}/${key}`, out);
  } else {
    out.set(prefix, value);
  }
  return out;
}

const index = readJson(join(FIXTURE_ROOT, "fixture-index.json"));
const hashesFile = readJson(join(GOLDEN_ROOT, "hashes.json"));
if (index.cases.length !== 12) throw new Error("Expected exactly 12 contract profiles");

const rebuilt = [];
let contentChanges = 0;
for (const fixture of index.cases) {
  const profile = readJson(join(FIXTURE_ROOT, fixture.profile));
  const first = (await handler(profile)).structuredContent;
  const second = (await handler(profile)).structuredContent;
  const hash = canonicalResponseHash(first);
  if (hash !== canonicalResponseHash(second)) {
    throw new Error(`${fixture.case_id} is not deterministic; refusing to pin`);
  }

  const committed = flatten(deterministicResponseProjection(readJson(join(GOLDEN_ROOT, fixture.golden))));
  const current = flatten(deterministicResponseProjection(first));
  const changed = [...new Set([...committed.keys(), ...current.keys()])]
    .filter((path) => committed.get(path) !== current.get(path));
  if (changed.length > 0) {
    contentChanges += 1;
    console.log(`${fixture.case_id}: ${changed.length} pinned value(s) differ`);
    for (const path of changed.slice(0, 12)) {
      console.log(`    ${path}\n      - ${JSON.stringify(committed.get(path))}\n      + ${JSON.stringify(current.get(path))}`);
    }
  }
  rebuilt.push({ fixture, response: first, hash });
}

if (contentChanges > 0 && !allowContentChanges) {
  console.error(`\n${contentChanges} golden response(s) changed in pinned content. Nothing was written.`);
  console.error("Review the differences above, then rerun with --allow-content-changes.");
  process.exit(1);
}

for (const { fixture, response } of rebuilt) {
  writeFileSync(join(GOLDEN_ROOT, fixture.golden), `${JSON.stringify(response, null, 2)}\n`);
}
hashesFile.volatile_paths_removed = [
  "/runtime_metadata/generated_at",
  "/runtime_metadata/correlation_id",
  "/runtime_metadata/duration_ms",
  "/server_version",
];
hashesFile.goldens = rebuilt.map(({ fixture, response, hash }) => ({
  case_id: fixture.case_id,
  profile: fixture.profile,
  golden: fixture.golden,
  canonical_sha256: hash,
  // The byte count describes the same string the hash does.
  canonical_bytes: Buffer.byteLength(canonicalize(deterministicResponseProjection(response)), "utf8"),
}));
writeFileSync(join(GOLDEN_ROOT, "hashes.json"), `${JSON.stringify(hashesFile, null, 2)}\n`);
console.log(`Wrote 12 goldens and hashes.json (${contentChanges} with reviewed content changes).`);
