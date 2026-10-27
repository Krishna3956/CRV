# Founder OS candidate file ownership map

This map is a review boundary for the mixed local checkout. It assigns every
path classified as intended release scope to one primary feature bucket and
names the required review role. It does not authorize staging, merging,
deployment, SQL execution, or package publication.

| Bucket | Path boundary | Primary owner | Required reviewer |
| --- | --- | --- | --- |
| Ingest and telemetry | `trackmcp-nextjs/src/app/api/v1/ingest/`, `trackmcp-nextjs/src/lib/telemetry/` | telemetry engineering | security + data-contract reviewer |
| Versioned read APIs | `trackmcp-nextjs/src/app/api/v2/`, `trackmcp-nextjs/src/app/api/v1/analytics/`, `trackmcp-nextjs/src/app/api/v1/tool-quality/`, `trackmcp-nextjs/src/app/api/v1/traces/` | product analytics engineering | tenant-isolation reviewer |
| Shared application libraries | `trackmcp-nextjs/src/lib/` | platform/product engineering | owning feature reviewer |
| Auth, workspaces, and CLI activation | `trackmcp-nextjs/src/app/api/v1/account/`, `trackmcp-nextjs/src/app/api/v1/cli/`, `trackmcp-nextjs/src/lib/device-auth*`, `trackmcp-nextjs/src/components/DeviceApprovalClient.tsx` | identity/platform engineering | security reviewer |
| Dashboard and customer UI | `trackmcp-nextjs/src/components/dashboard/`, `trackmcp-nextjs/src/app/dashboard/`, `trackmcp-nextjs/src/app/device/` | product engineering | UX/accessibility reviewer |
| Website and content | `trackmcp-nextjs/src/app/page.tsx`, `trackmcp-nextjs/src/app/docs/`, `trackmcp-nextjs/src/app/blog/`, `trackmcp-nextjs/src/components/Footer.tsx`, `trackmcp-nextjs/src/components/TrackMCPLogo.tsx`, `trackmcp-nextjs/src/app/sitemap.ts` | web/content engineering | product marketing + SEO reviewer |
| SDK and CLI | `trackmcp-nextjs/packages/typescript-sdk/`, `trackmcp-nextjs/packages/cli/` | SDK engineering | package/release reviewer |
| Python SDK | `packages/python-sdk/` | SDK engineering | package/release reviewer |
| Schema and SQL | `supabase/migrations/`, `supabase/manual/` | data/platform engineering | security + operator reviewer |
| Deployment and CI | `.github/workflows/`, `trackmcp-nextjs/deploy/`, `trackmcp-nextjs/workers/`, `trackmcp-nextjs/next.config.ts`, `trackmcp-nextjs/eslint.config.mjs` | platform/reliability engineering | release owner |
| Tests and release tooling | `trackmcp-nextjs/scripts/`, `trackmcp-nextjs/**/*.test.*`, `trackmcp-nextjs/package*.json` | developer productivity | owning feature reviewer |
| Founder OS documentation | `FOUNDER-OS-*.md`, `docs/FOUNDER-OS-*.md`, `docs/architecture.md`, `docs/getting-started.md` | CTO/release engineering | release owner |

Any intended path outside these boundaries is a release-review finding and must
be assigned explicitly before staging. Generated output, credentials, campaign
assets, and exports remain excluded by the scope audit and are not assigned an
owner for release.
