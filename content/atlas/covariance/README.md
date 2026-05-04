# ATLAS covariance priors (`content/atlas/covariance/`)

**Purpose:** Offline-computed imputation priors per locale. Canonical filenames: `prior_v1_{locale}.json` (**ADR-004** in [`docs/DECISIONS.md`](../../../docs/DECISIONS.md)).

**Do not put here**

- Live-updated matrices derived from streaming Supabase traffic, ad hoc JSON edits from production logs, or PCMS covariance estimates.

**Governance:** **ADR-004**. Runtime **application** of priors lives in `src/atlas/imputation/` (not in this folder).
