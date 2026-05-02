# Eight-construct behavioral model (global bank)

This document specifies the **scientific status** of the eight constructs in `content/questions/global-behavioral-v2/bank.json`, how they relate to the legacy **ten routing dimensions (F–V)**, and the **pre-specified** validation programme.

## 1. Constructs (hypothesised latent traits)

| Construct slug | Intended psychological content | Primary routing bridge (pilot) |
|----------------|--------------------------------|----------------------------------|
| `predictability_adaptivity` | Preference for predictable rhythm vs ease of shifting when circumstances change | R, C |
| `sensory_processing` | Comfort and reactivity to sensory load | S |
| `cognitive_framing` | Abstract vs concrete framing, pattern use | P, V |
| `social_orientation` | Energy and stance toward joint activity / voices | E |
| `information_load` | Managing competing demands and information density | F, P, I (cross-load pilot) |
| `temporal_processing` | Sense of timing, pacing, and duration in daily tasks | T |
| `self_regulation` | Adjusting impulses, affect, and effort toward goals | C, F |
| `motivation` | Sustained effort toward valued ends | F, A |

**Important:** Routing weights are **expert-pilot mappings**, not CFA loadings. After calibration, item parameters live in `irt_a` / `irt_b` (see schema) and may replace static `informationGain`.

## 2. Two reporting layers

1. **F–V routing vector** — Used by the adaptive engine, confidence model, and cognitive landscape. Unchanged in architecture.
2. **Eight construct scores** — Computed per session as the **mean of reverse-adjusted, scale-normalised item scores** (Likert-3 or Likert-5) within each `g8:` tag. Stored in `StoredPipelineSession.eightConstructScores`.

These layers are **intentionally both reported** so that (a) longitudinal routing research remains comparable, and (b) the new bank can be validated on its own factor structure.

## 3. Within-session statistics (what the UI shows)

- **Mean (0–100):** Session mean of adjusted item scores on [0,1].
- **Within-person item SD:** Spread of item scores **for this person** on that construct (not population SD).
- **Precision (SD/√n):** Descriptive uncertainty of the **item mean** within this session — **not** IRT theta SE or sampling SE across people.

Population **reliability (ω, α)** and **IRT** information are **only** interpretable after multi-person calibration (see `VALIDATION_ROADMAP.md`).

## 4. Pre-specified analyses (to be pre-registered before Phase-2 data)

1. **CFA:** Eight correlated factors; alternative nested models (e.g. higher-order “context regulation” factor) compared via χ², RMSEA, CFI, SRMR.
2. **Measurement invariance:** Configural → metric → scalar across **language** and **deployment region** (not “WEIRD” vs “non-WEIRD” as a blunt binary—use site / language as factors).
3. **IRT:** For 3-point items, graded response or 2PL with **category thresholds** estimated per item; DIF by group for flagged items.
4. **Convergent / discriminant validity:** Hypotheses linking constructs to external measures (to be chosen per site ethics and availability—not only Western instruments).

## 5. Ethics

The eight constructs remain **non-diagnostic** and **research-grade**. Local ethics approval, assent rules, and literacy/audio protocols supersede this document where they conflict.
