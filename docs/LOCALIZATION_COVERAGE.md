# Localization coverage matrix (June 2026)

Honest status for partners, reviewers, and deploy checks. **UI language** and **question stems** are tracked separately.

## Short answer

| Locale | Full website UI? | Question stems (default classic bank) | Question stems (`cultural_adaptive_v1`) |
|--------|------------------|--------------------------------------|----------------------------------------|
| `en` | **Yes** (~691 keys) | English (canonical) | `global` / regional English |
| `de` | **Yes** (~689 keys + DE privacy bundle) | ~130 classic + TIAV overrides | Forced to classic (no DE stems for ca-v1) |
| `fr` | **Tier 1–3 yes** (~554/733 keys); **~76% full site** | 50 classic draft stems; **200/200** francophone | **200/200** `francophone_west_africa` (machine draft) |
| `sw` | **Tier 1–3 yes** (~563/733 keys); **~77% full site** | 50 classic draft stems; **200/200** Kiswahili | **200/200** `east_africa` (machine draft) |
| `tw` | **Partial** — ~126 keys merged over English | English (Ghana stems when `ghana`/`tw` region) | English via `ghana` stem region |
| `wo` | **Partial** — ~485 keys merged over English | English; maps to `francophone_west_africa` for ca-v1 | French ca-v1 stems when using cultural bank |

**Conclusion:** `fr` and `sw` have **Tier 1–3** (assessment journey, privacy, results landscape/interpretation). **Cohort, group analysis, facilitator, offline import tools** (Tier 4) remain English. Only `en` and `de` are fully localized end-to-end.

---

## UI messages (`messages/`)

| Locale | Leaf keys translated | Merge strategy | Review flag |
|--------|---------------------|----------------|-------------|
| `en` | 691 | Canonical | — |
| `de` | 689 | Standalone + `messages/de/privacy.json` | Production UI |
| `fr` | 378 Tier 1 + 147 Tier 3 + 42 privacy (~554) | merge + `messages/fr/privacy.json` | `_localeReview: PENDING_NATIVE_REVIEW` |
| `sw` | 378 Tier 1 + 147 Tier 3 + 42 privacy (~563) | merge + `messages/sw/privacy.json` | `_localeReview: PENDING_NATIVE_REVIEW` |
| `tw` | 126 | Merge over English | `_localeReview: PENDING_NATIVE_REVIEW` |
| `wo` | 485 | Merge over English | `_localeReview: PENDING_NATIVE_REVIEW` |

French/Swahili Tier 1 bundles cover the full assessment journey (June 2026): welcome through banner namespaces; Likert uses `likert5_*` / `likert3_*` keys.

---

## Question stems

Resolution order: `resolveQuestionDisplayText()` → locale stem map (`QUESTION_STEMS_*`) if present → else `stemVariants[region]` with fallback chain (`src/lib/stem-region-fallback.ts`).

| Bank | `fr` region | `sw` region | `de` |
|------|-------------|-------------|------|
| `universal` classic (~130) | 50 in `question-stems-fr.ts` | 50 in `question-stems-sw.ts` | Full in `question-stems-de.ts` + TIAV |
| `cultural-adaptive-v1` (200) | 200 `francophone_west_africa` in `bank.json` v1.3+ | 200 `east_africa` in `bank.json` v1.4+ | Not available (loader forces classic for `de`) |

Set `NEXT_PUBLIC_PCMS_QUESTION_SOURCE=cultural_adaptive_v1` on Vercel for French/Swahili field pilots to use regional stems. Full deploy checklist: [FIELD_PILOT_FR_SW.md](./FIELD_PILOT_FR_SW.md).

---

## Tier 4 policy

**Decision (June 2026):** Research-operator UI stays **English** for `fr` and `sw` until a partner institution needs localized facilitator/cohort workflows.

| Tier | Namespaces | FR / SW status |
|------|------------|----------------|
| 1 | welcome → banner, questionnaire, Likert, dims, results core | ✅ Localized |
| 2 | `privacyPage` | ✅ Localized |
| 3 | landscape, field, pipeline, interp, radar, bars, insights | ✅ Localized |
| 4 | cohort, group_analysis, facilitator, offline import, operator tools | ⚠️ English (merge fallback) |

**Rationale:** Field sessions route participants through Tiers 1–3 only; Tier 4 is low-traffic and high legal/research translation cost.

**When to translate Tier 4:** Signed partner request + native reviewer for research terminology. Track in backlog / partner MOU.

**Env:** No toggle — intentional product default for pilots. See [FIELD_PILOT_FR_SW.md](./FIELD_PILOT_FR_SW.md#tier-4-policy-english-until-requested).

---

## Routing & switcher

All six locales are registered in `src/i18n/routing.ts` and appear in `LanguageSwitcher`. URLs: `/fr/...`, `/sw/...`, etc. (English omits `/en` prefix).

---

## Known gaps (action items)

1. ~~Tier 1 UI + privacy.~~ ~~Tier 3 landscape/interpretation.~~ Done (June 2026).
2. Native speaker / legal review for machine-draft stems, UI copy, and privacy bundles — [LOCALE-NATIVE-REVIEW-CHECKLIST.md](./LOCALE-NATIVE-REVIEW-CHECKLIST.md) §7–8.
3. ~~Tier 4 research/team tools — optional; can remain English for field pilots.~~ **Policy set:** Tier 4 stays EN until requested (see above).
4. E2E smoke: `npm run test:locale-smoke` for `/fr` and `/sw`.

---

## Verification commands

```bash
npm run check
npm run test:locale-smoke
PCMS_VALIDATE_LOCALE=fr npm run validate-cultural-bank
PCMS_VALIDATE_LOCALE=sw npm run validate-cultural-bank
```

See also: [`I18N.md`](./I18N.md), [`REGIONAL-STEM-RESOLUTION.md`](./REGIONAL-STEM-RESOLUTION.md).
