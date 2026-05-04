# ATLAS imputation (`src/atlas/imputation/`)

**Purpose:** Runtime helpers that **apply** a precomputed covariance prior to incomplete ATLAS profiles (when enabled by feature flag and a prior file exists). Loading and validation of `content/atlas/covariance/prior_v1_{locale}.json` belong here or in thin loaders this module owns.

**Do not put here**

- Code that recomputes the covariance matrix from live session streams or Supabase aggregates in production (**ADR-004**).
- PCMS imputation or PCMS score backfill.
- “Training” or online learning loops that mutate the prior from user traffic.

**Governance:** **ADR-004** (offline prior only). [`docs/DECISIONS.md`](../../../docs/DECISIONS.md).
