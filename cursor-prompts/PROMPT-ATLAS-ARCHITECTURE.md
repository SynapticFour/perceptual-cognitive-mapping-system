# Cursor prompt: PCMS prep for ATLAS (boundaries only)

## Goal

Prepare **directory structure and imports** so ATLAS can grow without contaminating PCMS — no covariance, no ATLAS items in PCMS banks, no shared scoring function.

## Rules (`docs/DECISIONS.md`)

- **ADR-001:** Code under `src/atlas/`; items under `content/questions/atlas-v1/`; covariance priors under `content/atlas/covariance/`.
- **ADR-002:** Future `src/atlas/scoring/` is separate from `src/scoring/` (PCMS).
- **ADR-004:** Prior JSON is offline-generated; read-only in app.

## Safe tasks now

- README pointers, empty modules, type stubs, CI guard that fails if `atlas-v1` paths are imported from PCMS question loader without explicit feature flag.
- **Do not** wire imputation into `buildCognitiveModel` or PCMS adaptive engine until priors exist and a new ADR authorises it.

## Done when

- `npm run build` passes with new folders present.
- No PCMS golden tests change behaviour.
