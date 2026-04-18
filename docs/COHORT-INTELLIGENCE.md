# Cohort Intelligence Layer

This document is the **canonical description** of the PCMS **Cohort Intelligence Layer**: group-level, **aggregate**, **probabilistic** understanding and environment-oriented guidance—**without** labels, diagnoses, or identifying individuals.

> **This is not classification analytics.** It is a system for understanding and adapting to **cognitive diversity** in groups. Implementations that label people, rank individuals, or expose identities are **out of scope** and must be rejected in product and code review.

---

## 1. Cohort cognitive map

| Item | Implementation |
|------|------------------|
| **Input** | Multiple `CognitiveModel` instances (`buildCognitiveModel` in `src/core/cognitive-pipeline.ts`). |
| **Pool** | All `activations` from all models; vectors aligned to shared dimensionality. |
| **Projection** | Single shared 2D plane via the same PCA path as individuals (`projectPointsTo2dPca` + `normalizePlanarCoords` in `src/lib/cognitive-map-projection.ts`). |
| **Outputs** | `cohortPoints[]`, `cohortWeights[]` (one coordinate + weight per **pooled** activation, not per person). |
| **Regions** | `computeCognitiveRegions` (`src/lib/cognitive-regions.ts`) — same family of logic as individual maps; fallback single region if needed. |
| **Metrics** | `diversityIndex` (variance of normalized construct mass), `regionBalance` (entropy of regional weights), `dominantTraits[]`, `spreadMetrics` (span/variance in 2D). |
| **Type** | `CohortModel` in `src/cohort/types.ts`; builder `buildCohortCognitiveMap` in `src/cohort/cohort-cognitive-map.ts`. |

**Why aggregation reduces stigma:** The published map never attributes a point or region to a named person; it describes **pooled** construct mass and soft geography in trait space.

---

## 2. Environmental sensitivity profile

**Goal:** Turn **cohort-level** trait mass into **environment-level** hints (schedules, sensory context, communication norms)—not person-level needs.

| Concept (spec language) | PCMS construct drivers (illustrative) | Signal id (code) |
|---------------------------|--------------------------------------|------------------|
| Sensory sensitivity → noise / light | `sensory_sensitivity`, `environmental_granularity` | `sensory_load` |
| Distractibility → interruption sensitivity | `attention_switching`, `cognitive_breadth` | `interruption_load` |
| Sustained focus → uninterrupted time | `sustained_focus`, `precision_drive` | `uninterrupted_blocks` |
| Social intensity → group interaction load | `interpersonal_sensitivity`, `collaborative_openness`, `direct_communication` | `group_interaction_load` |
| Need for structure / novelty tension | `routine_affinity`, `system_thinking`, `linear_inference` (friction: `novelty_seeking` vs `routine_affinity`) | `structure_predictability` |
| Time / rhythm / advance notice | `temporal_perception`, `steady_pacing` | `temporal_cues` |
| Transitions, fewer simultaneous demands (aggregate regulatory salience) | `emotional_reactivity`, `interoceptive_awareness` | `affect_transition_space` |
| Linear path vs broad exploration in shared materials | `exploratory_breadth`, `linear_inference` | `pathway_flexibility` |

**Functions:** `deriveEnvironmentSignals`, `cohortTraitShares` in `src/cohort/environment-signals.ts`.

**Output shape:** `EnvironmentSignal[]` — each entry has `id`, `intensity`, `confidence`, `narrative`, `explanation`. Copy uses **may / benefit from / tends to**, not “people with X need Y”.

---

## 3. Interaction friction mapping

**Goal:** Describe **aggregate** tension between common interaction norms (diverse styles), not blame between people.

| Construct pair (code) | Notes |
|-------------------------|--------|
| `direct_communication` ↔ `interpersonal_sensitivity` | Directness vs attunement — see `FRICTION_SCENARIOS[0].explanation` |
| `novelty_seeking` ↔ `routine_affinity` | Exploration vs predictability |
| `attention_switching` ↔ `sustained_focus` | Fast context change vs long focus (“fast switching” vs sustained focus) |
| `exploratory_breadth` ↔ `linear_inference` | Wide search vs stepwise path |
| `detail_orientation` ↔ `associative_thinking` | Local precision vs wide linking |
| `verbal_semantic` ↔ `spatial_holistic` | Language-leaning vs spatial gestalt channel |
| `curiosity_intensity` ↔ `delay_gratification` | Go-deep-now vs defer for long-horizon structure |

Per-pair `explanation` and `suggestion` strings live in `FRICTION_SCENARIOS` (`src/cohort/interaction-friction.ts`).

**Function:** `mapInteractionFriction` with `DEFAULT_FRICTION_PAIRS` in `src/cohort/interaction-friction.ts`.

**Output:** `FrictionSignal[]` with `traits`, `strength`, `explanation`, `suggestion` — e.g. emphasis on shared agreements and explicit norms.

---

## 4. Pattern library (global learning)

**Goal:** Reuse **descriptive** co-activation patterns across sessions/cohorts; **no** diagnostic categories.

| Item | Implementation |
|------|----------------|
| **Store** | `src/core/patterns/pattern-store.ts` — in-process history, optional **context** tag (e.g. cohort type), no personal identifiers. |
| **Snapshot** | `getPatternLibrarySnapshot()` → `patterns`, `lastUpdated`, `totalSignatures`, `contexts`. |
| **Top patterns** | `getTopPatterns(limit)` by support. |
| **Cohort match** | `matchCohortToKnownPatterns` (`src/cohort/pattern-cohort-match.ts`) compares cohort `dominantTraits` to mined patterns — overlap with **aggregate** emphasis, not a match to a person. |

**Export alias:** `getPatternLibrary` in `src/cohort/index.ts` (same as `getPatternLibrarySnapshot`).

---

## 5. Early support signals (non-diagnostic, private)

**Goal:** Optional **individual** hints from field shape and pattern resonance—**without** diagnosis, labels, or public cohort exposure.

| Signal type | Meaning (heuristic) |
|-------------|---------------------|
| `activation_peak` | Steep dominance of one activation vs others. |
| `field_imbalance` | High spread of weights across many constructs. |
| `rare_pattern_resonance` | Resonance with less common global patterns (descriptive). |

**Function:** `computeEarlySupportSignals` in `src/cohort/early-support-signals.ts`.

**Critical:** Do **not** attach to cohort dashboards, exports, or shared URLs. UI: `SupportInsightsSection` on **private** `results` page only (`src/app/[locale]/results/page.tsx`).

---

## 6. UI integration (aggregate only)

| User-facing idea | Component / route |
|------------------|-------------------|
| **Cohort map** | `CohortInsightsDashboard` + `CohortCognitiveLandscapeRegions`; compact tabs in `CohortIntelligencePanel` (tab `map`). |
| **Environment insights** | Same dashboard (section + panel tab `environment`). |
| **Interaction dynamics** | Same dashboard (section + panel tab `dynamics`); pattern overlap note where applicable. |
| **Route** | `src/app/[locale]/cohort-insights/` (demo/aggregation page). |

All of the above are **aggregate**; they must not show per-user identification.

---

## 7. Language and framing (mandatory)

- Avoid clinical wording; avoid deterministic claims.
- Prefer **may**, **tends to**, **may benefit from**, **at the aggregate level**.
- Public strings: `sanitizeGuidanceText` (`src/cohort/ux-copy-safety.ts`) where applicable.

---

## 8. Validation (mandatory)

| Check | Mechanism |
|-------|-----------|
| **No individual exposure** | `assertNoIndividualPayload`, `validateCohortModelView` — reject payloads containing `userId`, `sessionId`, `email`, `participant_id` patterns in cohort views. |
| **Non-diagnostic language** | `BANNED_DIAGNOSTIC_TERMS` in `src/cohort/cohort-validation.ts` (includes e.g. `autism`, `adhd`, `disorder`, `diagnosis`); `validateCohortPayloadCopy`, `validateEnvironmentSignals`, `validateFrictionSignals`. |
| **Distribution / aggregate** | `validateAggregateStructure` — aligned `cohortPoints` / `cohortWeights`, regional trait mass ~normalized. |
| **Bundle** | `validateCohortIntelligenceBundle(model, env?, friction?)` before publishing aggregate JSON or public UI. |
| **Interpretability** | Environment and friction types include `explanation`; cohort model includes `summaryExplanation`. |

---

## 9. Ethical design principles (rationale)

1. **Aggregation avoids stigma** — Group views describe **distributions** and **environments**, not who “is” a type.
2. **Environment-first** — Lower-risk, equitable levers (predictability, clarity, sensory steadiness) help many people without singling anyone out.
3. **No classification product** — We do not sort, rank, or label people for analytics; we support **understanding and adaptation**.

**Related:** [Designing for support without labels](./DESIGNING-SUPPORT-WITHOUT-LABELS.md), [Ethics](./ethics.md).

---

## Spec / prompt coverage (original Cohort Intelligence brief)

| Requirement | Status |
|--------------|--------|
| Cohort cognitive map (pooled activations, shared 2D, `cohortPoints` / `cohortWeights`, regions, diversity, balance, dominant traits) | **Yes** — `buildCohortCognitiveMap` |
| Environmental sensitivity profile (aggregate “may benefit” copy) | **Yes** — `deriveEnvironmentSignals`; extended signal set in `SIGNAL_DRIVERS` |
| Interaction friction (pairs, non-blaming) | **Yes** — `mapInteractionFriction` + `FRICTION_SCENARIOS` |
| Global pattern library + `matchCohortToKnownPatterns` | **Yes** — `pattern-store`, `getPatternLibrary` / `getPatternLibrarySnapshot` |
| Early support signals (private only) | **Yes** — `computeEarlySupportSignals`, results page only |
| UI: Cohort / Environment / Dynamics (aggregate) | **Yes** — `CohortInsightsDashboard`, `CohortIntelligencePanel` |
| Language: may / benefit / no deterministic claims | **Yes** — copy + `validateCohortPayloadCopy` / banned terms |
| Validation: no individual re-identification, non-diagnostic terms, distribution check, interpretability | **Yes** — `cohort-validation` |
| Documentation | **Yes** — this file + `DESIGNING-SUPPORT-WITHOUT-LABELS.md` + `data-model` cohort note |

**Not in automated scope:** server-side k-anonymity, legal review of copy in your jurisdiction, or data governance for your study—those stay institutional. The **implementation rejects** label/rank/identity-in-cohort per code paths and tests described above; always review product use with your ethics process.

## Rejected implementations (explicit non-goals)

- Labelling or diagnosing individuals from cohort data.
- Ranking or scoring people within a cohort for display to others.
- Exposing session handles, emails, or device identifiers in cohort exports.
- Presenting early support signals in any **shared** or **cohort** view.

---

## Module index (source)

| Area | Path |
|------|------|
| Cohort model | `src/cohort/cohort-cognitive-map.ts`, `src/cohort/types.ts` |
| Environment | `src/cohort/environment-signals.ts` |
| Friction | `src/cohort/interaction-friction.ts` |
| Patterns | `src/core/patterns/pattern-store.ts`, `src/cohort/pattern-cohort-match.ts` |
| Early support | `src/cohort/early-support-signals.ts` |
| Validation | `src/cohort/cohort-validation.ts` |
| UX copy / insights | `src/cohort/ux-insights.ts`, `src/cohort/ux-copy-safety.ts` |
| Tests | `src/cohort/__tests__/cohort-intelligence.test.ts` |
