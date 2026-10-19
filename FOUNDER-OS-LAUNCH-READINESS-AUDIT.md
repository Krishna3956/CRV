# Founder OS launch-readiness audit

Date: 2026-10-19  
Audience: engineering release owner  
Scope: whether the current checkout is safe to offer to 100 independent customer workspaces

## Verdict

**Not yet ready to promise a smooth 100-customer launch.** The repository has a
strong, locally tested foundation, but local tests are not proof of production
readiness. The current checkout is also uncommitted and therefore cannot be the
code running in production. The launch gate should remain closed until the
blockers below have owners, evidence, and a recorded release commit.

This is not a statement that the product is unusable. It is a distinction
between “the core request path works in tests” and “100 external customers can
reliably operate it with safe isolation, observability, recovery, and support.”

## Blocking issues

The local implementation has now passed the 101-suite release gate, TypeScript,
lint with one pre-existing image warning, and an isolated production build with
166 generated pages. Those are necessary release checks, not proof that the
currently uncommitted checkout is deployed or that production capacity and
runtime configuration have been verified.

| Severity | Area | Evidence | Why it blocks a 100-customer claim | Exit evidence |
| --- | --- | --- | --- | --- |
| P0 | Release state | Founder OS work is uncommitted in a mixed checkout | Nothing in this checkout is live; accidental `git add .` could include unrelated artifacts | Clean release branch, reviewed PR, deployed SHA, smoke test |
| P0 | Schema compatibility | Operator public-schema audits confirm the core Founder OS tables, columns, indexes, constraints, refresh RPCs, and the `00014` rate-limit table/RPCs with RLS and service-role-only execution | Ingest, workers, catalog history, and distributed rate-limit routes depend on the additive schema; runtime configuration and deployed-SHA evidence are still separate gates | Retain the operator's SQL run record, run paired read-only postflights, and verify the deployed runtime is configured intentionally |
| P0 | OTel | A bounded authenticated OTLP/HTTP JSON receiver has route-level fixtures proving supported spans reach authenticated ingest without raw attributes; there is no OTLP/gRPC receiver, exporter, or clean customer end-to-end evidence | OTel is only launchable as the explicitly documented JSON metadata path; protobuf/export claims remain unsupported | Run a clean external JSON exporter-to-ingest smoke, or keep OTel out of broad launch promises |
| P0 | Background work | A secret-authenticated refresh trigger, scheduled workflow, fact/action handlers, and bounded catalog snapshot handler now exist locally, but production secrets, migration postflight, and live scheduler evidence are not present | Derived facts, Action Queue, and catalog version rows can be automated only after the trigger is configured; retention still fails closed | Configure the reviewed secrets after migration postflight, run a live batch, and record worker lag/retry evidence |
| P1 | Rate limits | Limits now use an explicit provider boundary and bounded in-memory fallback, but no distributed provider is configured | Multiple App Runner instances do not share counters; clients can bypass limits across instances/restarts | Shared limiter or gateway policy, load test across instances, alerting |
| P1 | Production smoke | Local production-shaped harness covers ingest and v2 reads, and a local HTTP fixture covers CLI start, approval, polling, redemption, and replay; no complete post-deploy test covers CLI approval, redeem, dashboard, and privacy controls | A local fixture pass cannot detect DNS, env, cookie, migration, or runtime wiring errors | Disposable workspace/key smoke run with redacted evidence |
| P1 | Tenant isolation | Local fixtures now exercise every analytics-backed v2 projection plus catalogs, Action Queue, tool-quality, and explicit workspace key revocation across two workspaces; no production-shaped cross-workspace integration suite exists | A single query missing `.eq(workspace_id, ...)` could expose customer telemetry | Run the same matrix against a disposable production workspace and retain the RLS/service-role review |
| P1 | Package distribution | Package dry-run audit, metadata checks, and packed consumers pass locally; registry publication/provenance is still pending | Customers cannot reliably install the exact reviewed artifacts until packages are published and consumed from a clean project | Published immutable versions, clean npm/PyPI consumer tests, rollback instructions |
| P1 | Data volume | Analytics performs bounded-but-heavy reads (up to 10,000 events) and computes projections in request memory; latest local fixture harness passes 120 requests at p95 14.24 ms with 0 timeouts | Fixture timing is not App Runner/Supabase capacity evidence | Production-shaped load test against a disposable workspace, query plans, rollups/cursors, timeout and alert policy |
| P1 | Identity semantics | Resolver-derived identity is explicitly a claim, not verified identity | Dashboard must not present event-weighted resolver coverage as unique people/orgs | Keep null/unknown labels or add server-attested identity contract and tests |
| P2 | Product completeness | Resources/prompts are method-family summaries, not entity-level catalog analytics; journeys/reliability are bounded | Users may interpret empty/partial views as “no usage” | UI caveats, fixture coverage, and an explicit limited-coverage launch scope |
| P2 | Privacy deletion | Requests are recorded, and a secret-authenticated non-destructive review queue plus dry-run preview worker exist; no approved asynchronous deletion worker exists | The product cannot claim that a customer deletion request has been fulfilled | Reviewed destructive worker, legal-hold/retention policy, audit trail, and completion evidence |

## What is already credible

- SDK and CLI activation contracts have focused tests and packed-consumer checks.
- Ingest authenticates API keys by hash, scopes rows to the resolved workspace,
  bounds request size/event count, sanitizes payloads, and is fail-open for
  derived fact writes.
- API keys are not included in telemetry or privacy exports.
- Cross-tenant contract fixtures cover analytics, v2 reads, Action Queue,
  export, privacy requests, and catalog/tool source scoping.
- v2 read routes have a common response-envelope helper and conservative
  caveats.
- A bounded OTLP/HTTP JSON receiver and OTel-to-TrackMCP mapper exist. The
  receiver reuses authenticated ingest, rejects protobuf, and does not claim
  OTLP/gRPC or external export support.
- The production build, TypeScript check, release gate, SDK tests, CLI tests,
  and Python tests have passed locally during the current work cycle.
- Dashboard and docs disclose data-trust limits instead of claiming unknown
  unique people or guaranteed outcomes.
- Privacy requests now have a bounded, secret-authenticated operator review
  boundary that never returns idempotency material and cannot mark a request
  completed; completion remains closed until a destructive worker is reviewed.
- The local load harness completed 120 bounded requests with 0% errors and no
  tenant-isolation failures; this is a regression signal, not a production
  capacity claim.

## Concrete 100-customer acceptance matrix

This is the minimum evidence package for a limited 100-customer pilot. A
green local unit test is not a substitute for the environment-specific checks
marked `production-shaped` or `live`. The release owner records the artifact
link, timestamp, commit SHA, and test workspace for every row.

| Gate | Test and scope | Pass threshold | Evidence required | Blocks pilot? |
| --- | --- | --- | --- | --- |
| Build reproducibility | Clean checkout: install web, TypeScript, CLI, and Python dependencies; build all packages | Zero install/build failures; generated artifacts match package manifests | CI run URL and artifact checksums | Yes |
| Web runtime | Start the production artifact and exercise homepage, docs, signup/signin return, dashboard, setup, device page | No 5xx/uncaught client errors; all primary CTAs reach an intentional destination | Browser matrix with console/network capture | Yes |
| CLI activation | Fresh machine/project: `npx @trackmcp/cli init`, browser approval, signup, workspace selection, redeem | One successful activation; no key printed in browser; cancellation/expiry/replay are clear and recoverable | Redacted terminal transcript + device flow run ID | Yes |
| Published packages | Install the exact published npm and PyPI versions in clean temporary consumers | Install succeeds without local paths; one instrumented event reaches ingest | Package versions, registry URLs, consumer logs | Yes |
| Ingest reliability | 100 workspaces × representative event batches, including malformed/oversized payloads and unavailable TrackMCP | No customer request is blocked; accepted-event rate and reject reasons within agreed limits; no raw secrets in storage/logs | Load run, reject histogram, secret scan | Yes |
| Tenant isolation | For every v1/v2 read/write route, alternate workspace A/B credentials and attempt cross-read/cross-mutate | 0 cross-tenant records or mutations; expected 401/403/404 semantics documented | Automated matrix output and RLS/application authorization review | Yes |
| Key lifecycle | Create, use, rotate with overlap, revoke, and retry old key | New key works; revoked key fails; no secret is retrievable after creation | Key lifecycle transcript and DB postflight | Yes |
| Data trust | Empty, partial, truncated, stale, unknown-client, unresolved-identity, and insufficient-data fixtures | UI never renders a false zero/green success; every metric shows scope, denominator, freshness, and caveat | Screenshot/contract assertions and fixture report | Yes |
| Analytics correctness | Seed known events for tools, clients, outcomes, journeys, reliability, catalogs, and Action Queue | Aggregates match independent reference queries; explicit versus inferred outcomes remain distinct | Reference-query diff and route snapshots | Yes |
| Failure recovery | Ingest outage, database timeout, worker crash, expired lease, duplicate event, and redeem lost response | SDK remains fail-open; jobs retry/dead-letter; replay is idempotent; no duplicate key or fact | Fault-injection runbook output | Yes |
| Rate limiting | Burst start/poll/redeem/key-status and ingest from multiple instances/proxy paths | Shared limits hold across instances; retry-after is bounded and truthful; spoofed forwarding headers cannot bypass limits | Distributed limiter run and alert output | Yes |
| Background work | Claim/lease/execute/retry/terminal-failure for fact projection, Action Queue refresh, catalogs, retention | No orphaned leases after recovery; lag and dead-letter metrics visible; replay procedure succeeds | Worker metrics and replay record | Yes |
| Privacy controls | Export and deletion-request lifecycle with retention exceptions | Export omits keys/tokens/raw payloads; deletion completion is auditable and scoped | Redacted export, audit record, deletion postflight | Yes |
| OTel claim boundary | Attempt the documented JSON receiver path from a clean customer-like setup | JSON exporter reaches ingest with bounded metadata; protobuf/gRPC/export remain clearly labeled unsupported | OTel integration result and docs review | Yes if marketed |
| Protocol coverage | Fixture vectors for initialize, tools/resources/prompts, errors, retries, cancellation, progress, tasks, subscriptions, completions, sampling, and elicitation | Every supported vector has a classification; unsupported vectors are visibly labeled unknown/limited | Versioned fixture corpus and classifier report | Yes for corresponding claims |
| Observability/operations | App Runner, database, ingest, worker, rate-limit, and package health dashboards/alerts | On-call can detect and diagnose a failed integration without raw customer payloads | Alert test and incident runbook | Yes |
| Rollback | Revert application image and verify schema compatibility | Rollback completes without data loss or incompatible writes | Immutable image/SHA and rollback rehearsal | Yes |

### Pilot thresholds that must be agreed before the run

The matrix requires explicit numeric thresholds for availability, p95 latency,
ingest acceptance/rejection, worker lag, and rate-limit false positives. The PDF
does not define those values and they must not be invented after a failure. Put
the approved thresholds in the release record and keep “insufficient evidence”
distinct from “zero.”

## Runtime risks requiring explicit verification

### Authentication and tenant boundaries

The dashboard now returns all memberships, persists an explicit selected
workspace, and validates `workspace_id` on account, analytics, tool-quality,
alert, and Action Queue browser requests. API-key paths remain workspace-scoped,
but every new read/write route must still be included in cross-tenant fixtures.

Server-role Supabase access bypasses database RLS. The application therefore
owns authorization in route code; a migration/RLS check alone cannot prove
isolation.

### Rate limiting

CLI start, poll, redeem, and key-status limits currently use a process-local
map. This protects a single process from accidental abuse but is not a
distributed production control. `x-forwarded-for` must also be treated as a
proxy-provided value only when the deployment topology guarantees that clients
cannot set it directly.

### Persistence and recovery

The redeem path claims a session before creating a key. It handles replay, but
key creation and session finalization are separate writes. A failure between
those writes needs a reconciliation job or operator runbook before claiming
strong exactly-once behavior. The read-only report
`supabase/manual/founder-os-cli-redemption-reconciliation.sql` now detects
stale `redeeming` sessions and session/key integrity mismatches. It does not
automatically retry or mutate them.

### OTel boundary

The plan says generic OTel cannot replace MCP-native semantic instrumentation.
That is correct. The current code includes a privacy-safe structural span
mapper and bounded authenticated OTLP/HTTP JSON receiver. It still does not
implement protobuf/gRPC or external export, so OTel must be described as
limited JSON interoperability, not as complete native MCP coverage.

## Required release sequence

1. Freeze scope and create a clean release branch from the intended baseline.
2. Classify all files; exclude local CSVs, campaign assets, diagnostics, and
   unrelated worktree changes.
3. Run the seven migration postflight queries against production. Do not run a
   blanket migration command.
4. Deploy to a disposable production workspace through the existing CI path.
5. Execute the end-to-end smoke matrix:
   - new CLI session → sign-in/signup → workspace selection → approval;
   - one-time redeem and replay behavior;
   - first accepted ingest and key-status;
   - dashboard analytics and every v2 route;
   - export and privacy-request status;
   - cross-workspace negative authorization checks.
6. Run a representative load test and inspect App Runner memory, latency, 4xx,
   5xx, database errors, and rate-limit behavior.
7. Publish SDK/CLI artifacts only from the reviewed commit and run clean
   consumer installs from the published versions.
8. Record deployed SHA, migration postflight output, smoke results, rollback
   image, and known limitations in the release manifest.

## Customer-facing launch scope if released before the blockers are complete

The honest limited scope is: **MCP server-boundary telemetry for TypeScript
and Python with conservative tool-call analytics, bounded catalog observations,
and a CLI activation flow.** Do not promise OTel interoperability, verified
unique-user analytics, entity-level resource/prompt analytics, automatic
Action Queue refresh, or completed deletion until those capabilities have the
runtime evidence listed above.

