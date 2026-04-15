# PCMS Study Design v1.0
# Perceptual & Cognitive Mapping System - Research Protocol

---

## Study Overview

**Title:** Validation of a Dimensional Model for Cognitive Diversity Assessment  
**Type:** Observational, exploratory study  
**Version:** v1.0  
**Date:** April 2026  

---

## Study Design

### Research Approach
- **Design Type:** Cross-sectional observational study
- **Data Collection:** Web-based adaptive assessment
- **Participants:** Voluntary, anonymous adult participants
- **Setting:** Online platform with global accessibility

### Assessment Structure
The PCMS assessment consists of two phases:

1. **Core Phase (15 questions)**
   - Balanced coverage across all **ten routing dimensions (F–V)**
   - Broad-level questions to establish baseline profile
   - Adaptive selection for dimensional balance

2. **Refinement Phase (up to 10 questions)**
   - Targeted questions based on low-confidence dimensions
   - Specific probes to improve measurement precision
   - Confidence-based stopping criteria

### Stopping Criteria
Assessment completes when:
- **Primary:** Research confidence threshold met (0.75) for 70% of dimensions
- **Secondary:** Maximum 25 total questions reached
- **Tertiary:** User voluntarily exits

---

## Data Collection

### Primary Data Points
For each assessment session, we collect:

```typescript
{
  session_id: string,
  assessment_version: "v1.0",
  timestamp: ISO8601,
  duration_ms: number,
  question_path: string[],
  responses: {
    question_id: string,
    response: 1-5,
    response_time_ms: number,
    timestamp: ISO8601
  }[],
  /** Persisted pipeline outcome: `StoredPipelineSession` in app code (`src/types/pipeline-session.ts`). */
  final_profile: StoredPipelineSession,
  completion_status: 'confidence_met' | 'max_questions' | 'user_exit',
  cultural_context: 'western' | 'ghana' | 'universal'
}
```

### Secondary Metrics
- **Response latency:** Time per question
- **Question path order:** Sequence of questions asked
- **Phase transitions:** Core to refinement progression
- **Dropout points:** Where users exit (if applicable)

### Data Quality Indicators
- **Response consistency:** Variance within dimensions
- **Information gain:** Question contribution scores
- **Confidence trajectories:** Dimension-specific confidence building

---

## Research Hypotheses

### Primary Hypotheses

**H1: Traits are continuous rather than categorical**
- **Prediction:** Cognitive profiles will show continuous distributions rather than discrete clusters
- **Measurement:** Analysis of vector space distribution, cluster analysis validation
- **Expected:** No natural categorical boundaries in the **ten-dimensional routing** space (F–V)

**H2: Natural clusters emerge from dimensional profiles**
- **Prediction:** Subgroups will emerge based on dimensional similarity despite continuous traits
- **Measurement:** Unsupervised clustering algorithms (k-means, hierarchical, DBSCAN)
- **Expected:** 3-5 meaningful clusters representing cognitive phenotypes

**H3: Dropout behavior correlates with cognitive dimensions**
- **Prediction:** Assessment abandonment patterns will correlate with specific dimension scores
- **Measurement:** Survival analysis, dropout point analysis vs. final partial profiles
- **Expected:** Higher sensory sensitivity (S) and lower focus (F) predict earlier dropout

**H4: Profile usefulness predicts user-reported satisfaction**
- **Prediction:** Users will rate assessment usefulness based on profile accuracy
- **Measurement:** Post-assessment satisfaction surveys vs. profile coherence
- **Expected:** Higher confidence profiles correlate with higher satisfaction ratings

### Secondary Hypotheses

**H5: Cultural context affects dimensional expression**
- **Prediction:** Cultural adaptations will show systematic dimensional differences
- **Measurement:** Cross-cultural comparison of profile distributions
- **Expected:** Collectivist cultures show different social energy (E) patterns

**H6: Question path efficiency varies by cognitive profile**
- **Prediction:** Optimal question sequences differ across cognitive types
- **Measurement:** Path analysis vs. final profile convergence rate
- **Expected:** High focus (F) profiles require fewer refinement questions

---

## Statistical Analysis Plan

### Sample Size Considerations
- **Target:** N = 1,000 complete assessments
- **Power analysis:** 80% power to detect medium effect sizes (d = 0.5)
- **Attrition estimate:** 40% dropout rate, target N = 1,667 initiations

### Primary Analyses

1. **Descriptive Statistics**
   - Dimension distributions and correlations
   - Confidence threshold achievement rates
   - Assessment duration statistics

2. **Hypothesis Testing**
   - **H1:** Distribution analysis (Shapiro-Wilk, Q-Q plots)
   - **H2:** Cluster analysis (Silhouette scores, gap statistics)
   - **H3:** Survival analysis (Cox proportional hazards)
   - **H4:** Correlation analysis (Pearson/Spearman)

3. **Validation Analyses**
   - Internal consistency (Cronbach's alpha per dimension)
   - Test-retest reliability (subset of repeat participants)
   - Construct validity (correlations with external measures)

### Advanced Analyses

1. **Machine Learning Approaches**
   - Dimension reduction (PCA, t-SNE)
   - Profile classification algorithms
   - Anomaly detection for unusual response patterns

2. **Network Analysis**
   - Dimensional interdependence networks
   - Question response networks
   - Temporal response pattern analysis

---

## Ethical Considerations

### Participant Privacy
- **Anonymity:** No personally identifiable information collected
- **Data Storage:** Encrypted storage with de-identification
- **Data Sharing:** Aggregated, anonymized datasets only

### Risk Assessment
- **Minimal Risk:** Psychological assessment with no clinical implications
- **Informed Consent:** Clear explanation of research purpose and data use
- **Right to Withdraw:** Ability to exit at any point without penalty

### Data Management
- **Retention Period:** 5 years for research purposes
- **Access Controls:** Research team only, role-based permissions
- **Data Destruction:** Secure deletion after retention period

---

## Expected Contributions

### Scientific Contributions
1. **Methodological:** Validation of dimensional approach to cognitive assessment
2. **Theoretical:** Evidence for continuous trait models vs. categorical diagnoses
3. **Practical:** Framework for personalized cognitive profiling

### Clinical Applications
- **Assessment Tool:** Potential alternative to categorical diagnostic systems
- **Treatment Planning:** Dimensional profiles may inform intervention strategies
- **Research Platform:** Foundation for further cognitive diversity studies

### Societal Impact
- **Stigma Reduction:** Label-free approach to cognitive differences
- **Self-Understanding:** Tool for personal insight and development
- **Educational Applications:** Framework for learning style optimization

---

## Limitations and Mitigation Strategies

### Potential Limitations
1. **Self-Selection Bias:** Online participants may not represent general population
2. **Cultural Bias:** Questions developed primarily from Western psychological concepts
3. **Technical Issues:** Online assessment may have accessibility limitations

### Mitigation Strategies
1. **Diverse Recruitment:** Target multiple platforms and demographics
2. **Cultural Adaptations:** Include Ghana-specific and universal question sets
3. **Accessibility Testing:** Ensure compatibility with assistive technologies

---

## Timeline and Milestones

### Phase 1: Data Collection (Months 1-6)
- Platform deployment and testing
- Initial recruitment and data collection
- Quality assurance and data cleaning

### Phase 2: Analysis (Months 7-9)
- Preliminary descriptive analyses
- Hypothesis testing and validation
- Advanced modeling and clustering

### Phase 3: Dissemination (Months 10-12)
- Manuscript preparation and submission
- Conference presentations
- Public release of anonymized dataset

---

## Success Criteria

### Quantitative Metrics
- **Sample Size:** N > 1,000 complete assessments
- **Completion Rate:** > 60% completion among initiations
- **Reliability:** Cronbach's alpha > 0.7 for all dimensions

### Qualitative Metrics
- **User Satisfaction:** Average rating > 4.0/5.0
- **Profile Coherence:** Expert validation of dimensional interpretations
- **Research Impact:** Acceptance in peer-reviewed journal

---

## Future Directions

### Version 2.0 Enhancements
- **Expanded Dimensions:** Additional cognitive factors (e.g., creativity, memory)
- **Longitudinal Tracking:** Profile stability over time
- **Integration:** Connection with other assessment tools

### Clinical Validation
- **Comparison Studies:** Correlation with established clinical assessments
- **Predictive Validity:** Real-world outcomes based on profiles
- **Intervention Studies:** Profile-guided personal development programs

---

*This study design represents a foundational step toward a more nuanced, dimensional understanding of human cognitive diversity.*
