# Deployment — legal & data-processing snapshot (Synaptic Four)

**Not legal advice.** Technical and organisational facts intended to stay aligned with `messages/*/privacy.json` for the public instance **map.synapticfour.com**.

## Intended production stack

| Aspect | Intended setup |
|--------|----------------|
| Web hosting | Vercel Inc. (edge / serverless; parent company US-based) |
| App URL | `https://map.synapticfour.com` (`NEXT_PUBLIC_APP_URL`) |
| Optional DB | Supabase — **verify** project region **EU (Frankfurt, eu-central-1)** in [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → Infrastructure |
| Controller | Synaptic Four, Stuttgart — **contact@synapticfour.com** |

## Operator checklist (before go-live or after infra changes)

1. Confirm **Supabase region** matches privacy statements (EU Frankfurt for EU DB).
2. Confirm **no** `NEXT_PUBLIC_PCMS_CONSENT_MODE=skip` in production environment.
3. Ensure **Vercel** GDPR/SCC documentation for your team/org is on file if required by your policies.
4. After changing subprocessors, regions, or analytics: update **`messages/de/privacy.json`** and **`messages/en/privacy.json`**, bump **`last_updated`**, and redeploy.

## Related files

- Privacy UI: `src/app/[locale]/privacy/page.tsx`
- Strings: `messages/de/privacy.json`, `messages/en/privacy.json`
- Audit notes: `docs/legal-audit.md`
- Ethics framework (research conduct): `docs/ethics.md`
