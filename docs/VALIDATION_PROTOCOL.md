# PCMS validation protocol

**Audience:** researchers, institutional reviewers, and funders evaluating the Perceptual & Cognitive Mapping System (PCMS).

This document states what psychometric and cross-cultural evidence **exists today**, what **does not**, and what a **minimum credible path** to publication-grade validity looks like. It is intended to sit alongside technical specifications (e.g. confidence model, item banks) without overstating claims.

For a complementary technical roadmap (IRT, CFA, larger samples, item-level calibration), see [`VALIDATION_ROADMAP.md`](./VALIDATION_ROADMAP.md).

---

## Current status (be honest)

### Scoring weights

Dimension scores and routing weights are **derived from literature and expert design**, not from **empirical calibration** on a dedicated PCMS response corpus. That is a normal starting point for a new dimensional instrument, but it must be stated plainly: **weights are hypotheses to be tested**, not parameters estimated from this instrument’s own normative data.

### Cultural adaptation

The Ghana question bank was developed with **cultural input** in item wording and framing. It has **not** been validated against a **local normative sample** (Ghana or West Africa) with reported reliability, structure, and score comparability. Until such work exists, Ghana deployments should be described as **culturally informed**, not **locally normed**.

### Reliability

**Internal consistency** (e.g. Cronbach’s α, McDonald’s ω) has **not** been computed from **real PCMS response data** at scale and reported per dimension for each locale. Session-level “confidence” in the app is **not** a substitute for sample-based reliability reporting.

### Predictive validity

**Predictive validity** (outcomes, behaviors, or external criteria beyond self-report) has **not** been tested in peer-reviewed or pre-registered PCMS studies. Any informal correlations users draw are **exploratory**, not validated claims of the system.

---

## Validation roadmap (Phase 1 — minimum for publication)

These steps describe a **Phase 1** bar that many journals and funders would still consider incomplete for high-stakes use, but that moves PCMS from “prototype” toward **evidence-backed reporting**.

1. **Pilot study:** **N = 150 adults per locale** (English, German, Ghana-oriented deployment), **convenience sampling**, with documented inclusion criteria, consent, and data handling.
2. **Reliability:** Compute **Cronbach’s α** and **McDonald’s ω** per **dimension** (and report confidence intervals where appropriate).
3. **Test–retest:** **Two-week** interval, **N = 40 per locale**, with clear instructions not to rehearse items; report stability coefficients and interpret attrition.
4. **Convergent validity:** Correlate PCMS dimension scores with **established instruments** where theory predicts overlap — e.g. **BIS/BAS** (or related) for social/approach–avoidance facets linked to the **E** dimension, **HSPS** (or validated short forms) for **S** (sensory sensitivity), plus additional constructs mapped a priori. Pre-register hypotheses and comparison rules.
5. **Local norms:** Publish **mean and SD per dimension per locale** (and ideally percentiles once N permits), with explicit warnings if variances differ across locales.

Phase 1 does **not** by itself justify cross-locale score interchangeability; that requires **measurement invariance** work (beyond this checklist).

---

## What the system CANNOT currently claim

- That scores **identify children who would benefit from support** (clinical, educational, or therapeutic decisions).
- That **Ghana scores are directly comparable** to German or English scores without invariance and local norm evidence.
- That the **adaptive stopping rule** is **calibrated** to this population’s information rates or decision thresholds (it is engineered for coverage and efficiency under stated assumptions, not empirically tuned to validated stopping rules for each locale).

---

## What a teacher or facilitator needs that the current UI does not provide

PCMS is oriented toward **self-understanding and research**, not classroom placement. Responsible facilitation would still require:

- **A translation layer:** dimension score → **plain-language observation guide** (what might show up in behavior or preference, without labels or “diagnosis”).
- **A threshold guide:** explicit, evidence-backed **decision rules** only after norms exist — e.g. *“If S and R exceed local T90, consider environmental adjustments such as …”* — with **uncertainty** and **local validation** stated; the product must not imply precision it does not have.
- **An observer instrument for children under ~12:** **parent or teacher rating** (or structured observation), not sole child self-report, aligned to the same dimensions where feasible, with its own pilot and reliability.

---

## Revision

This protocol should be updated when each roadmap milestone is completed, with version, date, and a short evidence summary (sample, locale, analysis, and limitations).
