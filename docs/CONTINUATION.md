# Continuation handoff — PCMS / map stack (2026-05)

Use this file to resume work without re-reading the whole chat history.

## What landed recently (summary)

- **Public readiness:** [`SITE_AUDIT_REPORT.md`](./SITE_AUDIT_REPORT.md) (language, consent, T–I–A–V UI vs ADR-007, ATLAS separation, metadata, footer, privacy).
- **Privacy:** Session sync no longer writes `user_agent` to Supabase; rate-limit keys use an in-memory fingerprint (not DB-persisted).
- **Consent:** Ghana/West-Africa ethics step includes locale **`wo`** as well as **`tw`** / env (`ethics-flow-config.ts`).
- **Results UI (ADR-007):** Primary dimension bars and insight cards show **F–C** first; **T–V** in a default-collapsed `<details>` (`CognitiveLandscape`, `insight-cards`, `dimension-bar-grid`).
- **In-app legal docs:** Routes **`/ethics`** and **`/validation`** render `docs/ethics.md` and `docs/VALIDATION_PROTOCOL.md`; footer links point there (not GitHub blobs).
- **ATLAS self-nomination:** Feature-flagged; descriptor locale overrides (`content/atlas/descriptors-locale-overrides-v1.json`); ESLint + Vitest import boundary under `src/atlas/self-nomination/`; migration [`../supabase/migrations/20260502120000_atlas_tables_rls.sql`](../supabase/migrations/20260502120000_atlas_tables_rls.sql).
- **Ghana TIAV:** `content/questions/ghana/tiav-ghana-v1.json` — **16** items (target remains larger; see [`RESEARCH_ACTION_PLAN.md`](./RESEARCH_ACTION_PLAN.md)).
- **Twi messages:** `messages/tw.json` — review-tag suffixes stripped; cohort copy partly English until native pass.

## Commands (CI parity)

From repo root:

```bash
npm ci
npm run lint
npm run validate-questions
npm run validate-global-bank
npm run validate-cultural-bank
npx tsc --noEmit
npm run test:unit
npm run build
npm run test:e2e   # requires playwright browsers; see .github/workflows/ci.yml
```

Playwright’s dev server can fail in restricted sandboxes (`uv_interface_addresses`); run `npm run test:e2e` on a normal workstation or CI with full OS network APIs.

## Open work (needs people)

1. **Native Twi / Wolof** — full `ethics_consent`, Likert, and long-form copy; `_localeReview` in `messages/tw.json`.
2. **Ghana TIAV expansion** — toward ~20 items per T/I/A/V + psychometric review.
3. **Descriptor overrides** — fill `descriptors-locale-overrides-v1.json` with linguist-reviewed `tw` / `wo` body text ([`content/atlas/DESCRIPTOR-LOCALES.md`](../content/atlas/DESCRIPTOR-LOCALES.md)).

## Key file pointers

| Topic | Location |
|-------|----------|
| ADRs | [`DECISIONS.md`](./DECISIONS.md) |
| ATLAS | [`ATLAS.md`](./ATLAS.md), `src/atlas/` |
| Footer + doc routes | `src/components/layout/SiteFooter.tsx`, `src/app/[locale]/ethics/`, `validation/` |
| i18n for doc pages | `messages/*/json` → `docsPages` namespace |
| Feature flags | `src/config/feature-flags.ts`, `.env.example` |

## Website (synapticfour.com)

Corporate site copy should stay aligned with PCMS behaviour and URLs; after PCMS deploys, update [`synapticfour-website`](../synapticfour-website) privacy processor text if new public paths matter for Art. 13 transparency (e.g. in-app `/ethics`, `/validation` on the map host).
