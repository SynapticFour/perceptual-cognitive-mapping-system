# Research-grade profiling roadmap

This document tracks epics and concrete tickets for a **globally usable, culturally adaptive, offline-capable** cognitive profiling stack. It complements `docs/GROUP-COGNITIVE-ANALYSIS.md`, `docs/REGIONAL-STEM-RESOLUTION.md`, and `docs/EIGHT_CONSTRUCT_MODEL.md`.

## Principles

- **Non-diagnostic:** descriptive routing and confidence only; no disorder or aptitude labels in product copy.
- **WEIRD-aware:** multi-stem banks, multi-site validation plans, avoid conflating “Western English” with human universals.
- **Reproducible:** every saved session records **bank id**, **stem region**, and **adaptive diagnostics** where applicable.

---

## Epic A — Session persistence & reproducibility

| ID | Ticket | Status |
|----|--------|--------|
| A1 | Persist **`profileAdaptiveSummary`** (per-dim `n`, mean, variance, contradiction, profile confidence + session aggregates) on `StoredPipelineSession` | **Done** (this wave) |
| A2 | Persist **`stemRegionUsed`** (`global` \| `ghana` \| `west_africa`) from `displayStemRegionForUiLocale(locale)` + env override | **Done** (this wave) |
| A3 | Persist **`questionBankId`** + **`bankVersion`** via `inferQuestionBankMeta` from answered items | **Done** (this wave) |
| A4 | Bump share / export codecs if compact payloads must carry A1–A3 (backward-compatible version field) | **Backlog** |
| A5 | Mirror new fields in **IndexedDB** `OfflineSession.profile` sync path; **ZIP + full-session JSON + pending-queue download** | **Done** |

---

## Epic B — Two “confidence” stories (documentation + optional UI)

Two complementary signals exist in code:

1. **`scoringResult.confidenceComponents`** (`calculateResearchConfidence`) — evidence strength, Bayesian reliability shrinkage, response consistency (variance across weighted items), minimum-sample gates. **Use for:** reporting “how much item-level evidence supports each F–V axis.”
2. **`profileAdaptiveSummary`** (`computeProfileAdaptiveSnapshot`) — within-session mean/variance and reverse-split **contradiction** per routing dimension; drives **`profile_diagnostic`** selection. **Use for:** “how stable is this person’s pattern *within this session* for targeting the next item.”

| ID | Ticket | Status |
|----|--------|--------|
| B1 | Methods appendix / researcher one-pager explaining when to cite (1) vs (2) | **Done** (this doc §Epic B) |
| B2 | Optional results footnote when `profileAdaptiveSummary` present | **Backlog** |
| B3 | Correlation / calibration study (offline analysis repo, not app) | **Backlog** |

---

## Epic C — Question bank & cultural adaptation

| ID | Ticket | Status |
|----|--------|--------|
| C1 | CI validation: 200 × 8 dims × 3 stems (`cultural-adaptive-v1`) | **Partial** (loader asserts; add CI script hook) |
| C2 | Readability audit: simple language, concrete behaviours | **Backlog** |
| C3 | `cultural-adaptive-v2` versioning when stems change materially | **Backlog** |
| C4 | Optional new `QuestionStemRegion` bundles (same `stemVariants` shape) | **Backlog** |

---

## Epic D — Adaptive engine

| ID | Ticket | Status |
|----|--------|--------|
| D1 | Item-pair contradiction flags (research-only, same construct) | **Backlog** |
| D2 | Env-tunable `ProfileAdaptiveConfig` for field studies | **Backlog** |
| D3 | Diminishing-returns / stop rules telemetry in exports | **Backlog** |

---

## Epic E — Group & cohort

| ID | Ticket | Status |
|----|--------|--------|
| E1 | Foundation: `group-cognitive-analysis` clusters + diversity + Step 4 env mismatch | **Done** |
| E2 | Privacy-tier API (aggregate-only server path) | **Backlog** |

---

## Epic F — Offline

| ID | Ticket | Status |
|----|--------|--------|
| F1 | IndexedDB bank cache + offline sessions | **Done** (existing) |
| F2 | “Export full session JSON” including A1–A3 fields (results button + ZIP `full-session.json` + offline queue) | **Done** |
| F3 | Service worker / first-visit bundled bank guarantee | **Backlog** |

---

## Working agreement

- **Ship order:** persistence (A) → exports (A4, A5, F2) → psychometric tooling outside app (IRT / DIF).
- **Versioning:** `PIPELINE_STORAGE_VERSION` stays **3** while new fields remain optional on `StoredPipelineSession`; introduce v4 only if a breaking shape change is required.
