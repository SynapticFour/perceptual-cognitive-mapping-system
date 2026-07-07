# PCMS validation protocol

**Audience:** researchers, institutional reviewers, and funders evaluating the Perceptual & Cognitive Mapping System (PCMS).

> **Authoritative status report:** [CLRP-VR-2026-001](https://github.com/SynapticFour/cognitive-landscape-research-programme/blob/clrp-v2026.1/validation/CLRP-VR-2026-001-pcms-instrument-status.md) in the [Cognitive Landscape Research Programme (CLRP)](https://github.com/SynapticFour/cognitive-landscape-research-programme).  
> **Programme evidence standards:** [CLRP-006](https://github.com/SynapticFour/cognitive-landscape-research-programme/blob/clrp-v2026.1/clrp/CLRP-006-evidence-and-validation.md).

This file is a **local pointer** for PCMS developers and in-app routes (`/validation`). Psychometric status, claims matrix, and Phase 1 design live in CLRP-VR-2026-001.

## PCMS-specific references

| Document | Purpose |
|----------|---------|
| [`VALIDATION_ROADMAP.md`](./VALIDATION_ROADMAP.md) | Technical calibration (IRT, CFA, larger samples) |
| [`docs/confidence-model.md`](./confidence-model.md) | Session confidence specification (not reliability) |
| [`RESEARCH_ACTION_PLAN.md`](./RESEARCH_ACTION_PLAN.md) | Execution plan (IRB, OSF, pilots) |
| [`ACADEMIC_VALIDATION_AND_ADAPTATION_PROGRAMME.md`](./ACADEMIC_VALIDATION_AND_ADAPTATION_PROGRAMME.md) | Validation vs localization workstreams |

## In-app and deployment

- Validation summary served at `/validation` on map deployments
- Update CLRP-VR-2026-001 when Phase 1 milestones complete; bump version in revision history
- Pin `clrp-v2026.1` (or later release) in study exports and publications

## Revision

When CLRP-VR-2026-001 is updated, refresh the link above if the release tag changes. Do not duplicate normative status text here — edit CLRP-VR instead.
