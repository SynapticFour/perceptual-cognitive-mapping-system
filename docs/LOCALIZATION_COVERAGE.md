# Localization coverage matrix (June 2026)

Honest status for partners, reviewers, and deploy checks. **UI language** and **question stems** are tracked separately.

## Short answer

| Locale | Full website UI? | Question stems (default classic bank) | Question stems (`cultural_adaptive_v1`) |
|--------|------------------|--------------------------------------|----------------------------------------|
| `en` | **Yes** (~691 keys) | English (canonical) | `global` / regional English |
| `de` | **Yes** (~689 keys + DE privacy bundle) | ~130 classic + TIAV overrides | Forced to classic (no DE stems for ca-v1) |
| `fr` | **No** — ~45 keys; **~94% UI falls back to English** | 50 classic draft stems; **200/200** francophone | **200/200** `francophone_west_africa` (machine draft) |
| `sw` | **No** — ~45 keys; **~94% UI falls back to English** | 50 classic draft stems; **200/200** Kiswahili | **200/200** `east_africa` (machine draft) |
| `tw` | **Partial** — ~126 keys merged over English | English (Ghana stems when `ghana`/`tw` region) | English via `ghana` stem region |
| `wo` | **Partial** — ~485 keys merged over English | English; maps to `francophone_west_africa` for ca-v1 | French ca-v1 stems when using cultural bank |

**Conclusion:** The live site is **not** fully localized in French or Swahili. Questionnaire **item text** can be fully localized for `cultural_adaptive_v1` in `fr` and `sw`; navigation, consent body, results copy, dimensions T–V, privacy pages, and most chrome remain **English** until `messages/fr.json` and `messages/sw.json` are expanded.

---

## UI messages (`messages/`)

| Locale | Leaf keys translated | Merge strategy | Review flag |
|--------|---------------------|----------------|-------------|
| `en` | 691 | Canonical | — |
| `de` | 689 | Standalone + `messages/de/privacy.json` | Production UI |
| `fr` | 45 | `deepMergeMessages(en, fr)` | `_localeReview: PENDING_NATIVE_REVIEW` |
| `sw` | 45 | `deepMergeMessages(en, sw)` | `_localeReview: PENDING_NATIVE_REVIEW` |
| `tw` | 126 | Merge over English | `_localeReview: PENDING_NATIVE_REVIEW` |
| `wo` | 485 | Merge over English | `_localeReview: PENDING_NATIVE_REVIEW` |

French/Swahili draft bundles cover: welcome, consent headline, Likert anchors, partial results/dims (F/E/S only), ethics prototype banner, language switcher labels.

---

## Question stems

Resolution order: `resolveQuestionDisplayText()` → locale stem map (`QUESTION_STEMS_*`) if present → else `stemVariants[region]` with fallback chain (`src/lib/stem-region-fallback.ts`).

| Bank | `fr` region | `sw` region | `de` |
|------|-------------|-------------|------|
| `universal` classic (~130) | 50 in `question-stems-fr.ts` | 50 in `question-stems-sw.ts` | Full in `question-stems-de.ts` + TIAV |
| `cultural-adaptive-v1` (200) | 200 `francophone_west_africa` in `bank.json` v1.3+ | 200 `east_africa` in `bank.json` v1.4+ | Not available (loader forces classic for `de`) |

Set `NEXT_PUBLIC_PCMS_QUESTION_SOURCE=cultural_adaptive_v1` on Vercel for French/Swahili field pilots to use regional stems.

---

## Routing & switcher

All six locales are registered in `src/i18n/routing.ts` and appear in `LanguageSwitcher`. URLs: `/fr/...`, `/sw/...`, etc. (English omits `/en` prefix).

---

## Known gaps (action items)

1. Expand `messages/fr.json` and `messages/sw.json` toward parity with `en.json` (consent body, privacy, all dimension labels, questionnaire chrome, nav).
2. Native speaker review for machine-draft stems and UI copy (`meta.json` → `pending_native_speaker`).
3. Classic bank: extend `question-stems-fr.ts` / `question-stems-sw.ts` beyond 50 IDs if classic mode stays enabled for those locales.
4. Wolof/Twi: unchanged partial UI; no dedicated ca-v1 stem regions.

---

## Verification commands

```bash
npm run check
PCMS_VALIDATE_LOCALE=fr npm run validate-cultural-bank
PCMS_VALIDATE_LOCALE=sw npm run validate-cultural-bank
```

See also: [`I18N.md`](./I18N.md), [`REGIONAL-STEM-RESOLUTION.md`](./REGIONAL-STEM-RESOLUTION.md).
