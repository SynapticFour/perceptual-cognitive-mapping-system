# PCMS Documentation Index
## Perceptual & Cognitive Mapping System v1.0 (Research-Grade)

### Core Documentation

#### **Getting Started**
- **[Main README](../README.md)** - Complete overview and quick start guide
- **[Local Setup Guide](./LOCAL_SETUP.md)** - Detailed setup instructions for local development
- **[Data Model](./data-model.md)** - Database schema and data structure documentation

#### **Research Documentation**
- **[Whitepaper](./whitepaper.md)** - Complete technical and theoretical foundation
- **[Research Study Design v1.0](../lib/research/study_v1.md)** - Complete research protocol and study design
- **[Methodology](../lib/research/methodology.md)** - Research methodology and validation procedures
- **[Hypotheses](../lib/research/hypotheses.md)** - Research hypotheses and expected outcomes
- **[Related Work](../lib/research/related_work.md)** - Literature review and theoretical background

#### **Ethics and Compliance**
- **[Ethics Framework v1.0](./ethics.md)** - Ethical guidelines and non-diagnostic clarifications
- **GDPR tables** (after base schema): [`../supabase/migrations/20260413120000_ethics_gdpr.sql`](../supabase/migrations/20260413120000_ethics_gdpr.sql)
- **Ethics audit events** (compliance / audit trail): [`../supabase/migrations/20260414200000_ethics_audit_events.sql`](../supabase/migrations/20260414200000_ethics_audit_events.sql)

#### **Internationalization**
- **[I18N](./I18N.md)** - Locales, URLs, `messages/*.json`, and Twi review notes

### Quick Navigation

#### **User Journey** (locale prefix `as-needed`: English has no `/en`; `de` and `tw` prefix routes)
1. **Landing**: `/` — introduction; links to consent and questionnaire
2. **Consent**: `/consent` — multi-step informed consent (required before questionnaire/results)
3. **Questionnaire**: `/questionnaire` — adaptive assessment (15 core + targeted refinements)
4. **Results**: `/results` — landscape visualization; additional **assent** step before showing scores when applicable

#### **Developer Resources**
- **Setup Script**: `./setup.sh` - One-command setup for macOS
- **Makefile**: `./Makefile` - Development commands and lifecycle management
- **Package Scripts**: `npm run` commands for development and deployment
- **[API Documentation](./api-documentation.md)** - Complete API reference with examples
- **Component docs in source + tests** - UI guidance lives alongside components and in this docs set

#### **Research Infrastructure**
- **Adaptive Engine**: `src/adaptive/questionnaire-engine.ts` - Research-grade adaptive logic
- **Scoring Model**: `src/scoring/scoring-model.ts` - Confidence calculation and profile generation
- **Data Collection**: `src/lib/data-collection.ts` - Structured research data collection
- **Versioning**: `src/lib/assessment-versioning.ts` - Assessment version control and validation
- **Performance Monitoring**: `src/lib/monitoring.ts` - Real-time performance and user analytics
- **Web Workers**: `src/lib/worker.ts` - CPU-intensive computational tasks
- **Rate Limiting**: `src/lib/rate-limiter.ts` - API protection and abuse prevention

### Key Features v1.0

#### **Research-Grade Assessment Engine**
- **10-dimensional routing model**: F, P, S, E, R, C, T, I, A, V (see `src/model/cognitive-dimensions.ts` and [`PIPELINE_ARCHITECTURE.md`](../PIPELINE_ARCHITECTURE.md))
- **Adaptive Logic**: Core questions (15) + targeted refinements (up to 10)
- **Confidence Model**: [Routing confidence specification](./confidence-model.md) (CTT-style evidence + shrinkage + consistency); 0.75 threshold
- **Phase-Based Progression**: Balanced coverage, then targeted refinement

#### **Data Collection & Integrity**
- **Structured Logging**: Complete assessment tracking with question paths and timing
- **Version Control**: Assessment versioning (v1.0) for research reproducibility
- **Quality Assurance**: Data validation and fallback mechanisms
- **Publication-Ready**: Structured datasets for statistical analysis

#### **User Experience**
- **Dynamic Insights**: Personalized recommendations based on cognitive profile
- **Potential Stressors**: Identification of challenging situations
- **Interactive visualization**: Results cognitive landscape (map / density / vector switcher over one PCA projection); research UI still uses charts where noted
- **Cultural Adaptation**: Support for Western and Ghana contexts

### File Structure

```
perceptual-cognitive-mapping-system/
README.md                           # Main project documentation
messages/                           # next-intl strings (en, de, tw)
docs/                              # User and developer documentation
  README.md                        # This file - documentation index
  LOCAL_SETUP.md                   # Local development setup
  I18N.md                          # Internationalization
  whitepaper.md                    # Technical whitepaper
  ethics.md                         # Ethics framework
  data-model.md                     # Database schema documentation
src/                               # Application source code
  app/[locale]/                    # Next.js App Router + locale segment
    page.tsx                       # Landing
    consent/page.tsx               # Multi-step consent
    questionnaire/page.tsx         # Adaptive questionnaire
    results/page.tsx               # Results and insights
  i18n/                            # next-intl config
  components/                      # React components
    questionnaire/                  # Questionnaire UI components
    results/                        # Results page components
  adaptive/                        # Adaptive assessment engine
    questionnaire-engine.ts         # Research-grade adaptive logic
  scoring/                         # Scoring and confidence models
    scoring-model.ts                # Research-grade confidence calculation
  lib/                            # Utilities and services
    data-collection.ts              # Structured data collection
    assessment-versioning.ts       # Version control and validation
    supabase.ts                     # Database client and types
  data/                           # Data and configuration
    questions.ts                    # Research-grade question database
lib/research/                     # Research documentation
  study_v1.md                     # Complete study design v1.0
  methodology.md                  # Research methodology
  hypotheses.md                   # Research hypotheses
  related_work.md                  # Literature review
supabase-schema.sql               # Database schema for research data collection
setup.sh                         # One-command setup script
Makefile                         # Development commands
package.json                     # Dependencies and scripts
```

### URL Structure

#### **Development URLs** (English default)
- **Landing**: `http://localhost:3000/`
- **Consent**: `http://localhost:3000/consent`
- **Questionnaire**: `http://localhost:3000/questionnaire`
- **Results**: `http://localhost:3000/results`
- **German**: `http://localhost:3000/de/...` (same paths under `/de`)

#### **External Resources**
- **Node.js**: https://nodejs.org
- **Supabase**: https://supabase.com
- **Next.js Documentation**: https://nextjs.org/docs

### CLI Commands

#### **Setup and Management**
```bash
# One-command setup (macOS)
./setup.sh

# Development commands
make dev          # Start development server
make build        # Build for production
make start        # Start production server
make clean        # Clean local data

# Research commands
make verify       # Verify no testing artifacts committed
npm run verify    # Alternative verification command
```

#### **Complete Lifecycle**
```bash
./setup.sh start      # Start development server
./setup.sh stop       # Stop development server
./setup.sh restart    # Restart development server
./setup.sh status     # Check system status
./setup.sh clean      # Clean local data and cache
./setup.sh update     # Update dependencies
./setup.sh reset      # Reset to clean state
./setup.sh verify     # Verify no artifacts committed
```

### Research Data Flow

1. **Consent** — User completes `/consent`; timestamp stored (browser + session metadata when Supabase is used)
2. **Adaptive assessment** — Engine selects questions from confidence and routing weights
3. **Response recording** — Each answer logged with timing and path
4. **Pipeline** — Raw → features → latent space projection (pilot) → public interpretation (`src/lib/cognitive-pipeline.ts`); results 2D model for views: `src/core/cognitive-pipeline.ts` (`buildCognitiveModel`). See [`PIPELINE_ARCHITECTURE.md`](../PIPELINE_ARCHITECTURE.md)
5. **Completion** — Stops per configured confidence / max-question rules
6. **Persistence** — `profiles.cognitive_vector` stores a **`StoredPipelineSession`** JSON document when saved to Supabase; see [`data-model.md`](./data-model.md)
7. **Results** — Landscape UI (`CognitiveViewSwitcher`: constellation map, density, vector) built from **`buildCognitiveModel`**; optional share URL (`?p=`), JSON/PNG download; in-browser **co-activation pattern** hints (`src/core/patterns`, session-local); ethics APIs for delete / audit where configured

### Quality Assurance

#### **Data Validation**
- Assessment version validation before saving
- Structured data format validation
- Fallback mechanisms for data collection failures

#### **Code Quality**
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Comprehensive error handling and user feedback

#### **Research Integrity**
- Version-controlled assessment (v1.0)
- Complete audit trails with question paths
- Non-diagnostic ethical framework
- Anonymous data collection with privacy protection

---

**Last Updated**: April 12, 2026  
**Version**: v1.0 (Research-Grade)  
**Status**: Active development — run `npm test` (`npm run check` + unit tests) and `npm run build` before releases; use `npm run test:e2e` for Playwright smoke tests
