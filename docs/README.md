# PCMS documentation

Every document under `docs/`, grouped as a tutorial, how-to guides, reference, and explanation. One line each.

Read [STATUS.md](STATUS.md) before citing a result. The public questionnaire is not an empirical sample.

## Tutorial

| Document                                 | What it is                                                           |
| ---------------------------------------- | -------------------------------------------------------------------- |
| [GETTING-STARTED.md](GETTING-STARTED.md) | Run the questionnaire on this computer, and where the public site is |
| [LOCAL_SETUP.md](LOCAL_SETUP.md)         | Longer local-setup notes                                             |

## How-to guides

| Document                                                               | What it is                                                |
| ---------------------------------------------------------------------- | --------------------------------------------------------- |
| [COMMANDS.md](COMMANDS.md)                                             | npm, Make, and setup-script commands                      |
| [CONTRIBUTING.md](CONTRIBUTING.md)                                     | How to change this repository                             |
| [CULTURAL_REVIEW_CHECKLIST.md](CULTURAL_REVIEW_CHECKLIST.md)           | Checklist for a cultural review of items                  |
| [deployment-runbook.md](deployment-runbook.md)                         | Deploy, roll back, and migrate the public questionnaire   |
| [DEPLOYMENT.md](DEPLOYMENT.md)                                         | Environment variables and deploy notes                    |
| [DEPLOYMENT-LEGAL.md](DEPLOYMENT-LEGAL.md)                             | Operator checklist for privacy copy and disclosures       |
| [DIAGNOSTICS.md](DIAGNOSTICS.md)                                       | Health probes and operator diagnostics                    |
| [FIELD_PILOT_FR_SW.md](FIELD_PILOT_FR_SW.md)                           | Field-pilot notes for French and Swahili                  |
| [FORK-AND-HOSTING.md](FORK-AND-HOSTING.md)                             | Forks, hosting, and the legal notes moved from the README |
| [GROUP-COGNITIVE-ANALYSIS.md](GROUP-COGNITIVE-ANALYSIS.md)             | Paste several profiles for an optional aggregate view     |
| [I18N.md](I18N.md)                                                     | Locales, URLs, and message files                          |
| [LOCALE-NATIVE-REVIEW-CHECKLIST.md](LOCALE-NATIVE-REVIEW-CHECKLIST.md) | Native-speaker review of a locale                         |
| [OFFLINE-AND-PAPER-ARCHITECTURE.md](OFFLINE-AND-PAPER-ARCHITECTURE.md) | Offline cache, IndexedDB, and paper or CSV replay         |
| [RESEARCH-SESSION-EXPORT.md](RESEARCH-SESSION-EXPORT.md)               | Download a session as a ZIP                               |

## Reference

| Document                                                                                           | What it is                                            |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [ACADEMIC_VALIDATION_AND_ADAPTATION_PROGRAMME.md](ACADEMIC_VALIDATION_AND_ADAPTATION_PROGRAMME.md) | The planned validation and adaptation programme       |
| [ADAPTIVE_ENGINE.md](ADAPTIVE_ENGINE.md)                                                           | Adaptive question selection                           |
| [api-documentation.md](api-documentation.md)                                                       | HTTP routes that exist in this tree                   |
| [confidence-model.md](confidence-model.md)                                                         | Routing confidence formula                            |
| [data-model.md](data-model.md)                                                                     | Stored session and profile shape                      |
| [ethics.md](ethics.md)                                                                             | Ethics statement, including what has not been done    |
| [FEATURES.md](FEATURES.md)                                                                         | Feature notes moved from the README                   |
| [FOR-EVALUATORS.md](FOR-EVALUATORS.md)                                                             | What a software check shows and what it does not show |
| [legal-audit.md](legal-audit.md)                                                                   | Record of privacy-copy review                         |
| [LOCALIZATION_COVERAGE.md](LOCALIZATION_COVERAGE.md)                                               | Which locales have UI copy and which have stems       |
| [REGIONAL-STEM-RESOLUTION.md](REGIONAL-STEM-RESOLUTION.md)                                         | How a region picks question stems                     |
| [RESEARCH_ACTION_PLAN.md](RESEARCH_ACTION_PLAN.md)                                                 | Sequenced research plan                               |
| [SCOPE.md](SCOPE.md)                                                                               | What this repository is not                           |
| [STATUS.md](STATUS.md)                                                                             | Validation tier T0 and the version labels in code     |
| [VALIDATION_PROTOCOL.md](VALIDATION_PROTOCOL.md)                                                   | Psychometric status and the phase-1 bar               |
| [VALIDATION_ROADMAP.md](VALIDATION_ROADMAP.md)                                                     | Later calibration steps, still a plan                 |
| [validity-statement.md](validity-statement.md)                                                     | What validity is claimed and what is not              |

## Explanation

| Document                                                                   | What it is                                            |
| -------------------------------------------------------------------------- | ----------------------------------------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)                                         | Component map, plus the link to the pipeline page     |
| [ATLAS.md](ATLAS.md)                                                       | Companion atlas programme, design phase               |
| [ATLAS_VISION.md](ATLAS_VISION.md)                                         | Alias of the atlas note                               |
| [COGNITIVE-TERRAIN-3D.md](COGNITIVE-TERRAIN-3D.md)                         | 3D terrain view of the results                        |
| [COHORT-INTELLIGENCE.md](COHORT-INTELLIGENCE.md)                           | Aggregate cohort views, and what they do not classify |
| [DECISIONS.md](DECISIONS.md)                                               | Architectural decisions                               |
| [DESIGN-PHILOSOPHY.md](DESIGN-PHILOSOPHY.md)                               | Why the instrument avoids diagnostic labels           |
| [DESIGNING-SUPPORT-WITHOUT-LABELS.md](DESIGNING-SUPPORT-WITHOUT-LABELS.md) | Support copy that stays off labels                    |
| [DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md)                                   | The previous documentation index, kept in full        |
| [EIGHT_CONSTRUCT_MODEL.md](EIGHT_CONSTRUCT_MODEL.md)                       | Eight-construct note beside the ten scales            |
| [RESEARCH-ROADMAP.md](RESEARCH-ROADMAP.md)                                 | Engineering roadmap for research features             |
| [whitepaper.md](whitepaper.md)                                             | Theoretical and technical essay                       |

Files outside `docs/` that the same reading needs: [PIPELINE_ARCHITECTURE.md](../PIPELINE_ARCHITECTURE.md), [CHANGELOG.md](../CHANGELOG.md), [SECURITY.md](../SECURITY.md), [CONTRIBUTING.md](../CONTRIBUTING.md), [LICENSE](../LICENSE), [CITATION.cff](../CITATION.cff), and the research notes under `lib/research/`.
