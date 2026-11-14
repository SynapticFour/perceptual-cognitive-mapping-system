# Perceptual & Cognitive Mapping System (PCMS)

PCMS is a public questionnaire. It asks how a person focuses, senses, and organises, and it shows the answers as positions on continuous scales rather than as a label.

It is a questionnaire for self-reflection. The model comes from the open research programme linked below. Using the questionnaire does not contribute answers to that programme.

**Status: No public status is recorded.** The claims registry has no maturity stage for this repository. Evidence status: the map's validation status is tier T0: there is no empirical sample yet (PCMS-VALIDATION-001). The stored assessment label in `src/lib/assessment-versioning.ts` is `v1.0`. The npm version in `package.json` is `0.1.0`. Neither number is a status.

[![Live questionnaire](https://img.shields.io/badge/questionnaire-map.synapticfour.com-6366f1)](https://map.synapticfour.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## What it does

- A public questionnaire is published at [https://map.synapticfour.com](https://map.synapticfour.com). The deploy workflow runs on a release tag and calls `vercel deploy --prod`. That is how the public site is updated. See [docs/STATUS.md](docs/STATUS.md).
- Ten scales, with the letters F, P, S, E, R, C, T, I, A, and V (`src/model/cognitive-dimensions.ts`). A scale here is a continuous axis, not a diagnosis.
- A session asks at most 15 core questions and 10 refinement questions. The hard cap is 30 (`ENGINE_HARD_CAP_TOTAL_QUESTIONS` in `src/adaptive/questionnaire-engine.ts`).
- The English copy says about 10–15 minutes and no registration (`messages/en.json`). The duration was not timed (PCMS-USE-001).
- Answers are stored in the cloud only when the person agrees (PCMS-PRIVACY-001).

The longer feature notes are in [docs/FEATURES.md](docs/FEATURES.md). The programme that states the principles is the [Cognitive Landscape Research Programme](https://github.com/SynapticFour/cognitive-landscape-research-programme). The computational library is the [Cognitive Landscape Model](https://github.com/SynapticFour/cognitive-landscape-model).

## Limits

- The map is not a diagnostic instrument and not a medical device (PCMS-NOT-001).
- Validation tier T0: there is no empirical sample (PCMS-VALIDATION-001). The report is a draft.
- No study is running on this questionnaire. Answers are not collected for research. A later study would need its own ethics review and a separate consent (PCMS-VALIDATION-PLAN-001). The programme table still lists German and English as completed locales and French, Swahili, Twi, and Wolof as drafts pending native review.
- The ethics statement names what has not happened yet, including an ethics committee and a review under the Declaration of Helsinki (PCMS-ETHICS-001).
- Scoring weights in the current instrument are literature- and design-based. They are not empirically calibrated on a normative sample. See [docs/VALIDATION_PROTOCOL.md](docs/VALIDATION_PROTOCOL.md).

The full boundary is [docs/SCOPE.md](docs/SCOPE.md). The design argument is [docs/DESIGN-PHILOSOPHY.md](docs/DESIGN-PHILOSOPHY.md).

## Quick start

Prerequisites: Node.js 18 or newer, and npm. `./setup.sh` is the macOS path. It stops on any other operating system. Supabase is required only when a person chooses to save answers for themselves.

```bash
npm install
npm run dev
```

When the development server is running, the English page is [http://localhost:3000](http://localhost:3000). The same steps, the macOS script, and the public-site notes are in [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md).

## Documentation

Every file under `docs/` is listed in [docs/README.md](docs/README.md). The groups are a tutorial, how-to guides, reference, and explanation.

### Tutorial

- [Getting started](docs/GETTING-STARTED.md)
- [Local setup](docs/LOCAL_SETUP.md)

### How-to guides

- [Deployment runbook for the public questionnaire](docs/deployment-runbook.md)
- [Environment and deploy notes](docs/DEPLOYMENT.md)
- [Forks and hosting](docs/FORK-AND-HOSTING.md)

### Reference

- [Evidence status](docs/STATUS.md)
- [What this is not](docs/SCOPE.md)
- [For evaluators](docs/FOR-EVALUATORS.md)
- [Validation programme](docs/ACADEMIC_VALIDATION_AND_ADAPTATION_PROGRAMME.md)
- [Ethics statement](docs/ethics.md)

### Explanation

- [Architecture](docs/ARCHITECTURE.md)
- [Pipeline](PIPELINE_ARCHITECTURE.md)
- [Design philosophy](docs/DESIGN-PHILOSOPHY.md)

## Licence

The map's software is under the MIT licence (PCMS-LICENSE-001). The file is [LICENSE](LICENSE). That grant covers this software and the associated documentation files. It does not relicense research reports that carry their own licences. This is not legal advice.

## Cite

Use [CITATION.cff](CITATION.cff). Prefer that file over a hand-copied line.

## Website

- Open research: [https://synapticfour.com/en/offene-forschung/](https://synapticfour.com/en/offene-forschung/)
- The map: [https://synapticfour.com/en/offene-forschung/karte/](https://synapticfour.com/en/offene-forschung/karte/)
- Technical profile: [https://synapticfour.com/en/technical/code/](https://synapticfour.com/en/technical/code/)

The same pages exist in German (`/de/offene-forschung/`, `/de/offene-forschung/karte/`, `/de/technik/code/`) and in French (`/fr/offene-forschung/`, `/fr/offene-forschung/karte/`, `/fr/technique/code/`).

The map of repositories: [profile/README.md](https://github.com/SynapticFour/.github/blob/main/profile/README.md).

Contact: [contact@synapticfour.com](mailto:contact@synapticfour.com)

Changelog: [CHANGELOG.md](CHANGELOG.md). Security: [SECURITY.md](SECURITY.md). Contributing: [CONTRIBUTING.md](CONTRIBUTING.md).
