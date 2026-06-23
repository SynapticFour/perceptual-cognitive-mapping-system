# PCMS Academic Validation & Cultural Adaptation Programme

**Perceptual & Cognitive Mapping System (PCMS)**  
**Document type:** Public research and implementation roadmap  
**Audience:** University ethics boards (IRB/REC), funding reviewers, cross-cultural psychology collaborators, institutional partners  
**Status:** Living document — version tracked in Git  
**Companion documents:** [`VALIDATION_PROTOCOL.md`](./VALIDATION_PROTOCOL.md), [`RESEARCH_ACTION_PLAN.md`](./RESEARCH_ACTION_PLAN.md), [`DECISIONS.md`](./DECISIONS.md), [`I18N.md`](./I18N.md)

---

## 1. Purpose and scope

PCMS is a **non-diagnostic**, **dimensional** self-report instrument for mapping cognitive and experiential tendencies in continuous space. It is **not** a clinical diagnostic tool, an eligibility test for services, or a substitute for neuropsychological assessment.

This programme document separates two workstreams that are often conflated but must remain distinct in publications and ethics applications:

| Workstream | Question it answers | Primary outputs |
|------------|---------------------|-----------------|
| **A — Psychometric validation** | Does the instrument measure stable, interpretable constructs with acceptable reliability and validity? | Pre-registration, pilot data, CFA/IRT, norms, peer-reviewed paper |
| **B — Cultural adaptation & localization** | Are items and UI **meaningful, acceptable, and ecologically valid** in a target community? | Adapted stems, translated UI, cognitive interviews, local expert review, regional ethics copy |

**Workstream A can proceed in English and German** with convenience samples while **Workstream B runs in parallel** for Ghana, Francophone West Africa, and East Africa. Neither stream replaces the other.

---

## 2. Instrument architecture (what is being validated)

### 2.1 Routing model (F–V)

PCMS uses **ten routing dimensions** (F Focus, P Pattern, S Sensory, E Social energy, R Structure, C Cognitive flexibility, T Temporal, I Interoceptive, A Associative, V Verbal–spatial). Scores are **continuous** (0–1 routing posteriors with confidence), not categorical labels.

**ADR-007:** Dimensions T–V are **research-facing** in the default results UI until each axis has ≥20 items **and** test–retest reliability ≥0.70 per locale.

### 2.2 Question banks (versioned)

| Bank ID | Items | Role in validation |
|---------|-------|-------------------|
| `universal` classic (core + refinement + TIAV) | ~130 | Primary F–V adaptive instrument |
| `ghana` extension | +25 classic, +16 TIAV (expanding) | Culturally adapted stems |
| `global-behavioral-v2` | 200 (8 constructs, Likert-3) | Separate CFA/IRT track |
| `cultural-adaptive-v1` | 200 × regional English stems | Cross-site behavioural validation |

All banks record **`questionBankId`**, **`bankVersion`**, and **`stemRegionUsed`** on completed sessions for reproducibility.

### 2.3 What is **not** validated today

Stated plainly for ethics and funders (see also [`VALIDATION_PROTOCOL.md`](./VALIDATION_PROTOCOL.md)):

- Scoring weights are **literature- and design-based**, not empirically calibrated on a PCMS normative corpus
- No published internal consistency (α, ω) from PCMS field data
- No test–retest reliability, convergent validity, or local norms
- No IRB-approved primary study sample; live-site data before ethics approval is **pilot/informal only**
- No peer-reviewed publication

---

## Part A — Psychometric validation programme

### A.1 Research questions (validation)

These are the **primary scientific questions** for Phase 1–2. They should appear in OSF pre-registration.

**RQ1 — Structure:** Do PCMS item pools support the hypothesized **multi-dimensional** structure (10-factor routing model and/or 8-construct behavioural model) within each locale?

**RQ2 — Reliability:** Do dimension-level scores show **acceptable internal consistency** (target: ω ≥ 0.65–0.70 per dimension at pilot; ω ≥ 0.70 after item reduction) and **test–retest stability** (target: ICC ≥ 0.70 over 2 weeks)?

**RQ3 — Convergent validity:** Do PCMS dimensions correlate with established instruments **where theory predicts** (e.g. S with HSPS; E with BIS/BAS reward; F with attentional control; I with MAIA subscales)?

**RQ4 — Discriminant validity:** Are theoretically unrelated dimension pairs **weakly** correlated (e.g. |r| < 0.25 where specified a priori)?

**RQ5 — Adaptive efficiency:** Does the adaptive engine reach confidence thresholds with **fewer items** than a fixed-length form while preserving score stability?

**RQ6 — Continuity:** Are score distributions **continuous** rather than bimodally clustered at arbitrary cutoffs (exploratory; informs non-categorical framing)?

**RQ7 — Measurement invariance (cross-locale):** After adaptation, do configural and metric invariance hold across **language/region groups**? Scalar invariance is **not assumed**; mean comparisons require explicit invariance evidence.

### A.2 Governance and roles

| Step | Who | Context | Deliverable |
|------|-----|---------|-------------|
| Pre-registration | Lead PI | OSF / AsPredicted | Hypotheses, N, analysis plan, instruments |
| IRB / REC | PI + institution | University or partner hospital | Approved protocol, consent templates |
| Bank freeze | PI + methodologist | Before any primary data | Tagged Git release, `meta.json` version |
| Data collection | Research assistants | Online or field, pseudonymous | Session exports (JSON/ZIP) |
| Psychometrics | Statistician (offline) | R (`psych`, `mirt`) or Python | CFA, IRT, DIF, reliability tables |
| Publication | PI + co-authors | Open science package | Paper + OSF materials |

### A.3 Phase 1 — Minimum credible evidence (months 0–12)

**Sample:** N = **150 adults per locale** (convenience; document inclusion/exclusion).  
**Locales (initial):** English (UK/US/online), German (DE/AT/CH), Ghana-oriented deployment (Twi/English).

| Step | Method | Acceptance criterion |
|------|--------|----------------------|
| 1.1 | Lock question bank | No item changes during collection |
| 1.2 | Internal consistency | α and ω per dimension; flag items with item–total r < 0.20 |
| 1.3 | Test–retest | N = 40/locale, 2-week interval; ICC ≥ 0.70 |
| 1.4 | Convergent validity | Pre-registered correlations with HSPS, BIS/BAS, ACS, MAIA-short where available |
| 1.5 | Local norms | Mean, SD per dimension per locale; no cross-locale mean claims without invariance |

**Analysis is offline** — not embedded in the production app. Session exports must include `profileAdaptiveSummary`, `stemRegionUsed`, `adaptiveStopTelemetry`, and bank metadata.

### A.4 Phase 2 — Calibration and invariance (months 12–24)

| Step | Method | Notes |
|------|--------|-------|
| 2.1 | CFA | Eight-factor (`global_v2`) and/or 10-factor classic model |
| 2.2 | IRT (GRM / 2PL) | Populate `irt_a`, `irt_b` in `schema.json` |
| 2.3 | DIF | Mantel–Haenszel; flag |ETS D| > 1.0 for cultural review |
| 2.4 | Multi-group CFA | Configural → metric → scalar; document non-invariant items |
| 2.5 | Publication | Target: *Assessment*, *Journal of Cross-Cultural Psychology*, or *Frontiers in Psychology* |

### A.5 Phase 3 — ATLAS (separate programme)

High-dimensional experiential mapping (60–120 micro-traits) begins **only after** PCMS Phase 1 evidence exists. See [`ATLAS.md`](./ATLAS.md). ATLAS uses a **separate scoring pipeline** (ADR-002).

---

## Part B — Cultural adaptation & localization programme

### B.1 Principles (non-negotiable)

1. **Adaptation ≠ translation** (ADR-006): Items are rewritten for ecological validity (market vs office, communal time vs clock time), not word-for-word translation of Western scenarios.
2. **No diagnostic language** in any locale (ADR-005).
3. **Native speaker review** is required before calling a locale “validated for deployment” — draft UI/strings may ship with `_localeReview: PENDING` banners.
4. **Oral administration** may be required where literacy is mixed; Likert-3 (`global_v2`) supports audio-friendly scales.

### B.2 Adaptation workflow (per locale/region)

Follow COSMIN-inspired content validity practice and Beaton-style translation where a new language version is created:

```
1. Construct definition workshop (local psychologists + community advisors)
2. Item review / new stem writing for target context
3. Forward translation → back-translation OR bilingual expert panel (for new languages)
4. Cognitive interviews (n ≈ 5–10 per locale; record and transcribe)
5. Pilot (n ≈ 30); revise items with item–total and comprehension feedback
6. Field study (Phase 1 N) — only after IRB + bank freeze
7. Regional norms + invariance testing vs reference locale
```

### B.3 Current locale status

| UI locale | Language | Question stems | Ethics / review |
|-----------|----------|----------------|-----------------|
| `en` | English | Canonical | Production |
| `de` | German | Classic + TIAV (DE) | Production |
| `tw` | Twi / Akan | English (stems pending) | Native review pending |
| `wo` | Wolof | English (stems pending) | Native review pending |
| `fr` | French | Classic FR draft; regional stems fallback | Native review pending |
| `sw` | Swahili | Classic SW draft; regional stems fallback | Native review pending |

### B.4 Regional stem bundles (`cultural-adaptive-v1`)

English regional paraphrases exist for `global`, `ghana`, and `west_africa`. Extended bundles:

| Stem region | Intended deployment | Fallback chain |
|-------------|---------------------|----------------|
| `francophone_west_africa` | Senegal, Côte d'Ivoire, Mali, Burkina Faso, Benin, Togo, Niger (French UI) | → `west_africa` → `global` |
| `east_africa` | Kenya, Tanzania, Uganda, Rwanda (Swahili UI) | → `global` |

Dedicated stems for these regions are **drafted incrementally**; fallback ensures the instrument remains usable while adaptation proceeds.

---

## Part C — Regional deployment profiles

### C.1 Francophone West Africa

**Recommended primary UI languages:** **French (`fr`)** and **Wolof (`wo`)**.

| Factor | Implication for PCMS |
|--------|----------------------|
| French is the language of education, administration, and health communication in much of Francophone WA | **French UI is the highest-leverage single addition** for institutional adoption |
| Wolof is the largest first language in Senegal (~5–7M); Wolof UI already exists as draft | Pair **fr + wo** for Senegal-first pilots; Bambara (`bm`) as future extension for Mali |
| Stigma around psychiatric labels is high | PCMS non-label dimensional framing is a **feature**, not a limitation — must remain explicit in ethics copy |
| Oral culture & communal time | Items should reference **tontines, marchés, famille élargie, saison des pluies** — not only office scenarios |
| Existing psychometric work | World Bank ESTEEM scales validated in Hausa, Yoruba, Swahili, French across SSA — precedent for multi-language adult self-report |

**Adoption enablers already in PCMS:** offline mode, Likert-3 bank, aggregate cohort view (no individual ranking), GDPR-style consent ladder, `west_africa` English stems as interim.

**Gaps before field pilot:** French UI review; francophone stem bundle authoring; IRB via West African university partner; cognitive interviews in Dakar or Abidjan.

### C.2 East Africa (Swahili / East Africa)

**Recommended primary UI language:** **Swahili (`sw`)**. English (`en`) remains co-official for universities and H3Africa-style research.

| Factor | Implication for PCMS |
|--------|----------------------|
| Swahili (~100M+ L2 speakers) is the regional lingua franca | **Swahili UI unlocks Kenya, Tanzania, Uganda** for community-facing deployment |
| Strong validation culture for translated screens (e.g. K6 in Swahili, GHQ-12) | Follow established forward–back translation + CFA pattern |
| Urban–rural literacy variation | Offer **audio Likert-3** and facilitator-led (`field-import`) workflows |
| Communal identity ("Ubuntu" parallels in Swahili: *ubuntu* / *umoja* framing) | Social energy (E) items should reference **harambee, chama, ujamaa** contexts cautiously — expert review required |

**Adoption enablers:** same offline/export stack; `east_africa` stem region with global fallback; research ZIP for university analysis.

**Gaps:** Swahili UI native review; east_africa stem authoring; local IRB (e.g. UoN, MUHAS); convergent instruments available in Swahili (K6, not necessarily MAIA).

### C.3 Ghana (existing anchor)

Continue expanding `ghana/tiav-ghana-v1.json` toward **~20 items per T/I/A/V**; balance `ghana/core.json` (currently uneven across dimensions). Twi UI review per [`LOCALE-NATIVE-REVIEW-CHECKLIST.md`](./LOCALE-NATIVE-REVIEW-CHECKLIST.md).

---

## Part D — Deliverables checklist

### For ethics submission

- [ ] This document + [`VALIDATION_PROTOCOL.md`](./VALIDATION_PROTOCOL.md)
- [ ] [`ethics.md`](./ethics.md) and locale-specific consent strings
- [ ] OSF pre-registration link
- [ ] Data flow diagram ([`data-model.md`](./data-model.md))
- [ ] Explicit “not diagnostic” statement and referral pathways

### For publication (Phase 1)

- [ ] Frozen item bank on OSF
- [ ] Anonymised dataset + analysis scripts
- [ ] Reliability and validity tables per locale
- [ ] Limitations section (WEIRD origins, convenience sampling, no predictive validity)

### For localization sign-off (per locale)

- [ ] `_localeReview.reviewStatus: APPROVED` in `messages/<locale>.json`
- [ ] Cognitive interview report
- [ ] Question stem bank in target language (or approved bilingual protocol)
- [ ] Ethics copy reviewed by local advisor

---

## Part E — Technical enablers (maintainer reference)

Implementation priorities that **do not** require expert panels are tracked in [`TECHNICAL_IMPLEMENTATION_BACKLOG.md`](./TECHNICAL_IMPLEMENTATION_BACKLOG.md) and [`RESEARCH-ROADMAP.md`](./RESEARCH-ROADMAP.md).

Psychometric calibration itself remains **offline** (R/Python on exported sessions).

---

## References (indicative)

- American Educational Research Association et al. (2014). *Standards for Educational and Psychological Testing.*
- Beaton, D. E. et al. (2000). Guidelines for the process of cross-cultural adaptation of self-report measures. *Spine.*
- Clark, L. A. & Watson, D. (2019). Constructing validity: New developments in creating objective measuring instruments. *Psychological Assessment.*
- Kotov, R. et al. (2017). The Hierarchical Taxonomy of Psychopathology (HiTOP). *Journal of Abnormal Psychology.*
- Mehling, W. E. et al. (2018). MAIA-2. *PLOS ONE.*
- Muthén, B. & Muthén, L. (2018). Mplus user’s guide (measurement invariance).
- Terwee, C. B. et al. (2018). COSMIN methodology for content validity. *Quality of Life Research.*
- Wakschlag, L. S. et al. (2019). Dimensional approaches to autism and ADHD. *Journal of the American Academy of Child & Adolescent Psychiatry.*

---

**Document maintenance:** Update this file when phases complete, locales are approved, or validation evidence is published. Do not overstate claims in derivative materials (README, landing page) beyond what this programme supports.

**Last updated:** June 2026
