# Architecture

The pipeline layers are specified in [PIPELINE_ARCHITECTURE.md](../PIPELINE_ARCHITECTURE.md) at the repository root. This page keeps the README's component map and the development map. It is not a claim that the questionnaire is validated.

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
└── supabase/migrations/    # Versioned database schema and policy migrations
```

### Key Technologies

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS 4
- **Charts**: Recharts for research admin charts; results landscape uses Canvas/SVG (no radar “spider” chart)
- **Backend**: Supabase (PostgreSQL)
- **Deployment**: Vercel-ready
