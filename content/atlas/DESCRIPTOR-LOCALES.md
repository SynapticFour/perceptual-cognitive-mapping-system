# ATLAS descriptor locale overrides

Canonical English stems: [`descriptors-v1.json`](./descriptors-v1.json).

Optional per-locale **body text** overrides live in [`descriptors-locale-overrides-v1.json`](./descriptors-locale-overrides-v1.json):

```json
"locales": {
  "tw": { "DESC-intero-001": "…Twi…" },
  "wo": { "DESC-intero-001": "…Wolof…" }
}
```

- Keys must match descriptor `id` values from `descriptors-v1.json`.
- If an id is missing for a locale, the UI falls back to the English `text` field.
- Runtime mapping: `tw` applies to UI locales `tw`, `ghana`, and `gh-en` (same pattern as question stem bundles).

Have **native speakers** author or review all overrides before research use; do not ship machine-guessed African language strings.

Loader: `src/atlas/self-nomination/descriptor-display-text.ts`.
