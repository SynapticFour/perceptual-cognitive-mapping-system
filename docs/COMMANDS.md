# PCMS Command Reference

This file is the single source of truth for local project commands.

## Core npm Commands

| Command | Purpose |
|---|---|
| `npm run setup` | Run interactive local setup script |
| `npm run start:dev` | Start local dev server via setup wrapper |
| `npm run stop` | Stop local dev server on port 3000 |
| `npm run status` | Show local runtime/tooling status |
| `npm run verify` | Verify tracked/staged files do not include local artifacts/secrets |
| `npm run type-check` | Generate Next route types and run TypeScript checks |
| `npm run lint` | Run ESLint checks |
| `npm run check` | Run type-check + lint + question-bank validation |
| `npm run test:unit` | Run default stable unit tests |
| `npm run test:coverage` | Run unit tests with coverage and thresholds |
| `npm run test:edge` | Run stricter edge-case suites (informational, optional gate) |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run build` | Production build |
| `npm run start` | Start production server |

## Gate Recommendations

- **Default quality gate:** `npm run check && npm run test:unit && npm run build`
- **Pre-release gate:** `npm run check && npm run test:coverage && npm run test:e2e && npm run build`
- **Extended diagnostics:** run `npm run test:edge` separately

## Makefile Wrappers

`make` commands are convenience wrappers around the npm/setup commands above and should not diverge from this file.
