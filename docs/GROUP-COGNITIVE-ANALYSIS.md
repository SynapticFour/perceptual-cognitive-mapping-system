# Multi-profile (small-group) cognitive analysis

## Purpose

Optional **add-on** for combining **2–6** share-payload profiles (same `p=` encoding as individual results links). It **does not** replace:

- the personal cognitive map / landscape, or  
- the **Cohort insights** demo (`/cohort-insights`), which is aggregate-first and facilitator-oriented.

## Integration

| Piece | Role |
|--------|------|
| `src/lib/group-cognitive-analysis.ts` | Pure analysis: composes `buildCohortCognitiveMap`, `deriveEnvironmentSignals`, `mapInteractionFriction`; adds routing-space **diversity**, **k-means-style member clusters**, and **routing-based risk hints**. |
| `src/app/[locale]/group-cognitive-analysis/` | Client UI: paste payloads, run analysis, download portable JSON via `toPortableGroupAnalysisJson`. |
| Results page | When a dimension display exists, shows a link **Group profile comparison** → this route. |

## Outputs

1. **Clusters** — Members grouped in **normalized F–V routing space** (not clinical clusters).
2. **Diversity score** — Mean spread of raw routing percents + mean pairwise distance in 0–1 routing space.
3. **Risk-style indicators** — Heuristic flags (e.g. spread on R/C, sensory load, polarized cohort map, top friction signal). One “low” fallback when nothing stands out.
4. **Recommendations** — Merged from environment signals, friction suggestions, and non-low risk mitigations.

**JSON:** `toPortableGroupAnalysisJson(report)` omits large coordinate arrays while keeping interpretable fields.

## Consent & ethics

Combining profiles should follow **local consent and policy**. Copy on the page states the view is descriptive and non-diagnostic.
