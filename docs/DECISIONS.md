# Architectural Decision Record (ADR)

## PCMS + ATLAS

This file records significant architectural and research decisions.

**Before reversing or modifying any decision, add a new ADR — do not delete the old one.**

---

## ADR-001: ATLAS lives in the PCMS monorepo

**Date:** 2025  
**Status:** Accepted  
**Decision:** ATLAS (Adaptive Trait Landscape Architecture System) is developed in the same GitHub repository as PCMS, under clearly separated directories (`src/atlas/`, `content/questions/atlas-v1/`), not in a separate repo.  
**Rationale:** Infrastructure (adaptive engine, 3D terrain, database, cultural adaptation) is shared. Separating repos during the research phase creates unnecessary integration overhead for a single team.  
**Reversal condition:** If ATLAS grows into a standalone product with a different team, or if the codebases diverge significantly, extract at that point with a documented migration plan.

---

## ADR-002: PCMS and ATLAS use separate scoring pipelines

**Date:** 2025  
**Status:** Accepted  
**Decision:** ATLAS has its own scoring pipeline (`src/atlas/scoring/`). PCMS dimension scores (F–V) are never used directly as ATLAS micro-trait scores, even where constructs overlap.  
**Rationale:** The instruments measure related but distinct constructs. Mixing pipelines would invalidate both. Cross-instrument correlations are a research output, not an implementation shortcut.  
**Reversal condition:** Only after a published measurement invariance study demonstrates score comparability.

---

## ADR-003: Self-nomination is auxiliary, not scored

**Date:** 2025  
**Status:** Accepted  
**Decision:** The self-nomination module (where users select experiential descriptors that resonate) contributes NO input to dimension scores or terrain generation. It is stored separately and used only for convergent validity research.  
**Rationale:** Self-nomination is subject to selection bias, social desirability, and cultural priming. Incorporating it into scoring would compromise the psychometric integrity of the instrument.  
**Reversal condition:** Only after a peer-reviewed study demonstrates that self-nomination adds incremental predictive validity over questionnaire scores alone.

---

## ADR-004: Imputation uses an offline-computed covariance prior

**Date:** 2025  
**Status:** Accepted  
**Decision:** The covariance matrix used for micro-trait imputation is computed offline from normative data and stored as `content/atlas/covariance/prior_v1_{locale}.json`. It is not computed live from incoming session data.  
**Rationale:** Live covariance estimation from streaming data is numerically unstable and could introduce feedback loops. The prior is a research artifact, not a model weight.  
**Reversal condition:** Never for the core prior. A live "posterior update" layer may be added on top, but only with a separate validation study.

---

## ADR-005: No clinical or diagnostic language in user-facing UI

**Date:** 2025  
**Status:** Accepted — non-negotiable  
**Decision:** No diagnosis name (autism, ADHD, dyslexia, etc.), no clinical term (disorder, deficit, impairment), and no cutoff-based classification ("you have high X") appears in any user-facing interface, results page, or exported file.  
**Rationale:** The system is explicitly non-diagnostic. Using diagnostic language would (1) mislead users, (2) potentially cause harm, (3) violate the research ethics framework, and (4) create legal liability.  
**Reversal condition:** Never for user-facing UI. Research documentation may discuss clinical construct relationships in appropriate scientific framing.

---

## ADR-006: Cultural adaptation is locale-specific, not translated

**Date:** 2025  
**Status:** Accepted  
**Decision:** Question banks for different cultural contexts are *adapted*, not translated. A Ghana question may describe a market scenario where an EN question describes an office — this is intentional.  
**Rationale:** Translation preserves surface form but can carry cultural assumptions. Adaptation targets ecological validity in the target context.  
**Reversal condition:** Only for languages where the cultural context is demonstrably identical to an existing bank (very rare).

---

## ADR-007: T, I, A, V dimensions are "research-facing" until question banks are complete

**Date:** 2025 (UI clarification 2026)  
**Status:** Accepted  
**Decision:** Dimensions T (Temporal), I (Interoceptive), A (Associative), V (Verbal-Spatial) remain **research-facing**: they are not presented as peers to the six primary routing dimensions (F, P, S, E, R, C) in the default results layout. In the primary results experience, **F–C** bars and insight cards appear first; **T–V** appear in a **default-collapsed** disclosure (`<details>`) with copy that states lower coverage and research-facing status. Radar, vector exports, researcher tooling, and `EightConstructSummary` may still show all ten keys where appropriate.  
**Rationale:** With historically lower item counts per T–V axis, confidence is often too low to present those four on equal footing with the core routing dimensions. Collapsing them preserves transparency for curious users without implying equal psychometric standing.  
**Reversal condition:** When each of T, I, A, V has ≥20 items in the question bank **and** test-retest reliability ≥0.70 has been demonstrated, the product may promote them to the same visual tier as F–C (or document a new ADR if policy changes).

---

## ADR-008: The 3D terrain is a visualisation, not a score

**Date:** 2025  
**Status:** Accepted  
**Decision:** The 3D terrain map is a visual metaphor for the multi-dimensional profile. Its exact topography (peak positions, ridge heights) is not a psychometric output and should not be cited as such. Only dimension scores and their confidence intervals are psychometric outputs.  
**Rationale:** The terrain uses a density-based projection with aesthetic parameters (power curve 0.65, ridge sharpening). These choices affect appearance, not measurement.  
**Reversal condition:** If a peer-reviewed study demonstrates that terrain features are reliable and valid indicators of specific constructs, those features may be treated as scored outputs at that point.

---
