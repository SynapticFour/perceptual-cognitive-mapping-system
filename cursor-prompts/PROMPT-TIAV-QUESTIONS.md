# Cursor prompt: T / I / A / V question banks (PCMS Phase 0.1)

## Goal

Add **20 items per dimension** for **T** (Temporal), **I** (Interoceptive), **A** (Associative), **V** (Verbal–Spatial) so the 10D routing model is content-complete. Follow existing bank schema (`content/questions/schema.json`, universal core patterns).

## Constraints

- **Non-diagnostic copy** — no disorder names, deficit framing, or clinical cutoffs (see `docs/DECISIONS.md` ADR-005).
- **Ghana:** add culturally adapted stems where appropriate (`gh_variant` or regional stem pattern used elsewhere in the repo — match existing Ghana/Twi workflow).
- **Routing tags:** items must load onto the correct dimension weights; validate with `npm run validate-questions` (or the bank-specific validator once items are in the right JSON pack).
- **Reverse scoring:** mark where needed; keep consistent with F–C item style.

## Deliverables

1. JSON (or split files) under the same packaging model as existing universal items — **do not** place ATLAS-only content here (that lives under `content/questions/atlas-v1/` per ADR-001/002).
2. Short `docs/` note or changelog line listing bank version bump for “instrument lock” before Phase 1 collection.

## Done when

- Each of T, I, A, V has ≥20 scored items in the active universal (+ Ghana where applicable) bank.
- CI validation passes.
