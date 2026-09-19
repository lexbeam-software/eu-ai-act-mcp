#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const FIXTURE_ROOT = join(REPO_ROOT, "tests", "fixtures", "assess-system");
const GOLDEN_ROOT = join(REPO_ROOT, "tests", "golden");
const PACKAGE_NAME = "@lexbeam-software/eu-ai-act-mcp";

function parseArguments(argv) {
  if (argv.length !== 2 || argv[0] !== "--install-root") {
    throw new Error("Usage: check-packed-goldens.mjs --install-root <path>");
  }
  return { installRoot: resolve(argv[1]) };
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function canonicalize(value) {
  if (value === null || typeof value !== "object") {
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new TypeError("Canonical JSON cannot contain non-finite numbers");
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}

function canonicalResponseHash(response) {
  // Kept in step with deterministicResponseProjection in src/utils/canonical-json.ts.
  const { runtime_metadata: _runtimeMetadata, server_version: _serverVersion, ...stable } = response;
  return createHash("sha256").update(canonicalize(stable), "utf8").digest("hex");
}

const { installRoot } = parseArguments(process.argv.slice(2));
const packageRoot = join(installRoot, "node_modules", "@lexbeam-software", "eu-ai-act-mcp");
const sdkRoot = join(installRoot, "node_modules", "@modelcontextprotocol", "sdk", "dist", "esm");
const packageMetadata = readJson(join(packageRoot, "package.json"));
if (packageMetadata.name !== PACKAGE_NAME) {
  throw new Error(`Installed package identity is ${packageMetadata.name}, expected ${PACKAGE_NAME}`);
}

const { Client } = await import(pathToFileURL(join(sdkRoot, "client", "index.js")).href);
const { StdioClientTransport } = await import(
  pathToFileURL(join(sdkRoot, "client", "stdio.js")).href
);

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [join(packageRoot, packageMetadata.main)],
  cwd: packageRoot,
  stderr: "pipe",
});
let serverStderr = "";
transport.stderr?.on("data", (chunk) => {
  serverStderr += chunk.toString("utf8");
});
const client = new Client({ name: "lexbeam-release-verifier", version: "1.0.0" });

const fixtures = readJson(join(FIXTURE_ROOT, "fixture-index.json"));
const expectedByCase = new Map(
  readJson(join(GOLDEN_ROOT, "hashes.json")).goldens
    .map((entry) => [entry.case_id, entry.canonical_sha256]),
);
if (fixtures.cases.length !== 12 || expectedByCase.size !== 12) {
  throw new Error("Packed black-box verification requires exactly 12 golden profiles");
}

try {
  await client.connect(transport);
  const serverVersion = client.getServerVersion();
  if (serverVersion?.version !== packageMetadata.version) {
    throw new Error(
      `Packed server announced ${serverVersion?.version}, package contains ${packageMetadata.version}`,
    );
  }
  const tools = await client.listTools();
  if (!tools.tools.some((tool) => tool.name === "euaiact_assess_system")) {
    throw new Error("Packed server does not expose euaiact_assess_system");
  }

  for (const fixture of fixtures.cases) {
    const profile = readJson(join(FIXTURE_ROOT, fixture.profile));
    const response = await client.callTool({
      name: "euaiact_assess_system",
      arguments: profile,
    });
    if (response.isError || !response.structuredContent) {
      throw new Error(`${fixture.case_id} returned an MCP tool error`);
    }
    const actual = canonicalResponseHash(response.structuredContent);
    const expected = expectedByCase.get(fixture.case_id);
    if (actual !== expected) {
      throw new Error(`${fixture.case_id} produced ${actual}, expected ${expected}`);
    }
  }
} catch (error) {
  if (serverStderr.trim()) error.message += `\nPacked server stderr:\n${serverStderr.trim()}`;
  throw error;
} finally {
  await client.close();
}

console.log(
  `12 packed MCP profiles matched canonical hashes over stdio at version ${packageMetadata.version}`,
);
