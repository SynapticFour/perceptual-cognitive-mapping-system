# What the questionnaire contains

Moved from the README. The short list a newcomer needs is on the README. This page keeps the longer feature notes, the research-integration notes, and the analytics notes.

## Research-Grade Features

### Scientific Assessment Engine

- **10-dimensional routing model** (`src/model/cognitive-dimensions.ts`): **F** Focus, **P** Pattern processing, **S** Sensory sensitivity, **E** Social energy, **R** Structure preference, **C** Cognitive flexibility, plus **T, I, A, V** (extended routing axes; research-facing, non-diagnostic)
- **Adaptive Questionnaire**: up to 15 core questions and up to 10 targeted refinements, with confidence-based stopping. The engine hard cap for one session is 30 questions (`ENGINE_HARD_CAP_TOTAL_QUESTIONS`).
- **Research Confidence Model**: CTT-style weighted evidence, shrinkage reliability, and consistency penalty ([specification](confidence-model.md)); 0.75 threshold for routing decisions
- **Phase-Based Logic**: Core coverage dimension balancing, then targeted refinement

### Data Collection & Integrity

- **Structured Logging**: Complete assessment tracking with question paths and timing
- **Version Control**: Assessment versioning (v1.0) for research reproducibility
- **Quality Assurance**: Data validation and fallback mechanisms
- **Research Protocol**: Complete study design with hypotheses and analysis plan
- **ATLAS (companion programme, design phase):** Adaptive Trait Landscape Architecture System — separate bank and publication track from PCMS; shares infrastructure only. See [`docs/ATLAS.md`](./ATLAS.md) and decision log [`docs/DECISIONS.md`](./DECISIONS.md). Placeholders: `src/atlas/`, `content/questions/atlas-v1/`.

### User Experience

- **Internationalization**: English (default URL), German (`/de/...`), Wolof (`/wo/...`), Twi/Akan draft (`/tw/...`, merges over English for missing keys); see [`docs/I18N.md`](./I18N.md)
- **Dedicated consent flow**: `/consent` (multi-step checkboxes) before questionnaire/results — **institutions using this with minors or in classrooms must supply local ethics approval, assent/consent wording, and any age rules** (see [`docs/ethics.md`](./ethics.md))
- **Dynamic Insights**: Descriptive summaries based on response patterns (non-diagnostic)
- **Potential Stressors**: Identification of challenging situations (where configured in copy)
- **Interactive visualization**: Results **cognitive landscape** — micro-trait activations (map, density, **cognitive field**, **3D terrain**, vector) over **one** shared latent projection (`src/core/cognitive-pipeline.ts`, `src/core/traits`, `src/ui/CognitiveViewSwitcher.tsx`); optional **emergent co-activation patterns** learned only from signatures recorded in the same browser session (`src/core/patterns`); dimensional bars and insight cards; **Recharts** on research dashboards (not the main results map); 3D pipeline notes in [`docs/COGNITIVE-TERRAIN-3D.md`](./COGNITIVE-TERRAIN-3D.md)
- **Cultural adaptation**: Multiple question banks and locales (e.g. universal and Ghana-tuned items in `content/questions/`)
- **Cohort Intelligence Layer** (aggregate only): shared cognitive map, environment and interaction insights, global pattern library, validation — see [`docs/COHORT-INTELLIGENCE.md`](./COHORT-INTELLIGENCE.md) (not classification analytics; no labels in group views)
- **Offline-first & field workflows**: Bundled static question bank (`prebuild`), IndexedDB + optional service worker precache; paper/CSV replay at `/field-import` — [`docs/OFFLINE-AND-PAPER-ARCHITECTURE.md`](./OFFLINE-AND-PAPER-ARCHITECTURE.md)
- **Research session bundle**: Downloadable ZIP with manifest, long-form CSV, optional RO-Crate metadata — [`docs/RESEARCH-SESSION-EXPORT.md`](./RESEARCH-SESSION-EXPORT.md)
- **Optional multi-profile analysis**: `/group-cognitive-analysis` (paste several share payloads) — [`docs/GROUP-COGNITIVE-ANALYSIS.md`](./GROUP-COGNITIVE-ANALYSIS.md)

### Research Infrastructure

- **Publication-Ready Data**: Structured datasets for statistical analysis
- **Study Management**: Complete research protocol implementation
- **Ethical Compliance**: Informed consent, explicit cloud opt-in, and pseudonymous data protection
- **CLI Tools**: One-command setup and complete lifecycle management

## 📊 Research Integration

### Data Structure

- **Sessions**: Pseudonymous assessment tracking
- **Profiles**: Final cognitive vectors with confidence
- **Responses**: Individual question answers with timing
- **Analytics**: Aggregated research data

### Ethical Considerations

- **Pseudonymous by default**: No direct personal identifiers collected in the assessment flow
- **Informed Consent**: Required before assessment
- **Voluntary Participation**: Can withdraw at any time
- **Research Purpose**: Clearly stated, not diagnostic
- **Cultural Sensitivity**: Multiple context support

## 📈 Analytics & Monitoring

### Research Analytics

- Completion rates by cultural context
- Average response times
- Dimension confidence distributions
- Question effectiveness metrics
