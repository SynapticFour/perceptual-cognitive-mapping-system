# Field pilot — Francophone West Africa & East Africa (FR / SW)

Operational guide for deploying PCMS with **French (`fr`)** and **Kiswahili (`sw`)** UI for field pilots, workshops, and institutional demos.

**Related:** [LOCALIZATION_COVERAGE.md](./LOCALIZATION_COVERAGE.md) · [LOCALE-NATIVE-REVIEW-CHECKLIST.md](./LOCALE-NATIVE-REVIEW-CHECKLIST.md) · [REGIONAL-STEM-RESOLUTION.md](./REGIONAL-STEM-RESOLUTION.md)

---

## What participants get today

| Layer | FR | SW |
|-------|----|----|
| Welcome → banner, questionnaire chrome, Likert | ✅ French | ✅ Kiswahili |
| Privacy page | ✅ `messages/fr/privacy.json` | ✅ `messages/sw/privacy.json` |
| Results, landscape, interpretation UI | ✅ Tier 3 | ✅ Tier 3 |
| Question stems (200 × 7 dimensions) | ✅ `francophone_west_africa` | ✅ `east_africa` |
| Cohort / group analysis / facilitator tools | ⚠️ English (Tier 4 — intentional) | ⚠️ English |

Participants see a **draft-locale banner** in production when review warnings are enabled (see below).

---

## Vercel / production environment

Set these in **Vercel → Project → Settings → Environment Variables** (Production + Preview recommended):

| Variable | Value | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_PCMS_QUESTION_SOURCE` | `cultural_adaptive_v1` | Adaptive bank + regional stems (not legacy static bank) |
| `NEXT_PUBLIC_LOCALE_REVIEW_WARNINGS` | `true` | Show draft-locale banner for `PENDING_NATIVE_REVIEW` locales in production |
| `NEXT_PUBLIC_PCMS_CONSENT_MODE` | *(omit or `standard`)* | Use real consent flow in the field; use `skip` only for internal QA |

**Do not change** for a standard field pilot:

- `NEXT_PUBLIC_PCMS_CULTURAL_STEM` — leave unset; stems resolve from UI locale (`fr` → francophone bundle, `sw` → east_africa).
- Tier 4 namespaces — no env toggle; they stay English until translated (see policy below).

After changing env vars, **redeploy** (Vercel rebuild) so client bundles pick up `NEXT_PUBLIC_*` values.

### CLI (optional)

```bash
vercel env add NEXT_PUBLIC_PCMS_QUESTION_SOURCE production
# enter: cultural_adaptive_v1

vercel env add NEXT_PUBLIC_LOCALE_REVIEW_WARNINGS production
# enter: true
```

---

## Local development (field-pilot parity)

Copy from `.env.example`:

```bash
NEXT_PUBLIC_PCMS_QUESTION_SOURCE=cultural_adaptive_v1
NEXT_PUBLIC_LOCALE_REVIEW_WARNINGS=true
```

Then:

```bash
npm run dev
# http://localhost:3000/fr
# http://localhost:3000/sw
```

---

## URLs to smoke-test before a session

| URL | Expect |
|-----|--------|
| `/fr` | French welcome title |
| `/fr/privacy` | French privacy heading |
| `/fr/consent` | French consent copy |
| `/sw` | Kiswahili welcome |
| `/sw/privacy` | Kiswahili privacy heading |

Automated: `npm run test:locale-smoke` (Playwright).

---

## Facilitator briefing (5 minutes)

1. **Language:** Send `/fr` or `/sw` links; avoid `/en` for francophone / East Africa cohorts unless bilingual.
2. **Banner:** Draft UI notice is intentional — do not hide it without native review sign-off.
3. **English corners:** Group analysis, cohort dashboards, and some research-only pages may still be English; route participants through welcome → consent → questionnaire → results only.
4. **Stems:** Questions are machine-drafted; debrief that wording may be refined after native review.
5. **Data:** Same Supabase / export pipeline as other locales; document locale in session metadata.

---

## Tier 4 policy (English until requested)

Research-operator surfaces (`cohort`, `group_analysis`, `facilitator`, parts of `docsPages`) remain **English by merge fallback** for this pilot phase.

**Rationale:** Low traffic in field sessions; high translation cost; legal/research nuance needs institutional partners.

**When to translate Tier 4:** Partner institution commits to facilitator workflow in FR/SW and provides a native reviewer for research terminology.

See [LOCALIZATION_COVERAGE.md](./LOCALIZATION_COVERAGE.md#tier-4-policy).

---

## Sign-off before removing the draft banner

Complete [LOCALE-NATIVE-REVIEW-CHECKLIST.md](./LOCALE-NATIVE-REVIEW-CHECKLIST.md) sections **7 (FR)** and **8 (SW)**, then:

1. Set `_localeReview.reviewStatus` to `APPROVED` in `messages/fr.json` / `messages/sw.json`.
2. Set `lastReviewed` to ISO date and clear `outstandingItems`.
3. Optionally set `NEXT_PUBLIC_LOCALE_REVIEW_WARNINGS=false` after both locales are approved.

---

*Last updated: 2026-06-23 — field pilot FR/SW configuration guide.*
