# Perceptual & Cognitive Mapping System (PCMS) v1.0

[![Live Demo](https://img.shields.io/badge/Live%20Demo-map.synapticfour.com-6366f1)](https://map.synapticfour.com)

**Research-Grade Adaptive Assessment Platform for Cognitive Diversity**

**GitHub “About” description (copy into repository settings):**  
`Research-grade adaptive assessment platform for cognitive diversity. Continuous dimensional profiling — not diagnosis, not labels. Next.js 16 · TypeScript · MIT.`

A scientifically grounded web-based system for mapping human cognition into continuous multi-dimensional space, replacing categorical thinking with dimensional modeling for **research and educational self-understanding** (not clinical diagnosis).

> **Research Prototype | MIT License | Not a diagnostic instrument**
>
> PCMS maps cognitive tendencies as continuous dimensional profiles — not labels, not diagnoses.
> It is designed for self-understanding and open research. Results should never be used for
> institutional decisions about individuals.
>
> [Why no labels? →](#design-philosophy)

### Version labels

Research documentation and stored assessments refer to protocol **v1.0** for reproducibility. The npm semver in `package.json` is maintained separately and may differ—pin **git commit** (or release tags, when published) for reproducible deployments, not the npm version alone.

## Design Philosophy

### Dimensions, not diagnoses

PCMS deliberately avoids assigning diagnostic labels. This is a considered scientific and ethical choice, not a gap. Here is why:

**Scientifically:** Human cognitive traits are continuously distributed. The evidence that conditions like ADHD, autism, or dyslexia represent discrete natural categories (rather than cut-points on continuous spectra) is weak (Haslam, 2003; Haslam et al., 2020). Dimensional models consistently outperform categorical models in predictive validity (Kotov et al., 2017 — the HiTOP framework; Insel et al., 2010 — the RDoC framework).

**In cross-cultural contexts:** A clinical label assigned by a Western instrument applied in a Ghanaian classroom can result in stigma, exclusion, or harm — independent of whether the label is accurate. PCMS was designed from the start to be useful in settings where labels do more harm than good. The same profile that in one context might lead a person to explore whether they are highly sensitive, in another context might make them less likely to seek help if it generates a stigmatising classification.

**For novel discovery:** By not forcing cognitive variation into pre-existing categories, PCMS can detect patterns that categorical instruments mask. This is a genuine scientific opportunity.

### What PCMS is not a replacement for

PCMS does not replace:
- Clinical diagnostic assessment
- Neuropsychological testing
- Accommodation or service eligibility assessments

### Compatibility with label-based systems

If a user does want to understand how their PCMS profile relates to common neurodevelopmental presentations, that mapping is possible — but it is always framed as correlation, never as diagnosis. The research literature on dimensional correlates of categorical diagnoses (e.g. Wakschlag et al., 2019) provides the scientific basis for such mappings, while preserving the non-pathologising framing.

## Research-Grade Features

### Scientific Assessment Engine
- **10-dimensional routing model** (`src/model/cognitive-dimensions.ts`): **F** Focus, **P** Pattern processing, **S** Sensory sensitivity, **E** Social energy, **R** Structure preference, **C** Cognitive flexibility, plus **T, I, A, V** (extended routing axes; research-facing, non-diagnostic)
- **Adaptive Questionnaire**: 15 core questions + 12 targeted refinements with confidence-based stopping
- **Research Confidence Model**: CTT-style weighted evidence, shrinkage reliability, and consistency penalty ([specification](docs/confidence-model.md)); 0.75 threshold for routing decisions
- **Phase-Based Logic**: Core coverage dimension balancing, then targeted refinement

### Data Collection & Integrity
- **Structured Logging**: Complete assessment tracking with question paths and timing
- **Version Control**: Assessment versioning (v1.0) for research reproducibility
- **Quality Assurance**: Data validation and fallback mechanisms
- **Research Protocol**: Complete study design with hypotheses and analysis plan

### User Experience
- **Internationalization**: English (default URL), German (`/de/...`), Wolof (`/wo/...`), Twi/Akan draft (`/tw/...`, merges over English for missing keys); see [`docs/I18N.md`](./docs/I18N.md)
- **Dedicated consent flow**: `/consent` (multi-step checkboxes) before questionnaire/results — **institutions using this with minors or in classrooms must supply local ethics approval, assent/consent wording, and any age rules** (see [`docs/ethics.md`](./docs/ethics.md))
- **Dynamic Insights**: Descriptive summaries based on response patterns (non-diagnostic)
- **Potential Stressors**: Identification of challenging situations (where configured in copy)
- **Interactive visualization**: Results **cognitive landscape** — micro-trait activations (map, density, **cognitive field**, **3D terrain**, vector) over **one** shared latent projection (`src/core/cognitive-pipeline.ts`, `src/core/traits`, `src/ui/CognitiveViewSwitcher.tsx`); optional **emergent co-activation patterns** learned only from signatures recorded in the same browser session (`src/core/patterns`); dimensional bars and insight cards; **Recharts** on research dashboards (not the main results map); 3D pipeline notes in [`docs/COGNITIVE-TERRAIN-3D.md`](./docs/COGNITIVE-TERRAIN-3D.md)
- **Cultural adaptation**: Multiple question banks and locales (e.g. universal and Ghana-tuned items in `content/questions/`)
- **Cohort Intelligence Layer** (aggregate only): shared cognitive map, environment and interaction insights, global pattern library, validation — see [`docs/COHORT-INTELLIGENCE.md`](./docs/COHORT-INTELLIGENCE.md) (not classification analytics; no labels in group views)
- **Offline-first & field workflows**: Bundled static question bank (`prebuild`), IndexedDB + optional service worker precache; paper/CSV replay at `/field-import` — [`docs/OFFLINE-AND-PAPER-ARCHITECTURE.md`](./docs/OFFLINE-AND-PAPER-ARCHITECTURE.md)
- **Research session bundle**: Downloadable ZIP with manifest, long-form CSV, optional RO-Crate metadata — [`docs/RESEARCH-SESSION-EXPORT.md`](./docs/RESEARCH-SESSION-EXPORT.md)
- **Optional multi-profile analysis**: `/group-cognitive-analysis` (paste several share payloads) — [`docs/GROUP-COGNITIVE-ANALYSIS.md`](./docs/GROUP-COGNITIVE-ANALYSIS.md)

### Research Infrastructure
- **Publication-Ready Data**: Structured datasets for statistical analysis
- **Study Management**: Complete research protocol implementation
- **Ethical Compliance**: Informed consent, anonymity, and data protection
- **CLI Tools**: One-command setup and complete lifecycle management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for data collection)

### Installation

### One-Command Setup (macOS / Unix-like)

On macOS or another Unix-like environment with Bash, run:

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

Canonical command reference: [`docs/COMMANDS.md`](./docs/COMMANDS.md)

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

- **Layered research stack** (raw → features → latent space projection (pilot) → public interpretation): see [`PIPELINE_ARCHITECTURE.md`](./PIPELINE_ARCHITECTURE.md). **Orchestration** lives in `src/lib/cognitive-pipeline.ts` (questionnaire → stored session). **Results 2D projection** for the landscape is built separately in `src/core/cognitive-pipeline.ts` (`buildCognitiveModel`) so UI views do not duplicate PCA.
- **GDPR / ethics tables** used by `src/lib/ethics-service.ts`: after applying `supabase-schema.sql`, run in order in the Supabase SQL editor (or your migration workflow):
  - [`supabase/migrations/20260413120000_ethics_gdpr.sql`](./supabase/migrations/20260413120000_ethics_gdpr.sql)
  - [`supabase/migrations/20260414200000_ethics_audit_events.sql`](./supabase/migrations/20260414200000_ethics_audit_events.sql) (audit events for compliance reporting)

### Manual Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd perceptual-cognitive-mapping-system
   npm install
   ```

2. **Set up Supabase** (optional for testing)
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your URL and anon key
   - Run the SQL schema from `supabase-schema.sql` in Supabase SQL editor

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
   Default locale: [http://localhost:3000](http://localhost:3000) (English). Other locales: `/de`, `/wo`, `/tw` (draft). Assessment: `/questionnaire`, consent: `/consent`, results: `/results`.

> **Note**: You can test the complete system without Supabase setup. Data collection features require Supabase configuration.

### Production deployment (Vercel)

- **Project:** connect this repo; Next.js is auto-detected. **`vercel.json`** sets `buildCommand` (`npm run build`), security headers, and caching for `/_next/static/*` vs HTML—no locale rewrites (next-intl keeps `/de`, `/wo`, `/tw` as normal routes).
- **Environment:** copy variables from **`.env.example`** into the Vercel project (Production + Preview as needed). Set **`NEXT_PUBLIC_APP_URL`** to your canonical URL (e.g. `https://map.synapticfour.com`). Supabase keys remain optional: without them the app uses browser storage only.
- **Domain:** attach **`map.synapticfour.com`** in Vercel → Domains (DNS at your registrar).

### Quick Test

After setup, you can immediately test the system:
1. Open `/consent` and complete the multi-step consent
2. Take the adaptive questionnaire (about 10–15 minutes)
3. Confirm results assent when prompted, then view the cognitive landscape (map / density / vector views + share link)
4. Download JSON export from results if desired

**Quality gate (recommended before release):** `npm run check` (TypeScript + ESLint + question validation), `npm run test:unit`, `npm run test:coverage`, `npm run test:e2e` (Playwright; see `playwright.config.ts`), and `npm run build` (production compile).  
`npm run test:edge` is intentionally separate for stricter edge-case diagnostics.

## 🏗️ Architecture

### Core Components

- **Model Layer** (`/src/model/`): Cognitive dimensions and profile definitions
- **Data Layer** (`/src/data/`): Question database and cultural adaptations
- **Adaptive Engine** (`/src/adaptive/`): Intelligent question selection
- **Scoring Model** (`/src/scoring/`): Response processing and confidence tracking
- **UI Components** (`/src/components/`): Reusable React components
- **Results views** (`/src/ui/`): `CognitiveViewSwitcher` and per-view renderers (`src/ui/views/`)
- **Data Collection** (`/src/lib/`): Supabase integration and analytics

### Key Algorithms

1. **Adaptive Question Selection**: 
   - Targets lowest confidence dimensions
   - Maximizes expected information gain
   - Avoids question redundancy

2. **Confidence Tracking**:
   - Bayesian-inspired confidence updates
   - Temporal decay for old responses
   - Outlier detection and handling

3. **Dimensional Scoring**:
   - Weighted question contributions
   - Normalized Likert scale processing
   - Continuous vector representation

## 📊 Research Integration

### Data Structure

- **Sessions**: Anonymous assessment tracking
- **Profiles**: Final cognitive vectors with confidence
- **Responses**: Individual question answers with timing
- **Analytics**: Aggregated research data

### Ethical Considerations

- **Complete Anonymity**: No PII collected
- **Informed Consent**: Required before assessment
- **Voluntary Participation**: Can withdraw at any time
- **Research Purpose**: Clearly stated, not diagnostic
- **Cultural Sensitivity**: Multiple context support

## 🔧 Development

### Project Structure

```
├── messages/               # next-intl UI strings (en, de, wo, tw draft)
├── src/
│   ├── app/[locale]/       # Next.js App Router (locale segment)
│   ├── i18n/               # next-intl routing + request config
│   ├── components/         # React components
│   ├── model/              # Routing dimensions + latent model
│   ├── core/               # Results PCA model, synthetic population, traits, in-browser pattern mining
│   ├── data/               # Questions and adaptations
│   ├── adaptive/           # Questionnaire engine
│   ├── scoring/            # Response processing
│   ├── ui/                 # Cognitive view switcher + view components
│   └── lib/                # Questionnaire pipeline, data collection, ethics
├── docs/                   # Documentation
├── lib/research/           # Research materials
└── supabase-schema.sql     # Database schema
```

### Key Technologies

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS 4
- **Charts**: Recharts for research admin charts; results landscape uses Canvas/SVG (no radar “spider” chart)
- **Backend**: Supabase (PostgreSQL)
- **Deployment**: Vercel-ready

## 🔒 Privacy & Security

- **Data Encryption**: All data encrypted in transit and at rest
- **Anonymous Storage**: No personal identifiers collected
- **Integrity metadata**: Optional hashed IP field in the database schema for future abuse controls (not enforced in the app layer yet)
- **GDPR Compliant**: Right to deletion and data export

## 📈 Analytics & Monitoring

### Research Analytics
- Completion rates by cultural context
- Average response times
- Dimension confidence distributions
- Question effectiveness metrics

## 🚀 Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Manual Deployment
```bash
npm run build
npm start
```

## 🤝 Support

### For Researchers
- Data export capabilities
- Custom question set integration
- Collaborative research opportunities

### For Users
- Complete assessment documentation
- Profile interpretation guides
- Support resources (non-clinical)

### Contact
- Questions or security concerns: [contact@synapticfour.com](mailto:contact@synapticfour.com)

## 📚 Governance

- Contribution guide: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Security policy: [`SECURITY.md`](./SECURITY.md)
- Code of conduct: [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)

## Legal & privacy (forks and self-hosting)

PCMS ships with consent copy, a Datenschutz/privacy page, and footer links aligned with the **Synaptic Four** public deployment at **map.synapticfour.com** (Vercel hosting; optional Supabase in **EU Frankfurt** — verify in dashboard). See **`docs/DEPLOYMENT-LEGAL.md`** and **`docs/legal-audit.md`** for the operator checklist and disclosure status.

**If you fork or self-host this software, you are responsible for your own legal documents and disclosures.** At minimum, operators typically need:

- A **privacy policy** (Datenschutzerklärung) appropriate for their jurisdiction, hosting, and subprocessors — replace or adapt the template content under `/privacy` and the message files in `messages/*/privacy.json`.
- **Consent wording** aligned with what your deployment actually collects and stores (including optional Supabase, retention, and any analytics).
- An **Imprint** (Impressum) where legally required — the default footer links to Synaptic Four’s imprint; change that link for your organisation.

This repository does not provide turnkey legal compliance for every jurisdiction.

## ⚖️ Legal Notice

This repository documents technical capabilities and research operating guidance. It is not legal advice and does not by itself provide regulatory certification or compliance guarantees. Compliance outcomes depend on operator configuration, contracts, and organisational controls.

## 📄 License

This project is licensed under the MIT License.

---

**Important**: This system is for **research, education, and self-understanding** only. It is **not** a medical, diagnostic, or therapeutic tool, **not** a selection or placement test, and **not** a substitute for professional advice. Deploying it with young people or in schools requires **local ethical review**, appropriate consent or assent, and often a customised build (e.g. age wording and data handling). For health concerns, people should consult qualified professionals in their own context.
