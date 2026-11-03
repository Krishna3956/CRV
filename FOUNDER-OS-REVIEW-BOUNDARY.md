# Founder OS review boundary

This ledger records paths that the release-scope classifier intentionally keeps
outside the product candidate. A path listed here requires explicit owner and
reviewer disposition before staging; it is never included by a blanket add.

| Path | Classification | Owner | Required reviewer | Disposition |
| --- | --- | --- | --- | --- |
| `trackmcp-nextjs/AGENTS.md` | review-required | repository maintainer | release owner | instruction-only formatting change; exclude from product candidate unless separately approved |
| `trackmcp-nextjs/.github/workflows/production-key-lifecycle-smoke.yml` | review-required | repository maintainer | release owner | manual, write-gated operator workflow; review secret names and retain only redacted lifecycle evidence |
| `trackmcp-nextjs/.github/workflows/production-ingest-smoke.yml` | review-required | repository maintainer | release owner | manual, write-gated first-ingest workflow; review disposable-key handling, confirmation token, trusted-host validation, and redacted evidence |
| `trackmcp-nextjs/.github/workflows/production-auth-smoke.yml` | review-required | repository maintainer | release owner | manual/read-only authenticated UAT workflow; review disposable workspace keys, immutable release selection, trusted origin, and redacted tenant-isolation evidence |
| `trackmcp-nextjs/.github/workflows/production-transport-smoke.yml` | review-required | repository maintainer | release owner | manual Streamable HTTP/SSE interoperability workflow; review disposable key handling, direct-origin target, transport fixture boundary, and redacted evidence |
| `trackmcp-nextjs/.github/workflows/founder-os-refresh-worker.yml` | review-required | repository maintainer | release owner | scheduled production refresh workflow; review bounded concurrency, freshness classification, timeout behavior, and redacted worker evidence before release |
| `trackmcp-nextjs/.github/workflows/founder-os-refresh-health.yml` | review-required | repository maintainer | release owner | read-only scheduled monitor; review GitHub artifact access, bounded sample/cadence logic, warning behavior, and secret-free health output before release |
| `trackmcp-nextjs/workers/refresh-scheduler/README.md` | review-required | repository maintainer | release owner | AWS Scheduler enablement runbook; review secret-manager references, endpoint/token checks, disabled-first rollout, and scheduled-sample acceptance before release |
| `trackmcp-nextjs/workers/refresh-scheduler/handler.mjs` | review-required | repository maintainer | release owner | authenticated Lambda invoker; review bearer-token handling, bounded request body, timeout, and response/error logging boundary before deployment |
| `trackmcp-nextjs/workers/refresh-scheduler/handler.test.mjs` | review-required | repository maintainer | release owner | handler-level scheduler tests; review mocked bearer transport, fail-closed configuration, upstream status handling, and secret-free assertions before release |
| `trackmcp-nextjs/workers/refresh-scheduler/template.yaml` | review-required | repository maintainer | release owner | AWS Scheduler/Lambda/IAM/DLQ template; review least-privilege actions, secret dynamic reference, alarms, retry policy, and disabled-by-default state before enablement |
| `trackmcp-nextjs/.github/workflows/deploy.yml` | review-required | repository maintainer | release owner | production App Runner rollout workflow; review concurrency, immutable SHA selection, timeout behavior, and redacted smoke evidence before release |
| `trackmcp-nextjs/.github/workflows/deploy-refresh-scheduler.yml` | review-required | repository maintainer | release owner | manual OIDC SAM deployment; review endpoint/secret ARN validation, disabled-by-default schedule input, IAM capability, and status-only output before use |
| `trackmcp-nextjs/.github/workflows/ci.yml` | review-required | repository maintainer | release owner | hosted multi-language CI and artifact-validation workflow; review runner permissions, package artifact boundaries, timeout/concurrency controls, and ensure Go/.NET checks do not imply registry publication |
| `trackmcp-nextjs/supabase/manual/founder-os-migration-parity-postflight.sql` | review-required | repository maintainer | release owner | read-only production migration parity query; review the manifest against the approved release and interpret missing rows before any migration action |
| `trackmcp-nextjs/Dockerfile` | review-required | repository maintainer | release owner | production image build/runtime contract; review immutable release identity propagation and ensure no secret build arguments are added |
| `docs/mcp-blog-backlink-plan-2026-10.md` | review-required | repository maintainer | release owner | local editorial/outreach planning only; exclude from the product candidate and do not infer external publication or backlink evidence |
| `docs/SUBMISSION-ATTRIBUTION-RUNBOOK.md` | review-required | repository maintainer | privacy/release owner | analytics attribution runbook; review source precedence, self-reported detail redaction, and read-only reporting before publication |
| `docs/evidence/production-auth-scope-smoke-2026-10-30.json` | review-required | repository maintainer | release owner | redacted, read-only production tenant/auth scope evidence; review that it contains no credentials, workspace identifiers, raw bodies, or mutation results before release use |
| `docs/evidence/synthetic-customer-mcp-uat-2026-10-30.json` | review-required | repository maintainer | release owner | redacted synthetic MCP fixture evidence; review that it contains no credentials or customer claims and remains engineering-only evidence rather than real customer interoperability |
| `docs/evidence/authenticated-product-synthetic-mcp-uat-2026-10-30.json` | review-required | repository maintainer | release owner | redacted authenticated product integration evidence; review disposable-key handling, product-ingest scope, metadata-only retention, and the continued synthetic-server boundary |
| `docs/evidence/business-user-ux-local-preview-2026-11-03.md` | review-required | repository maintainer | release owner | local UX/browser evidence only; review that it remains clearly separated from production proof and contains no credentials or customer data |
| `docs/IN-APP-COPY-UX-READINESS.md` | review-required | repository maintainer | release owner | UX/copy readiness ledger; review implementation evidence, remaining browser/UAT gates, and keep local-only claims separate from production approval |
| `docs/IN-APP-COPY-UX-STRATEGY-2026-11.md` | review-required | repository maintainer | release owner | research-backed copy and interaction strategy; review wording and product claims before publication |
| `docs/IN-APP-COPY-UX-TARGET.md` | review-required | repository maintainer | release owner | UX acceptance target; review the evidence mapping and keep production/UAT boundaries explicit |
| `docs/IN-APP-COPY-UX-WORK-QUEUE.md` | review-required | repository maintainer | release owner | implementation checklist; review completion marks against tests and browser evidence before release |
| `docs/CONCISE-COPY-STRATEGY-2026-11.md` | review-required | repository maintainer | release owner | research-backed concise-copy strategy; review wording and product claims before publication |
| `docs/CONCISE-COPY-TARGET.md` | review-required | repository maintainer | release owner | concise-copy acceptance target; keep local and production evidence separate |
| `docs/CONCISE-COPY-WORK-QUEUE.md` | review-required | repository maintainer | release owner | concise-copy implementation checklist; review completion marks against tests and browser evidence |
| `docs/CONCISE-COPY-READINESS.md` | review-required | repository maintainer | release owner | concise-copy release ledger; production merge/deploy/UAT remain explicit gates |
| `docs/cxo-dashboard-readout-2026-11.md` | review-required | repository maintainer | release owner | CXO dashboard readout strategy; review evidence-backed metrics and keep illustrative data separate from production claims |
| `docs/cxo-dashboard-work-queue.md` | review-required | repository maintainer | release owner | CXO dashboard implementation checklist; review completion marks against focused tests and production evidence |
| `docs/dashboard-cognitive-load-audit-2026-11.md` | review-required | repository maintainer | release owner | research-backed dashboard simplification rationale; review wording and visual-system claims before release |
| `docs/dashboard-cognitive-load-work-queue.md` | review-required | repository maintainer | release owner | dashboard simplification checklist; review completion marks against focused tests and production evidence |
| `docs/dashboard-competitive-research-2026-11.md` | review-required | repository maintainer | release owner | comparative product-analytics research and visual references; review source links and keep competitor claims bounded |
| `docs/dashboard-ia-and-color-strategy-2026-11.md` | review-required | repository maintainer | release owner | dashboard information-architecture and semantic color strategy; review product-language and accessibility decisions before release |
| `docs/dashboard-research-work-queue.md` | review-required | repository maintainer | release owner | research and color implementation checklist; review completion marks against tests and deployment evidence |

## Boundary rules

- Review-required paths are not product evidence and must not be counted as
  application functionality.
- Local CSVs, campaign assets, credentials, environment files, and generated
  output remain excluded artifacts, not review-approved release files.
- A new review-required path must be added here with an owner, reviewer, and
  disposition before a candidate can be staged.
