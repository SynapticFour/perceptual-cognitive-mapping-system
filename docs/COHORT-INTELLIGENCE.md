# Cohort Intelligence Layer

This document describes the **aggregate-only** cohort layer on top of individual cognitive maps. It supports group-level understanding and environment adaptation **without** labels, diagnoses, or identifying individuals.

## Cohort-Level Cognitive Mapping

- **Input**: multiple `CognitiveModel` instances (each built from a completed questionnaire session).
- **Process**: all activations are pooled, vectors are aligned to a shared dimensionality, and a **single** PCA projection places every activation in one shared 2D plane. Regions are detected with the same clustering approach as individual maps (`computeCognitiveRegions`).
- **Output**: `CohortModel` — regions with trait distributions, `diversityIndex` (variance of normalized construct mass), `regionBalance` (entropy of regional weights), `dominantTraits`, and `spreadMetrics`.
- **Why aggregation avoids stigma**: the view never attributes a point or region to a named person; it describes **pooled** construct mass and soft geography in trait space.

## Environment Adaptation Without Labels

- **Environment signals** translate **cohort-level** trait mass into tentative environment hypotheses (e.g. sensory load, interruption load, need for uninterrupted blocks).
- Copy is framed with **may / tends to / benefit from**, not deterministic claims.
- **Rationale**: changing the environment is often lower-risk and more equitable than inferring individual needs from group data.

## Interaction Dynamics

- **Friction mapping** compares predefined construct pairs (e.g. direct communication vs interpersonal sensitivity) when each construct is salient in **different** aggregate regions—signalling diverse norms, not conflict between people.
- Suggestions point to **shared agreements** (norms, agendas), not blame.

## Ethical Design Principles

1. **No individual exposure**: cohort exports must not contain user ids, emails, or session handles. Use `validateCohortModelView` and `assertNoIndividualPayload` before publishing aggregate JSON.
2. **Non-diagnostic language**: `BANNED_DIAGNOSTIC_TERMS` guards against clinical wording in public strings (`validateCohortPayloadCopy`, `validateEnvironmentSignals`, `validateFrictionSignals`).
3. **Distribution check**: `validateAggregateStructure` verifies aligned `cohortPoints` / `cohortWeights` and normalized regional trait mass. Use **`validateCohortIntelligenceBundle`** to run structure + language checks on a `CohortModel` plus optional environment and friction signals before export or public UI.
4. **Interpretability**: each signal type includes an `explanation` field describing what was measured in plain language.

## Pattern Library (Global)

- `recordUserSignatureWithContext` stores anonymized co-activation history with an optional **context tag** (e.g. cohort type)—never personal identifiers.
- `getPatternLibrarySnapshot` exposes support counts and last update time for research tooling.
- Patterns remain **descriptive** (trait co-occurrence), not diagnostic categories.

## Early Support Signals (Private)

- `computeEarlySupportSignals` operates on a **single** `CognitiveModel` and is meant for **authorized individual flows only**.
- **Do not** show these signals on cohort dashboards or in shared cohort exports.

## UI: Cohort Map · Environment Insights · Interaction Dynamics

- **`CohortInsightsDashboard`** (`src/components/cohort/CohortInsightsDashboard.tsx`) is the guidance-oriented cohort view: regional landscape (no individual points), key insights (capped), optional environment recommendation cards, and neutral interaction signals—with confidence bands and “Why am I seeing this?” expanders.
- `CohortIntelligencePanel` remains a compact three-tab aggregate panel for embedding.
- Individual-only **Support insights** live in `SupportInsightsSection` on the private results page—not on cohort views.
- See also [Designing for support without labels](./DESIGNING-SUPPORT-WITHOUT-LABELS.md).
