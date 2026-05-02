# Research session export (ZIP bundle)

## Formats in behavioural / psychology research

What is **most widespread** for sharing tabular + metadata:

- **CSV (long format)** — one row per response; universal for **SPSS, R, Stata, Python (pandas)**. This remains the default interchange for journals and secondary analysis.
- **JSON sidecars** — full pipeline output and reproducible structured data; common in web-first studies and for scripting.

**RO-Crate** ([Research Object Crate](https://www.researchobject.org/ro-crate/)) is **not** as ubiquitous as CSV in psychology departments, but it is **growing** in FAIR data repositories, institutional archives, and cross-disciplinary workflows. It packages files with **linked-data metadata** so deposits are machine-actionable.

## What PCMS ships

The **Research bundle (ZIP)** download includes:

| File | Role |
|------|------|
| `manifest.json` | Export version, session ids, consent timestamp pointer, **SHA-256** of pipeline + history JSON |
| `pipeline-session.json` | Full `StoredPipelineSession` |
| `question-history.json` | Serialised `QuestionResponse[]` |
| `responses-long.csv` | Long-format CSV for stats software |
| `ro-crate-metadata.json` | **Minimal RO-Crate 1.1** `Dataset` describing the bundle |

**Recommendation:** Use **CSV + JSON** for everyday analysis; use the **full ZIP** (with RO-Crate) when submitting to a repository that supports FAIR packaging or when you want checksums and a single archive.

## Related code

- `src/lib/research-session-bundle.ts` — ZIP construction and RO-Crate graph.
- `src/app/[locale]/results/page.tsx` — “Research bundle (ZIP)” button when a full session is stored.
