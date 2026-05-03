# Cultural review checklist (before a locale goes live)

Use this list with **native-language** reviewers who also understand **local norms** (education, family structure, work, health communication). Record outcomes in the locale’s message file under `_localeReview` (see `messages/wo.json` / `messages/tw.json`) or in your study protocol.

---

## 1. Framing

- Does any string **imply deficit, disorder, or medical condition** (including via negation: “not a disorder”, “not autism”, etc.)?
- Are strengths and differences described in **neutral or asset** language where appropriate?
- Do results, consent, and landing copy avoid **clinical priming** (e.g. “symptom”, “patient”, “treatment”, “diagnosis”) unless a lawyer-approved exception exists?

**Reviewer actions:** Flag strings; propose rewrites that describe **tendencies**, **preferences**, or **patterns** without health framing.

---

## 2. Scales (Likert and similar)

- Do labels such as **“strongly agree” / “strongly disagree”** map onto how people in this region give direct answers?
- In some cultures, **strong public disagreement** is avoided; very assertive “strongly” wording can skew responses or feel rude.
- Are **middle options** (neutral / “it depends”) worded so they are socially usable, not as a “cop-out” that carries shame?

**Reviewer actions:** Suggest softer maxima (“agree a lot”), **face-saving** phrasing for disagreement, or **frequency** wording (“often / rarely”) if Likert labels misfit.

---

## 3. Context examples in questions

- Are **scenario references** (school, family, market, workplace, transport, digital life) recognisable in the **target region(s)**?
- Flag items that assume:
  - **Formal schooling** or homework as a universal experience,
  - **Nuclear family** as the default household,
  - **Western office** norms (open-plan, “manager”, 9–5 calendar),
  - **Car-centric** or **hyper-digital** defaults where they do not fit.

**Reviewer actions:** List question IDs or stems that need **local examples** or **more inclusive** wording; coordinate with content owners (question banks may live outside `messages/`).

---

## 4. Consent language: “research”

- Is the word or phrase used for **“research”** **neutral** in this locale?
- In some contexts, “research” evokes **colonial extraction**, **experimentation on communities**, or **clinical trials**—not voluntary self-report.
- Are **benefit, risk, storage, and withdrawal** described in plain language **without** institutional intimidation?

**Reviewer actions:** Propose alternative terms if needed (“study”, “learning together”, community-approved phrasing) and align with **ethics** and **privacy** pages.

---

## 5. “Thinking style” / cognitive tendency framing

- Does the translation of **cognitive tendency**, **thinking style**, or **profile** carry **stigma** or sound like a **medical label**?
- Does it accidentally **essentialise** (“you are X type”) instead of **situational** (“you often respond this way”)?
- Is **mental health** language avoided unless intentionally and ethically scoped?

**Reviewer actions:** Prefer **behaviour-in-context** phrasing; cross-check with youth and **non-specialist** readers.

---

## After review

- Set `_localeReview.reviewStatus` to a value other than `PENDING_NATIVE_REVIEW` when the locale is cleared for production (e.g. `REVIEWED` + `lastReviewed` ISO date), or remove `_localeReview` if you track status elsewhere.
- Keep **version notes** when large batches of strings change.

---

## Machine-readable status in `messages/*.json`

Standard JSON does **not** support `//` comments. For **Wolof** (`messages/wo.json`) and **Twi** (`messages/tw.json`), review status and outstanding checklist notes live in a root object **`_localeReview`** (ignored by UI copy; consumed by dev tooling / `UnreviewedLocaleWarner`). Other locales omit this key until a review pass is scheduled.
