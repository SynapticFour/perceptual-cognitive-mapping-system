# PCMS — Deployment Runbook

Operator guide for **SynapticFour SaaS** production: **Vercel** (app) + **Supabase** (Postgres). No Docker/Compose release path — intentional for Category B.

Reference: [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md) (env vars), [`docs/DEPLOYMENT-LEGAL.md`](./DEPLOYMENT-LEGAL.md) (legal checklist).

---

## Architecture

| Layer | Service | Notes |
|-------|---------|-------|
| App | Vercel | Next.js; `vercel.json` + project env |
| Database | Supabase (EU Frankfurt) | SQL in `supabase/migrations/` |
| Offline / local dev | Browser only | IndexedDB + localStorage — no Supabase required |

---

## Release deploy (tag)

1. Ensure **`main` CI is green** (`.github/workflows/ci.yml`).
2. If the release includes **schema changes**, apply Supabase migrations **first** (see below).
3. Update `CHANGELOG.md`.
4. Tag and push:
   ```bash
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin vX.Y.Z
   ```
5. GitHub Actions **Deploy** (`.github/workflows/deploy.yml`) runs:
   - lint, validators, type-check, unit tests, build
   - `vercel deploy --prod`
6. Post-deploy smoke:
   ```bash
   curl -s https://map.synapticfour.com/api/health/live
   curl -s https://map.synapticfour.com/api/health/ready
   curl -s https://map.synapticfour.com/api/health/supabase-public
   ```

**Required GitHub secrets:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

Ad-hoc deploy without tag: workflow **Rotate Research API Keys** (optional deploy) or local `vercel deploy --prod`.

---

## Supabase migrations (manual — not in CI)

Migrations are **not** run automatically on tag deploy. Apply them **locally** with the Supabase CLI **before** deploying app code that depends on new schema.

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Project linked (one-time): `supabase login` → `supabase link --project-ref <ref>`

### Apply pending migrations

From repo root:

```bash
supabase db push
```

Or review and apply individually:

```bash
supabase migration list
supabase db push --dry-run   # preview
supabase db push
```

Migration files (source of truth):

| File | Purpose |
|------|---------|
| `20260401090000_base_pcms_schema.sql` | Core PCMS tables |
| `20260413120000_ethics_gdpr.sql` | GDPR / consent tables |
| `20260414200000_ethics_audit_events.sql` | Ethics audit trail |
| `20260502120000_atlas_tables_rls.sql` | ATLAS tables + RLS |
| `20260505163000_research_storage_hardening.sql` | Research storage |
| `20260505164000_advisor_security_fixes.sql` | Security advisor fixes |

**Order:** always migrate **before** Vercel deploy when SQL changes ship in the tag.

Legacy one-shot scripts (`supabase-schema*.sql` at repo root) are reference only — prefer `supabase/migrations/`.

---

## Rollback

### App (Vercel) — instant

1. Vercel dashboard → **Deployments** → select last known-good deployment → **Promote to Production**  
   Rollback is **immediate** (no rebuild required for promotion).

2. Or redeploy a previous git tag:
   ```bash
   git checkout vX.Y.Z
   vercel deploy --prod
   ```

### Database (Supabase)

- **No automatic down-migrations.** Roll forward with a fix migration, or restore from backup (below).
- App rollback without DB rollback is safe only when the release did **not** change schema.

---

## Supabase backup

- **Dashboard:** Project → **Database** → **Backups** (plan-dependent; enable PITR on paid tiers).
- **Before risky migrations:** trigger a manual backup or note latest restore point in the release notes.
- **Manual dump** (operator workstation, direct connection — not pooler):
  ```bash
  pg_dump "$DATABASE_URL" -Fc -f pcms-backup-$(date +%Y%m%d).dump
  ```
- Free-tier projects pause after inactivity — use `.github/workflows/supabase-keepalive.yml` and/or `GET /health/db` monitoring.

---

## Local development without Supabase SaaS

PCMS runs **without** cloud Postgres. If `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset, the app uses **browser storage only** — no crash.

| Storage | Module | Contents |
|---------|--------|----------|
| **localStorage** | session, pipeline, consent | In-progress / completed assessment state |
| **IndexedDB** (`PCMSOffline`) | `src/lib/offline-storage.ts` | Question bank cache, offline session queue |

Cloud sync (`src/lib/offline-supabase-sync.ts`) runs only when Supabase is configured and online.

**Quick start (no Supabase):**

```bash
cp .env.example .env.local
# Leave Supabase vars empty
npm install
npm run dev
```

Open `http://localhost:3000` — full questionnaire, scoring, and results work locally. Research export, ethics audit API, and multi-device sync require Supabase + server keys.

See also: [`OFFLINE-AND-PAPER-ARCHITECTURE.md`](./OFFLINE-AND-PAPER-ARCHITECTURE.md).

---

## Related workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | push/PR `main` | Full verify + e2e |
| `deploy.yml` | tag `v*.*.*` | Production Vercel |
| `supabase-keepalive.yml` | daily cron | Prevent free-tier pause |
| `rotate-research-keys.yml` | manual | Rotate research API keys + optional deploy |
