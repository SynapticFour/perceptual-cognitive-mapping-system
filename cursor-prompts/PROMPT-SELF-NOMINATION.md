# Cursor prompt: Self-nomination module (exploratory)

## Status: **implemented (v1)** in-repo

Shipped paths:

- UI: `src/atlas/self-nomination/SelfNominationModule.tsx`, research-only note `SelfNominationResearchNote.tsx` (behind `NEXT_PUBLIC_SHOW_VALIDATION_STATUS`)
- Data: `content/atlas/descriptors-v1.json`
- Persistence: `src/lib/offline-storage.ts` (IndexedDB store `atlasSelfNomination`), `src/lib/atlas-self-nomination-persist.ts`, `POST /api/atlas/self-nomination`
- Integration: `src/app/[locale]/results/page.tsx` (after facilitator block, before research summary card)
- i18n: `messages/en.json` + `messages/de.json` → namespace `selfNomination.*` (Twi/Wolof inherit English strings via `deepMergeMessages` with `en.json`)

Flag: `NEXT_PUBLIC_ENABLE_SELF_NOMINATION=true` (see `src/config/feature-flags.ts`).

## Hard rules (ADR-003) — unchanged

- **Zero** influence on dimension scores, adaptive routing, or terrain heightmap inputs.
- Store selections in a **separate** payload / table for research only.
- Cards: experiential language only; no diagnosis names; no disorder framing.

## Optional follow-ups

- Translate or culturally adapt `descriptors-v1.json` for `tw` / `wo` (or split by `culturalContext` like question banks).
- Unit test: assert no import from scoring pipeline into self-nomination UI (or ESLint boundary rule).
- Supabase RLS for `atlas_self_nominations` if inserts should ever use the anon key (current API uses service role).
