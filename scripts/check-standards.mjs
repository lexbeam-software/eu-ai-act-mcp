#!/usr/bin/env node

// Network check behind the weekly "Harmonised standards" workflow: asks the Official Journal,
// through the Publications Office Cellar, whether an act appeared that euaiact://standards does
// not reflect yet. Needs dist/ (npm run build) for the cited standards and STANDARDS_REVIEWED_ON.
//
//   node scripts/check-standards.mjs [--report FILE] [--today YYYY-MM-DD]
//                                    [--response FILE] [--save-response FILE] [--endpoint URL]
//
// Exit codes: 0 no change; 1 undetermined (the check could not decide, never read as "no
// change"); 2 change (an act nobody has reviewed); 3 review due (no change, but
// STANDARDS_REVIEWED_ON is older than 60 days). --response assesses a recorded answer instead of
// asking the network (the offline suite does this); --save-response records the live answer;
// --today and --endpoint rehearse the review and failure paths.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  SPARQL_ENDPOINT,
  assess,
  buildQuery,
  parseResults,
  queryCellar,
  renderReport,
  undetermined,
  watchPlan,
} from "./standards-watch.mjs";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const FLAGS = ["--report", "--today", "--response", "--save-response", "--endpoint"];

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!FLAGS.includes(flag)) throw new Error(`Unknown argument: ${flag}`);
    if (!value) throw new Error(`${flag} requires a value`);
    options[flag.slice(2).replace(/-(\w)/g, (_, letter) => letter.toUpperCase())] = value;
  }
  return options;
}

const options = parseArguments(process.argv.slice(2));
const today = options.today ?? new Date().toISOString().slice(0, 10);
const source = options.response ? `the recorded answer ${options.response}` : options.endpoint ?? SPARQL_ENDPOINT;

let outcome;
let reviewedOn = null;
try {
  const standards = join(REPO_ROOT, "dist", "knowledge", "standards.js");
  if (!existsSync(standards)) throw new Error("dist/ is missing; build before checking standards");
  const { STANDARDS_REVIEWED_ON, citedHarmonisedStandards } = await import(pathToFileURL(standards).href);
  reviewedOn = STANDARDS_REVIEWED_ON;
  const reviewed = JSON.parse(readFileSync(join(REPO_ROOT, "tests", "fixtures", "standards", "reviewed-acts.json"), "utf8"));
  const plan = watchPlan(citedHarmonisedStandards, reviewed.acts);
  const answer = options.response
    ? JSON.parse(readFileSync(options.response, "utf8"))
    : await queryCellar(buildQuery(plan), { endpoint: source });
  if (options.saveResponse) writeFileSync(options.saveResponse, `${JSON.stringify(answer, null, 2)}\n`);
  outcome = assess(parseResults(answer), { known: plan.known, reviewedOn, today });
} catch (error) {
  outcome = undetermined(error.message, { reviewedOn, today });
}

const report = renderReport(outcome, { source });
console.log(report);
if (options.report) writeFileSync(options.report, `${report}\n`);
process.exitCode = outcome.exitCode;
