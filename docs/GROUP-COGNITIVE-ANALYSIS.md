# Multi-profile (small-group) cognitive analysis

## Purpose

Optional **add-on** for combining **2–6** share-payload profiles (same `p=` encoding as individual results links). It **does not** replace:

- the personal cognitive map / landscape, or  
- the **Cohort insights** demo (`/cohort-insights`), which is aggregate-first and facilitator-oriented.

## Integration

| Piece | Role |
|--------|------|
| `src/lib/group-cognitive-analysis.ts` | Pure analysis: composes `buildCohortCognitiveMap`, `deriveEnvironmentSignals`, `mapInteractionFriction`; adds routing-space **diversity**, **k-means-style member clusters**, and **routing-based risk hints**. |
| `src/app/[locale]/group-cognitive-analysis/` | Client UI: paste payloads, optional **setting-context** sliders (maps to `EnvironmentStressProfile`), run analysis, download portable JSON via `toPortableGroupAnalysisJson`. |
| Results page | When a dimension display exists, shows a link **Group profile comparison** → this route. |

## Outputs

1. **Clusters** — Members grouped in **normalized F–V routing space** (not clinical clusters). Count defaults from group size; override with `GroupAnalysisOptions.kClusters`.
2. **Diversity** — Mean spread of raw routing percents (0–1 score), per-dimension standard deviations, mean pairwise Euclidean distance in normalized routing space, and **routing-profile entropy** (mean softmax entropy per person, scaled 0–1 by `ln(K)` for *K* routing dimensions).
3. **Risk-style indicators** — Heuristics from pooled routing + cohort map + friction (e.g. spread on R/C, sensory load, polarized map, top friction). If **`GroupAnalysisOptions.environment`** is set, **person–environment mismatch** hints are merged first (same severity model), then deduplicated by `id`.
4. **Recommendations (strings)** — Merged narrative lines from environment signals, friction suggestions, and non-low risk mitigations.
5. **Recommendation items (structured)** — Typed rows with `category`, `text`, `rationale`, and `relatedRiskIds` for tooling and UI; see [Step 4 API](#step-4-api-environment-stress-and-structured-recommendations).

**JSON:** `toPortableGroupAnalysisJson(report)` omits large coordinate arrays while keeping interpretable fields, including `recommendationItems` and optional `environment` when present (`undefined` is dropped from JSON).

## Step 4 API: environment stress and structured recommendations

Use this when you need **explicit setting ratings** (facilitator view of the *context*, not people) and **machine-readable** mitigation rows alongside the existing string list.

### `analyzeMultiProfileGroup(members, options?)`

- **`members`** — `GroupMemberInput[]` (length ≥ 2), each with `id`, `label`, `model`, `display`.
- **`options`** — optional `GroupAnalysisOptions`:
  - **`environment?: EnvironmentStressProfile`** — all values in `[0, 1]`:
    - **`predictability01`** — 1 = stable / predictable; 0 = chaotic / unpredictable.
    - **`stimulation01`** — 0 = calm sensory load; 1 = high stimulation (noise, crowding, visual load).
    - **`interruption01`** — 0 = few interruptions; 1 = frequent interruptions.
  - **`kClusters?: number`** — overrides the default cluster count derived from group size.

When `environment` is omitted, behavior matches the earlier multi-profile report (routing + cohort signals only). When set, aggregate means on **R** (structure), **S** (sensory), and **F** (focus channel) are compared to the three sliders using fixed thresholds; matching rows are **`GroupRiskIndicator`** objects (non-diagnostic copy).

Typical **mismatch risk ids** (for tests, analytics, or `relatedRiskIds`):

| `id` | Rough meaning |
|------|----------------|
| `structure_need_chaotic_env` | High aggregate **R** vs low **predictability01** |
| `sensory_environment_mismatch` | High aggregate **S** vs high **stimulation01** |
| `focus_interruption_mismatch` | High aggregate **F** vs high **interruption01** |

Routing-only risks (e.g. `structure_routine_spread`, `sensory_load`, `polarized_trait_field`, `aggregate_style_tension`, `no_major_flags`) still come from `deriveRoutingRisks`. The full list is **deduped by `id`**, with environment-derived rows taking precedence in merge order when ids could overlap (they do not today).

### Diversity metrics (reference)

| Field | Meaning |
|-------|---------|
| `diversity.score` | 0–1, from average std of raw routing percents (gentle cap vs model scale). |
| `diversity.perDimensionStd` | Per F–V dimension std across members. |
| `diversity.meanPairwiseDistance` | Mean Euclidean distance in 0–1 normalized routing vectors. |
| `diversity.routingProfileEntropy01` | Mean per-person entropy of softmax(normalized routing row), divided by `ln(K)` so comparable 0–1. |

### Structured recommendation engine

- **`buildStructuredRecommendationItems({ risks, diversity, environmentSignals, frictionSignals })`** — exported helper that builds up to **16** deterministic `GroupRecommendationItem` rows (sorted by `id`), from mismatch/routing risk ids, high diversity, top environment narratives, and optionally one strong friction signal.
- **`RecommendationCategory`** — `'environment_design' | 'temporal_structure' | 'sensory_access' | 'social_norms'`.
- **`GroupRecommendationItem`** — `{ id, category, text, rationale, relatedRiskIds }`.

For ad-hoc checks without a full report, **`deriveEnvironmentMismatchRisks(members, env)`** is also exported.

### Portable JSON

`toPortableGroupAnalysisJson` includes:

- **`recommendationItems`** — array as above.
- **`environment`** — echo of `options.environment` when the caller passed it (otherwise omitted in the in-memory report; the serializer includes it if present on `report`).

## Consent & ethics

Combining profiles should follow **local consent and policy**. Copy on the page states the view is descriptive and non-diagnostic.
