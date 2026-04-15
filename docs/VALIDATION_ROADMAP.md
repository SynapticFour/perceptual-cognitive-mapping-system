# Validation Roadmap

This document describes the empirical validation programme planned for PCMS. It follows the APA Standards for Educational and Psychological Testing (2014) and is intended to be converted into a pre-registration document on OSF before Phase 2 data collection.

## Phase 2: Instrument Calibration (Target: n = 400+)

### 2.1 IRT Calibration

- Model: 2-Parameter Logistic (2PL) for polytomous items (Samejima's graded response model)
- Software: R packages `mirt` or `ltm`
- Target: Calibrate `irt_a` (discrimination) and `irt_b` (difficulty) for all items
- Acceptance criterion: RMSEA < 0.06, CFI > 0.95 for confirmatory IRT fit

### 2.2 Differential Item Functioning

- Compare Western vs Ghana question banks using Mantel-Haenszel and Lord's chi-square
- Flag items with moderate DIF (|ETS D| > 1.0) for cultural review
- Remove or rephrase items with severe DIF (|ETS D| > 1.5)

### 2.3 Dimensionality

- Parallel analysis + MAP test to confirm 10-factor structure
- Confirmatory Factor Analysis (CFA) per cultural group
- Report RMSEA, CFI, SRMR

### 2.4 Internal Consistency

- McDonald's ω (preferred) and Cronbach α per dimension
- Acceptable threshold: ω ≥ 0.70 per dimension

## Phase 3: Validity (Target: n = 300+)

### 3.1 Test-Retest Reliability

- Two-month interval
- Target: ICC ≥ 0.70 per dimension

### 3.2 Convergent Validity

- F dimension vs. CAARS-SR (attention), Brown ADD Rating Scales
- S dimension vs. Highly Sensitive Person Scale (HSP)
- E dimension vs. Big Five Extraversion (BFI-10)
- I dimension vs. Multidimensional Assessment of Interoceptive Awareness (MAIA)
- A dimension vs. Divergent Thinking (Alternate Uses Task)

### 3.3 Discriminant Validity

- Low correlations expected between non-theoretically-related pairs
- E.g. F and V should show r < 0.25

### 3.4 Cross-Cultural Measurement Invariance

- Multi-group CFA: configural → metric → scalar invariance
- Between Western and Ghana samples
- Partial invariance acceptable with documented non-invariant items

## Phase 4: Confirmatory Studies

Pre-registered on OSF. Primary hypotheses (see `lib/research/hypotheses.md`):

- H1: Continuity (continuous distributions, no discrete clusters)
- H2: Natural clustering (unsupervised clustering yields interpretable profiles)
- H3: Stigma reduction (A/B vs categorical presentation)
- H6: Adaptive efficiency (fewer items to reach 0.70 confidence vs fixed-length)

## Notes for Partner Researchers

- All data collected via PCMS research export is pseudonymised at source
- Datasets are available in SPSS-compatible CSV and R-ready RDS formats
- Contact the project repository to discuss data sharing agreements
