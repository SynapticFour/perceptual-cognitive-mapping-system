# Releasing

Semantic Versioning (`MAJOR.MINOR.PATCH`). Pin **git tag** (or commit SHA) for reproducible research deployments — not npm version alone.

## Release process

1. Ensure CI is green on `main`.
2. If SQL changed: apply Supabase migrations locally **before** tag (see [`docs/deployment-runbook.md`](./docs/deployment-runbook.md)).
3. Update `CHANGELOG.md`.
4. Annotated tag: `git tag -a vX.Y.Z -m "vX.Y.Z"` && `git push origin vX.Y.Z`
5. Verify GitHub Actions **Deploy** workflow → Vercel production.
6. Post-deploy health checks (see runbook).

## Required repository secrets

| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Vercel deploy |
| `VERCEL_ORG_ID` | Project org |
| `VERCEL_PROJECT_ID` | Project id |

Supabase credentials live in **Vercel project env**, not in the deploy workflow.

## What is not automated

- **Supabase migrations** — manual `supabase db push` locally (documented in runbook)
- **Docker / Compose** — not used for PCMS SaaS (Vercel + Supabase only)

## Versioning rules

- `MAJOR`: breaking API/behavior or schema incompatible without migration
- `MINOR`: backward-compatible features
- `PATCH`: fixes and maintenance
