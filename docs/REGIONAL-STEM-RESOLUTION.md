# Regional question stems (Step 3)

## Goal

Same **measurement intent** and **psychometric item** (`id`, `reverseScored`, `responseScale`, routing weights), while **surface wording** follows a **region** bundle: `global` | `ghana` | `west_africa`.

## Selection logic

1. **Display** uses `resolveQuestionDisplayText(question, uiLocale)` (`src/lib/resolve-question-display-text.ts`).
2. If `question.stemVariants` exists (cultural-adaptive bank and future banks), the English stem is:
   - `resolveStemForRegion(question, displayStemRegionForUiLocale(uiLocale))`.
3. `displayStemRegionForUiLocale` is **`culturalAdaptiveStemKey(uiLocale)`** (`src/lib/cultural-adaptive-bank.ts`):
   - Env override wins: `NEXT_PUBLIC_PCMS_CULTURAL_STEM=global|ghana|west_africa`.
   - Else: UI locale `ghana` or `gh-en` → `ghana`; any other locale → `global`.
4. German UI still prefers `QUESTION_STEMS_DE[question.id]` when present (unchanged).

## Fallback system (`resolveStemForRegion`)

For requested region `R`:

1. Use `trim(stemVariants[R])` if non-empty.
2. Else use `trim(stemVariants.global)` if non-empty.
3. Else use first non-empty among `ghana`, `west_africa`, `global` (any remaining).
4. Else `trim(question.text)` (load-time default).
5. Else `question.id`.

This keeps sessions **deterministic** and **offline**; no network.

## Semantic equivalence & bias

- Variants are **paraphrases** of the same observable behaviour (same `id`, same `reverse`).
- Authoring rule: **no culture as trait** (do not measure “Ghanaianness”); only **register / setting** phrasing.
- `global` is the canonical fallback so missing copy never blanks the UI.

## Example mapping (from `cultural-adaptive-v1/bank.json`)

| `id` | `global` (excerpt) | `ghana` (excerpt) | `west_africa` (excerpt) |
|------|--------------------|-------------------|-------------------------|
| `ca-v1-sensory_regulation-001` | “I notice everyday smells in a room before others mention them.” | “When I enter a room or hall, I often notice ordinary smells there before anyone else points them out.” | “In the place where I sit or stand, I tend to notice common smells before people around me say anything.” |

All three: **same construct** (sensory noticing vs others), same **Likert** process, different **collocation** only.
