# The front door, measured

`euaiact_classify_system` is called by language-model agents, not by people. What the
classifier returns therefore depends on two things: the deterministic logic in this
repository, and what an agent makes of the tool definition it is shown. The behavior
suite covers the first. This directory measures both together.

## What is here

| File | Content |
| --- | --- |
| `corpus.json` | Natural descriptions of AI systems, each with the set it belongs to, its label and, for hand-written negatives, the provision it rests on. Read its `caveats` before quoting a number. |
| `tool-<label>.json` | The tool definition of one version exactly as an MCP client shows it to an agent: name, description, input JSON schema. |
| `agent-prompt.md` | The prompt a recording is made with. `{{TOOL}}` is the tool definition, `{{MESSAGES}}` one description per line with its id. |
| `agent-args-<label>.json` | A recording: for every description, the arguments the agent model passed on its first call. |
| `score.mjs` | Feeds a recording to the built classifier and counts. Offline and deterministic. |

## Scoring

```bash
npm run build
node evals/front-door/score.mjs evals/front-door/agent-args-1.6.0.json
```

Two numbers matter and they pull in opposite directions. **Regulated descriptions
recognised** is recall. **Negatives wrongly regulated** is the count of systems that came
back high-risk or prohibited although they are neither; it has to be zero. A call the
input schema rejects is counted as invalid and as not recognised.

## Making a recording

A recording needs a language model, so it is made by hand and never in CI. Give the model
`agent-prompt.md` with the tool definition and 24 descriptions at a time, and collect the
JSON arrays it returns into one object keyed by description id. The recordings here were
made on 19 September 2026 with `google/gemini-3.7-flash`, which is one agent; another
model may fill the signals differently, and a weaker one may fill fewer.

Record again whenever the tool description, the input schema or the signal path changes.

## What the sets are

- `s1` to `s3`: 76 regulated descriptions and 20 hard negatives each, written by three
  different models under one brief that forbade the regulation's own terms. The hard
  negatives share vocabulary with a regulated category and fall clearly outside.
- `s4`: 24 systems that operate inside a sector Annex III names while performing none of
  the uses it lists, written by hand, each with the provision it rests on.
- `s5`: 22 more of the same kind, written by a model that never saw a tool definition and
  was forbidden the examples the field description uses. It exists so that `s4`, whose
  wording overlaps those examples, is not the only evidence.
