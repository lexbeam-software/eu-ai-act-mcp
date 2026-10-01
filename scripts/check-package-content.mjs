#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const NPM = process.platform === "win32" ? "npm.cmd" : "npm";
const packageMetadata = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8"));

const result = spawnSync(NPM, ["pack", "--dry-run", "--json", "--ignore-scripts"], {
  cwd: REPO_ROOT,
  env: process.env,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
  windowsHide: true,
});
if (result.error) throw result.error;
if (result.status !== 0) {
  throw new Error([result.stdout, result.stderr].filter(Boolean).join("\n"));
}

let pack;
try {
  const payload = JSON.parse(result.stdout);
  if (!Array.isArray(payload) || payload.length !== 1) {
    throw new Error("npm pack must describe exactly one package");
  }
  [pack] = payload;
} catch (error) {
  throw new Error(`Could not parse npm pack dry-run output: ${error.message}`);
}

if (pack.name !== packageMetadata.name || pack.version !== packageMetadata.version) {
  throw new Error(`npm pack identity ${pack.name}@${pack.version} does not match package.json`);
}

const files = pack.files.map((entry) => entry.path.replaceAll("\\", "/"));
const fileSet = new Set(files);
const required = [
  "package.json",
  "examples/assessment-minimal.json",
  packageMetadata.main,
  packageMetadata.types,
  ...Object.values(packageMetadata.bin ?? {}),
];
for (const path of required) {
  if (!fileSet.has(path)) throw new Error(`Packed package is missing required file ${path}`);
}
if (!files.some((path) => path.startsWith("dist/"))) {
  throw new Error("Packed package contains no dist files");
}

const allowedStaticFiles = new Set(["LICENSE", "README.md", "package.json", "examples/assessment-minimal.json"]);
for (const path of files) {
  if (/(^|\/)\.env(?:\.|$)/i.test(path)) {
    throw new Error(`Packed package contains environment file ${path}`);
  }
  if (/holdout/i.test(path)) {
    throw new Error(`Packed package contains holdout path ${path}`);
  }
  if (allowedStaticFiles.has(path)) {
    if (lstatSync(join(REPO_ROOT, path)).isSymbolicLink()) {
      throw new Error(`Packed package contains symlink ${path}`);
    }
    continue;
  }
  if (!path.startsWith("dist/")) {
    throw new Error(`Packed package contains stray file ${path}`);
  }
  if (!/(?:\.js|\.js\.map|\.d\.ts|\.d\.ts\.map)$/.test(path)) {
    throw new Error(`Packed dist contains unexpected file type ${path}`);
  }
  const localPath = join(REPO_ROOT, path);
  if (lstatSync(localPath).isSymbolicLink()) {
    throw new Error(`Packed package contains symlink ${path}`);
  }
}

for (const path of files) {
  const contents = readFileSync(join(REPO_ROOT, path), "utf8");
  if (/holdout/i.test(contents)) {
    throw new Error(`Packed file contains a holdout reference: ${path}`);
  }
}

console.log(`${files.length} files; dist and runnable assessment example present; allowlist, .env, and holdout checks passed`);
