# Regional question stems

## Goal

Same **measurement intent** and **psychometric item** (`id`, `reverse`, routing weights), while **surface wording** follows a **region** bundle.

## Regions

| Region | Typical UI locale | Language | Fallback chain |
|--------|-------------------|----------|----------------|
| `global` | `en` | English | — |
| `ghana` | `tw`, `ghana`, `gh-en` | Regional English | → `global` |
| `west_africa` | (env override) | Regional English | → `global` |
| `francophone_west_africa` | `fr`, `wo` | French (ca-v1) | → `west_africa` → `global` |
| `east_africa` | `sw` | Kiswahili (ca-v1) | → `global` |

## Selection logic

1. **Display** uses `resolveQuestionDisplayText(question, uiLocale)` (`src/lib/resolve-question-display-text.ts`).
2. If a locale stem map exists (`QUESTION_STEMS_DE`, `QUESTION_STEMS_FR`, `QUESTION_STEMS_SW`), use `map[question.id]` when present.
3. If `question.stemVariants` exists (cultural-adaptive bank), use `resolveStemForRegion(question, culturalAdaptiveStemKey(uiLocale))`.
4. Env override: `NEXT_PUBLIC_PCMS_CULTURAL_STEM=global|ghana|west_africa|francophone_west_africa|east_africa`.

`culturalAdaptiveStemKey()` lives in `src/lib/stem-region-fallback.ts`.

## Fallback system (`resolveStemForRegion`)

For requested region `R`, walk `STEM_REGION_FALLBACK_CHAIN[R]`, then `global`, then any non-empty variant, then `question.text`, then `question.id`.

## Coverage (June 2026)

- **cultural-adaptive-v1:** 200/200 `francophone_west_africa` (French, machine draft v1.3+); 200/200 `east_africa` (Kiswahili, machine draft v1.4+).
- **Classic universal:** German full; French/Swahili partial (~50 IDs each).

See [`LOCALIZATION_COVERAGE.md`](./LOCALIZATION_COVERAGE.md) for UI vs stems matrix.

## Authoring rules

- Variants are **paraphrases** of the same observable behaviour (same `id`, same `reverse`).
- **No culture as trait** — only register and setting phrasing.
- Machine drafts require native review before field deployment.
