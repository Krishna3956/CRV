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

## Boundary rules

- Review-required paths are not product evidence and must not be counted as
  application functionality.
- Local CSVs, campaign assets, credentials, environment files, and generated
  output remain excluded artifacts, not review-approved release files.
- A new review-required path must be added here with an owner, reviewer, and
  disposition before a candidate can be staged.
