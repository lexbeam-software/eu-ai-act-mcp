#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const packageVersion = JSON.parse(
  readFileSync(join(REPO_ROOT, "package.json"), "utf8"),
).version;
// 1.5.1 shipped with package-lock.json still at 1.5.0: npm ci does not mind, and nothing
// else looked. Every file that states the version is compared here.
const lock = JSON.parse(readFileSync(join(REPO_ROOT, "package-lock.json"), "utf8"));
const smitheryVersion = readFileSync(join(REPO_ROOT, "smithery.yaml"), "utf8")
  .match(/^version:\s*(\S+)\s*$/m)?.[1];
if (!smitheryVersion) throw new Error("smithery.yaml states no version");
const changelog = readFileSync(join(REPO_ROOT, "CHANGELOG.md"), "utf8");
const changelogVersion = changelog.match(/^## \[(\d+\.\d+\.\d+)\](?: - .+)?$/m)?.[1];
if (!changelogVersion) throw new Error("CHANGELOG.md has no released head entry");

const constantsUrl = pathToFileURL(join(REPO_ROOT, "dist", "constants.js"));
constantsUrl.searchParams.set("verify", String(Date.now()));
const { SERVER_VERSION } = await import(constantsUrl.href);

const values = {
  "package.json": packageVersion,
  "package-lock.json": lock.version,
  "package-lock.json root package": lock.packages?.[""]?.version,
  "smithery.yaml": smitheryVersion,
  SERVER_VERSION,
  "CHANGELOG head": changelogVersion,
};
if (new Set(Object.values(values)).size !== 1) {
  throw new Error(`Version identity mismatch: ${JSON.stringify(values)}`);
}

console.log(
  `${packageVersion} matches package.json, package-lock.json, smithery.yaml, SERVER_VERSION, and CHANGELOG head`,
);
