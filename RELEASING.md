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
compares all three values.

`smithery.yaml` is deployment metadata and must also be reviewed when the package
version changes, but it is not part of the npm artifact identity check.

## Publication checklist

1. Confirm the branch contains the intended legal, schema, test, and documentation
   changes.
2. Confirm `package.json`, `package-lock.json`, `smithery.yaml`, and the changelog
   describe the intended release.
3. Run `npm run verify:release` from a clean checkout.
4. Review `release-evidence/manifest.json`, `digests.sha256`, the package manifest,
   the black-box golden log, and the SBOM.
5. Commit the release changes. Obtain the required review and approval.
6. Use the standard `npm publish` command only from the approved commit. Its
   `prepublishOnly` hook reruns `npm run verify`.
7. Confirm the published package version and hosted MCP version only after an
   authorized publication or deployment.

Pushing to `main`, deploying the hosted service, and publishing to npm remain three
independent actions. Verification authorizes none of them by itself.

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
