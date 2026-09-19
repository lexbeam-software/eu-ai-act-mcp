# Releasing this server

The release path has two canonical commands. Do not substitute an ad hoc build,
individual test script, or the retired `build-and-test.mjs` workflow.

## Canonical verification

Run this for every change:

```bash
npm ci
npm run verify
```

`npm run verify` is ordered and fail-fast. It removes the generated root `dist/`
directory and then runs:

1. clean TypeScript build;
2. behavior suite;
3. claim matrix;
4. post-serialization schema gate;
5. pinned-corpus verification;
6. deterministic regulation-compiler tests;
7. public-evaluation grader with Day 2 baseline reproduction;
8. all 12 golden profiles ten times against their pinned canonical hashes;
9. `npm pack --dry-run` content inspection; and
10. package, served, and changelog version identity.

The package-content gate requires compiled `dist` entry points, permits only npm's
standard `LICENSE`, `README.md`, and `package.json` files outside `dist`, rejects
unexpected compiled file types and symlinks, and rejects `.env` files or holdout
references.

CI runs this same command on every push and pull request under Node.js 20 and 22.
The `prepublishOnly` lifecycle also runs it, so the standard `npm publish` path
cannot bypass the canonical gates. Never publish with `--ignore-scripts`.

## Release verification

Before approving or publishing a release candidate, run:

```bash
npm run verify:release
```

This reruns every canonical gate, creates the actual npm tarball without invoking
publication lifecycle scripts recursively, installs it into an isolated temporary
project, and calls all 12 golden profiles through the packed MCP server over stdio.
The responses must match the pinned RFC 8785 SHA-256 hashes.

It then requests every lexbeam.com URL the package publishes: the compiled server,
`README.md`, the package metadata, and the allowlist in
`tests/fixtures/site/known-live-urls.json`. A URL that does not answer 200 fails the
release. This is the only gate that needs the network, which is why it belongs here
and not in `npm run verify`. The canonical behavior suite holds `src/` to the same
allowlist offline, so a link to a page that does not exist fails CI long before a
release. When the site gains or renames a page, update the allowlist;
`npm run check:links` runs the network check on its own.

The command also generates an SPDX runtime SBOM with `npm sbom` and writes an
ignored `release-evidence/` directory containing:

- one log for every canonical and release-only gate;
- the complete canonical verification log and summaries;
- the packed tarball and npm package metadata;
- the SPDX SBOM;
- a release manifest with package, Git, Node.js, and npm identity; and
- `digests.sha256`, covering every other evidence file.

Verify the bundle after generation with:

```bash
cd release-evidence
shasum -a 256 -c digests.sha256
```

GitHub's manually dispatched `Release verification` workflow runs the same command
and uploads that directory as a workflow artifact. It does not publish the package.

## Version identity

`package.json` is the package version source. `src/constants.ts` reads that value
into `SERVER_VERSION`, which feeds the MCP handshake and HTTP health response. The
first released entry below `[Unreleased]` in `CHANGELOG.md` must carry the same
version. The final verification gate imports the freshly built server constant and
compares it with every file that states the version: `package.json`, both version
fields of `package-lock.json`, `smithery.yaml`, and the changelog head. Bump with
`npm version <x.y.z> --no-git-tag-version`, which keeps the lockfile in step, then
edit `smithery.yaml` and the changelog.

A version bump moves no pinned artefact. `server_version` is outside the pinned
response hash, the suite compares goldens through the same projection, and the
evaluation grader ignores the package version recorded in its baseline. Goldens and
hashes change only when an assessment result changes. For that case
`scripts/regen-goldens.mjs` is the one way to regenerate: it prints every differing
pinned value and writes nothing until `--allow-content-changes` confirms that the
differences are the intended ones.

## Publication checklist

1. Confirm the branch contains the intended legal, schema, test, and documentation
   changes.
2. Confirm `package.json`, `package-lock.json`, `smithery.yaml`, and the changelog
   describe the intended release.
3. Run `npm run verify:release` from a clean checkout.
4. Review `release-evidence/manifest.json`, `digests.sha256`, the package manifest,
   the black-box golden log, and the SBOM.
5. Commit the release changes. Obtain the required review and approval.
6. Publish in two human steps. First publish a GitHub release whose tag is `v` plus the
   package version. The `Stage on npm` workflow refuses a tag that does not match,
   refuses a version that is already on npm, runs `npm run verify:release`, keeps the
   evidence bundle as a workflow artifact, and then runs `npm stage publish`, whose
   `prepublishOnly` hook reruns `npm run verify`. It authenticates over npm trusted
   publishing, so no npm token exists on any machine. Staging makes nothing public.
   Second, approve the staged version with 2FA on npmjs.com (package page, Staged
   Packages, Approve) or with `npm stage approve <stage-id>`; `npm stage view` and
   `npm stage download` show what was staged, `npm stage reject` discards it. Compare
   the staged tarball's shasum with the one in the release evidence before approving.
   Run the workflow by hand with "dry run" ticked to rehearse everything except the
   upload. The trusted publisher is a one-time setting on npmjs.com (package Settings,
   Trusted Publisher, GitHub Actions: `lexbeam-software`, `eu-ai-act-mcp`,
   `publish.yml`, no environment, stage only). Staged publishing needs npm 11.15.0 or
   later, which Node 24 ships.
7. If the workflow is unavailable, the standard `npm publish` from the approved commit
   on a logged-in machine remains valid. Never publish with `--ignore-scripts`.
8. Confirm the published package version and hosted MCP version only after an
   authorized publication or deployment.

Pushing to `main`, deploying the hosted service, and publishing to npm remain three
independent actions. Verification authorizes none of them by itself.

## Between releases

The `Site links` workflow runs `npm run check:links` every Monday and opens or updates
one issue when a lexbeam.com URL stops resolving. The release gate cannot see a page
that disappears while a version sits published; this can.

## The front door, measured

`evals/front-door/` measures what a calling agent makes of `euaiact_classify_system`.
`corpus.json` holds natural descriptions of regulated systems and two kinds of
negatives. A recording (`agent-args-<label>.json`) holds the arguments an agent model
passed on its first call for each description, given only the tool definition of that
version (`tool-<label>.json`). `node evals/front-door/score.mjs <recording>` feeds a
recording to the built classifier, offline and deterministically. Recordings need a
language model and are therefore made by hand, never in CI; `README.md` in that
directory states the procedure. Re-record when the tool description, the input schema
or the signal path changes, and read both numbers: regulated descriptions recognised,
and negatives wrongly regulated.

## Generated and tracked content

Root `dist/`, `compiler/dist/`, `node_modules/`, and `release-evidence/` are generated
and must remain untracked. Verify that with:

```bash
git ls-files node_modules dist compiler/dist release-evidence
```

The command must print nothing. Never use `prepare` for the root build because it
runs during installation before deployment images have copied the build inputs.

## Legal-content releases

A legal amendment is a content pass, not a date edit. Reconcile every served
surface, regenerate contract fixtures and goldens when required, verify the pinned
corpus and claim matrix, and record any contract migration before running the two
canonical commands.
