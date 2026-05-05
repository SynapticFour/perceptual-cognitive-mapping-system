# Next Steps: Toward Real Research & Publication

## PCMS — Concrete Action Plan

> This document is for the research team. It is deliberately specific, honest about gaps, and sequenced for realistic execution. It is also readable by AI agents assisting with the codebase.

---

## Where We Are Now (Honest Assessment)

PCMS is a well-engineered research prototype. It has:

- ✅ A theoretically grounded 10-dimensional model with literature anchors
- ✅ An adaptive questionnaire engine with Bayesian confidence tracking
- ✅ Culturally adapted question banks (EN, DE, Ghana/Twi, Wolof)
- ✅ A 3D terrain visualisation that is unique in the field
- ✅ Ethics framework: non-diagnostic, non-labelling, GDPR-aware
- ✅ Open source, exportable data, offline-capable

It does NOT yet have:

- ❌ Empirical scoring weights (current weights are expert-designed hypotheses)
- ❌ Internal consistency data (Cronbach's α, McDonald's ω) from real responses
- ❌ Test-retest reliability data
- ❌ Convergent validity evidence
- ❌ A normative sample from any locale
- ❌ IRB approval for human subjects research
- ❌ Pre-registration on OSF or AsPredicted
- ❌ A peer-reviewed publication

This is a **normal and acceptable** state for a prototype in pre-Phase 1. It is important that all of this is stated plainly — not defensively — in any funder or ethics application. The public-facing summary is in [`VALIDATION_PROTOCOL.md`](./VALIDATION_PROTOCOL.md).

---

## Phase 0: Foundations (Now — 3 months)

### 0.1 Complete T, I, A, V question banks

**Who:** Research team + domain expert review  
**What:** Write 20 items per dimension for T (Temporal), I (Interoceptive), A (Associative), V (Verbal-Spatial). Use the existing question schema. Add `gh_variant` for Ghana cultural context.  
**Why:** Until these exist, PCMS effectively measures 6 dimensions. The 10D architecture is wasted.  
**Cursor prompt:** [`cursor-prompts/PROMPT-TIAV-QUESTIONS.md`](../cursor-prompts/PROMPT-TIAV-QUESTIONS.md)

**TODO (Ghana TIAV bank):** `content/questions/ghana/tiav-ghana-v1.json` was raised from **8 → 16** items (2026-05-02); still expand toward **~20 items per T/I/A/V** (or match the universal TIAV depth) before a Ghana field pilot, with expert item review.

### 0.2 Ethics & IRB preparation

**Who:** Lead researcher  
**What:** Draft IRB protocol for Phase 1 data collection (N=150/locale, online convenience sample, pseudonymous). Identify target institution for submission (University affiliation needed for most IRB processes).  
**Why:** Without IRB approval, data collected cannot be used in peer-reviewed publications in most journals.  
**Note:** Data already collected from the live site (`map.synapticfour.com`) before IRB approval can only be used as **pilot/informal** data — not as a primary study sample. This is standard research ethics.

### 0.3 Pre-registration (OSF)

**Who:** Lead researcher  
**What:** Pre-register the Phase 1 study on the Open Science Framework (osf.io) before beginning data collection. Specify: sample size, inclusion criteria, primary outcomes, analysis plan, hypotheses about convergent validity.  
**Why:** Pre-registration is increasingly required by journals and significantly increases credibility of findings. It is free and takes ~1 week to prepare.

### 0.4 Live site disclaimer audit

**Who:** Developer  
**What:** Verify that the live site (`map.synapticfour.com`) has: (1) no diagnostic language, (2) clear research consent explaining data use, (3) a visible link to the validity statement, (4) no claims of clinical or educational utility.  
**Why:** The site is live and public. Any overclaiming right now creates liability.  
**Cursor prompt:** [`cursor-prompts/PROMPT-SITE-AUDIT.md`](../cursor-prompts/PROMPT-SITE-AUDIT.md)  
**Record:** [`SITE_AUDIT_REPORT.md`](./SITE_AUDIT_REPORT.md) (2026-05-02 pass).

---

## Phase 1: First Evidence (3–12 months)

### 1.1 Pilot data collection (N=150/locale)

**Target locales:** English (UK/US), German (DE/AT/CH), Ghana (Twi/English)  
**Method:** Online, pseudonymous, voluntary. Recruit through: university mailing lists, neurodiversity communities (with care — see consent design), social networks.  
**Instrument version:** Lock the question bank *before* data collection begins. Any changes reset the clock.  
**Data storage:** Supabase with full session export. No PII collected.

### 1.2 Reliability analysis

Compute for each of the 10 dimensions, per locale:

- Cronbach's α (report with 95% CI)
- McDonald's ω (more appropriate for non-τ-equivalent items)
- Average inter-item correlation
- Item-total correlations (flag items below 0.20 for review)

**Tools:** R (`psych` package) or Python (`pingouin`). This is offline analysis, not in the app.  
**Acceptable threshold for proceeding:** α ≥ 0.65 per dimension. Below that: revise items before Phase 2.

### 1.3 Test-retest reliability

- N=40 per locale who complete the instrument twice, 2 weeks apart
- Instruct participants not to try to remember answers
- Compute intraclass correlation coefficient (ICC) per dimension
- Acceptable threshold: ICC ≥ 0.70

### 1.4 Convergent validity

Pre-register the following hypotheses before collecting:

- PCMS-S correlates r ≥ 0.40 with HSPS (Highly Sensitive Person Scale, Aron & Aron 1997)
- PCMS-E correlates r ≥ 0.40 with BIS/BAS Reward Responsiveness (Carver & White 1994)
- PCMS-F correlates r ≥ 0.35 with Attentional Control Scale (Derryberry & Reed 2002)

These instruments are freely available for research use. Include them in the online data collection.

### 1.5 Local norm computation

Compute mean and SD per dimension per locale. Publish as a supplementary table. These are the first real normative data for PCMS.

---

## Phase 2: Publication (12–24 months)

### 2.1 Target journals

Primary target: **Assessment** (SAGE, IF ~4.5) — a strong fit for a new instrument paper.  
Secondary: **Psychological Assessment** (APA), **Journal of Cross-Cultural Psychology**, **Frontiers in Psychology (Assessment section)**.

### 2.2 Paper structure (first publication)

Title: *"PCMS: A culturally adaptive, non-diagnostic dimensional instrument for cognitive profiling across WEIRD and non-WEIRD populations"*

Sections:

1. Introduction: problem with categorical/WEIRD instruments; dimensional alternatives (HiTOP, RDoC)
2. Instrument development: theoretical basis, item writing, cultural adaptation process
3. Study 1 (pilot): reliability and convergent validity
4. Study 2 (Ghana): cultural adaptation evidence, local norms
5. Discussion: limitations (no predictive validity yet, no child validation), future directions (ATLAS)

### 2.3 Open science package

Submit alongside the paper:

- All question items and scoring weights (OSF)
- Anonymised pilot dataset
- Analysis R/Python scripts
- Pre-registration link

---

## Phase 3: ATLAS Integration (24–48 months)

See **[`ATLAS.md`](./ATLAS.md)** for the full programme (also reachable as [`ATLAS_VISION.md`](./ATLAS_VISION.md)). The PCMS validation work is a prerequisite — do not begin ATLAS data collection until Phase 1 is complete.

Key milestones:

- Micro-trait library expert review (begins Phase 0, parallel)
- ATLAS question bank v1 written (begins Phase 1)
- ATLAS pilot (N=50, EN only): begins after PCMS Phase 1 paper submitted
- Covariance matrix estimation: begins after ATLAS pilot
- ATLAS full study: begins after PCMS paper accepted

---

## For AI Agents: What to Build Next

The following are implementation priorities that unblock the research programme. In order:

1. **T/I/A/V question bank** — [`cursor-prompts/PROMPT-TIAV-QUESTIONS.md`](../cursor-prompts/PROMPT-TIAV-QUESTIONS.md)
2. **Self-nomination module** — [`ATLAS.md`](./ATLAS.md) §3 and [`cursor-prompts/PROMPT-SELF-NOMINATION.md`](../cursor-prompts/PROMPT-SELF-NOMINATION.md)
3. **PCMS architecture prep for ATLAS** — [`cursor-prompts/PROMPT-ATLAS-ARCHITECTURE.md`](../cursor-prompts/PROMPT-ATLAS-ARCHITECTURE.md)
4. **Site audit for live deployment** — [`cursor-prompts/PROMPT-SITE-AUDIT.md`](../cursor-prompts/PROMPT-SITE-AUDIT.md)
5. **Research data export enhancements** — ensure all session data needed for Phase 1 analysis is captured and exportable; see [`RESEARCH-SESSION-EXPORT.md`](./RESEARCH-SESSION-EXPORT.md) and full-session JSON.

Do not begin ATLAS micro-trait integration into the scoring pipeline until the covariance prior exists. Build the structure, leave the data empty. See **ADR-002–004** in [`DECISIONS.md`](./DECISIONS.md).
