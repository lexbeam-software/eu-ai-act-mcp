# Contributing

Thanks for taking the time to look at this project.

`@lexbeam-software/eu-ai-act-mcp` is maintained by Lexbeam Software, currently a one-person operation. Bug reports, regulation-accuracy corrections, and small documentation fixes are very welcome. Larger feature PRs should be discussed in an issue first so we do not waste your time on something we cannot merge.

## How to run the project locally

```bash
git clone https://github.com/lexbeam-software/eu-ai-act-mcp.git
cd eu-ai-act-mcp
npm install
npm run build
node test.mjs
```

The test suite must pass before any PR is merged.

## What we care about most

1. **Regulation accuracy.** If you find a misquoted article number, a wrong deadline, or an obligation that does not match Regulation (EU) 2024/1689, please file an issue. Cite the article. Accuracy beats coverage.
2. **Determinism.** This server has no LLM in the loop. PRs that introduce probabilistic behavior or LLM calls into the core knowledge layer will not be merged.
3. **Test coverage.** New tools or branches need tests in `test.mjs`. The current suite is 109 tests and we want to keep that floor.

## Reporting bugs

Open an issue using the bug template. Include the tool name, the input, the actual output, and what you expected.

## Reporting security issues

See [SECURITY.md](SECURITY.md). Do not open public issues for security findings.

## Code style

- TypeScript with strict mode
- Match the formatting conventions of the surrounding code
- Keep functions small and pure where possible

## Questions

For implementation help or commercial work, reach out at info@lexbeam.com or visit [lexbeam.com/kontakt](https://lexbeam.com/kontakt).
