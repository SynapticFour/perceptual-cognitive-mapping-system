# Adaptive questioning engine — design, implementation, and prompt alignment

This document specifies the **offline, deterministic** adaptive engine for PCMS routing dimensions **F–V**, maps it to a portable **algorithm description**, and records **objective** alignment with a generic “minimize questions / maximize confidence” specification.

## 1. Data structures

```text
QuestionBank: AssessmentQuestion[]
  — each item: id, dimensionWeights[F..V], informationGain, type ∈ {core, refinement}, tags, reverseScored, responseScale?

State:
  answeredIds: Set<questionId>
  history: QuestionResponse[]   // ordered
  phase: core | refinement | complete
  culturalContext: universal | ghana | western

Per dimension d ∈ {F..V} (after each answer), derived offline:
  mean01[d]           — weighted mean of reverse-adjusted, scale-normalized responses (w ≥ 0.3)
  varianceW[d]        — population variance of weighted contributions (same stream as consistency)
  confidence[d]       — see §2 (finalConfidence in scoring model)
  contributingItems[d] — count of items with w_d ≥ 0.3

Coverage vector (routing):
  coverage[d] = confidence[d]   // used for thresholds and UI

Config:
  τ : confidenceThreshold       // default 0.75
  maxCore, maxRefinement, hardCap (e.g. 30)
  stoppingRule: majority_dimensions | all_dimensions
```

## 2. Confidence definition (implemented)

For each dimension **d**, confidence is **not** a raw count; it combines **evidence strength** (number and quality of loadings) with **response consistency**:

1. **Effective evidence** — \( \sum_i w_{i,d}^2 \) over answered items (CTT-style).
2. **Reliability** — \( \mathrm{evidence} / (\mathrm{evidence} + k) \) with Bayesian prior \(k\) (default 0.5).
3. **Consistency** — \( 1 - \mathrm{Var}(\text{weighted adjusted responses}) \) when at least two contributions exist; else 1.
4. **Combined** — reliability × clamp(consistency); capped until ≥2 **strong** loadings (\(w>0.5\)) per dimension.

This matches the requirement “function of number of answers **and** consistency of answers” in a **research-conservative** way.

Full formulas: `src/scoring/scoring-model.ts` (`calculateResearchConfidence`).

## 3. Question selection (implemented)

### Core phase

Candidates: unanswered **core** items.

Score(item) =
  `informationGain`
  + Σ\_tags \( w \cdot \max(0, (3 - \mathrm{count}_\mathrm{tag}) \cdot 0.2) \)  — **balance** under-covered dimensions  
  + Σ\_tags \( w \cdot \max(0, \tau - \mathrm{coverage}[\mathrm{tag}]) \cdot 0.35 \)  — **target low confidence** (added to align with adaptive specs)

Pick **highest** score (deterministic tie-break: sort).

### Refinement phase

1. Choose **lowest** `coverage[d]` among dimensions still below **τ** (`getNextTargetTag`).
2. Among **refinement** items loading on that dimension, score = \(2 \cdot w\_\mathrm{target} + \mathrm{informationGain}\); pick **highest** — favours **high discrimination on the weak dimension** (proxy for uncertainty reduction).

## 4. Stopping criteria (implemented)

| Mode | Global stop in refinement (no focus dimensions) |
|------|--------------------------------------------------|
| **majority_dimensions** (default) | ≥ **70%** of the 10 routing dimensions have `coverage[d] ≥ τ` **or** max refinement questions **or** hard cap |
| **all_dimensions** | **All** dimensions have `coverage[d] ≥ τ` **or** same caps |

Core → refinement transition: unchanged (e.g. core cap or early jump when ≥3 dimensions high and ≥10 core answers).

Configure: `new AdaptiveQuestionnaireEngine(ctx, { stoppingRule: 'all_dimensions' })`.

## 5. Offline / deterministic

- No network calls in selection or scoring.
- **Exception:** `getAssessmentReport()` uses `Math.random()` only for a **session id string** — does not affect question order or scores.

## 6. Algorithm pseudocode

```text
procedure SELECT_NEXT(state, bank, config):
  if state.complete or |history| >= hardCap:
    return COMPLETE

  coverage := SCORING(history).finalConfidencePerDimension   // F..V

  if CORE_PHASE:
    if SHOULD_EXIT_CORE(state, coverage, config):
      state.phase := REFINEMENT
    else:
      candidates := filter core items not in answeredIds
      if empty: return COMPLETE
      for each q in candidates:
        score[q] := IG(q)
               + BALANCE(q, countPerTag)
               + GAP(q, coverage, τ)          // low-confidence boost
      return argmax score[q]

  if REFINEMENT_PHASE:
    if STOP_REFINEMENT(coverage, config):
      return COMPLETE
    target := argmin coverage[d] among d with coverage[d] < τ
    if no target and not focus mode: fallback pool
    candidates := refinement items loading target, not answered
    if empty: return COMPLETE
    return argmax ( 2 * w_target + IG )
```

## 7. Example flow (abbreviated)

1. **Start:** empty history → core; pick core item with high IG + balance + gap terms.
2. After each answer, recompute **coverage**; core continues until core limits or switch to refinement.
3. **Refinement:** repeatedly pick dimension with smallest coverage below τ; ask refinement item with strong loading on that dimension.
4. **Stop** when majority/all rule satisfied (per config) or caps hit.

## 8. Objective “prompt vs PCMS” checklist

| Requirement | Before this doc iteration | After code + doc |
|-------------|---------------------------|-------------------|
| Track mean / variance / confidence per dimension | Confidence yes; mean/variance implicit in scoring | **Exposed** via `getCompletionStats().perDimensionRouting` + `buildPerDimensionRoutingDiagnostics` |
| Confidence = f(n, consistency) | Yes (evidence + consistency) | Unchanged; **documented** |
| Prioritize low-confidence dimensions | Strong in **refinement**; core used **counts** only | Core also boosts items loading on **low coverage** (gap term) |
| Prioritize uncertainty reduction | Refinement uses target tag + IG | Unchanged; **documented** |
| Stop: all dims high **or** max Q | **Majority** (7/10) by default, not “all” | **`stoppingRule: 'all_dimensions'`** available |
| Offline deterministic | Yes (except report id random) | **Documented** |

**Verdict:** The system is **objectively closer** to the generic prompt: first-class **mean/variance/confidence** visibility, **stricter stopping** optional, and **core-phase** selection now considers **current confidence gaps**, not only balance counts.

## 9. Related files

| Piece | Path |
|--------|------|
| Engine | `src/adaptive/questionnaire-engine.ts` |
| Coverage / thresholds | `src/adaptive/coverage-model.ts` |
| Confidence + consistency | `src/scoring/scoring-model.ts` |
| Mean / variance / confidence export | `src/adaptive/routing-diagnostics.ts` |
