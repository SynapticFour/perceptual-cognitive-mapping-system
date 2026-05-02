# Legal audit notes (PCMS)

**Not legal advice.** Working notes for operators. Public deployment reference: **map.synapticfour.com** (Synaptic Four, Stuttgart; contact@synapticfour.com).

## Disclosure status (rolling)

The following are **addressed in product copy or docs** as of the last substantive privacy pass:

- Datenschutzhinweise unter `/privacy` (Art. 13 DSGVO-orientiert): Verantwortlicher, Datenkategorien, Rechtsgrundlage Einwilligung, Hosting (Vercel), Drittlandübermittlung (USA), optional Supabase EU Frankfurt, lokale Speicherung, Aufbewahrung, Löschung, Widerruf, Auftragsverarbeiter, Rechte, Art. 22-Verneinung, Beschwerderecht (LfDI BW-Link), medizinischer Hinweis.
- Einwilligung (`/consent`): Betreiber **Synaptic Four**, Kontakt **contact@synapticfour.com**, Verweis auf Datenschutzseite in den Texten zu Speicherung/Rechten (DE/EN).
- Hinweis zu lokalem Speicher + optionalem Forschungsserver auf der Einwilligungsseite.
- Fußzeile: Datenschutz, Impressum (synapticfour.com), GitHub.

## Operational checks (Betrieb — keine Rechtsberatung)

- **`NEXT_PUBLIC_PCMS_CONSENT_MODE`**: In Produktion **niemals** `skip` für echte Teilnehmende.
- **Supabase**: Region **eu-central-1 (Frankfurt)** im Projekt-Dashboard verifizieren; bei Änderung **messages/*/privacy.json** und diese Notiz aktualisieren.
- **Vercel**: Vertragliche Unterlagen (AV-Vertrag / SCC) für den konkreten Workspace dokumentieren — Verantwortung des Betreibers.
- **Aufbewahrungsfrist**: Privacy-Text verlangt eine intern dokumentierte Höchstfrist ohne Nutzerlöschung — sobald festgelegt, in `messages/de/privacy.json` und `messages/en/privacy.json` nachziehen.
- **Internationale Ausweitung**: Bei neuen Regionen oder Tracking Tools erneut prüfen (Einwilligung, TTDSG/ePrivacy, Auftragsverarbeitung).

## Historische TODOs (Archiv)

Ältere Einzel-TODOs wurden durch die erweiterte Datenschutzseite und Einwilligungstexte weitgehend obsolet. Neue Lücken bitte hier als Bullet ergänzen.
