# Designing for support without labels

This document explains how the Perceptual & Cognitive Mapping System (PCMS) guidance layer stays **supportive**, **non-diagnostic**, and **useful in real environments**—without turning into a clinical or labeling tool.

## Guidance system, not a reporting dashboard

The cohort and support UX is intentionally a **guidance layer**: it turns statistical field shapes into **understandable insights**, **safe recommendations**, and **actionable ideas** for human environments (schedules, sensory conditions, communication norms). It is **not** an analytics product for sorting or labeling people, **not** a clinical report, and **not** a substitute for professional judgment. Where uncertainty matters, the UI shows **confidence bands** and copy reminds users that patterns are **probabilistic**.

## Why the system avoids diagnosis

- **Scope**: The instrument measures self-reported response patterns for research and reflection. It is not a medical device and does not establish clinical conditions.
- **Stigma**: Diagnostic-sounding language can stick to people in education and workplaces. We keep copy at the level of **environments**, **habits**, and **optional adaptations**.
- **Uncertainty**: Field-based summaries are **probabilistic**. Presenting them as definitive would be misleading and unsafe.

## Why environment adaptation is preferred

Most friction people experience in groups is about **fit**—between tasks, sensory load, communication norms, and pacing—not about fixed traits. Environment-level changes (predictability, clarity, choice) tend to:

- benefit many people at once without singling anyone out;
- be reversible and low-risk when framed as experiments;
- align with how teams and classrooms actually improve collaboration.

## How insights should be used

- **Conversation starters**, not verdicts. Use insights to ask “what might we try?” rather than “what is wrong?”
- **Short experiments**: change one variable at a time (e.g., notice period before a schedule shift), observe, adjust.
- **Privacy**: **Cohort** views show **aggregates only**—no individual points or identifiers. **Individual** support hints stay in private results flows.
- **Confidence**: Every insight carries a **low / medium / high** band as a reminder that strength of evidence varies.

## Language guardrails

Public cohort copy is scanned for disallowed diagnostic terms (see `BANNED_DIAGNOSTIC_TERMS` in `src/cohort/cohort-validation.ts`). UI layers apply the same family of checks where user-facing strings are assembled (`sanitizeGuidanceText` in `src/cohort/ux-copy-safety.ts`).

## Related implementation

- Cohort guidance dashboard: `src/components/cohort/CohortInsightsDashboard.tsx`
- Individual “Support insights”: `src/components/cohort/SupportInsightsSection.tsx`
- Insight builders: `src/cohort/ux-insights.ts`
