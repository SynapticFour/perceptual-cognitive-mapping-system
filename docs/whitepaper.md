# Perceptual & Cognitive Mapping System (PCMS)
## Technical White Paper — Research Prototype, v0.1

> **Status:** Research prototype. Not a clinical or diagnostic instrument.
> **License:** MIT — open for research and educational use.
> **Pre-registration:** Planned on Open Science Framework before Phase 2 data collection.

---

### 1. Problem Statement

Mainstream cognitive assessment rests on two assumptions that are increasingly contested in the scientific literature:

1. **Categorical thinking:** A person either "has" or "does not have" a condition, scored against a fixed threshold.
2. **Western monoculture:** Most instruments were developed and normed in North American or European populations, then exported globally with minimal adaptation.

Both assumptions create concrete harms. Categorical labels carry stigma that can affect education, employment, and self-concept — particularly in contexts where disability disclosure has severe social consequences. In sub-Saharan Africa, receiving a label such as "ADHD" or "autism spectrum disorder" can result in exclusion from schooling, community stigma, or family breakdown. Meanwhile, instruments designed for one cultural context systematically misrepresent cognition in another: what looks like "inattention" in a classroom-based test may reflect culturally appropriate interactional norms rather than an executive function deficit.

PCMS proposes a different starting point: **map cognitive tendencies as continuous profiles, not categories.** A person's position in a multidimensional cognitive space is more informative than any binary label, more comparable across cultures, and — crucially — carries no inherent pathologising implication.

This approach also opens a scientific opportunity: by observing cognitive variation without forcing it into pre-existing categories, we may discover patterns that categorical systems have masked. Cross-cultural comparison of continuous profiles can reveal whether Western diagnostic boundaries are universal or culturally contingent — a question that existing instruments cannot answer because they bake the categories in from the start.

**PCMS is not anti-diagnosis.** Users who need or want a formal diagnostic assessment are explicitly encouraged to seek one. PCMS results are for self-understanding and research, not clinical decision-making.

---

### 2. Design Principles

| Principle | Implementation |
|---|---|
| Dimensional, not categorical | Ten continuous routing dimensions F–V; no archetypes, no cutoff scores |
| Non-pathologising | No dimension is "good" or "bad"; all profiles are presented as cognitive tendencies |
| Cross-cultural from the start | Separate question banks for Western, Ghana, and Universal contexts; offline-first for low-bandwidth environments |
| Transparent uncertainty | Bayesian confidence tracking visible to users; results shown only when minimum confidence is reached |
| Open science | MIT license; raw session data exportable for researchers; pre-registration planned |
| Ethics first | Informed consent gate; right to deletion (GDPR); no institutional use of individual profiles |
| Self-understanding, not gatekeeping | PCMS results do not affect eligibility for any diagnosis, accommodation, or service |

---

### 3. The Ten Routing Dimensions

PCMS maps responses onto ten continuous axes. All scores are unit-interval [0, 1] and should be read as points on a spectrum, not as high/low judgements. Each dimension is grounded in peer-reviewed constructs; citations below are correlational/theoretical, not diagnostic claims.

| Key | Construct | Low end | High end | Research anchors |
|---|---|---|---|---|
| F | Focus intensity | Easily redirected | Sustained deep focus | Attention networks; sustained-performance paradigms |
| P | Pattern processing | Concrete, sequential | Abstract pattern detection | Relational processing; matrix reasoning |
| S | Sensory sensitivity | Low sensory reactivity | High sensory reactivity | Sensory Processing Sensitivity (Aron & Aron, 1997); occupational therapy literature |
| E | Social energy | Energised by groups | Drained by prolonged contact | Introversion–extraversion energy models |
| R | Structure preference | Flexible, improvising | Strong routine preference | Need for cognitive closure (Webster & Kruglanski, 1994); intolerance of uncertainty |
| C | Cognitive flexibility | Prefers stable answers | Comfortable with ambiguity | Cognitive set-shifting; ambiguity tolerance |
| T | Temporal processing | Time-forgetting, in-the-moment | Highly precise time sense | ADHD time estimation (Barkley, 1997); autism temporal processing; chronobiology |
| I | Interoceptive awareness | Low body-signal awareness | High body-signal awareness | Interoceptive accuracy/sensibility (Garfinkel et al., 2015); alexithymia; trauma dissociation |
| A | Associative thinking | Linear, convergent | Strongly divergent, far-reaching | Divergent thinking/creativity (Guilford, 1967); schizotypy; ADHD idea density |
| V | Verbal–visual bias | Verbal, sequential processing | Visuo-spatial, holistic processing | Dual coding (Paivio, 1986); dyslexia; autism visual processing |

**These dimensions are not a diagnostic taxonomy.** High scores on S do not mean "sensory processing disorder"; high A does not mean "mania." The constructs are descriptive tendencies, not pathological states.

---

### 4. Technical Architecture

#### 4.1 Adaptive Questionnaire Engine

The engine uses an information-theoretic approach to question selection:

- **Phase 1 (Core):** Questions are selected to maximise coverage across all ten dimensions, weighted by current confidence deficit per dimension.
- **Phase 2 (Refinement):** Questions are selected to target dimensions below the confidence threshold.
- **Termination:** The session ends when all dimensions reach the confidence threshold (default: 0.75) or the hard cap of 30 questions is reached.

#### 4.2 Confidence Model

Per-dimension confidence is calculated using a Classical Test Theory (CTT) model with Bayesian shrinkage:

effective_evidence = Σ(w²_d,i) for all answered questions i with weight w_d on dimension d
reliability = effective_evidence / (effective_evidence + prior_pseudo_evidence)
consistency = 1 − variance_penalty(responses_to_dimension_d)
confidence_d = reliability × consistency, capped at research_confidence_cap (default: 0.75)

The 0.75 cap reflects the pilot phase: no single session should claim research-grade certainty before psychometric calibration. This cap is configurable for simulation studies.

#### 4.3 Latent Space Projection

After scoring, the ten routing scores are projected into a 32-dimensional vector using a deterministic trigonometric expansion. **This is a pilot projection, not a trained ML embedding.** It is used for cosine-similarity comparisons between profiles in the visualisation layer.

Once pilot data is available (n ≥ 200 per cultural context), this projection will be replaced with PCA-derived loadings trained on real session data.

#### 4.4 Trait Layer

On top of the routing scores, a curated set of micro-traits (e.g. `sensory_sensitivity`, `temporal_perception`) is activated based on weighted combinations of routing dimensions. Trait weights are pilot estimates set by subject-matter review; they are not yet empirically calibrated. See `src/core/traits/trait-definitions.ts` for current mappings and `docs/VALIDATION_ROADMAP.md` for the calibration plan.

#### 4.5 Cultural Adaptation

Three question banks are maintained:

- **Universal:** Items validated for cross-cultural use.
- **Western:** Items normed on European/North American contexts.
- **Ghana:** Items developed with Ghanaian consultants, reflecting local schooling, social, and environmental contexts. Includes an offline/SMS export path for low-connectivity settings.

Question-level differential item functioning (DIF) analysis across contexts is planned for Phase 2.

---

### 5. Ethical Framework

#### 5.1 What PCMS Is and Is Not

| PCMS is | PCMS is not |
|---|---|
| A tool for cognitive self-understanding | A diagnostic instrument |
| A research data platform (with consent) | A clinical screening tool |
| A complement to formal assessment | A replacement for formal assessment |
| A tool for individual use | A tool for institutional decisions about individuals |

No PCMS result should be used to deny, grant, or condition access to education, employment, healthcare, or legal rights. Results are personal and voluntary.

#### 5.2 Consent and Data Rights

- Informed consent is obtained before any data is collected (dedicated `/consent` route).
- All data is anonymous by default; no personally identifiable information is required.
- Users may delete their session at any time via the session deletion API.
- Research data export requires explicit secondary consent.
- GDPR-compliant audit logging is implemented for research contexts.

#### 5.3 Avoiding Gatekeeping

PCMS was designed explicitly to avoid becoming a barrier to diagnosis. The system:

- Never recommends against seeking a formal assessment.
- States clearly on the results screen that profiles are for self-understanding only.
- Does not produce scores on any scale that maps to diagnostic thresholds.
- Does not report results in terms of "likelihood of having X."

---

### 6. Validation Roadmap

PCMS is currently a research prototype. The following validation steps are planned before any scientific claims are made:

| Phase | Activity | Required sample |
|---|---|---|
| Phase 1 (current) | Instrument development; pilot data collection | No minimum |
| Phase 2 | IRT calibration (Rasch / 2PL) per cultural context | n ≥ 200 per context |
| Phase 2 | DIF analysis across Western / Ghana question banks | n ≥ 200 per context |
| Phase 2 | Internal consistency (Cronbach α, McDonald ω) per dimension | n ≥ 200 |
| Phase 3 | Test-retest reliability (2-month interval) | n ≥ 100 |
| Phase 3 | Construct validity (convergent/discriminant with established measures) | n ≥ 300 |
| Phase 3 | Cross-cultural measurement invariance (CFA, MGCFA) | n ≥ 200 per context |
| Phase 4 | Pre-registered confirmatory studies | Per power analysis |

All primary hypotheses will be pre-registered on the Open Science Framework before Phase 2 data collection begins.

---

### 7. Known Limitations

- **Self-report bias:** All measures depend on subjective response. Performance-based or physiological measures would complement but not replace self-report.
- **Question weights are pilot estimates:** `dimensionWeights` in the question bank are expert-assigned, not IRT-calibrated. Treat all profile outputs as indicative until Phase 2 calibration is complete.
- **Latent projection is deterministic:** The 32-dimensional profile representation is a mathematical projection, not a trained representation. Cosine similarities between profiles have limited interpretive validity pre-calibration.
- **Language coverage:** English and German UI strings are complete. Twi (Ghana) is a draft requiring native-speaker review.
- **Digital access:** The tool requires internet or recent offline sync. SMS export partially addresses this for Ghana.

---

### 8. Citation and Reuse

PCMS is MIT-licensed. If you use PCMS in research, please cite:

> PCMS Contributors (2026). *Perceptual & Cognitive Mapping System* [Software]. https://github.com/[your-repo]

A peer-reviewed methods paper is planned following Phase 2 validation.

---

*This white paper reflects the current state of the prototype. It will be updated as validation evidence accumulates.*
