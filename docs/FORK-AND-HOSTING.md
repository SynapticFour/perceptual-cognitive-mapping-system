# Forks, hosting, and the legal notes from the README

Moved from the README. Operator checklists that were already separate stay in [DEPLOYMENT.md](DEPLOYMENT.md), [DEPLOYMENT-LEGAL.md](DEPLOYMENT-LEGAL.md), and [deployment-runbook.md](deployment-runbook.md).

The public questionnaire is [https://map.synapticfour.com](https://map.synapticfour.com). Deploying that site is not a statement that the instrument is validated. See [STATUS.md](STATUS.md).

## Privacy & Security

Not a GDPR certification. Not a medical device. Encryption in transit and at rest is whatever the host (Vercel / Supabase) is configured for on a given deployment — this repository does not claim those controls as a verified product property.

- **Pseudonymous storage:** the assessment flow does not collect direct personal identifiers.
- **Integrity metadata:** optional hashed IP field in the database schema for future abuse controls (not enforced in the app layer yet).
- **Session deletion:** the assessment UI can request deletion of the current session. That is not a formal data-subject-request process.
- **Export:** research session export exists as an operator/research path, not as a GDPR portability process.

## 🚀 Deployment

### Vercel

1. Connect this GitHub repository to Vercel
2. Add environment variables in the Vercel dashboard
3. The deploy workflow runs on a tag that matches `v*.*.*` (`.github/workflows/deploy.yml`). A push to `main` does not run that workflow.

### Manual Deployment

```bash
npm run build
npm start
```

## 🤝 Support

### For Researchers

- Data export capabilities
- Custom question set integration
- Collaborative research opportunities

### For Users

- Complete assessment documentation
- Profile interpretation guides
- Support resources (non-clinical)

### Contact

- Questions or security concerns: [contact@synapticfour.com](mailto:contact@synapticfour.com)

## 📚 Governance

- Contribution guide: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Security policy: [`SECURITY.md`](./SECURITY.md)
- Code of conduct: [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)

## Legal & privacy (forks and self-hosting)

PCMS ships with consent copy, a Datenschutz/privacy page, and footer links aligned with the **Synaptic Four** public deployment at **map.synapticfour.com** (Vercel hosting; optional Supabase in **EU Frankfurt** — verify in dashboard). See **`docs/DEPLOYMENT-LEGAL.md`** and **`docs/legal-audit.md`** for the operator checklist and disclosure status.

**If you fork or self-host this software, you are responsible for your own legal documents and disclosures.** At minimum, operators typically need:

- A **privacy policy** (Datenschutzerklärung) appropriate for their jurisdiction, hosting, and subprocessors — replace or adapt the template content under `/privacy` and the message files in `messages/*/privacy.json`.
- **Consent wording** aligned with what your deployment actually collects and stores (including optional Supabase, retention, and any analytics).
- An **Imprint** (Impressum) where legally required — the default footer links to Synaptic Four’s imprint; change that link for your organisation.

This repository does not provide turnkey legal compliance for every jurisdiction.

## ⚖️ Legal Notice

This repository documents technical capabilities and research operating guidance. It is not legal advice and does not by itself provide regulatory certification or compliance guarantees. Compliance outcomes depend on operator configuration, contracts, and organisational controls.

## 📄 License

This project is licensed under the MIT License.

---

**Important**: This system is for **research, education, and self-understanding** only. It is **not** a medical, diagnostic, or therapeutic tool, **not** a selection or placement test, and **not** a substitute for professional advice. Deploying it with young people or in schools requires **local ethical review**, appropriate consent or assent, and often a customised build (e.g. age wording and data handling). For health concerns, people should consult qualified professionals in their own context.
