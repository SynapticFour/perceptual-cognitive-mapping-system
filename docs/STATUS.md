# Evidence status

No public maturity stage is recorded for this repository in the claims registry. The four public labels are Prototype, Early use, In use, and Independently reviewed. None of those is assigned here.

## What is deployed

A public questionnaire is published at [https://map.synapticfour.com](https://map.synapticfour.com). The deploy workflow (`.github/workflows/deploy.yml`) runs on a tag matching `v*.*.*` and calls `vercel deploy --prod`. That flag is the host's name for the public target. It is not a validation result.

## Validation tier

The map's validation status is tier T0: there is no empirical sample yet. According to the action plan, an ethics review is still outstanding (PCMS-VALIDATION-001). The status report CLRP-VR-2026-001 is a draft. The planned first phase is a design, not a result.

The validation programme is planned (PCMS-VALIDATION-PLAN-001). Before any primary data there is a pre-registration and an ethics vote. Phase 1 plans 150 adults per language, internal consistency, a test–retest with 40 people per language over two weeks, convergent validity, and local norms. Phase 2 plans confirmatory factor analysis, item-response calibration, a check for items that work differently across groups, and invariance across languages. In [`ACADEMIC_VALIDATION_AND_ADAPTATION_PROGRAMME.md`](ACADEMIC_VALIDATION_AND_ADAPTATION_PROGRAMME.md), German and English are the completed locales. French, Swahili, Twi, and Wolof are drafts pending native review. No data has been collected under that plan.

Longer statements: [`VALIDATION_PROTOCOL.md`](VALIDATION_PROTOCOL.md), [`RESEARCH_ACTION_PLAN.md`](RESEARCH_ACTION_PLAN.md), [`VALIDATION_ROADMAP.md`](VALIDATION_ROADMAP.md).

## Version labels

Research documentation and stored assessments refer to protocol **v1.0** for reproducibility. The code stores that label as `CURRENT_VERSION` in `src/lib/assessment-versioning.ts`. The npm version in `package.json` is `0.1.0`. Pin a git commit for a reproducible deployment. Neither number is a public status.

## What this page does not say

A green CI run is a technical signal. It is not a certificate, and it is not an empirical sample.
