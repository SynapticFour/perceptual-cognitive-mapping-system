# ATLAS (`src/atlas/`)

Application code for **Adaptive Trait Landscape Architecture System** — companion programme to PCMS, same repo, **separate** scoring and banks (**ADR-001**, **ADR-002**).

- **Vision, phases, agent rules:** [`docs/ATLAS.md`](../../docs/ATLAS.md) (short alias: [`docs/ATLAS_VISION.md`](../../docs/ATLAS_VISION.md))
- **Decisions:** [`docs/DECISIONS.md`](../../docs/DECISIONS.md) (ADR-001–008)
- **Feature flags (all off by default):** [`src/config/feature-flags.ts`](../config/feature-flags.ts)

**Subdirectories**

| Path | Role |
|------|------|
| `scoring/` | ATLAS micro-trait scoring only |
| `self-nomination/` | Descriptor card UI + persistence hooks |
| `imputation/` | Covariance-based imputation **using** offline priors |

**Do not put here**

- PCMS-only modules that belong under `src/lib`, `src/core`, or PCMS-specific `src/components` without an ADR.
- ATLAS question JSON (use `content/questions/atlas-v1/`).
- Imports that call PCMS scoring from ATLAS scoring, or the reverse (**ADR-002**).

Each subdirectory has its own `README.md` with stricter exclusions and ADR references.
