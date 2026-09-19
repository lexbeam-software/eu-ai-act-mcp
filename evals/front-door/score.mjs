#!/usr/bin/env node

// Scores a recording of agent calls against the front-door corpus. Deterministic and
// offline: the recording holds the arguments an agent model passed on its first call for
// each description, this script feeds them to the built classifier and counts.
//
//   npm run build && node evals/front-door/score.mjs evals/front-door/agent-args-<label>.json
//
// A call whose arguments the input schema rejects is counted as such and as not recognised,
// which is what an MCP client would make of it.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { registerClassifyTool } from "../../dist/tools/classify.js";
import { classifyInputSchema } from "../../dist/schemas/classify.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const corpus = JSON.parse(readFileSync(join(HERE, "corpus.json"), "utf8")).items;
const recordingPath = process.argv[2];
if (!recordingPath) throw new Error("usage: score.mjs <agent-args.json> [--json]");
const recording = JSON.parse(readFileSync(recordingPath, "utf8"));

let handler;
registerClassifyTool({ registerTool: (_name, _config, candidate) => { handler = candidate; } });

function expected(label) {
  if (label.startsWith("annex_iii_")) return { risk: "high-risk", number: Number(label.split("_")[2]) };
  if (label.startsWith("art5_")) return { risk: "prohibited" };
  if (label.startsWith("art50_")) return { risk: "limited" };
  return { risk: "none" };
}

const rows = [];
for (const item of corpus) {
  const args = recording[item.id];
  const want = expected(item.label);
  const row = { id: item.id, set: item.set, label: item.label, regulated: want.risk !== "none" };
  if (!args) { rows.push({ ...row, outcome: "not_recorded" }); continue; }
  const signalCount = Object.keys(args.signals ?? {}).length;
  const parsed = classifyInputSchema.safeParse(args);
  if (!parsed.success) { rows.push({ ...row, outcome: "invalid_call", signalCount }); continue; }
  const result = (await handler(parsed.data)).structuredContent;
  const isRegulated = result.risk_classification === "high-risk" || result.risk_classification === "prohibited";
  const correct = want.risk === "none"
    ? !isRegulated
    : result.risk_classification === want.risk &&
      (want.number === undefined || result.annex_iii_category?.number === want.number);
  rows.push({
    ...row, signalCount, basis: result.basis, got: result.risk_classification,
    category: result.annex_iii_category?.number ?? null,
    outcome: correct ? "correct" : want.risk === "none" ? "false_positive" : isRegulated || result.risk_classification === "limited" ? "wrong_tier" : "abstained",
  });
}

const count = (filter) => rows.filter(filter).length;
const summary = {
  recording: recordingPath,
  calls: count((r) => r.outcome !== "not_recorded"),
  calls_with_signals: count((r) => (r.signalCount ?? 0) > 0),
  invalid_calls: count((r) => r.outcome === "invalid_call"),
  regulated: { total: count((r) => r.regulated), recognised: count((r) => r.regulated && r.outcome === "correct"),
    wrong_tier: count((r) => r.outcome === "wrong_tier"), abstained: count((r) => r.outcome === "abstained") },
  hard_negatives: { total: count((r) => !r.regulated), wrongly_regulated: count((r) => r.outcome === "false_positive") },
  by_set: Object.fromEntries(["s1", "s2", "s3", "s4"].map((set) => [set, {
    recognised: count((r) => r.set === set && r.regulated && r.outcome === "correct"),
    of: count((r) => r.set === set && r.regulated),
    wrongly_regulated: count((r) => r.set === set && r.outcome === "false_positive"),
  }])),
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ summary, rows }, null, 1));
} else {
  console.log(JSON.stringify(summary, null, 1));
  for (const row of rows.filter((r) => r.outcome === "false_positive")) {
    console.log(`FALSE POSITIVE ${row.id}: ${row.got}${row.category ? `/${row.category}` : ""} (basis ${row.basis})`);
  }
}
