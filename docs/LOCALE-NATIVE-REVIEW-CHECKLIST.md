# Locale Native-Speaker Review Checklist

This checklist documents exactly which text needs native-speaker verification to keep PCMS language quality and legal clarity high across all supported UI locales (`en`, `de`, `tw`, `wo`).

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
  - `tw` / `wo`: currently English stems (UI is localized, stems are not fully localized yet).
- For consistency, the loader now forces German locale to `classic` bank mode when non-classic banks are configured, because only classic IDs have curated German stems.

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

## Question stems: explicit native-review tasks

For each target locale stem set (current: DE only; future: TW/WO):

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
