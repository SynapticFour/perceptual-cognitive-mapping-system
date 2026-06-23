# PCMS Technical Implementation Backlog

**Purpose:** Track engineering work that **unblocks** the [Academic Validation & Adaptation Programme](./ACADEMIC_VALIDATION_AND_ADAPTATION_PROGRAMME.md) without waiting on expert panels, IRB, or field data.

**Last updated:** June 2026

---

## Priority legend

| Priority | Meaning |
|----------|---------|
| **P0** | Blocks research reproducibility or regional rollout |
| **P1** | High value; implement before next field pilot |
| **P2** | Improves operations; safe to defer |

---

## Completed in this wave (June 2026)

| ID | Item | Notes |
|----|------|-------|
| A4 | Share codec v2 optional metadata (`bk`, `sr`) | Backward-compatible with v1 |
| B2 | Results footnote for within-session profile diagnostics | When `profileAdaptiveSummary` present |
| C1 | Cultural-adaptive bank CI in `npm run check` | Already wired; stem audit script added |
| C2 | `scripts/readability-audit.ts` | Flesch-Kincaid + sentence length flags |
| C3 | `cultural-adaptive-v1/meta.json` | Content version manifest |
| C4 | `francophone_west_africa` + `east_africa` stem regions | Fallback chains; optional bank keys |
| D1 | Contradictory item-pair flags in session export | Research-only diagnostic block |
| D2 | Env-tunable `ProfileAdaptiveConfig` | `NEXT_PUBLIC_PCMS_PROFILE_*` |
| D3 | `adaptiveStopTelemetry` on stored sessions | completion reason, trace tail, marginal gain |
| E2 | `POST /api/cohort/aggregate` | Aggregate-only; rejects identifiable payloads |
| F3 | Service worker v3 precache | Universal + cultural-adaptive public JSON |
| I18N | Locales `fr`, `sw` | Draft UI; classic stem maps started |
| I18N | German TIAV stems | `question-stems-de-tiav.ts` |
| C4b-fr | Francophone cultural-adaptive stems (200/200) | Machine draft in bank v1.3; `scripts/patch-francophone-*.ts` |
| C4b-ea | East Africa cultural-adaptive stems (200/200) | Machine draft Kiswahili in bank v1.4; `scripts/patch-east-africa-stems.ts` |
| DOC | Academic programme doc | `ACADEMIC_VALIDATION_AND_ADAPTATION_PROGRAMME.md` |

---

## Remaining (requires human experts or field data)

| ID | Item | Blocker |
|----|------|---------|
| B3 | Correlation study (confidence models) | Offline analysis + N |
| C2b | Item rewriting from readability audit | SME / cognitive interviews |
| C4b-review | Francophone + East Africa stem native review + cognitive interviews | First-language reviewers (draft stems shipped) |
| I18N | Native review TW, WO, FR, SW | First-language reviewers |
| PSY | IRT calibration | N ≥ 400 sessions |
| PSY | IRB + OSF | PI / institution |
| ATLAS | Micro-trait integration | PCMS Phase 1 complete |

---

## Environment variables (field studies)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_PCMS_PROFILE_SESSION_THRESHOLD` | Profile stop confidence (default 0.78) |
| `NEXT_PUBLIC_PCMS_PROFILE_MIN_ANSWERS` | Min answers before profile stop (default 14) |
| `NEXT_PUBLIC_PCMS_PROFILE_N_HALF` | Saturation midpoint per dimension (default 3) |
| `NEXT_PUBLIC_PCMS_CULTURAL_STEM` | Force stem region override |
| `NEXT_PUBLIC_PCMS_ETHICS_REGION` | `west_africa` / `ghana` / `east_africa` ethics ladder |

See `.env.example` for full list.
