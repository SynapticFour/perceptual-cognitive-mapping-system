# Cognitive profiling pipeline (implemented layout)

This document reflects **what exists in the repository today**, not a future `src/pipeline/` tree.

## Layers and source files

| Layer | Responsibility | Canonical types | Implementation |
|-------|------------------|-----------------|----------------|
| **1 — Raw** | Immutable per-item capture from the assessment | `RawResponse`, `SessionRaw` | `src/types/raw-session.ts` |
| **2 — Features** | Derived numeric summaries | `CognitiveFeatures` | `StatisticalFeatureExtractor` in `src/model/latent-representation.ts` |
| **3 — Latent space projection (pilot)** | High-dimensional vector + metadata | `LatentCognitiveVector`, alias `CognitiveEmbedding` | `LatentVectorGenerator`, `LatentRepresentationManager` in `src/model/latent-representation.ts` |
| **4 — Interpretation** | Non-clinical, UI-safe narrative | `CognitiveProfilePublic` | `src/types/profile-public.ts`, `interpretCognitiveFeatures` in `src/lib/interpretation.ts` |

## Orchestration (wiring)

- **`src/lib/cognitive-pipeline.ts`** — Converts `QuestionResponse` + resolved `Question` / `ResearchQuestion` into `SessionRaw`, then runs `runResearchPipeline` (features → latent space projection (pilot) → public interpretation).
- **`src/lib/session-stats.ts`** + **`src/types/session-stats.ts`** — `getSessionStats(session)` returns **`SessionStatsInternal`** (includes `rawResponses`). **`toPublicSessionStats()`** strips raw data for UI/API surfaces.

## Results visualization (same latent space projection (pilot), different lenses)

This is **separate** from `src/lib/cognitive-pipeline.ts` (which never imported the UI layer):

- **`src/core/cognitive-pipeline.ts`** — `buildCognitiveModel(...)`: builds **many user activations** (one row per micro-trait from the ontology), stacks them with archetype lifts + optional cohort + synthetic reference rows in ℝ^d, runs **one** joint PCA + normalization, applies **field spread** (global repel from weighted centroid, **k-nearest local repel**, bbox expansion when tight, deterministic jitter) so the map reads as a **spatial field** rather than a single dominant locus, precomputes a density grid (sqrt of raw weights only — **no cluster boost in weights**), lighter smoothing for multiple peaks, and keeps a **faint-only** centroid for diagnostics. `clusterVisualBoost` remains for cluster hints only, not for density or point sizing. Returns **`CognitiveModel`** (`embedding`, `projectedPoints`, `allVectors`, `kinds`, `labels`, `pointWeights`, `clusterVisualBoost`, `activationClusterHints`, `activations`, `traitEdges`, `density`, …). This is a **latent space projection (pilot)** (deterministic projection, not a trained ML model; to be replaced by PCA-based loadings post Phase 2 calibration).
- **Debug** — Set `NEXT_PUBLIC_PCMS_DEBUG_FIELD=true` or `PCMS_DEBUG_FIELD=true` to log activation spatial variance during `buildCognitiveModel` and draw a bounding box around the activation spread in Map and Density views.
- **`src/core/traits/*`** — Curated **micro-trait ontology** (`trait-definitions.ts`, domains in `trait-domains.ts`), `mapAnswersToActivations` (`trait-mapping.ts`: weights from routing scores, deterministic vector perturbation, optional **trait–trait interactions** in `trait-interactions.ts`), validation in `trait-validation.ts`. Types: `CognitiveActivation` in `traits/types.ts`.
- **`src/core/patterns/*`** — **In-browser only** (current tab / process): `extractUserSignature`, `minePatterns` (pair/triplet co-occurrence counts), `pattern-store` + `subscribePatternStore`, `matchUserToPatterns` for optional UI highlights and copy. Not persisted to Supabase by default; safe for research builds that add their own aggregation later.
- **`src/ui/CognitiveViewSwitcher.tsx`** + **`src/ui/views/*`** — Pure renderers (`MapView`, `DensityView`, `CognitiveFieldView`, `VectorView`) that consume **`CognitiveModel`** (and optional pattern highlight props from the landscape); they do not re-run PCA.

## Why multiple visualizations?

The same cognitive model is intentionally rendered through multiple lenses because cognition is not a single number or a single point.

- **`MapView`** → structural view of points and regions (where tendencies sit relative to each other)
- **`DensityView`** → distribution view (where activation mass concentrates across the plane)
- **`VectorView`** → compositional view (which traits contribute, grouped by region)
- **`CognitiveFieldView`** → continuous-system view (activity as a fluid field with gradients and multiple peaks)

### Rationale for the field model

`CognitiveFieldView` treats activations as a distributed process rather than discrete outcomes:

- cognition is modeled as a **continuous field**, not isolated bins
- inspired by **brain activity maps** (e.g. fMRI-like spatial activation framing)
- aligned with **dynamical systems** and **distributed processing** perspectives in cognitive science

Design intent: answer **“what does this mind look like as a system?”** rather than “what is the result?”.

## Live product vs research stack

- **Primary UX path** (questionnaire → results): adaptive engine + **10D routing** (`COGNITIVE_DIMENSION_KEYS` in `src/model/cognitive-dimensions.ts`), UI display via `CognitiveProfilePublic` / landscape components, session payload persisted to `localStorage` and, when configured, **`profiles.cognitive_vector`** as a **`StoredPipelineSession`**-shaped JSON document (`src/lib/data-collection.ts`).
- **Layers 1–4** above are **typed, test-covered, and wired** for exports, analytics, and the same trace the product uses for interpretation.

## Data flow (single trace)

1. UI submits **`QuestionResponse`** (`src/data/questions.ts`).
2. **`questionResponseToRawResponse`** maps to **`RawResponse`** (adds `questionContext` from the research bank).
3. **`buildSessionRawFromHistory`** aggregates **`SessionRaw`**.
4. **`LatentRepresentationManager.generateLatentVector`** → **`CognitiveFeatures`** + **`LatentCognitiveVector`**.
5. **`interpretCognitiveFeatures`** → **`CognitiveProfilePublic`** (no raw payloads).

## Rules

- Do not expose **`SessionStatsInternal.rawResponses`** to React props or public APIs — use **`toPublicSessionStats`**.
- Prefer importing **`RawResponse` / `SessionRaw`** from `@/types/raw-session` (re-exported from `@/model/latent-representation` for backward compatibility).
