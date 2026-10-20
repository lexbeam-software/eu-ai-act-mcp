// Watches the Official Journal for harmonised-standard references under the AI Act, so the
// dated "as of" statements in euaiact://standards cannot go stale unnoticed. Shared by the
// weekly network check (check-standards.mjs) and the offline suite in test.mjs, which pins
// the known positive from a recorded answer.
//
// The source is the Publications Office Cellar SPARQL endpoint: EUR-Lex answers scripted
// requests with an empty HTTP 202, the Cellar answers them. One query asks four questions:
//   legal-basis  acts based on Regulation (EU) No 1025/2012 that cite the AI Act, which is
//                how the Commission publishes references under Art. 10(6) of that regulation;
//   title        decisions and corrigenda since 2025 whose English title names the AI Act
//                standards series, a watched decision or the number of a cited standard
//                (a restriction or withdrawal names one of them);
//   link         any act that points at a watched decision, by any relation: amends,
//                corrects, cites, consolidates, repeals;
//   control      the link pattern on a pair that exists: the Digital Omnibus amends the AI Act.
// It fails closed. An answer without a new act counts as "no change" only when the same answer
// returns the known positive (Implementing Decision (EU) 2026/2274) through both legal-basis
// and title, and the control through link.

export const SPARQL_ENDPOINT = "https://publications.europa.eu/webapi/rdf/sparql";
export const AI_ACT = "32024R1689";
export const STANDARDISATION_REGULATION = "32012R1025";
/** Commission Implementing Decision (EU) 2026/2274, which published the reference of EN 18286:2026. */
export const KNOWN_POSITIVE = "32026D2274";
export const CONTROL = { celex: "32026R1744", relation: "amends", target: AI_ACT };
export const SEARCH_FROM = "2025-01-01";
export const STALE_AFTER_DAYS = 60;
export const EXIT_CODES = { "no-change": 0, undetermined: 1, change: 2, "review-due": 3 };

const CDM = "http://publications.europa.eu/ontology/cdm#";
const VIAS = ["legal-basis", "title", "link", "control"];
const DAY_MS = 86_400_000;

function ojNumber(celex) {
  const match = /^3(\d{4})[A-Z](\d{4})$/.exec(celex);
  if (!match) throw new Error(`not the CELEX number of an act: ${celex}`);
  return `${match[1]}/${Number(match[2])}`;
}

function isoDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(time) || new Date(time).toISOString().slice(0, 10) !== value ? null : time;
}

function cleanTitle(value) {
  return value ? value.replace(/\s+/g, " ").trim() : null;
}

/** "...#resource_legal_amends_resource_legal" -> "amends"; "...#work_cites_work" -> "cites". */
export function relationName(uri) {
  const local = uri.startsWith(CDM) ? uri.slice(CDM.length) : uri;
  return local.replace(/^(resource_legal|act_consolidated|work)_/, "").replace(/_(resource_legal|work)$/, "");
}

/** What to watch, from the standards the server cites and the acts a person has reviewed. */
export function watchPlan(citedStandards, reviewedActs = []) {
  const decisions = [...new Set([KNOWN_POSITIVE, ...citedStandards.map((standard) => standard.oj_publication.celex)])].sort();
  decisions.forEach(ojNumber);
  const standardNumbers = [...new Set(citedStandards
    .map((standard) => /\d{4,}/.exec(standard.reference)?.[0])
    .filter(Boolean))].sort();
  const known = new Set([...decisions, ...reviewedActs.map((act) => act.celex)]);
  return { decisions, standardNumbers, known };
}

export function buildQuery({ decisions, standardNumbers }, { since = SEARCH_FROM, control = CONTROL } = {}) {
  const titles = [`harmonised.standard.*${ojNumber(AI_ACT)}`, ...decisions.map(ojNumber), ...standardNumbers].join("|");
  const watched = decisions.map((celex) => `"${celex}"^^xsd:string`).join(" ");
  if (!isoDay(since)) throw new Error(`not an ISO date: ${since}`);
  return `PREFIX cdm: <${CDM}>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX rt: <http://publications.europa.eu/resource/authority/resource-type/>
PREFIX lang: <http://publications.europa.eu/resource/authority/language/>
SELECT DISTINCT ?via ?celex ?date ?title ?rel ?target WHERE {
  {
    ?standardisation cdm:resource_legal_id_celex "${STANDARDISATION_REGULATION}"^^xsd:string .
    ?aiAct cdm:resource_legal_id_celex "${AI_ACT}"^^xsd:string .
    ?w cdm:resource_legal_based_on_resource_legal ?standardisation ;
       cdm:work_cites_work ?aiAct ;
       cdm:resource_legal_id_celex ?celex .
    FILTER(STRSTARTS(STR(?celex), "3"))
    BIND("legal-basis" AS ?via)
  } UNION {
    VALUES ?type { rt:DEC_IMPL rt:DEC rt:CORRIGENDUM }
    ?w cdm:work_has_resource-type ?type ;
       cdm:work_date_document ?adopted ;
       cdm:resource_legal_id_celex ?celex .
    FILTER(?adopted >= "${since}"^^xsd:date)
    ?expression cdm:expression_belongs_to_work ?w ;
                cdm:expression_uses_language lang:ENG ;
                cdm:expression_title ?matched .
    FILTER(REGEX(STR(?matched), "${titles}", "i"))
    BIND("title" AS ?via)
  } UNION {
    VALUES ?target { ${watched} }
    ?watched cdm:resource_legal_id_celex ?target .
    ?w ?rel ?watched ;
       cdm:resource_legal_id_celex ?celex .
    FILTER(?w != ?watched)
    BIND("link" AS ?via)
  } UNION {
    VALUES (?target ?celex) { ("${control.target}"^^xsd:string "${control.celex}"^^xsd:string) }
    ?watched cdm:resource_legal_id_celex ?target .
    ?w cdm:resource_legal_id_celex ?celex ;
       ?rel ?watched .
    BIND("control" AS ?via)
  }
  OPTIONAL { ?w cdm:work_date_document ?date }
  OPTIONAL {
    ?english cdm:expression_belongs_to_work ?w ;
             cdm:expression_uses_language lang:ENG ;
             cdm:expression_title ?title .
  }
}`;
}

/** Rows of a SPARQL JSON answer to buildQuery; throws when the answer has another shape. */
export function parseResults(json) {
  const bindings = json?.results?.bindings;
  if (!Array.isArray(json?.head?.vars) || !Array.isArray(bindings)) {
    throw new Error("the answer is not a SPARQL result set");
  }
  return bindings.map((binding) => {
    const value = (name) => binding[name]?.value;
    const row = {
      via: value("via"),
      celex: value("celex"),
      date: value("date") ?? null,
      title: cleanTitle(value("title")),
      relation: value("rel") ? relationName(value("rel")) : null,
      target: value("target") ?? null,
    };
    if (!VIAS.includes(row.via) || !row.celex) throw new Error(`unexpected row in the answer: ${JSON.stringify(binding)}`);
    return row;
  });
}

function reviewAge(reviewedOn, today) {
  const reviewed = isoDay(reviewedOn);
  const now = isoDay(today);
  return reviewed === null || now === null ? null : Math.round((now - reviewed) / DAY_MS);
}

function result(status, fields) {
  return { status, exitCode: EXIT_CODES[status], reasons: [], newActs: [], ...fields };
}

/** The state when no answer could be assessed. Never reported as "no change". */
export function undetermined(reason, { reviewedOn = null, today = null } = {}) {
  const age = reviewAge(reviewedOn, today);
  return result("undetermined", {
    reasons: [reason],
    knownPositiveFoundBy: [],
    review: { reviewedOn, today, age, staleAfterDays: STALE_AFTER_DAYS, stale: age !== null && age > STALE_AFTER_DAYS },
  });
}

export function assess(rows, { known, reviewedOn, today, staleAfterDays = STALE_AFTER_DAYS }) {
  const reasons = [];
  const knownPositiveFoundBy = ["legal-basis", "title"]
    .filter((via) => rows.some((row) => row.via === via && row.celex === KNOWN_POSITIVE));
  for (const via of ["legal-basis", "title"]) {
    if (!knownPositiveFoundBy.includes(via)) reasons.push(`the ${via} search did not return the known positive ${KNOWN_POSITIVE}`);
  }
  if (!rows.some((row) => row.via === "control" && row.celex === CONTROL.celex &&
      row.relation === CONTROL.relation && row.target === CONTROL.target)) {
    reasons.push(`the link search did not return its control (${CONTROL.celex} ${CONTROL.relation} ${CONTROL.target})`);
  }

  const acts = new Map();
  for (const row of rows) {
    if (row.via === "control") continue;
    const act = acts.get(row.celex) ?? { celex: row.celex, date: null, title: null, foundBy: [], links: [] };
    act.date ??= row.date;
    act.title ??= row.title;
    if (!act.foundBy.includes(row.via)) act.foundBy.push(row.via);
    const link = row.relation ? `${row.relation} ${row.target}` : null;
    if (link && !act.links.includes(link)) act.links.push(link);
    acts.set(row.celex, act);
  }
  const newActs = [...acts.values()]
    .filter((act) => !known.has(act.celex))
    .sort((a, b) => a.celex.localeCompare(b.celex));

  const age = reviewAge(reviewedOn, today);
  if (age === null) reasons.push(`the review date "${reviewedOn}" or the check date "${today}" is not an ISO date`);
  const stale = age !== null && age > staleAfterDays;
  const status = reasons.length > 0 ? "undetermined" : newActs.length > 0 ? "change" : stale ? "review-due" : "no-change";
  return result(status, {
    reasons,
    newActs,
    knownPositiveFoundBy,
    actsSeen: acts.size,
    review: { reviewedOn, today, age, staleAfterDays, stale },
  });
}

const HEADLINES = {
  "no-change": () => "NO CHANGE",
  change: (r) => `CHANGE: ${r.newActs.length} act${r.newActs.length === 1 ? "" : "s"} in the Official Journal not reviewed yet`,
  undetermined: () => "UNDETERMINED: the check could not decide. This is not a \"no change\" result",
  "review-due": (r) => `REVIEW DUE: no new act, but STANDARDS_REVIEWED_ON is ${r.review.age} days old`,
};

/** Markdown for the job log and the issue body. */
export function renderReport(r, { source = SPARQL_ENDPOINT } = {}) {
  const lines = [`## Harmonised standards check: ${HEADLINES[r.status](r)}`, ""];
  lines.push(`Checked on ${r.review.today ?? "an unknown date"} against ${source}.`);
  if (r.status !== "undetermined") {
    lines.push(`The known positive ${KNOWN_POSITIVE} (Implementing Decision (EU) 2026/2274) came back through ${r.knownPositiveFoundBy.join(" and ")}, ` +
      `and the link control (${CONTROL.celex} ${CONTROL.relation} ${CONTROL.target}) came back too, so an empty result counts. ` +
      `Acts seen: ${r.actsSeen}.`);
  }
  if (r.reasons.length > 0) {
    lines.push("", "Why the check could not decide:", ...r.reasons.map((reason) => `- ${reason}`));
  }
  if (r.newActs.length > 0) {
    lines.push("", r.status === "undetermined" ? "Acts seen in an answer that cannot be trusted as complete:" : "Acts not reviewed yet:");
    for (const act of r.newActs) {
      const how = [...act.foundBy, ...act.links.map((link) => `(${link})`)].join(" ");
      lines.push(`- ${act.celex}${act.date ? ` of ${act.date}` : ""}, found by ${how}: ${act.title ?? "no English title"}. ` +
        `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${act.celex}`);
    }
  }
  const review = r.review;
  lines.push("", review.age === null
    ? "Review date: unknown."
    : `Review date: STANDARDS_REVIEWED_ON is ${review.reviewedOn}, ${review.age} days before the check (limit ${review.staleAfterDays}).`);
  if (review.stale) {
    lines.push("Warning: the review is older than the limit. This check cannot see the Commission's guidance pages that " +
      "euaiact://standards also reports (guidelines, codes of practice); only a re-read can.");
  }
  const todo = {
    change: "Read each act. If it publishes, restricts or withdraws a reference, update `src/knowledge/standards.ts` " +
      "(the standard, its act, `STANDARDS_REVIEWED_ON`) and release. If it changes nothing the server says, record its CELEX " +
      "in `tests/fixtures/standards/reviewed-acts.json` with a note. Either way the next run is quiet.",
    undetermined: "Re-run the workflow. If it stays undetermined, the endpoint or its metadata changed and " +
      "`scripts/standards-watch.mjs` needs a look. Until then the state of the Official Journal is unknown.",
    "review-due": "Re-read the Official Journal and the Commission's AI Act standardisation and guidance pages, " +
      "update `src/knowledge/standards.ts` with a new `STANDARDS_REVIEWED_ON`, and release.",
  }[r.status];
  if (todo) lines.push("", `What to do: ${todo}`);
  return lines.join("\n");
}

/** POSTs the query; throws unless the endpoint returns a complete JSON result set. */
export async function queryCellar(query, { endpoint = SPARQL_ENDPOINT, attempts = 3, timeoutMs = 60_000, pauseMs = 10_000 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          accept: "application/sparql-results+json",
          "content-type": "application/x-www-form-urlencoded",
          "user-agent": "lexbeam-eu-ai-act-mcp-standards-check",
        },
        body: new URLSearchParams({ query }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const body = await response.text();
      if (response.status !== 200) throw new Error(`HTTP ${response.status}${body.trim() ? "" : " with an empty body"}`);
      // Virtuoso marks an answer cut short by its time limit with these headers.
      const partial = response.headers.get("x-sql-state") ?? response.headers.get("x-sql-message");
      if (partial) throw new Error(`the endpoint returned a partial answer (${partial})`);
      const type = response.headers.get("content-type") ?? "";
      if (!type.includes("json")) throw new Error(`unexpected content type "${type}"`);
      return JSON.parse(body);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, pauseMs));
    }
  }
  const cause = lastError?.cause?.code ? ` (${lastError.cause.code})` : "";
  throw new Error(`the Cellar SPARQL endpoint did not answer after ${attempts} attempts: ${lastError?.message ?? lastError}${cause}`);
}
