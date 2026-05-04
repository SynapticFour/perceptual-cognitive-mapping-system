# ATLAS — Adaptive Trait Landscape Architecture System

## Vision, Architecture & Research Programme

> **Status:** Pre-research design phase. Companion programme to PCMS.  
> **Relationship to PCMS:** ATLAS shares PCMS infrastructure but is a distinct research programme with its own question bank, validation protocol, and publication track.  
> **Decision log:** All architectural decisions are recorded in [`DECISIONS.md`](./DECISIONS.md). **Before reversing or modifying any decision, add a new ADR — do not delete the old one.**

---

## 1. What ATLAS Is

ATLAS is a research programme that extends PCMS from a 10-dimensional cognitive instrument into a high-dimensional experiential landscape — a map that captures not just cognitive *style* but the full texture of how a person experiences their inner life and the world around them.

Where PCMS asks: *"How do you tend to process information?"*  
ATLAS asks: *"What is it like to be you?"*

The goal is a validated, culturally adaptive instrument of 60–120 micro-traits that can produce a rich topographic landscape from as few as 25–35 adaptive questions, using statistical imputation to fill unmeasured dimensions from known correlational structure.

This is not a diagnostic tool. It produces no labels. It generates a landscape.

---

## 2. The Core Idea: From Points to Topography

### Current PCMS state

PCMS has 10 dimensions (F, P, S, E, R, C, T, I, A, V). F–C have long-standing banks; **T, I, A, V** now have a substantial classic-bank extension (`content/questions/universal/tiav-extension-v1.json`, plus `ghana/tiav-ghana-v1.json`). Item *count* is no longer the main bottleneck for those four; **reliability, norms, and product policy (ADR-007)** still limit how T–V are shown in the primary results UI — some charts may still list all ten routing keys until UI and ADR are explicitly aligned.

### ATLAS target state

60–120 micro-traits, each operationalised with 2–3 questions. The adaptive engine (already built in PCMS) selects ~25–35 questions. Statistical imputation fills the remaining dimensions using a covariance prior learned from a normative sample. The 3D terrain gains 40–80 distinct topographic features — ridges, valleys, basins, isolated peaks — that are unique to each person.

### The inspiration

The ADHD / autism / giftedness Venn diagram literature (e.g. Katy Higgins Lee, MFT; broader neurodiversity research) demonstrates the granularity that experiential self-knowledge can reach. But ATLAS does not limit itself to neurodiversity — it covers the full range of human cognitive and experiential variation across the whole of life.

---

## 3. The Self-Nomination Module (Brainstorming → Research Tool)

A promising addition: a **self-nomination interface** where participants review a curated list of experiential descriptors (drawn from validated literature, not clinical terms) and select those that resonate.

### How it works

1. After completing the adaptive questionnaire, the user sees a visual card array of ~80–120 descriptors (e.g. "I often notice physical sensations before emotions", "Unexpected changes in plans feel disproportionately disruptive", "I find metaphors easier to think in than literal descriptions")
2. The user selects any that feel true — no forced choice, no minimum
3. Their selections are compared to their PCMS/ATLAS dimension scores

### Scientific value

- **Convergent validity proxy:** if sensory-related cards are selected by users who score high on S, that is a meaningful correlation signal even before formal validation
- **Qualitative anchoring:** self-nominations add *experiential meaning* to quantitative dimensions — the map gets named features, not just contour lines
- **Hypothesis generation:** unexpected correlations between self-nominations and dimension scores can generate new research questions

### Important caveats (must be documented)

- Self-nomination is **not** psychometrically validated on its own — selection bias, social desirability, and cultural priming all apply
- It is treated as **exploratory/auxiliary data**, not as a scoring input
- It is separated from the main score calculation
- Cards must be written in non-clinical, non-pathologising language — no diagnosis names, no disorder framing

### Implementation status (PCMS repo, v1)

**Shipped:** Post-results **card grid** on the results page, gated by `NEXT_PUBLIC_ENABLE_SELF_NOMINATION` / `FEATURE_FLAGS.ATLAS_SELF_NOMINATION` (`src/atlas/self-nomination/SelfNominationModule.tsx`). Descriptor copy lives in **`content/atlas/descriptors-v1.json`** (~60 neutral first-person stems, English). Optional per-locale **body** overrides for Twi/Wolof live in **`content/atlas/descriptors-locale-overrides-v1.json`** (see **`content/atlas/DESCRIPTOR-LOCALES.md`**); `descriptorDisplayText()` merges them for `tw` / `ghana` / `gh-en` and `wo`. Selections are stored in **IndexedDB** (`PCMSOffline` v2 store `atlasSelfNomination`) and in **`localStorage`** (`pcms-self-nomination-v1:{sessionId}`), and may be written to **`atlas_self_nominations`** via **`POST /api/atlas/self-nomination`** when the **service role** is configured; apply **`supabase/migrations/20260502120000_atlas_tables_rls.sql`** (RLS enabled; anon/authenticated have no policies — inserts stay server-side). **ADR-003:** selections never feed scoring, routing, or terrain inputs.

**Gaps / next steps:** Fill **`descriptors-locale-overrides-v1.json`** with linguist-reviewed Twi/Wolof strings before field use. If you ever insert from the **anon** Supabase client, add explicit RLS `INSERT` policies — do not widen policies without review.

---

## 4. The Imputation Architecture

### DNA analogy

In genomics, linkage disequilibrium allows imputation of unmeasured SNPs from measured ones. The covariance structure between genetic loci — learned from a reference panel — acts as a prior.

ATLAS uses the same principle for cognitive traits:

- A normative sample (N ≥ 300 per locale) completes a full-length instrument
- A covariance matrix between all micro-trait pairs is estimated
- Future users complete a short adaptive version; unmeasured traits are imputed using the covariance prior
- Uncertainty of imputation is displayed visually (fog/mist on unmeasured terrain regions)

### Required statistics

| Method | Purpose | Prerequisite |
|--------|---------|-------------|
| Multiple Imputation by Chained Equations (MICE) | Fill missing trait values from observed responses | N ≥ 300 normative sample |
| Item Response Theory (Graded Response Model) | Estimate latent trait from ordinal Likert responses | Calibration data |
| Confirmatory Factor Analysis | Validate micro-trait factor structure | Same N ≥ 300 |
| Measurement Invariance Tests | Confirm scores are comparable across cultures | Multi-locale data |
| Gaussian Process Regression | Smooth terrain interpolation between known points | Covariance matrix |

### Phasing

- **Phase 0 (now):** PCMS collects data with exportable session JSON. No imputation yet.
- **Phase 1 (after N=200/locale):** Estimate first covariance matrix offline. No app changes.
- **Phase 2 (18–36 months):** Integrate offline covariance priors (`content/atlas/covariance/prior_v1_{locale}.json`, ADR-004) into the ATLAS adaptive engine. Visualise uncertainty.

---

## 5. Relationship to PCMS

### What they share

- Adaptive questionnaire engine (`src/adaptive/`)
- 3D terrain visualisation (`src/ui/views/Terrain3DView.tsx`, `src/lib/cognitive-terrain-pipeline.ts`)
- Database (Supabase) — separate tables, shared anonymous ID scheme
- Cultural adaptation infrastructure (question bank schema, locale files)
- Ethics framework and non-diagnostic principles

### What is separate

- Question bank: ATLAS items live in `content/questions/atlas-v1/`, never mixed with PCMS banks
- Dimensions: ATLAS micro-traits are a superset of PCMS dimensions but are not the same constructs
- Scoring: ATLAS uses a separate scoring pipeline; PCMS scores are not used as ATLAS scores
- Publication track: separate pre-registration, separate IRB protocol

### Repository decision

**ATLAS lives in the same repository as PCMS, in a clearly separated directory structure.** Rationale: the infrastructure is shared, the team is the same, and a monorepo reduces integration friction during the research phase. If ATLAS grows into a standalone product with a different team, it should be extracted at that point. This decision is recorded in `DECISIONS.md` (ADR-001).

---

## 6. Micro-Trait Candidate Library (Seed List)

Drawn from: neurodiversity literature, HiTOP model, interoception research, temporal cognition, social cognition, emotional granularity research.

This list is a starting point for expert review — not a final instrument.

### Category: Sensory & Body

- Interoceptive awareness (noticing hunger, heartbeat, tension before emotions)
- Proprioceptive sensitivity (body position awareness)
- Sensory gating (ability to filter background noise/light)
- Pain threshold variability
- Tactile sensitivity

### Category: Temporal Experience

- Time perception accuracy
- Planning horizon (how far ahead feels real)
- Transition sensitivity (cost of switching contexts)
- Urgency calibration (tendency to underestimate deadlines)

### Category: Social & Communication

- Social masking effort (energy spent performing expected behaviour)
- Mentalization ease (how automatic Theory of Mind feels)
- Direct communication preference
- Social energy recovery time

### Category: Cognitive Texture

- Metaphor-dominance (thinking in metaphors vs. literal descriptions)
- Pattern imposition tendency
- Hyperfocus depth and trigger specificity
- Associative thinking breadth

### Category: Emotional

- Alexithymia (difficulty naming feelings)
- Affect intensity
- Emotional contagion susceptibility
- Moral intensity (strength of ethical reactions)

### Category: Motivational

- Novelty drive vs. routine preference
- Existential preoccupation
- Intrinsic vs. extrinsic motivation ratio
- Boredom threshold

---

## 7. The Research Programme

### PCMS (current, protect this)

1. Complete T, I, A, V question banks (20 items each)
2. Ghana pilot N=150, IRB protocol filed
3. Compute Cronbach's α and McDonald's ω per dimension
4. Test-retest at 2 weeks (N=40/locale)
5. Convergent validity: BIS/BAS, HSPS, correlational pre-registration
6. Submit Phase 1 paper: "A culturally adaptive, non-diagnostic dimensional instrument for cognitive profiling"

### ATLAS (parallel, do not rush)

1. Expert review of micro-trait candidate list (Phase 0)
2. Write 3 questions per candidate trait (Phase 0)
3. Pilot with N=50 (convenience, EN only) to check face validity (Phase 1)
4. Full normative sample N=300/locale for covariance matrix (Phase 2)
5. Implement imputation in engine (Phase 2)
6. Submit ATLAS paper: "High-dimensional experiential mapping with statistical imputation: toward a complete topography of cognitive variation"

---

## 8. For AI Agents Reading This Document

If you are an AI assistant helping with this codebase, here is what you must know:

**Do not:**

- Mix ATLAS question items into PCMS question banks
- Use clinical or diagnostic language anywhere in user-facing UI
- Change architectural decisions in `DECISIONS.md` without documenting a reason
- Modify the PCMS scoring pipeline for ATLAS purposes — create a new one

**Do:**

- Keep all ATLAS code under `src/atlas/` or `content/questions/atlas-v1/`
- Keep the self-nomination module behind `NEXT_PUBLIC_ENABLE_SELF_NOMINATION`
- Treat the covariance matrix as read-only data, not a scoring output
- Document every new decision in `DECISIONS.md`
- Maintain the non-diagnostic principle: no labels, no cutoffs, no "you have X"

**The north star:** A person completes 25 questions. They receive a richly detailed topographic map of their inner life — mountains and valleys, fog where data is thin, named peaks where patterns are strong. No diagnosis. No label. Just a landscape.
