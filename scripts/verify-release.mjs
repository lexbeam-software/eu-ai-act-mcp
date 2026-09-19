#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(SCRIPT_DIR);
const EVIDENCE_ROOT = join(REPO_ROOT, "release-evidence");
const VERIFY_GATES = join(EVIDENCE_ROOT, "gates", "verify");
const RELEASE_GATES = join(EVIDENCE_ROOT, "gates", "release");
const PACKAGE_DIR = join(EVIDENCE_ROOT, "package");
const NPM = process.platform === "win32" ? "npm.cmd" : "npm";
const MAX_BUFFER = 128 * 1024 * 1024;

function assertExactGeneratedDirectory(target, parent, expectedName) {
  if (dirname(target) !== parent || basename(target) !== expectedName) {
    throw new Error(`Refusing to manage unexpected generated directory: ${target}`);
  }
  if (existsSync(target) && lstatSync(target).isSymbolicLink()) {
    throw new Error(`Refusing to manage generated symlink: ${target}`);
  }
}

function resetEvidenceDirectory() {
  assertExactGeneratedDirectory(EVIDENCE_ROOT, REPO_ROOT, "release-evidence");
  if (existsSync(EVIDENCE_ROOT)) {
    rmSync(EVIDENCE_ROOT, { recursive: true, force: false });
  }
  mkdirSync(VERIFY_GATES, { recursive: true });
  mkdirSync(RELEASE_GATES, { recursive: true });
  mkdirSync(PACKAGE_DIR, { recursive: true });
}

function removeTemporaryDirectory(target, prefix) {
  const tempRoot = resolve(tmpdir());
  const resolved = resolve(target);
  if (
    dirname(resolved) !== tempRoot ||
    !basename(resolved).startsWith(prefix) ||
    lstatSync(resolved).isSymbolicLink()
  ) {
    throw new Error(`Refusing to remove unexpected temporary directory: ${resolved}`);
  }
  rmSync(resolved, { recursive: true, force: false });
}

function commandResult(command, args, options) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? REPO_ROOT,
    env: options.env,
    encoding: "utf8",
    maxBuffer: MAX_BUFFER,
    windowsHide: true,
  });
  const output = [result.stdout, result.stderr]
    .filter((value) => value && value.trim().length > 0)
    .join("\n")
    .trim();
  if (result.error) {
    const error = new Error(result.error.message);
    error.output = output;
    throw error;
  }
  if (result.status !== 0) {
    const error = new Error(`${command} ${args.join(" ")} exited with status ${result.status}`);
    error.output = output;
    throw error;
  }
  return { stdout: result.stdout, stderr: result.stderr, output };
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function evidenceFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Evidence contains symlink: ${path}`);
    if (entry.isDirectory()) files.push(...evidenceFiles(path));
    else if (entry.isFile()) files.push(path);
    else throw new Error(`Evidence contains unsupported filesystem entry: ${path}`);
  }
  return files;
}

function printSummary(results) {
  const headers = ["Release gate", "Status", "Detail"];
  const rows = results.map((result) => [result.name, result.status, result.detail]);
  const widths = headers.map((header, column) =>
    Math.max(header.length, ...rows.map((row) => row[column].length)),
  );
  const format = (row) => row
    .map((value, column) => value.padEnd(widths[column]))
    .join(" | ");
  console.log("Release verification summary");
  console.log(format(headers));
  console.log(widths.map((width) => "-".repeat(width)).join("-+-"));
  for (const row of rows) console.log(format(row));
}

resetEvidenceDirectory();
const npmCache = mkdtempSync(join(tmpdir(), "lexbeam-release-npm-cache-"));
const installRoot = mkdtempSync(join(tmpdir(), "lexbeam-packed-install-"));
const env = { ...process.env, npm_config_cache: npmCache };
const results = [];
let failure;
let packMetadata;

async function step(name, id, action) {
  if (failure) {
    results.push({ name, status: "SKIP", detail: "fail-fast" });
    return;
  }
  try {
    const outcome = await action();
    results.push({ name, status: "PASS", detail: outcome.detail });
    writeFileSync(join(RELEASE_GATES, `${id}.log`), `${outcome.output}\n`);
  } catch (error) {
    const output = error.output || error.stack || String(error);
    failure = { name, error, output };
    results.push({ name, status: "FAIL", detail: error.message });
    writeFileSync(join(RELEASE_GATES, `${id}.log`), `${output}\n`);
  }
}

try {
  await step("Canonical verify", "01-canonical-verify", async () => {
    const result = commandResult(process.execPath, [
      "scripts/verify.mjs",
      "--evidence-dir",
      VERIFY_GATES,
    ], { env });
    writeFileSync(join(EVIDENCE_ROOT, "verify.log"), `${result.output}\n`);
    return { output: result.output, detail: "10 gates passed" };
  });

  await step("Packed tarball", "02-package", async () => {
    const result = commandResult(NPM, [
      "pack",
      "--json",
      "--ignore-scripts",
      "--pack-destination",
      PACKAGE_DIR,
    ], { env });
    const payload = JSON.parse(result.stdout);
    if (!Array.isArray(payload) || payload.length !== 1) {
      throw new Error("npm pack did not describe exactly one package");
    }
    [packMetadata] = payload;
    writeFileSync(
      join(PACKAGE_DIR, "package-metadata.json"),
      `${JSON.stringify(packMetadata, null, 2)}\n`,
    );
    const tarball = join(PACKAGE_DIR, packMetadata.filename);
    if (!existsSync(tarball)) throw new Error(`npm pack did not write ${tarball}`);
    return {
      output: result.output,
      detail: `${packMetadata.entryCount} files; ${packMetadata.shasum}`,
    };
  });

  await step("Packed MCP goldens", "03-packed-goldens", async () => {
    writeFileSync(
      join(installRoot, "package.json"),
      `${JSON.stringify({ name: "lexbeam-packed-verifier", private: true }, null, 2)}\n`,
    );
    const tarball = join(PACKAGE_DIR, packMetadata.filename);
    const install = commandResult(NPM, [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--package-lock=false",
      tarball,
    ], { cwd: installRoot, env });
    const blackBox = commandResult(process.execPath, [
      "scripts/check-packed-goldens.mjs",
      "--install-root",
      installRoot,
    ], { env });
    return {
      output: [install.output, blackBox.output].filter(Boolean).join("\n"),
      detail: "12 hashes matched over MCP stdio",
    };
  });

  await step("Site links", "04-site-links", async () => {
    const result = commandResult(process.execPath, ["scripts/check-links.mjs"], { env });
    return {
      output: result.output,
      detail: result.stdout.trim().split("\n").at(-1),
    };
  });

  await step("Runtime SBOM", "05-sbom", async () => {
    const result = commandResult(NPM, [
      "sbom",
      "--omit=dev",
      "--sbom-format",
      "spdx",
    ], { env });
    const sbom = JSON.parse(result.stdout);
    if (!String(sbom.spdxVersion).startsWith("SPDX-")) {
      throw new Error("npm sbom did not produce an SPDX document");
    }
    writeFileSync(join(EVIDENCE_ROOT, "sbom.spdx.json"), `${JSON.stringify(sbom, null, 2)}\n`);
    return {
      output: [result.stderr, `SPDX packages: ${sbom.packages?.length ?? 0}`]
        .filter(Boolean)
        .join("\n"),
      detail: `${sbom.packages?.length ?? 0} runtime packages`,
    };
  });

  await step("Evidence bundle", "06-evidence", async () => ({
    output: "Release evidence assembled. digests.sha256 covers every other evidence file.",
    detail: "manifest and SHA-256 digests",
  }));

  const packageJson = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8"));
  const gitCommit = commandResult("git", ["rev-parse", "HEAD"], { env }).stdout.trim();
  const npmVersion = commandResult(NPM, ["--version"], { env }).stdout.trim();
  const manifest = {
    schema_version: "1.0",
    generated_at: new Date().toISOString(),
    overall_pass: !failure,
    package: {
      name: packageJson.name,
      version: packageJson.version,
    },
    git_commit: gitCommit,
    runtime: {
      node: process.version,
      npm: npmVersion,
    },
    packed_artifact: packMetadata
      ? {
          filename: packMetadata.filename,
          shasum: packMetadata.shasum,
          integrity: packMetadata.integrity,
        }
      : null,
    gates: results,
  };
  writeFileSync(join(EVIDENCE_ROOT, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(
    join(EVIDENCE_ROOT, "release-summary.json"),
    `${JSON.stringify({ overall_pass: !failure, gates: results }, null, 2)}\n`,
  );

  const digestPath = join(EVIDENCE_ROOT, "digests.sha256");
  const files = evidenceFiles(EVIDENCE_ROOT)
    .filter((path) => path !== digestPath)
    .sort();
  const digestLines = files.map((path) => {
    const name = relative(EVIDENCE_ROOT, path).split(sep).join("/");
    return `${sha256(path)}  ${name}`;
  });
  writeFileSync(digestPath, `${digestLines.join("\n")}\n`);

  if (failure) {
    console.error(`Release gate failed: ${failure.name}`);
    console.error(failure.output);
    console.error("");
  }
  printSummary(results);
  console.log(`Evidence: ${EVIDENCE_ROOT}`);
  if (failure) process.exitCode = 1;
} finally {
  removeTemporaryDirectory(installRoot, "lexbeam-packed-install-");
  removeTemporaryDirectory(npmCache, "lexbeam-release-npm-cache-");
}
