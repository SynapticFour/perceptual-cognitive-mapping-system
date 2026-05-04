# ATLAS scoring (`src/atlas/scoring/`)

**Purpose:** ATLAS-only scoring logic (micro-trait aggregation, item → trait mapping, normalisation). This pipeline produces ATLAS `DimensionScore`-shaped outputs for storage and research export.

**Do not put here**

- Imports from PCMS scoring modules (e.g. cognitive pipeline profile reducers, PCMS routing weights, or any `src/lib` / `src/core` PCMS score path). **Do not import PCMS scoring functions here.**
- PCMS question banks or F–V dimension-specific business rules copied “for convenience.”
- Self-nomination selections or descriptor text used as score inputs (see **ADR-003**).

**Governance:** **ADR-002** (separate scoring pipelines), **ADR-001** (ATLAS in monorepo). Full log: [`docs/DECISIONS.md`](../../../docs/DECISIONS.md).
