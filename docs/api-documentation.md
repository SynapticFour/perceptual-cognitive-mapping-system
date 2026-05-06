# API Documentation
## Perceptual & Cognitive Mapping System

This document lists currently implemented API routes under `src/app/api/**/route.ts`.

Base URL:

```text
http://localhost:3000/api
```

## Auth model (current)

- Public health and question-loading endpoints are unauthenticated.
- Research export uses API key authentication.
- Session deletion and compliance endpoints use server-side controls in the route handlers.

## Implemented endpoints

### Questionnaire and content

- `GET /api/questions`
  - Returns question bank payload for the current locale/source mode.

### Research export

- `POST /api/research/export`
  - Exports research data.
  - Requires research export API key.

### Session deletion and ethics

- `POST /api/delete-session`
  - Deletes pseudonymous session data for the provided session id.

- `POST /api/ethics-audit`
  - Appends ethics audit events.

- `GET /api/ethics/compliance-report`
  - Returns compliance summary output.

### ATLAS

- `POST /api/atlas/self-nomination`
  - Accepts ATLAS self-nomination payloads.

### Diagnostics / operations

- `HEAD /api/health`
- `GET /api/health`
  - Compatibility endpoint exposing structured readiness summary.

- `GET /api/health/live`
  - Liveness probe.

- `GET /api/health/ready`
  - Readiness probe (`pass` / `warn` / `fail`).

- `GET /api/health/supabase-public`
  - Non-secret diagnostics for public Supabase env detection.

## Canonical references

- Deployment and runtime diagnostics: `docs/DEPLOYMENT.md`, `docs/DIAGNOSTICS.md`
- Ethics and compliance behavior: `docs/ethics.md`, `docs/DEPLOYMENT-LEGAL.md`
- Data model and storage semantics: `docs/data-model.md`

## Notes

- API surface is intentionally small; most questionnaire/result logic runs client-side in the app pipeline.
- For operational checks, use `docs/DIAGNOSTICS.md`.
- For storage semantics and schema, use `docs/data-model.md` and `supabase/migrations/`.
