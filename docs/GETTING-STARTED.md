# Getting started

This page is the tutorial. It keeps the previous README quick start.

`./setup.sh` with no arguments calls `check_macos` and `check_homebrew` in `setup.sh`. That path is for macOS. The path that does not use that script is `npm install` and `npm run dev` below.

The public questionnaire is [https://map.synapticfour.com](https://map.synapticfour.com). Running the commands here starts a local server. It does not change that site. When `npm run dev` is running, the English page is [http://localhost:3000](http://localhost:3000). Data collection needs a Supabase project. The questionnaire itself can be opened without one.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for data collection)

### Installation

### One-command setup (macOS)

`setup.sh` stops unless the operating system is macOS. On macOS, run:

```bash
./setup.sh
```

This script automatically handles all setup steps including dependency installation, environment configuration, and server startup.

#### Complete CLI Lifecycle Management

The setup script provides complete lifecycle management for local testing:

```bash
# Setup and start
./setup.sh              # Full setup and start
./setup.sh start         # Start development server
./setup.sh stop          # Stop development server
./setup.sh restart       # Restart development server

# Maintenance
./setup.sh status        # Check system status
./setup.sh clean         # Clean local data and cache
./setup.sh update        # Update dependencies
./setup.sh reset         # Reset to clean state
./setup.sh verify        # Verify no artifacts committed

# Removal
./setup.sh remove        # Remove project completely
./setup.sh help          # Show all commands
```

#### Alternative Interfaces

Canonical command reference: [`docs/COMMANDS.md`](./COMMANDS.md)

**Makefile commands:**

```bash
make setup      # Run setup
make start      # Start server
make stop       # Stop server
make status     # Check status
make clean      # Clean data
make verify     # Verify no artifacts committed
```

**npm scripts:**

```bash
npm run setup      # Run setup
npm run start:dev   # Start server
npm run stop        # Stop server
npm run status      # Check status
npm run verify      # Verify no artifacts committed
npm run test:coverage # Unit tests with V8 coverage report
npm run test:edge   # Optional edge-case suites (stricter/experimental)
```

### Research pipeline & GDPR schema

- **Layered research stack** (raw → features → latent space projection (pilot) → public interpretation): see [`PIPELINE_ARCHITECTURE.md`](../PIPELINE_ARCHITECTURE.md). **Orchestration** lives in `src/lib/cognitive-pipeline.ts` (questionnaire → stored session). **Results 2D projection** for the landscape is built separately in `src/core/cognitive-pipeline.ts` (`buildCognitiveModel`) so UI views do not duplicate PCA.
- **GDPR / ethics tables** used by `src/lib/ethics-service.ts`: apply migrations in order (recommended: `supabase db push`):
  - Base schema: [`supabase/migrations/20260401090000_base_pcms_schema.sql`](../supabase/migrations/20260401090000_base_pcms_schema.sql)
  - Ethics/GDPR: [`supabase/migrations/20260413120000_ethics_gdpr.sql`](../supabase/migrations/20260413120000_ethics_gdpr.sql)
  - Ethics audit trail: [`supabase/migrations/20260414200000_ethics_audit_events.sql`](../supabase/migrations/20260414200000_ethics_audit_events.sql)

### Manual Setup

1. **Clone and install dependencies**

   ```bash
   git clone https://github.com/SynapticFour/perceptual-cognitive-mapping-system.git
   cd perceptual-cognitive-mapping-system
   npm install
   ```

2. **Set up Supabase** (optional for testing)
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your URL and anon key
   - Apply migrations from `supabase/migrations/` (recommended: `supabase db push`)

3. **Configure environment variables**
   Copy `.env.example` to `.env.local` and adjust:

   ```bash
   # Supabase (optional for local-only testing)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Server-only: research export API (`POST /api/research/export`), delete-session, ethics audit
   RESEARCH_EXPORT_API_KEY=your_secret
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   NODE_ENV=development
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Default locale: [http://localhost:3000](http://localhost:3000) (English). Other locales: `/de` (full UI), `/fr`, `/sw`, `/wo`, `/tw` (partial UI — see [`docs/LOCALIZATION_COVERAGE.md`](./LOCALIZATION_COVERAGE.md)). Assessment: `/questionnaire`, consent: `/consent`, results: `/results`.

> **Note**: You can test the complete system without Supabase setup. Data collection features require Supabase configuration.

### Public site (Vercel)

- **Tag release:** push `v*.*.*` → [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) → `vercel deploy --prod`. See **[`docs/deployment-runbook.md`](./deployment-runbook.md)** (deploy, rollback, Supabase migrations, backups).
- **Project:** connect this repo; Next.js is auto-detected. **`vercel.json`** sets `buildCommand` (`npm run build`), security headers, and caching for `/_next/static/*` vs HTML—no locale rewrites (next-intl keeps `/de`, `/fr`, `/sw`, `/wo`, `/tw` as normal routes).
- **Environment:** copy variables from **`.env.example`** into the Vercel project (Production + Preview as needed). Set **`NEXT_PUBLIC_APP_URL`** to your canonical URL (e.g. `https://map.synapticfour.com`). Supabase keys remain optional: without them the app uses browser storage only (IndexedDB + localStorage).
- **Domain:** attach **`map.synapticfour.com`** in Vercel → Domains (DNS at your registrar).
- **Supabase migrations:** manual via Supabase CLI before deploy when schema changes — not in CI (runbook).

### Quick Test

After setup, you can immediately test the system:

1. Open `/consent` and complete the multi-step consent
2. Take the adaptive questionnaire (about 10–15 minutes)
3. Confirm results assent when prompted, then view the cognitive landscape (map / density / vector views + share link)
4. Download JSON export from results if desired

**Quality gate (recommended before release):** `npm run check` (TypeScript + ESLint + question validation), `npm run test:unit`, `npm run test:coverage`, `npm run test:e2e` (Playwright; see `playwright.config.ts`), and `npm run build` (the Next.js build).  
`npm run test:edge` is intentionally separate for stricter edge-case diagnostics.
