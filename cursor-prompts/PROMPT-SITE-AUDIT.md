# Cursor prompt: Live site audit (public deployment)

## Goal

Ensure **map.synapticfour.com** (and equivalent public builds) are legally and ethically safe: no diagnostic overclaim, honest consent, visible validity link, no implied clinical/educational utility.

## Checklist

1. **User-facing copy** (`messages/*.json`, `src/app`, `src/components`): no diagnosis names, no “disorder/deficit/clinical” framing in UI; prefer capacity-oriented wording (ADR-005).
2. **Consent:** research prototype + data use + retention + IRB status where required; Ghana step honest about voluntary research vs care (`messages` `ethics_consent.*`).
3. **Results:** visible map disclaimer; hedged dimension language.
4. **Footer / meta:** link to validity statement (`docs/VALIDATION_PROTOCOL.md` on GitHub or equivalent); `description` / Open Graph honest; no `noindex` on public marketing routes.
5. **Record findings** in `docs/SITE_AUDIT_REPORT.md` (append a new dated section if re-auditing).

## Reference

- Completed pass (2026-05): `docs/SITE_AUDIT_REPORT.md`
- Validity narrative: `docs/VALIDATION_PROTOCOL.md`
