<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Product paths (PCMS)

- Questionnaire orchestration and stored session: `src/lib/cognitive-pipeline.ts`
- Results 2D constellation (multi-trait activations, PCA, density): `src/core/cognitive-pipeline.ts`, `src/core/traits/`, `src/ui/views/`
- In-browser co-activation pattern mining: `src/core/patterns/` (session-local; see `PIPELINE_ARCHITECTURE.md`)
