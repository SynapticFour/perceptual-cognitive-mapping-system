# Locale Native-Speaker Review Checklist

This checklist documents exactly which text needs native-speaker verification to keep PCMS language quality and legal clarity high across all supported UI locales (`en`, `de`, `fr`, `sw`, `tw`, `wo`).

**Field pilot (FR/SW):** See [FIELD_PILOT_FR_SW.md](./FIELD_PILOT_FR_SW.md) for deploy env vars and facilitator briefing.

## How to use this checklist

1. Open the app in each locale and walk the full path:
   - landing
   - introduction
   - consent
   - questionnaire
   - results
   - privacy / ethics / validation pages
2. Verify all strings in context (not only key-by-key in JSON).
3. Record fixes as PRs that reference exact key paths.
4. Re-run this checklist whenever legal/privacy copy or question banks change.

## Current stem behavior (important)

- Question item text (stems) is loaded from `content/questions/*` (canonical English source data).
- Display stem resolution:
  - `de`: uses `QUESTION_STEMS_DE` for known IDs (`src/i18n/question-stems-de.ts`).
  - `fr` / `sw`: with `NEXT_PUBLIC_PCMS_QUESTION_SOURCE=cultural_adaptive_v1`, regional stems from `cultural-adaptive-v1/bank.json` (`francophone_west_africa`, `east_africa`); classic bank uses `question-stems-fr.ts` / `question-stems-sw.ts` (50 draft stems each).
  - `tw` / `wo`: currently English stems for classic bank (UI is localized, stems not fully localized yet).
- For consistency, the loader forces German locale to `classic` bank mode when non-classic banks are configured, because only classic IDs have curated German stems.

## EN (English) — verification scope

Files:
- `messages/en.json`
- `messages/en/privacy.json`

Native review focus:
- Clarity, plain-language readability, and consistency of research disclaimers.
- Legal precision in:
  - `ethics_consent.*`
  - `ethics_assent.*`
  - `ethics_results.*`
  - `site_footer.*`
  - `privacyPage.*` (from `messages/en/privacy.json`)
- Operator diagnostics wording:
  - `operatorSync.*`

## DE (German) — verification scope

Files:
- `messages/de.json`
- `messages/de/privacy.json`
- `src/i18n/question-stems-de.ts`

Native review focus:
- Formality/register consistency (`du` vs `Sie`) across entire flow.
- Legal wording accuracy in:
  - `ethics_consent.*`
  - `ethics_assent.*`
  - `ethics_results.*`
  - `privacyPage.*`
- Questionnaire UI labels and Likert labels:
  - `questionnaire.*`
- Question stems in `question-stems-de.ts`:
  - semantic equivalence to source English intent
  - readability at B1-B2
  - no accidental clinical wording drift

Known DE follow-up:
- `facilitator.*` placeholders were replaced with German wording, but this section should still receive native pedagogical review (teacher/caregiver register, age appropriateness, and consistency with local school language).

## TW (Twi/Akan) — verification scope

Files:
- `messages/tw.json` (merged over EN fallback)

Native review focus:
- All keys tagged `[NEEDS_REVIEW]`.
- Consent/ethics/legal content:
  - `consent.*`
  - `ethics_consent.*`
  - `ethics_assent.*`
  - `ethics_results.*`
  - `ethics_delete.*`
- Cultural appropriateness of dimension descriptions:
  - `dims.*`
  - `interp.*`
- Navigation and CTA clarity for low-literacy contexts:
  - `landing.*`
  - `questionnaire.*`
  - `results.*`

Known TW follow-up:
- Questionnaire stems are still English for now; Twi stem localization is pending.

## WO (Wolof) — verification scope

Files:
- `messages/wo.json` (merged over EN fallback)

Native review focus:
- Orthography and natural phrasing for first-language Wolof readers.
- Consent/legal clarity:
  - `consent.*`
  - `ethics_consent.*`
  - `ethics_assent.*`
  - `ethics_results.*`
  - `ethics_delete.*`
- Tone and accessibility in core UX:
  - `welcome.*`
  - `landing.*`
  - `questionnaire.*`
  - `results.*`

Known WO follow-up:
- Questionnaire stems are still English for now; Wolof stem localization is pending.

## FR (French — Francophone West Africa) — verification scope

**Status:** Tier 1–3 UI + privacy done (June 2026); `_localeReview: PENDING_NATIVE_REVIEW`.

Files:
- `messages/fr.json` (Tier 1 + Tier 3 namespaces)
- `messages/fr/privacy.json`
- `content/questions/cultural-adaptive-v1/bank.json` → `variants.francophone_west_africa`
- `src/i18n/question-stems-fr.ts` (classic bank only)

### Priority order (review in this sequence)

1. **Legal / ethics (highest risk)** — `consent.*`, `ethics_consent.*`, `ethics_assent.*`, `ethics_results.*`, `privacyPage.*`
2. **Assessment journey** — `welcome.*`, `landing.*`, `introduction.*`, `questionnaire.*`, `likert5_*`, `likert3_*`
3. **Results & interpretation** — `results.*`, `landscape.*`, `field.*`, `pipeline.*`, `interp.*`, `results_interpretation.*`, `radar.*`, `bars.*`, `insights.*`
4. **Dimension labels** — `dims.*` (plain-language F–V descriptions)
5. **Question stems** — sample 20 items per dimension from `francophone_west_africa`; all reverse-scored items
6. **Tier 4 (optional for pilot)** — skip unless facilitator workflow is in scope; see Tier 4 policy below

Native review focus:
- Register: vous/tu consistency; avoid unintended clinical or diagnostic tone.
- Francophone West Africa health-referral wording in consent (`important_medical`, `important_help`).
- Semantic parity of stems vs English intent; negations and reverse-scored items.
- Privacy bundle legal adequacy for WA field context (not EU copy-paste assumptions).

### §7.5 Sign-off template (FR)

Copy into PR or email when review is complete:

```
Locale: fr (Francophone West Africa)
Reviewer name / affiliation:
Date:
Bank reviewed: [ ] classic  [ ] cultural_adaptive_v1 (francophone_west_africa)
Sections signed off: consent/privacy / questionnaire UI / results UI / stems (circle)
Outstanding issues (if any):
Approved for field pilot without banner: [ ] yes  [ ] no — keep PENDING
```

## SW (Kiswahili — East Africa) — verification scope

**Status:** Tier 1–3 UI + privacy done (June 2026); `_localeReview: PENDING_NATIVE_REVIEW`.

Files:
- `messages/sw.json`
- `messages/sw/privacy.json`
- `content/questions/cultural-adaptive-v1/bank.json` → `variants.east_africa`
- `src/i18n/question-stems-sw.ts` (classic bank only)

### Priority order

Same sequence as §7 (legal → journey → results → dims → stems → Tier 4 optional).

Native review focus:
- Standard Kiswahili (sanifu) vs regional register — document choice in PR.
- East Africa health-referral and assent wording for youth contexts.
- Stem clarity for reverse-scored and double-negative items.
- Privacy bundle adequacy for Kenya/Tanzania/East Africa field norms.

### §8.5 Sign-off template (SW)

```
Locale: sw (Kiswahili / East Africa)
Reviewer name / affiliation:
Date:
Bank reviewed: [ ] classic  [ ] cultural_adaptive_v1 (east_africa)
Sections signed off: consent/privacy / questionnaire UI / results UI / stems
Outstanding issues (if any):
Approved for field pilot without banner: [ ] yes  [ ] no — keep PENDING
```

## Tier 4 policy (FR / SW field pilots)

These namespaces remain **English via merge fallback** until an institution requests facilitator/cohort localization:

- `cohort.*`, `group_analysis.*`, `facilitator.*`, parts of `operatorSync.*`, `offline_import.*`

**Pilot default:** Participants use welcome → consent → questionnaire → results only. Facilitators may see English research tools — acceptable for June 2026 pilots.

See [LOCALIZATION_COVERAGE.md](./LOCALIZATION_COVERAGE.md#tier-4-policy) and [FIELD_PILOT_FR_SW.md](./FIELD_PILOT_FR_SW.md).

## Question stems: explicit native-review tasks

For each target locale stem set (current: DE, FR, SW machine drafts; future: TW/WO):

1. Validate semantic parity with source English item intent.
2. Validate reading level and ambiguity (especially negations/reverse-scored items).
3. Validate cultural neutrality and non-stigmatizing phrasing.
4. Validate consistency of response-scale interpretation (`likert5` / `likert3`).
5. Sign off reverse-scored items separately (high risk of inversion errors).

## Completion criteria per locale

A locale is considered review-complete when:

- No placeholder markers remain (e.g. `[DE]`, `[NEEDS_REVIEW]`).
- Consent/privacy/legal paths are signed off by native speaker + project owner.
- Questionnaire UI labels and all shown stems are native-reviewed.
- A full end-to-end walkthrough is recorded in PR notes with screenshots.
