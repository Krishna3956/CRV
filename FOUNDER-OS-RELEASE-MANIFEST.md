# Founder OS local release manifest

Date: 2026-10-30
Status: post-release evidence reconciliation; documentation changes are reviewed separately from the deployed application.

The earlier `local review only; intentionally uncommitted` classification has
been superseded for the application release; this document remains a scope and
evidence aid for follow-up work.

This manifest separates the intended Founder OS release from unrelated local
work. It is a review aid, not a commit instruction.
Path-level reconciliation is maintained in `FOUNDER-OS-FILE-OWNERSHIP.md` and
the current out-of-scope disposition is maintained in
`FOUNDER-OS-REVIEW-BOUNDARY.md`.

## Current package correction — 2026-10-30

`@trackmcp/cli@0.1.13` is the current published CLI. It contains the npm/npx
entrypoint symlink fix and local help dispatch; the public artifact was verified
after publication workflow `40962471850`. This replaces the prior `0.1.12`
baseline for active docs and smoke defaults. Historical release rows below are
retained as immutable evidence.

## Current pilot evidence manifest (2026-10-30)

This is the immutable cross-system inventory for the current bounded pilot
baseline. It is evidence mapping, not a go/no-go decision; the active decision
surface remains `docs/FOUNDER-OS-100-CUSTOMER-PILOT-EXTERNAL-GATES.md`.

| Scope | Immutable identifier | Evidence / boundary |
| --- | --- | --- |
| Application source/runtime | deployed application `c6b6e85a43c33629e73694eb312e4e7db24b5a35`; App Runner run `40988182608` | Direct-origin `/api/health` reports the exact runtime SHA; `/`, `/docs`, `/sitemap.xml`, and `/robots.txt` returned 200; deployment release gate, rollout, production smoke, runtime safety, translation, and immutable identity checks passed |
| Repository mainline | `bf8fe88f2f1aa7c20aed4cfca5d0c932c85ee6ca` | Documentation-only readiness reconciliation after the capability-aware analytics release; it does not change the deployed application image |
| Scheduler source/deployment | source `20702c9`; CI `40628036758`; deploy `40628036770` | Independent AWS refresh scheduler; schedule enablement `40628646879` |
| Scheduler smoke/health | smoke `40628409832`; health `40629348992` | Authenticated smoke returned status 200 with DLQ depth 0; health reports 3/3 AWS worker samples, 6/6 invocations, and 4/4 EMF successes within budget |
| Applied refresh migration | `20261028000001_coalesce_refresh_jobs` | Additive coalescing migration and read-only postflight are recorded in the readiness ledger; no destructive schema operation is implied |
| Published package versions | `@trackmcp/sdk@0.1.25`; `@trackmcp/cli@0.1.13`; `trackmcp==0.1.15` | Public npm/PyPI registry checks and clean-consumer evidence are recorded in `docs/FOUNDER-OS-PACKAGE-RELEASE-READINESS.md`; activation and customer UAT remain separately gated |
| Verification | local release gate `154` suites; production build generates `211` routes; main CI `40988182750`; authenticated smoke `40989051472` | Local release gate, lint, and build pass; hosted CI and the 37-check authenticated read-only smoke are the authoritative hosted evidence |

The release remains **HOLD** for backup/PITR ownership, privacy acceptance,
customer-owned endpoint/protocol UAT, and release-owner scope/go-no-go. This
manifest must not be read as customer-readiness approval.

## Intended application scope

- Semantic event classifier, bounded facts, outcomes, and metric contracts.
- Privacy-safe account identity capture in the TypeScript and Python SDKs.
- Feature-flagged semantic-fact and action-queue persistence from ingest.
- Action-queue read API and owner/admin lifecycle mutations.
- Dashboard outcome evidence and action-queue review controls.
- Analytics data-trust metadata and resolver-based identity coverage.
- Versioned read-only overview, data-trust, tools, and tool-detail APIs.
- CLI/SDK activation flow, tests, and packed-consumer validation.
- Deployment-template wiring for `TRACKMCP_ENABLE_FACT_WRITES`.
- Publication workflow preflight for npm provenance and PyPI artifact checks;
  the current immutable packages are published (`@trackmcp/sdk@0.1.25`,
  `@trackmcp/cli@0.1.13`, `trackmcp==0.1.15`). Historical package versions
  remain in the release records as immutable evidence only.
- Architecture, retention, metric, standards, and lifecycle documentation.
- Supabase migrations and read-only postflight SQL (application reported by
  the operator; this checkout never executes production SQL).
- Service-role-only refresh-worker RPC migration and read-only RPC postflight;
  no SQL execution is implied by this checkout.
- Secret-authenticated refresh trigger route and a scheduled workflow that
  safely skips until its production secrets are configured.
- Lease-fenced refresh worker with a bounded external-trigger batch runner.
- Multi-workspace dashboard selection with explicit workspace authorization on
  account, analytics, tool-quality, alert, and Action Queue browser paths.
- Refresh-job result fencing that rejects stale workers after lease recovery.
- Bounded authenticated OTLP/HTTP JSON ingestion that reuses the metadata-only
  TrackMCP ingest contract; protobuf/gRPC and external export remain excluded.
- Repeatable local runtime smoke command: `npm run smoke:local`.
- Catalog sitemap index plus deterministic 45,000-URL shards with submission
  invalidation for catalogs beyond a single sitemap document.
- Hash-only resources/read and prompts/get catalog entity projections with
  workspace-scoped snapshot uniqueness and privacy-export/deletion coverage.
- Rollback readiness contract requiring immutable reviewed/deployed/rollback
  SHAs and container digests, additive-schema compatibility, and bounded smoke
  evidence before any release-owner rollback decision.
- Redacted evidence-record template requiring accountable owner, UTC timestamp,
  exact probe, environment, result, artifact reference, and scope caveat for
  every gate.
- Review-boundary ledger for every path classified outside the intended product
  scope, with explicit owner, reviewer, and disposition.
- Manifest-reconciliation contract connecting the thematic release scope to the
  machine-readable path classifier and ownership map.

## Intended product/content scope requiring separate review

The following files are present locally but should be reviewed as a separate
website/content release rather than silently mixed into the telemetry release:

- `trackmcp-nextjs/src/app/blog/enrichment.ts`
- `trackmcp-nextjs/src/app/blog/posts.ts`
- `trackmcp-nextjs/src/app/docs/page.tsx`
- `trackmcp-nextjs/src/app/docs/typescript/page.tsx`
- `trackmcp-nextjs/src/app/sitemap.ts`
- `trackmcp-nextjs/src/app/tool-sitemap.xml/route.ts`
- `trackmcp-nextjs/src/app/tool-sitemap/[shard].xml/route.ts`
- `trackmcp-nextjs/docs/PRD-sdk-activation-funnel.md`
- `trackmcp-nextjs/docs/blog-search-growth-plan-2026-10.md`

## Explicitly excluded

- Production credentials and local environment files.
- Campaign HTML, email templates, CRM exports, and CSV files.
- Generated `.next` output and `node_modules`.
- Supabase execution and production credentials. Git history and deployment
  operations are allowed for the reviewed application scope; this manifest
  does not authorize unrelated files.

## Release checks completed

- No secret-pattern matches in the reviewed source/docs scope.
- No campaign, email-template, or CSV artifact is present in the reviewed
  repository tree.
- TypeScript, lint, focused tests, and isolated Webpack production builds pass
  in the current local checkout.
- The local release gate passes 102 suites, TypeScript, lint with one existing
  image warning, and an isolated production build generating 169 pages.
- The application release was merged and deployed through App Runner from
  `a026d1fd222b37a599c92aca4e7af8b0ac6014fd`; deployment run
  [39236970873](https://github.com/Krishna3956/CRV/actions/runs/39236970873)
  completed successfully.
- A guarded read-only production smoke against `https://trackmcp.com` passed
  14 checks for public pages, docs, support, sitemaps, unauthenticated
  key-status, and exact published registry versions. It intentionally did not
  create an ingest event or use a production key.
- A clean detached checkout now passes the complete 102-suite release gate;
  generated Python wheel/sdist artifacts are built automatically before their
  contract checks and are not tracked in Git.
- Clean external npm consumers installed the exact SDK/CLI versions and a
  clean Python target installed `trackmcp==0.1.4`. No production telemetry
  event was emitted during those checks.

## 100-customer pilot gate

Before staging any release, run the read-only scope classifier from the web
workspace:

```bash
cd trackmcp-nextjs
npm run audit:release-scope
```

It separates intended release paths from local build artifacts and
review-required paths. The current mixed checkout reports 376 intended paths,
1 review-required path (`trackmcp-nextjs/AGENTS.md`), and no excluded local
artifacts in the audit output. It does not
stage, delete, or modify any file; `--strict` is available when a clean release
scope is required.

The detailed acceptance matrix is maintained in
`FOUNDER-OS-LAUNCH-READINESS-AUDIT.md`. The release is not pilot-ready until
the owner records evidence for every remaining blocking row; it is not yet
proven pilot-ready until that evidence includes
including a disposable production workspace CLI activation, first-event
browser/CLI smoke, cross-workspace negative authorization tests,
worker/rate-limit runtime evidence, rollback rehearsal, and an explicit
decision on whether OTel is a launch claim. Local fixture/load results must not
be represented as production capacity or availability evidence.

The executable evidence sequence is maintained in
`docs/FOUNDER-OS-100-CUSTOMER-PILOT-RUNBOOK.md`.

The following are known non-green at this review point:

- this documentation refresh is intentionally separate from the deployed
  application and the user-owned `trackmcp-nextjs/AGENTS.md` edit remains
  uncommitted;
- OTel has a bounded OTLP/HTTP JSON receiver; there is still no OTLP/gRPC receiver, exporter, or clean customer end-to-end evidence;
- no production scheduler/queue trigger is proven for refresh jobs (the reviewed
  route and GitHub Actions schedule exist locally, but production secrets and a
  live run have not been evidenced);
- no distributed rate-limit provider is proven;
- production safe-event and complete registry provenance evidence remain
  separate from the clean published-consumer verification;
- the deletion-request worker is not executing approved deletions;
- the CLI activation lifecycle has a local start/approve/poll/redeem/replay
  fixture; full production customer smoke evidence remains required.

Before any future commit, the intended scope above must be staged explicitly;
do not use a blanket `git add .` while the worktree contains mixed website,
SDK, and Founder OS changes.
