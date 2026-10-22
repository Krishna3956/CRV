# Codex handoff: project state

Date of handoff: 2026-10-22

This is an evidence-based snapshot for a new Codex session. **Verified** means
the checkout, a test, a commit, or a public GitHub Actions result supports it.
**Reported** means it comes from an existing status document or earlier
conversation and was not re-run here. **Uncertain** means the repository cannot
prove it.

## Repository and release state

- Repository: `Krishna3956/CRV`.
- Checkout: `/Users/krishna/Documents/Codex/2026-10-17/okay-x20/CRV`.
- Current branch: `main`.
- Remote `main` currently points to `4ebd8386cb52c90ff95c863d8af55dba616018fb`.
- Recent commits: `f6ae4eb` (refresh evidence docs), `f2528cc` (direct App
  Runner refresh origin), `37f1e8c` (Founder OS vertical-slice merge),
  `b8163fe` (device approval contract), `3247574` (production smoke edge
  evidence), and the six vertical-slice commits `8319482`, `2154936`,
  `0e60b3b`, `f6fbc9a`, `7fba542`, `4dcc661`, `41c2bd4`.
- The handoff ledger under `docs/codex-handoff/` and local `tmp/` artifacts are
  intentionally untracked working notes; do not stage them into product PRs.
- No credentials, environment files, campaign files, or CSV exports are in the
  tracked diff inspected here.

## Architecture

TrackMCP is a Next.js application in `trackmcp-nextjs/` backed by Supabase. It
contains a web dashboard, authenticated account/workspace/key routes, MCP
repository discovery pages, CLI device authorization, direct telemetry
ingestion, bounded OTLP/HTTP JSON ingestion, Founder OS read models, and
scheduled refresh work.

The main data path is:

`TypeScript/Python SDK or bounded OTLP/HTTP JSON -> authenticated ingest ->
trackmcp_events -> optional semantic facts/action queue -> v2 read models ->
desktop Founder OS dashboard`.

Important source boundaries:

- Ingest: `trackmcp-nextjs/src/app/api/v1/ingest/` and
  `trackmcp-nextjs/src/lib/telemetry/validation.ts`.
- Analytics: `trackmcp-nextjs/src/app/api/v1/analytics/handlers.ts` and
  `trackmcp-nextjs/src/lib/telemetry/`.
- Versioned read APIs: `trackmcp-nextjs/src/app/api/v2/`.
- Dashboard: `trackmcp-nextjs/src/components/dashboard/DashboardApp.tsx`.
- Device flow: `trackmcp-nextjs/src/lib/device-auth.ts` and
  `trackmcp-nextjs/src/app/api/v1/cli/device/sessions/`.
- SDK/CLI: `trackmcp-nextjs/packages/typescript-sdk`,
  `trackmcp-nextjs/packages/cli`, and `packages/python-sdk`.
- Migrations: `supabase/migrations/` (32 files in this checkout).
- Deployment: `.github/workflows/deploy.yml` and `trackmcp-nextjs/deploy/`.

## Implemented product functionality

The source dashboard navigation is Overview, The journey, What they're doing,
Did it work, What's broken, Resources & prompts, Who's using it, Evidence, and
Setup. The six Founder OS read models are named `who_is_using_it`,
`capability_activity`, `resource_prompt_activity`, `journey_activity`,
`outcome_activity`, and `issue_activity`. Their shared privacy, scope, trust,
and uncertainty rules are in `docs/FOUNDER-OS-VERTICAL-SLICE-CONTRACT.md`.

The CLI package is `@trackmcp/cli@0.1.4`; the TypeScript SDK is
`@trackmcp/sdk@0.1.12`; the published Python package is `trackmcp==0.1.6`.
The TypeScript SDK 0.1.9 publication, provenance, exact integrity,
and clean-consumer export check are verified in the current release ledger. The
Node adapter accepts the official stdio, Streamable HTTP, and SSE transport
classes, emits bounded caller-driven reconnect lifecycle evidence, and records
privacy-safe server-directed task state transitions.
`npx @trackmcp/cli init` can install the SDK, reuse a valid key, open
the browser device flow, support sign-up/sign-in and workspace selection, and
redeem/store the connection key in `.env.local`. Installation remains silent
by design. See `trackmcp-nextjs/packages/cli/README.md`.

Browser approval never displays the raw key; the CLI performs one-time
redemption. The stable backend contract is
`trackmcp-nextjs/docs/DEVICE-AUTH-BACKEND-CONTRACT.md`, aligned by `628f403`.

The default telemetry contract is metadata-first: bounded protocol/tool/
service fields, coarse outcomes, and hashes where needed. Raw keys, headers,
prompt text, tool arguments/results, cookies, email, IP, full URLs, and
arbitrary payloads are excluded by default. The design record is
`docs/FOUNDER-OS-EXTERNAL-STANDARDS-DECISIONS.md`.

OTel support is bounded to authenticated OTLP/HTTP JSON with selected MCP
metadata. Protobuf/gRPC, external export, and complete proxy/stdio fallback are
not launch claims; see `docs/FOUNDER-OS-OTEL-INTEROPERABILITY.md` and
`docs/FOUNDER-OS-PROTOCOL-MATRIX.md`.

## Operations

`POST /api/internal/refresh/run` requires `TRACKMCP_REFRESH_WORKER_SECRET`,
uses a bounded batch, and returns non-2xx when unhealthy work remains. The
workflow `.github/workflows/founder-os-refresh-worker.yml` now uses AWS OIDC to
discover the App Runner hostname and calls the origin directly, avoiding
Cloudflare browser protection. Run `39311968261` succeeded with
`processed: 0`, `failed: 0`, `errors: []`, and `idle: true`. This proves
connectivity/authentication with an empty queue; it does not prove non-empty
production work was processed.

The deployment workflow is `.github/workflows/deploy.yml`; merge-triggered App
Runner run `39651989091` succeeded for `47ab7aadf13d19db0f6894efb0dc3945811643ee`.
Its redacted smoke executed 26/28 checks and retained the intentional
authenticated/write skips. Public evidence is recorded in
`docs/evidence/production-pilot-smoke-2026-10-19.json`; it deliberately does
not claim authenticated dashboard, tenant isolation, first ingest, or write
behavior.

The latest merged main commit is `4af64ee24dca8eefa89f85e69084c3d7e88cb986`.
It adds a bounded TypeScript `ModernMcpClient` discovery surface for the
`server/discover` contract (protocol version `2026-07-28`) and deliberately does
not claim a complete modern lifecycle client. SDK `0.1.10` was published once
with provenance by workflow `39709543205`; registry metadata reports integrity
`sha512-g6I5RClPAHVpSsZF+p7GgYuhOsLQdou8CE4AFYxvKgoTuTXU/M/gp3nWKKdb1SlEjwcv4BGKm780Czdaaz3WiA==`.
