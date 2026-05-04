# ATLAS self-nomination (`src/atlas/self-nomination/`)

**Purpose:** Post-session UI and client/server helpers for **experiential descriptor** selection (card flow). Data is stored for convergent-validity research only.

**Do not put here**

- Any code that merges selections into ATLAS or PCMS dimension scores, terrain generation, or adaptive item selection.
- PCMS questionnaire steps or results-page primary scoring widgets.
- Clinical or diagnostic copy in user-visible strings (**ADR-005**).

**Governance:** **ADR-003** (self-nomination not scored), **ADR-005** (no clinical UI). [`docs/DECISIONS.md`](../../../docs/DECISIONS.md). Product spec: [`docs/ATLAS.md`](../../../docs/ATLAS.md).

**Module:** `SelfNominationModule.tsx` — card grid gated by `FEATURE_FLAGS.ATLAS_SELF_NOMINATION` (`src/config/feature-flags.ts`). Descriptor source: [`content/atlas/descriptors-v1.json`](../../../content/atlas/descriptors-v1.json).
