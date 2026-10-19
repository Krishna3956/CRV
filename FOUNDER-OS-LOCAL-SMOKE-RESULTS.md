# Founder OS local smoke results

Date: 2026-10-19  
Environment: isolated Webpack build served locally with `next start -p 3201`

Latest verification: the isolated production build generated 165 pages, the
71-suite release gate passed, and the catalog-history dashboard panel is included in
the local build. Setup health now distinguishes waiting, first-event verified,
limited coverage, and unresolved identity. The runtime smoke below remains a
local-only check.

This is a local runtime check only. It does not prove production DNS,
environment variables, Supabase schema, App Runner capacity, or browser auth.

Repeat it against a running local server with:

```bash
cd trackmcp-nextjs
npm run smoke:local
```

## Public routes

Every public route also returned the baseline security headers: `nosniff`,
strict-origin referrer policy, same-origin framing protection, and the
camera/microphone/geolocation permissions policy.

| Route | Result |
| --- | ---: |
| `/` | 200 |
| `/docs` | 200 |
| `/docs/python` | 200 |
| `/docs/typescript` | 200 |
| `/device` | 200 |
| `/dashboard` | 200 |
| `/sitemap.xml` | 200 |
| `/tool-sitemap.xml` | 200 |

## Protected/API behavior without credentials

| Route | Result | Interpretation |
| --- | ---: | --- |
| `/api/v2/overview` | 401 | Correctly requires authenticated workspace context |
| `/api/v2/data-trust` | 401 | Correctly requires authenticated workspace context |
| `/api/v1/analytics` | 401 | Correctly rejects unauthenticated analytics reads |
| `/api/v1/ingest` | 405 | Correctly rejects an unauthenticated GET; ingest is POST-only |
| `/api/v1/otel/v1/traces` | 405 | Correctly rejects an unauthenticated GET; OTLP receiver is POST-only |
| `/api/v1/cli/device/sessions` | 405 | Correctly rejects an unauthenticated GET; device-session creation is POST-only |
| `/api/v1/cli/key-status` | 401 | Correctly rejects a request without a bearer key |
| `/api/internal/refresh/run` | 401 | Correctly rejects a POST without the worker bearer secret |
| `/api/internal/rate-limit/cleanup` | 401 | Correctly rejects a POST without the worker bearer secret |

## Remaining runtime evidence required before a 100-customer launch

- Real signup/sign-in/device approval and CLI redeem flow.
- Disposable workspace first-event ingest and dashboard verification.
- Cross-workspace negative authorization checks against production-shaped data.
- Key rotation/revocation and replay behavior.
- App Runner memory/latency/error metrics under representative load.
- Production postflight evidence for the operator-applied SQL migrations.
- Published npm/PyPI consumer installs from immutable release versions.
