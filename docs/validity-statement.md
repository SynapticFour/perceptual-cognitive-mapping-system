# Validity Roadmap

> **This document is a forward-looking roadmap, not a validity statement.**
> PCMS is a research prototype. No psychometric validity claims are made until
> the studies described below are completed and pre-registered findings published.

## Why honesty here matters

Some projects have been damaged by premature validity claims. PCMS will not make claims that outrun the evidence. The following is an honest account of what has been done, what has not, and what is planned.

## What has been done (Phase 1)

- Instrument design grounded in peer-reviewed constructs (citations in whitepaper §3)
- Expert review of question-dimension weight assignments
- Adaptive engine tested for logical correctness (unit + integration tests)
- Cultural adaptation of question bank for Ghana context (expert review, not empirical DIF)
- Ethics infrastructure: consent, deletion, GDPR audit

## What has NOT been done

- IRT calibration on real response data
- Differential Item Functioning (DIF) analysis across cultural groups
- Internal consistency analysis (Cronbach α, McDonald ω)
- Test-retest reliability study
- Construct validity study (convergent/discriminant)
- Cross-cultural measurement invariance testing
- Any confirmatory study

## Planned validation (Phase 2–4)

See whitepaper §6 for the full roadmap with required sample sizes.

## Interim guidance for researchers using PCMS data

Before Phase 2 calibration:

- Treat dimensional scores as ordinal indicators, not interval measurements.
- Do not report group-level comparisons as if measurement equivalence is established.
- Pre-register your analysis plan before data collection.
- Use the research export API to obtain raw response data alongside scored profiles.

## Contact

If you are planning a study using PCMS and want to coordinate on validation, please open an issue on the project repository.
