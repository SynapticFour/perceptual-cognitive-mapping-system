# For evaluators

Read this page before treating a run, a badge, or the public site as evidence.

## What to read first

1. [STATUS.md](STATUS.md) — tier T0, no empirical sample, and the planned validation programme (PCMS-VALIDATION-001, PCMS-VALIDATION-PLAN-001).
2. [SCOPE.md](SCOPE.md) — not a diagnostic instrument and not a medical device (PCMS-NOT-001).
3. [VALIDATION_PROTOCOL.md](VALIDATION_PROTOCOL.md) — the protocol's own limits.
4. [ethics.md](ethics.md) — what the ethics statement says has not been done (PCMS-ETHICS-001).
5. [ACADEMIC_VALIDATION_AND_ADAPTATION_PROGRAMME.md](ACADEMIC_VALIDATION_AND_ADAPTATION_PROGRAMME.md) — the plan, including locale status.

The programme texts are in the [Cognitive Landscape Research Programme](https://github.com/SynapticFour/cognitive-landscape-research-programme). The conformance notes in the previous README named `clrp-v2026.1` for CLRP-003, CLRP-005, and CLRP-007. Those documents are the programme's, not a certificate issued by this repository.

## What a check shows

`npm test` runs `npm run check` and the unit tests. `npm run check` is the type check, ESLint, and the question-bank validators. That is a software check. It does not create an empirical sample.

The public questionnaire at [https://map.synapticfour.com](https://map.synapticfour.com) is the deployed Next.js app. Opening it is not a psychometric result.

## Question caps in the code

`src/model/cognitive-dimensions.ts` lists ten keys: F, P, S, E, R, C, T, I, A, V. `src/adaptive/questionnaire-engine.ts` sets `maxCoreQuestions` to 15 and `maxRefinementQuestions` to 10. `ENGINE_HARD_CAP_TOTAL_QUESTIONS` is 30. The English copy says about 10–15 minutes (`messages/en.json`). That duration was not timed for PCMS-USE-001.

## Privacy gate

Unit tests for the per-answer cloud write are `src/lib/__tests__/question-response-cloud-gate.test.ts`. The claim records three cases. This page does not add a result those tests did not record.
