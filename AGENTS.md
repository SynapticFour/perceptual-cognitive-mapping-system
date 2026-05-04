<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Product paths (PCMS)

- Questionnaire orchestration and stored session: `src/lib/cognitive-pipeline.ts`
- Results 2D constellation (multi-trait activations, PCA, density): `src/core/cognitive-pipeline.ts`, `src/core/traits/`, `src/ui/views/`
- In-browser co-activation pattern mining: `src/core/patterns/` (session-local; see `PIPELINE_ARCHITECTURE.md`)

## ATLAS Programme

ATLAS (Adaptive Trait Landscape Architecture System) is a companion research programme to PCMS. Read `docs/ATLAS_VISION.md` (alias) and `docs/ATLAS.md` before touching any ATLAS code.

Key rules for agents:

- ATLAS code lives in `src/atlas/` — do not put it in `src/` root or in PCMS directories
- ATLAS question items live in `content/questions/atlas-v1/` — not in any PCMS bank
- The scoring pipelines are separate — never import from one into the other
- Self-nomination data is auxiliary and never feeds into dimension scores
- All architectural decisions are in `docs/DECISIONS.md` — read it before refactoring
- Feature flags for ATLAS are all off by default — see `src/config/feature-flags.ts`
