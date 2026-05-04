# Site Audit Report

| Field | Value |
|-------|-------|
| Date | 2026-05-02 |
| Code version | pcms6 (branch: main / perceptual-cognitive-mapping-system) |
| Auditor | Automated (Cursor agent) + repository review |
| Scope | Full public readiness audit per internal prompt |
| Live site referenced | map.synapticfour.com |

**Prerequisites read:** [`DECISIONS.md`](./DECISIONS.md), [`VALIDATION_PROTOCOL.md`](./VALIDATION_PROTOCOL.md).

---

## Part A — Language findings

### A1 — Clinical / diagnostic scan

Command run (equivalent to prompt): `grep` over `src/app/`, `src/components/`, `src/atlas/`, `messages/`, `content/questions/` for clinical-adjacent stems, excluding tests and internal anchor comments.

**Acceptable (unchanged):** Matches aligned with prompt exceptions — e.g. `operatorSync` “diagnostics” (operator tooling, not user health), ethics keys that describe *non*-labelling intent in consent/assent (`chk_nondiagnostic`, etc.), `group-cognitive-analysis` “Non-diagnostic” in code comment, `facilitator` copy framed as suggestions-only.

**Fixed in this pass:**

| Location | Issue | Change |
|----------|--------|--------|
| `src/app/research/dashboard/page.tsx` | Phrase “clinical scores” in user-visible research UI | Rephrased to research routing means “not labels for individual medical, educational, or placement decisions.” |

**Left as-is (with rationale):**

- `messages/*/ethics_assent` and `ethics_results` strings use words like “nondiagnostic” in **checkbox labels** where the legal/ethical meaning must stay explicit; body copy elsewhere was shifted toward positive framing where requested (see A3).
- `messages/tw.json` / `messages/wo.json` contain translator notes and mixed-quality strings — **High** follow-up: dedicated native pass (already noted in locale files).

### A2 — Overclaiming scan

`grep` for “identifies / detects / diagnoses / …” in `messages/`, `src/app/`, `src/components/`, `src/atlas/` returned only benign matches (e.g. “If you have questions”, “If you have health concerns”). **No change required.**

### A3 — Negation framing (ADR-005)

**Fixed:**

| Key | Change |
|-----|--------|
| `results.public_map_disclaimer` (`en`, `de`) | Replaced “not a clinical assessment / keine klinische Beurteilung” with positive lead (“Research prototype… explores tendencies… not validated for individual clinical, legal, or placement decisions”). |
| `site_footer.prototype_line` (`en`, `de`) | Removed “not a clinical instrument”; now describes prototype + maps tendencies. |
| `src/app/layout.tsx` `SITE_DESCRIPTION` + metadata titles | Dropped “Non-diagnostic”; title set to **“PCMS — Cognitive Mapping”**; description states reflection-oriented research prototype. |
| `ethics_consent.ghana_body` (`en`, `de`) | Removed “not a hospital or school service / nicht als Klinik-…” negation; retained where to seek care and that participation stays in research-and-reflection lane. |
| `cohortInsights.meta_description` (de) | Removed “keine diagnostische Ansicht”; positive description of aggregate-only use. |

### A4 — ATLAS descriptors (`content/atlas/descriptors-v1.json`)

- **60** descriptors in pack.
- Automated scan: **no** clinical/diagnostic stems in `text`.
- Openings are mixed (“I …”, “When …”, “In …”, “My …”) — all remain **experiential first-person** voice; strict “starts with I ” is not required by product copy and was not enforced.
- **No rewrites** flagged from content review in this pass.

---

## Part B — Consent & ethics findings

### B1 — Consent screen completeness (`src/app/[locale]/consent/page.tsx` + `ethics_consent`)

| Requirement | Status |
|-------------|--------|
| “Research prototype” visible, not buried | **Yes** — `prototype_banner_title` / `prototype_banner_body` in highlighted block at top. |
| IRB / ethics status | **Yes** — `irb_status_body` states tool has not yet received institutional ethics approval as a finished study. |
| Instrument-development scope | **Yes** — `research_body`, `prototype_banner_body`, `limits_body` state development / reflection / not for placement or treatment decisions. |
| Data retention & deletion | **Yes** — `privacy_body_local`, rights + Privacy page reference; results flow includes “Delete my data” where configured. |
| Ghana-specific step for `tw` / `wo` | **Fixed** — `shouldIncludeGhanaEthicsStep` in `src/lib/ethics-flow-config.ts` now includes **`wo`** as well as `tw` (and existing region env). |
| No implied clinical benefit | **Yes** — copy frames participation as research/reflection and instrument development. |

### B2 — Results disclaimer visibility & content

- **`results.public_map_disclaimer`** is rendered **above** `CognitiveLandscapeGate` (3D / map block) on `src/app/[locale]/results/page.tsx` — user does **not** need to scroll past the terrain to read it (though a tall viewport above the disclaimer may still require scroll on very small screens).
- English text updated (see A3) to include: research prototype, self-understanding + research purpose, explicit “not validated for individual clinical, legal, or placement decisions.”

### B3 — Ghana consent step

- **Config:** `buildConsentSteps` appends `ghana` when `shouldIncludeGhanaEthicsStep(locale)` is true — now **`tw` and `wo`** under `auto`, plus env `NEXT_PUBLIC_PCMS_ETHICS_REGION` / `NEXT_PUBLIC_PCMS_ETHICS_GHANA_STEP`.
- **Copy:** `ghana_body` updated to positive framing while keeping referral to local licensed/trusted practitioners (see A3).

---

## Part C — T / I / A / V integrity

### C1 — Pool vs. primary results UI

- **Loaded (server / disk path):** `src/data/question-loader-fs.ts` references `tiav-extension-v1.json` (universal) and `tiav-ghana-v1.json` (Ghana locale bundle). Client builds typically consume merged banks via `/data/` or API — `src/data/__tests__/question-loader.test.ts` asserts TIAV stems present after merge.
- **Dimension bars:** `dimension-bar-grid.tsx` lists **`PRIMARY_RESULTS_ROUTING_KEYS` (F–C)** in the main list; **T, I, A, V** appear only inside a **default-closed `<details>`** with ADR-007 disclosure copy — aligned with **ADR-007 (2026 clarification)** in `DECISIONS.md`, not the older “never show in UI” reading.
- **Research export:** Full session / vector paths still carry ten routing dimensions where applicable (unchanged).

### C2 — TIAV item spot check (`content/questions/universal/tiav-extension-v1.json`)

Sampled **T** items `TIAV-T-01`–`TIAV-T-04` and structure for **I / A / V** blocks: primary dimension in `dimension_weights` matches id prefix; weights are positive and sum to **1.0**; `informationGain` in sampled rows lies in **~0.68–0.78** (within 0.50–0.95); language is behavioural; `reverseScored` present where expected. **No edits** required from spot check.

### C3 — Ghana TIAV count

- **`content/questions/ghana/tiav-ghana-v1.json`:** **8** items (minimum smoke size).
- **Documentation:** Added explicit **TODO** under Phase 0.1 in [`RESEARCH_ACTION_PLAN.md`](./RESEARCH_ACTION_PLAN.md) to expand toward ~20 items per T/I/A/V before Ghana field pilot.

---

## Part D — ATLAS separation

### D1 — Imports under `src/atlas/`

`grep` for `@/core/`, `@/scoring/`, `@/lib/cognitive-pipeline`, `@/adaptive/` found only:

- `SelfNominationResearchNote.tsx` → `@/adaptive/routing-tags` (allowed tag surface, not questionnaire engine).

**No ADR-002 / ADR-003 violation** from forbidden pipeline imports.

### D2 — Self-nomination gating & scoring isolation

- `SelfNominationModule` is wrapped in `FEATURE_FLAGS.ATLAS_SELF_NOMINATION && …` on results page.
- `handleSelfNomComplete` calls `persistSelfNomination` / local storage only — **no** path into dimension scoring or `buildCognitiveModel` inputs from descriptor IDs (verified by reading handler).

### D3 — Feature flags default off

- `src/config/feature-flags.ts`: all ATLAS-related flags require `=== 'true'` on `NEXT_PUBLIC_*` vars → **default false**.
- `.env.example`: ATLAS toggles are **commented** (off unless operator enables).

**Live deployment:** cannot be verified from repo alone; operators must confirm production env does not set these to `true` unintentionally.

---

## Part E — Metadata

- **`src/app/layout.tsx`:** Title **“PCMS — Cognitive Mapping”**; description and Open Graph use honest research-prototype wording without naming diagnoses.
- **`public/manifest.json`:** Name “Perceptual & Cognitive Mapping System” / short_name “PCMS”; description mentions research-based mapping and **research prototype** — acceptable.

---

## Part F — Footer & legal

### F1 — Link reachability (spot check 2026-05-02)

| URL | Result |
|-----|--------|
| `https://synapticfour.com/de/impressum` | **200** — legal imprint content loads. |
| In-app `/ethics` and `/validation` | **Shipped (2026-05-02 follow-up):** footer links render repository `docs/ethics.md` and `docs/VALIDATION_PROTOCOL.md` inside the app (preformatted). GitHub remains available separately via the repo link. |
| In-app `/privacy` | Not HTTP-checked here; route exists in footer `Link href="/privacy"`. |

### F2 — “Research prototype” in footer

- **`SiteFooter.tsx`** renders `site_footer.prototype_line` below nav links.
- String updated to positive framing while keeping “Research prototype” visible (**Part A3**).

---

## Part G — Data & privacy

### G1 — PII / fingerprinting

**Fixed (Critical):**

- Removed **`user_agent`** from session upserts in `src/lib/data-collection.ts` and `src/lib/offline-supabase-sync.ts` so new sync rows do not store browser UA strings.
- GDPR anonymization path in `src/lib/ethics-service.ts` now sets `user_agent: null` instead of the literal `'anonymized'`.

**Reviewed:** `grep` hits for `name` / `email` largely typings, filenames, or explicit “we do not collect name/email” privacy strings — no new PII storage introduced.

**Note (2026-05-02 follow-up):** `RateLimiter` default keys now use a **short non-reversible fingerprint** of `x-forwarded-for` for in-memory buckets only (not written to PCMS databases). Middleware is not yet wired to this limiter in all API routes — confirm when enabling abuse protection.

### G2 — ATLAS RLS

- `supabase/migrations/20260502120000_atlas_tables_rls.sql`: **`ENABLE ROW LEVEL SECURITY`** on `atlas_sessions`, `atlas_self_nominations`, `atlas_descriptors`.
- **Policies:** Intentionally **none** for `anon` / `authenticated` → default deny; server routes use **service role** (bypasses RLS). SQL file now documents this pattern.

`supabase/supabase-schema-atlas.sql` remains a reference script; migration is the source of truth for new deploys.

---

## Outstanding items (still need external / specialist input)

| Priority | Item |
|----------|------|
| **High** | **Native Twi / Wolof copy:** `_localeReview` in `messages/tw.json` still flags a full native pass; many `ethics_consent` strings in Twi remain English — needs linguist + local ethics review. Wolof has fuller coverage but should be reviewed the same way. |
| **High** | **Ghana TIAV depth:** bank expanded from **8 → 16** items (2026-05-02); Phase 0.1 target remains **~20 items per T/I/A/V** with expert item review — psychometrician / domain lead. |
| **Medium** | **Rate limiter deployment:** fingerprinting is in code; wire `createRateLimitMiddleware` on sensitive API routes in production if not already. |
| **Low** | **ethics.md** (source doc) still uses emphatic “NOT A MEDICAL…” headings — acceptable for researchers; optional tone alignment with ADR-005 for the in-app mirror. |

---

## Next audit recommended

**Before the next major feature batch** that touches consent, results layout, question banks, or Supabase schema — or **within 4 weeks** if the site continues to receive public traffic without a release freeze.
