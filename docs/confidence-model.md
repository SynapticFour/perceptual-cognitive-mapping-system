# Routing dimension confidence model

This document specifies the **per-dimension routing confidence** used by the adaptive questionnaire (tags **F…V** — ten routing keys in `COGNITIVE_DIMENSION_KEYS`). These quantities are **opaque routing weights**, not latent trait estimates; they support stopping rules and item selection only.

## Mathematical specification

For each routing dimension \(d \in \{F,P,S,E,R,C,T,I,A,V\}\) and answered items \(i = 1,\ldots,n\):

### 1. Item weights

Let \(w_{di} \in [0,1]\) be the declared routing weight of item \(i\) on dimension \(d\) (from the question bank). Let \(r_i \in \{1,\ldots,5\}\) be the Likert response and \(\tilde{r}_i = (r_i-1)/4\) its \([0,1]\) normalisation. If item \(i\) is reverse-scored, use \(\tilde{r}_i' = 1-\tilde{r}_i\); otherwise \(\tilde{r}_i'=\tilde{r}_i\).

### 2. Weighted evidence (CTT-style)

\[
E_d = \sum_i w_{di}^2
\]

Squaring \(w_{di}\) down-weights weakly loading items relative to strongly loading ones, so a single high-loading item contributes more effective evidence than several low-loading items (Lord & Novick, 1968, Ch. 2–4 on test information as a function of item properties).

### 3. Shrinkage reliability

With pseudo-evidence prior \(k > 0\) (default \(k = 0.5\)):

\[
R_d = \frac{E_d}{E_d + k}
\]

This is a monotone map of \(E_d\) onto \((0,1)\) with larger \(k\) pulling \(R_d\) toward 0 for the same evidence—analogous to variance–bias / shrinkage ideas (Efron & Morris, 1977). It avoids claiming certainty from a handful of self-report items.

### 4. Consistency penalty

Let \(\mathcal{I}_d = \{ i : w_{di} \ge 0.3 \}\). For \(|\mathcal{I}_d| \ge 2\), define weighted adjusted values \(z_i = \tilde{r}_i' \cdot w_{di}\) and the **population** variance over \(i \in \mathcal{I}_d\):

\[
\mathrm{Var}_d = \frac{1}{|\mathcal{I}_d|} \sum_{i \in \mathcal{I}_d} (z_i - \bar{z})^2,\quad
C_d^{\text{raw}} = 1 - \mathrm{Var}_d
\]

If \(|\mathcal{I}_d| < 2\), set \(C_d^{\text{raw}} = 1\) (no penalty).

Then

\[
C_d = \max\left(0.5,\ \min(1,\ C_d^{\text{raw}})\right)
\]

The floor at 0.5 limits collapse from a single discordant self-report pair (Nunnally & Bernstein, 1994, on treating unstable estimates cautiously).

### 5. Combined confidence (pre-gate)

\[
\tilde{c}_d = R_d \cdot C_d
\]

### 6. Minimum-sample gate

Let \(N^{\text{strong}}_d = \#\{ i : w_{di} \ge 0.5 \}\). If \(N^{\text{strong}}_d < 2\), **cap** reported confidence at the research threshold \(\tau = 0.75\):

\[
c_d = \begin{cases}
\tilde{c}_d & N^{\text{strong}}_d \ge 2 \\
\min(\tilde{c}_d,\ \tau) & \text{otherwise}
\end{cases}
\]

This encodes that substantive claims at the “research-grade” level should not rely on a single high-loading item (Nunnally, 1978, on minimum length for reliability goals—here operationalised as a count gate rather than coefficient \(\alpha\), which would require a calibrated scale).

## Implementation mapping

| Symbol | Code field |
|--------|------------|
| \(E_d\) | `effectiveEvidence` |
| \(R_d\) | `reliability` |
| \(C_d^{\text{raw}}\) | `consistency` (stored pre-floor for transparency) |
| \(c_d\) | `finalConfidence` |
| \(N^{\text{strong}}_d \ge 2\) | `meetsMinimumSample` |

**Note:** The stored `consistency` value is \(C_d^{\text{raw}}\) before the \([0.5,1]\) clamp used in multiplication; the clamp is applied only when forming \(\tilde{c}_d\). Inspectors should reapply `max(0.5, min(1, consistency)) * reliability` to recover the pre-gate product if needed.

## Example values (illustrative)

Assume \(k = 0.5\), all items load only on \(d\), \(w_{di}=1\), reverse-scored false, and \(\tau=0.75\). Consistency uses \(z_i = \tilde{r}_i'\).

| Answered \(n\) | Responses (Likert) | \(\mathrm{Var}_d\) on \(z\) | \(C_d\) (after clamp) | \(R_d\) | \(\tilde{c}_d\) | Gate | \(c_d\) |
|----------------|---------------------|----------------------------|------------------------|---------|-----------------|------|---------|
| 1 | 4 | — (use 1) | 1.0 | 0.667 | 0.667 | cap | 0.667 |
| 2 | 4, 4 | 0 | 1.0 | 0.8 | 0.8 | ok | 0.8 |
| 2 | 1, 5 | 0.25 | 0.75 | 0.8 | 0.6 | ok | 0.6 |
| 3 | 4, 4, 4 | 0 | 1.0 | 0.857 | 0.857 | ok | 0.857 |
| 5 | 4,4,4,4,4 | 0 | 1.0 | 0.909 | 0.909 | ok | 0.909 |

With many items at \(w=0.48\) only, \(N^{\text{strong}}_d=0\): \(R_d\) may exceed \(0.75\) but \(c_d = \min(\tilde{c}_d, 0.75)\).

## Literature anchors

| Design choice | Reference |
|---------------|-----------|
| Evidence as function of item information / weight | Lord & Novick (1968), *Statistical Theories of Mental Test Scores* |
| Shrinkage / bias–variance trade-off via \(k\) | Efron & Morris (1977), Stein-type estimation |
| Cautious interpretation until adequate multi-item support | Nunnally (1978); Nunnally & Bernstein (1994), *Psychometric Theory* |

## Limitations (methods text)

1. **Self-report**: Responses are subjective; the model does not correct for acquiescence or social desirability.
2. **No IRT calibration**: Item weights are expert-designed loadings, not discrimination parameters from a fitted IRT model; \(w_{di}^2\) is a pragmatic information proxy, not Fisher information at \(\theta\).
3. **Local independence**: The model does not yet penalise correlated residuals among similar items.
4. **Single administration**: No test–retest or alternate-form data enter the confidence.

## Single source of truth

All per-dimension routing confidences used for adaptive stopping and UI coverage bars are produced by `calculateResearchConfidence` in `src/scoring/scoring-model.ts` (via `ScoringModel` and `CoverageModel.coverageVectorFromResponses`). No other module implements an alternate confidence formula.
