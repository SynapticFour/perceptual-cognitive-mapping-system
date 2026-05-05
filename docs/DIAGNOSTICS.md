# Diagnostics and Health Checks

PCMS now follows a common production pattern for service diagnostics:

- **Liveness probe**: `/api/health/live`
- **Readiness probe**: `/api/health/ready`
- **Public Supabase env diagnostics**: `/api/health/supabase-public`
- **Compatibility endpoint**: `/api/health` (same readiness payload shape)

These endpoints are safe for production use and never return secrets.

## Endpoint Semantics

### `GET /api/health/live`

Use for uptime/liveness checks. This should only verify that the process responds.

Example:

```json
{
  "status": "pass",
  "service": "pcms",
  "probe": "live",
  "timestamp": "2026-05-05T16:00:00.000Z"
}
```

### `GET /api/health/ready`

Use for readiness/load-balancer checks. Returns:

- `pass` (healthy)
- `warn` (degraded but service still usable, e.g., local-only mode)
- `fail` (unhealthy; responds with HTTP 503)

Current readiness checks include:

- HTTP runtime availability
- Supabase public env availability (`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`, with fallback from `SUPABASE_URL` + `SUPABASE_ANON_KEY`)

### `GET /api/health/supabase-public`

Deployment diagnostics for public Supabase env resolution:

- `configured` (boolean)
- `urlHost` (host only, never full key/URL secrets)
- `vercelEnv`, `targetEnv`, `gitSha`

Use this endpoint to debug "cloud not configured" behavior on `/consent` without exposing credentials.

## Operator UI Diagnostics

When `NEXT_PUBLIC_PCMS_SHOW_OPERATOR_SYNC_DIAGNOSTIC=1`, PCMS shows an operator bar with:

- Cloud env detected/not detected
- Participant cloud-storage consent status
- Last cloud write status (success/failure + context)
- Pending offline sessions count

Component: `src/components/layout/OperatorSyncDiagnosticBar.tsx`

## Why This Matters

This setup follows widely used service-health conventions:

- Keep liveness checks minimal and dependency-free.
- Put dependency/config checks in readiness.
- Return structured machine-readable JSON for operations and automation.
- Do not expose secrets in diagnostic payloads.
