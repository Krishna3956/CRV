# Founder OS delivery status and remaining work

Date: 2026-10-19
Review mode: post-release evidence reconciliation
Repository: `Krishna3956/CRV`
Current checkout: `codex/founder-os-evidence-refresh`
Review baseline: `origin/main` at `66e4348`
Application deployment: `a026d1fd222b37a599c92aca4e7af8b0ac6014fd`

This document is the delivery ledger for the Founder OS programme. It is an
engineering status record, not an instruction to merge, deploy, publish a
package, or execute SQL. The working tree intentionally contains mixed,
uncommitted work. A release owner must classify and stage files explicitly.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| **Baseline/live candidate** | Present in `origin/main` or in the previously released application. Local inspection alone does not prove production is serving it. |
| **Implemented and locally verified** | Source and tests are present in this checkout and the stated local checks passed. |
| **SQL required** | Application/schema contract exists, but the named migration must be applied and postflight-checked before enabling dependent writes. No SQL was executed by this checkout. |
| **Release required** | Local code is ready or near-ready, but it is uncommitted/unmerged and therefore cannot be in production. |
| **Partial / limited coverage** | A safe bounded projection exists, but it deliberately does not make a stronger product claim. |
| **Deferred / missing** | The requirement is in the plan but has no complete implementation yet. |
| **Decision required** | Product or security policy cannot be inferred safely from code. |

## Executive snapshot

The repository now has a substantial, test-backed semantic foundation: a
bounded event contract, conservative facts/outcomes, privacy-safe resolver
identity, catalog observation metadata, data-trust disclosures, an Action Queue
lifecycle, versioned v2 read surfaces, SDK/CLI activation work, and a dashboard
signal surface. The local release gate and a clean production build have passed
in the latest verification cycle. The latest cycle passed all 101 release-gate
suites, TypeScript, lint with one pre-existing image warning, and local runtime smoke
covering 8 public routes and 10 protected/API checks. The original PDF audit also closed the first high-priority
protocol gap around multi-round-trip outcomes and added a truthful Setup status
surface.

It is not yet the complete Founder OS product. The reviewed application and
package changes have been merged and deployed, but the pilot evidence ledger
still contains environment-specific gates that cannot be inferred from local
tests. The highest-risk remaining dependencies are:

1. Confirm every required Supabase migration with read-only postflight checks.
   The operator has reported that the earlier migrations were applied; this
   checkout has not independently verified production.
3. Apply and verify the catalog-observation migration before enabling code that
   selects or writes its columns.
4. Resolve product decisions around supported MCP versions, outcome claims,
   retention, minimum sample sizes, identity semantics, and pricing.
5. Complete the missing semantic capabilities: catalog history joins,
   entity-level resources/prompts, verified identity, durable scheduling,
   export/delete controls, and the Founder OS dashboard information architecture.
6. Complete the production-shaped pilot evidence sequence: CLI activation,
   first ingest, dashboard export, negative authorization, key lifecycle,
   worker/rate-limit behavior, rollback rehearsal, and final go/no-go review.

## Production and repository state

### Current review baseline

- `origin/main` review baseline: `66e4348da49f98ab89fc2a212846ac6a170979f7`.
- Application code deployed by App Runner: `a026d1fd222b37a599c92aca4e7af8b0ac6014fd`.
- App Runner deployment run: [39236970873](https://github.com/Krishna3956/CRV/actions/runs/39236970873).
- The deployed public surface passed the guarded read-only smoke with 14 checks; the redacted report is `/tmp/trackmcp-production-smoke.json`.
- Rollback candidate digest: `sha256:ff8221e6eda6ce105ccf406ea79b5e06848a3a4757d708e1a75e29d9cd607563`.
- This checkout is documentation-only reconciliation; the unrelated local
  `trackmcp-nextjs/AGENTS.md` edit is intentionally excluded.

### What is known

- `origin/main` currently resolves to `66e4348` (`Merge production public smoke evidence`).
- The application release was merged through PR #43 and deployed by the
  existing GitHub Actions/App Runner workflow.
- `@trackmcp/sdk@0.1.2`, `@trackmcp/cli@0.1.4`, and `trackmcp==0.1.4` are
  published; clean external npm and Python consumer installs passed.
- Supabase SQL was intentionally not executed by the agent; operator-run
  postflight evidence remains a separate gate.
- Local verification has covered the web release gate, SDK/CLI packed consumers,
  Python tests, TypeScript, lint, migration contract tests, and sequential
  Webpack builds. The default Turbopack limitation observed previously is an
  environment/process issue; it is not a substitute for the CI build.

### What is not proven locally

- Whether the production browser/CLI smoke sequence has been completed for a
  disposable pilot workspace.
- Whether production contains every migration listed below.
- Whether the production deployment has `TRACKMCP_ENABLE_FACT_WRITES=true`.
- Whether production data has enough accepted events for meaningful outcome,
  identity, or catalog metrics.
- Whether a post-deploy browser smoke test has exercised every v2 endpoint.

## Requirement-to-delivery matrix

### 1. Product truth, language, and boundaries

| Founder OS requirement | Current evidence | Status | Remaining acceptance |
| --- | --- | --- | --- |
| Outcome-first product positioning | `FOUNDER-OS-IMPLEMENTATION-PLAN.md` canonical language and homepage/docs edits in the worktree | Implemented locally; release required | Review copy with product; publish only with the intended website release |
| Distinguish server-local evidence from whole-agent completion | `docs/FOUNDER-OS-METRIC-CONTRACT.md`, outcome caveats in v2 routes | Implemented locally | Add UI evidence drawers and verify every metric includes scope/caveat |
| Explicit non-goals for raw secrets, payloads, and unsupported claims | `docs/FOUNDER-OS-EXTERNAL-STANDARDS-DECISIONS.md`, validation and route bounds | Implemented locally | Security review and production redaction audit |
| Naming and compatibility decision record | `docs/FOUNDER-OS-EXTERNAL-STANDARDS-DECISIONS.md` and plan | Partial | Product must approve first-class MCP versions/transports and publish a versioned matrix |
| First paid use case | Plan section 20 lists the decision | Decision required | Choose tool reliability, workflow completion, or adoption intelligence before broad sales claims |
| Metric glossary and denominator policy | `docs/FOUNDER-OS-METRIC-CONTRACT.md`, `metric-definitions.ts` | Implemented locally | Product sign-off, sample-size policy, and dashboard copy |

### 2. Event contract, privacy, and ingestion

| Requirement | Current evidence | Status | Remaining acceptance |
| --- | --- | --- | --- |
| Bounded canonical event envelope | `src/lib/telemetry/types.ts`, `validation.ts` | Implemented locally | Add full fixture corpus across all protocol families |
| Metadata-first collection and payload bounds | telemetry validation, SDK redaction tests | Implemented locally | Threat model and production log review |
| Fail-open SDK behavior | TypeScript/Python SDK tests and docs | Implemented locally | Add network outage and bounded retry tests for every supported runtime |
| Idempotency and duplicate handling | ingest handler, `(workspace_id,event_id)` database uniqueness, conflict-ignoring upsert, and replay integration test | Implemented locally / production schema evidence pending | Retain the migration/postflight record and run a production-shaped replay against the deployed schema; retention policy remains separate |
| Protocol/transport capture | semantic fields, catalog observation fields, bounded TypeScript/Python initialize/shutdown lifecycle boundaries, explicit Python transport metadata, and bounded failed-session evidence on TypeScript transport errors | Partial | Add dedicated transport/process/notification/catalog event families and fixtures; Python transport remains explicit configuration rather than an inferred value |
| Ingest authentication/rate limits | existing v1 ingest handler and route contracts | Baseline + locally extended | Load test per key/workspace limits and verify cross-tenant isolation |
| Account identity resolver | SDK resolver support, `account_key`, source labels | Implemented locally / claimed identity | Add server-attested or workspace-keyed verification; document that resolver claims are not proof |
| No raw API keys/tokens in telemetry | tests and release-hygiene checks | Implemented locally | Repeat secret-leak scan on the exact release tree |
| Retention and deletion policy | `docs/FOUNDER-OS-RETENTION-POLICY.md`, SQL/manual checks | Implemented policy / operationally partial | Schedule and monitor cleanup; add customer deletion/export workflow |
| Queue/worker boundary | fact writer, durable refresh-job lifecycle, lease-fenced batch worker, secret-authenticated trigger, and scheduled workflow | Partial; production trigger configuration and live evidence remain | Configure the production secrets after postflight, add lag/dead-letter metrics, and document replay procedure |

### 3. Catalog and protocol semantics

| Requirement | Current evidence | Status | Remaining acceptance |
| --- | --- | --- | --- |
| Catalog observation without raw names/URIs | SDK hashing, ingest fields, `20261018000005_catalog_observation_contract.sql` | Implemented locally; operator-reported SQL complete | Retain the SQL run record and run `founder-os-catalog-observation-postflight.sql` before release |
| Catalog snapshots and version joins | Privacy-safe normalization, bounded worker snapshot writes, workspace-scoped v2 catalog metadata, timestamp cursor pagination, and review-only schema | Partial; operator-reported SQL complete | Add deployment joins and production scheduler evidence; cursor pagination is implemented locally |
| Tools analytics | v2 tools/tool-detail routes, bounded projections, validated `tool_name` filtering, and additive opaque cursor pagination | Implemented locally / bounded | Seeded production-shaped query-cost review and durable catalog joins remain |
| Resources analytics | v2 resources route reports method families plus bounded unique SHA-256 URI-hash counts; TypeScript/Python SDKs emit bounded hashes; local refresh handler writes a review-ready entity-read projection | Partial / SQL required | Apply and postflight `20261019000002_catalog_entity_reads.sql`, then verify durable read-result joins; raw URI identities remain unavailable by design |
| Prompts analytics | v2 prompts route reports method families plus bounded unique SHA-256 name-hash counts; TypeScript/Python SDKs emit bounded hashes; local refresh handler writes a review-ready entity-read projection | Partial / SQL required | Apply and postflight `20261019000002_catalog_entity_reads.sql`, then verify durable input/completion joins; raw names/arguments remain unavailable by design |
| Subscriptions and list-changed notifications | Protocol events persist through the canonical envelope; semantic facts now classify progress, catalog-changed, notification, and subscription start/stop signals without treating them as business outcomes | Implemented locally / bounded | Add SDK/exporter emission coverage and dashboard projections before marketing lifecycle analytics |
| Sampling and elicitation | semantic fixtures plus TypeScript server-wrapper metadata-only response observations for bounded `complete`/`input_required` result types | Partial | Add durable capability-aware request/result persistence, broader runtime fixtures, and dashboard outcome evidence |
| Stream/stdio lifecycle | TypeScript and Python adapters emit bounded `session_started`/`session_ended` boundaries for initialize/start, shutdown/close, and TypeScript transport errors; TypeScript includes bounded session duration | Partial | Capture disconnect, crash, graceful shutdown, and transport-specific evidence separately; add process-exit fixtures before claiming full lifecycle coverage |
| Protocol matrix | versioned evidence matrix and contract test | Implemented locally | Add fixtures as each deferred surface is implemented |

### 4. Facts, outcomes, journeys, reliability, and actions

| Requirement | Current evidence | Status | Remaining acceptance |
| --- | --- | --- | --- |
| Shared semantic classifier | `src/lib/telemetry/semantic.ts`, tests | Implemented locally | Version classifier outputs and add full modern/legacy protocol vectors |
| Capability-aware outcomes | `outcomes.ts`, fact/read-model tests, and `/api/v2/outcomes` explicit-fact integration coverage | Implemented locally / conservative | Add elicitation/sampling/structured-output/transport outcomes and late-event recomputation |
| Persistent facts | `fact-writer.ts`, feature flag and migration | Implemented locally; operator-reported SQL complete | Enable the feature flag deliberately, monitor write failures and lag |
| Data-trust facts | `data-trust.ts`, v2 route, dashboard panel | Implemented locally | Back with durable rollups and show freshness/denominator on every view |
| Journeys and drop-off | v2 journeys projection now exposes explicit terminal/unresolved summary counts and never labels unresolved sessions as abandonment | Partial | Correlate request-state/task/workflow handles and add evidence drill-downs; do not infer abandonment from idle gaps |
| Reliability | v2 reliability projection now includes observed daily baseline/comparison error rates with a 30-call minimum per side and explicit sparse-data states | Partial | Add transport/process facts, deployment-linked comparisons, incident linkage, and production-shaped evidence; these rates remain observed telemetry rather than infrastructure uptime |
| Action Queue candidate evaluation | `action-queue.ts`, `fact-writer.ts` | Implemented locally / conservative | Persist candidates durably, deduplicate, and link to issue evidence |
| Action Queue lifecycle | `action-queue-lifecycle.ts`, v1 read/PATCH routes, workspace-scoped `before` cursor, migration 00004 | Implemented locally; operator-reported SQL complete | Audit transitions, owner permissions, and optimistic concurrency in production |
| Action Queue scheduler | durable jobs, lease-fenced worker, internal trigger, and scheduled workflow | Partial; production configuration/evidence pending | Configure the trigger, add lag/dead-letter metrics, and document replay procedure; local batches now enforce a 45-second default wall-clock deadline (60-second hard maximum), while the scheduled route retains its request-level timeout |
| Alerts linked to action issues | shared hash-only fingerprint, review-only additive column/index, and optional workspace-scoped `linked_alerts` read projection on v2 Action Queue | Implemented locally / SQL required | Apply and postflight the additive link migration, then verify linked incident and delivery-history evidence in production-shaped data |

### 5. API/read models and dashboard

| Requirement | Current evidence | Status | Remaining acceptance |
| --- | --- | --- | --- |
| `/api/v2/overview` | route, handler, contract test | Implemented locally | Verify common envelope fields and production authorization/data |
| `/api/v2/people` | route and contract test with explicit resolver/unresolved identity-source counts | Partial | Keep unique people/org counts null until verified identity exists; add pagination and production identity evidence |
| `/api/v2/tools` and detail | routes, tests, bounded projections, and optional cursor pagination | Implemented locally / bounded | Seeded integration test and production query-cost review |
| `/api/v2/resources` and `/prompts` | routes and tests | Partial / limited coverage | Entity-level capture as described above |
| `/api/v2/journeys` | route and test | Partial | Durable correlation and evidence drill-down |
| `/api/v2/outcomes` | route and contract/integration tests; uses explicit shared workflow facts and exposes unresolved/evidence-quality counts | Implemented locally / conservative | Classifier expansion and persistent rollups |
| `/api/v2/reliability` | route and test | Partial | Transport lifecycle and baselines |
| `/api/v2/action-queue` | route and test | Implemented locally | Production migration/postflight and scheduler |
| `/api/v2/catalogs` | route and test | Partial | Snapshot/version persistence and joins |
| `/api/v2/data-trust` | route and test | Implemented locally | Durable freshness/lag and production samples |
| Common response envelope | Shared `v2-envelope.ts` integrated across all v2 read routes and contract-tested | Implemented locally; release required | Validate runtime scope/freshness values against production data and preserve compatibility during rollout |
| Dashboard Founder OS information architecture | dashboard panels exist (data trust, protocol surfaces, action queue) | Partial | Complete navigation/overview/setup/people/tools/outcomes/reliability IA and evidence drill-downs |
| Setup → first-event verification | CLI/device activation, first accepted-ingest milestone foundations, read-only `/api/v2/setup` state contract, and dashboard consumption of the contract | Implemented activation / partial product surface | Add end-to-end browser/CLI evidence and production-shaped first-event verification |
| Export/delete controls | Bounded export, caller-scoped status, non-destructive deletion review, and hash-only catalog entity-read export | Partial; SQL/runtime evidence required | Record production postflight and operator audit; add the separately reviewed asynchronous deletion worker, legal-hold handling, and retention exceptions; requests still never delete data |

### 6. SDK, CLI, docs, and website

| Requirement | Current evidence | Status | Remaining acceptance |
| --- | --- | --- | --- |
| One-command CLI activation | CLI package, device auth, packed-consumer tests | Implemented locally; release required | Publish versioned package only after clean release and workflow approval |
| TypeScript SDK parity | source/dist, tests, packed consumer, MCP SDK 1.32.1 security upgrade | Implemented locally | Review remaining transitive development-tree advisories, verify generated dist is intentional, and publish with provenance |
| Python SDK parity | `packages/python-sdk`, tests/docs; Python middleware emits hash-only `resources/read` and `prompts/get` identity observations, bounded initialize/shutdown session boundaries, and optional explicit transport metadata | Implemented locally / capability scope must be stated | Validate `pip`/`uv`/Poetry examples against a clean consumer and document limitations; disconnect/crash/stdio process lifecycle remains unsupported |
| First-event verification | key status, milestone ingest, CLI output | Implemented locally / production-dependent | Exercise against production after deployment with a disposable workspace/key |
| Installation/docs content | docs pages and README changes | Implemented locally; release required | Content review, links, command correctness, and release-note publication |
| Homepage and feature positioning | local blog/docs/homepage changes | Partial; separate content release | Review product copy and CTA; do not mix silently with telemetry release |
| Release notes/blog | blog posts and enrichment present in worktree | Partial; separate content release | Confirm intended posts, dates, SEO metadata, and publication scope |
| Sitemap refresh | Dynamic tool sitemap index with 45,000-URL shards, deterministic pagination, and immediate invalidation after successful submissions | Implemented locally; production evidence pending | Verify the deployed index and shard response, plus crawler registration, after release |
| OTel boundary | Privacy-safe mapper plus bounded authenticated OTLP/HTTP JSON receiver, explicit accepted/rejected span counts, tests, and docs | Partial; no OTLP/gRPC receiver/exporter or clean customer run | Run a clean JSON exporter-to-ingest smoke before marketing it broadly; keep protobuf/gRPC/export explicitly unsupported |
| Proxy/stdio fallback | plan only | Deferred | Implement only after native SDK evidence and explicit limited-coverage docs |

### 7. Operations, CI, security, and release governance

| Requirement | Current evidence | Status | Remaining acceptance |
| --- | --- | --- | --- |
| CI runs web/SDK/Python gates | `.github/workflows/ci.yml`, release gate script | Implemented locally | Validate GitHub run on the exact intended commit |
| Full local release gate | `scripts/release-gate.mjs` | Implemented and locally verified (101 suites, including the setup state contract, ingest replay, protocol-semantic signals, dashboard contract, privacy review, package consumers, security headers, worker-health and operations contracts, public-claim truth, Python/OTel documentation boundaries, manual SQL safety, release-scope/instruction/ownership contracts, scope-aware secret audit, rollback readiness, evidence records, review boundaries, and manifest reconciliation) | Re-run from clean isolated checkout before PR |
| Production build | sequential Turbopack build passed (latest 166/166) | Implemented and locally verified | Confirm CI default build and artifact/runtime smoke tests |
| Lint/type checks | passed; one existing image warning | Implemented locally | Decide whether warning is accepted or fix separately |
| Release hygiene | `release-hygiene.test.mjs` | Implemented and locally verified | Run on exact staged tree; ensure no CSV/campaign/env artifacts |
| Migration contract tests | account/read-model/action/catalog tests | Implemented locally | Run read-only production postflights; never use a blanket migration push |
| Workspace/tenant authorization | v1/v2 auth boundaries, route contracts, and two-workspace fixtures covering every analytics-backed v2 projection | Implemented locally / needs runtime evidence | Security review and production-shaped cross-tenant run |
| Retention worker | retention policy plus refresh-worker handler boundary | Partial | Operational scheduler, metrics, audit, failure handling |
| Deployment workflow | existing GitHub/App Runner workflow with 4 GB capacity guard, runtime secret wiring, and fail-fast Founder OS feature/secret validation | Baseline plus local safeguards | Release owner must merge through PR and verify deployed commit/smoke tests |
| Package publishing | no publication in this checkout | Deferred for release | Version, provenance, clean consumer, and rollback plan |
| Rollback plan | plan policy | Documented | Record immutable image/commit and schema compatibility before production |

## SQL and production-schema dependencies

The following are review-only files. This checkout did not execute SQL. The
operator reports that production SQL has been applied; that report still needs
to be retained with the paired read-only postflight evidence before a production
claim.

| Migration | Purpose | Current status | Dependent code |
| --- | --- | --- | --- |
| `20261018000002_account_identity_contract.sql` | bounded resolver-derived account identity columns | Operator-reported applied; verify | SDK resolver + ingest writes |
| `20261018000003_founder_os_read_model.sql` | semantic facts, outcomes/action foundation | Operator-reported applied; verify | fact writer, v2 projections |
| `20261018000004_action_queue_lifecycle.sql` | acknowledge/snooze/resolve metadata and concurrency fields | Operator-reported applied; verify | action queue lifecycle routes |
| `20261018000005_catalog_observation_contract.sql` | bounded catalog kind/count/hash columns and constraints | Operator-reported applied; postflight evidence pending | ingest select/write and catalog projections |
| `20261018000006_founder_os_refresh_jobs.sql` | durable worker leases, retries, deduplication, and bounded job state | Operator-reported applied; postflight evidence pending | refresh worker route/workflow are local; production trigger evidence pending |
| `20261018000007_privacy_requests.sql` | non-destructive deletion-request state and idempotency records | Operator-reported applied; postflight evidence pending | privacy-request endpoints; no deletion is performed |
| `20261018000008_catalog_snapshot_versions.sql` | privacy-safe catalog snapshot lineage and bounded diffs | Operator-reported applied; postflight evidence pending | snapshot normalization/diff layer; no historical rows are backfilled |
| `20261019000002_catalog_entity_reads.sql` | idempotent hash-only resources/read and prompts/get projection plus worker vocabulary | Review-only; not executed; postflight pending | Apply manually, run `founder-os-catalog-entity-reads-postflight.sql`, then schedule `catalog_entity_recompute` |
| `20261018000009_mcp_round_trip_outcomes.sql` | bounded result semantics, retry linkage, and resource annotations | Operator-reported applied; postflight evidence pending | semantic validation, ingest projection, and outcomes reads |
| `20261018000010_refresh_job_worker_rpc.sql` | service-role lease claim/result RPCs | Review-only; postflight evidence pending | refresh worker Supabase adapter and trigger |
| `20261018000011_catalog_workspace_scope.sql` | explicit workspace scope for catalog version rows | Review-only; postflight evidence pending | workspace-scoped analytics/catalog history |
| `20261018000012_privacy_deletion_batches.sql` | bounded, auditable deletion-batch planning state | Operator audit confirms table and integrity checks; retain postflight evidence | privacy preview/retention operations |
| `20261018000013_cli_redemption_idempotency.sql` | stable redemption-id hash and replay protection | Operator audit confirms column, index, and constraint | CLI device redemption |
| `20261018000014_rate_limit_buckets.sql` | service-role distributed rate-limit buckets and cleanup RPCs | Operator postflight confirms table, index, both RPCs, RLS, and service-role-only execution; no browser-role access | distributed device/key-status rate limiting; enable only with explicit runtime mode and observe fallback/latency |
| `20261019000001_alert_action_queue_link.sql` | additive indexed hash-only link from alert incidents to Action Queue fingerprints | Review-only; not executed; postflight pending | alert evidence carries the same bounded fingerprint locally; top-level writes remain opt-in behind `TRACKMCP_ENABLE_ALERT_ACTION_QUEUE_LINK` until postflight |
| `20261019000003_catalog_workspace_unique_scope.sql` | workspace-scoped catalog snapshot uniqueness and refresh conflict boundary | Review-only; not executed; postflight pending | apply manually, run `founder-os-catalog-workspace-unique-postflight.sql`, then verify cross-workspace snapshot writes |

Run only the paired read-only postflight files after the operator confirms the
production migration state:

- `supabase/manual/founder-os-account-identity-postflight.sql`
- `supabase/manual/founder-os-read-model-postflight.sql`
- `supabase/manual/founder-os-action-queue-lifecycle-postflight.sql`
- `supabase/manual/founder-os-catalog-observation-postflight.sql`
- `supabase/manual/founder-os-refresh-jobs-postflight.sql`
- `supabase/manual/founder-os-privacy-requests-postflight.sql`
- `supabase/manual/founder-os-alert-action-queue-link-postflight.sql`
- `supabase/manual/founder-os-catalog-snapshot-postflight.sql`
- `supabase/manual/founder-os-cli-redemption-idempotency-postflight.sql`
- `supabase/manual/founder-os-rate-limit-postflight.sql`
- `supabase/manual/founder-os-round-trip-outcomes-postflight.sql` (create/read-only check before release if present)
- `supabase/manual/founder-os-retention.sql`
- `supabase/manual/founder-os-catalog-entity-reads-postflight.sql`
- `supabase/manual/founder-os-catalog-workspace-unique-postflight.sql`

## Local evidence index

The following files are the primary implementation evidence, not a statement
that production has them:

- Plan and governance: `FOUNDER-OS-IMPLEMENTATION-PLAN.md`,
  `FOUNDER-OS-LOCAL-AUDIT.md`, `FOUNDER-OS-RELEASE-MANIFEST.md`.
- Contracts: `docs/FOUNDER-OS-METRIC-CONTRACT.md`,
  `docs/FOUNDER-OS-EXTERNAL-STANDARDS-DECISIONS.md`,
  `docs/FOUNDER-OS-RETENTION-POLICY.md`,
  `docs/FOUNDER-OS-ACTION-QUEUE-LIFECYCLE.md`.
- Telemetry: `trackmcp-nextjs/src/lib/telemetry/`.
- Ingest/analytics: `trackmcp-nextjs/src/app/api/v1/ingest/`,
  `trackmcp-nextjs/src/app/api/v1/analytics/`,
  `trackmcp-nextjs/src/app/api/v2/`.
- SDKs: `trackmcp-nextjs/packages/typescript-sdk/`,
  `packages/python-sdk/`, and `trackmcp-nextjs/packages/cli/`.
- Dashboard: `trackmcp-nextjs/src/components/dashboard/`.
- Privacy controls: `trackmcp-nextjs/src/app/api/v1/account/export/`,
  `trackmcp-nextjs/src/app/api/v1/account/privacy-request/`, and
  `docs/FOUNDER-OS-PRIVACY-REQUESTS.md`.
- Shared API contract: `trackmcp-nextjs/src/lib/api/v2-envelope.ts`.
- Catalog snapshots: `trackmcp-nextjs/src/lib/telemetry/catalog-snapshots.ts`
  and its review-only migration/postflight pair.
- CI/release: `.github/workflows/ci.yml`,
  `trackmcp-nextjs/scripts/release-gate.mjs`,
  `trackmcp-nextjs/scripts/release-hygiene.test.mjs`.

## Prioritized next-work plan

## Latest local verification (2026-10-19)

Continuation evidence (same local, uncommitted checkout): the privacy export
projection now allowlists nested facts, action evidence, catalog diffs, and
catalog hashes. A synthetic disposable-workspace review passed 6/6 projection
checks, and the complete privacy-export suite passed 14/14. The dashboard
mobile shell now wraps narrow-screen header controls and bounds the workspace
selector; the mobile layout contract passed 4/4. Local route smoke returned
HTTP 200 for `/`, `/docs`, `/device?user_code=ABCD-2345`, and `/dashboard`.
The full release gate now passes 101 suites, TypeScript passes, and `git diff --check`
passes for the reviewed paths. The read-only release-scope audit now
classifies every current worktree path and strict mode fails closed on review
or local-artifact paths. These checks remain local evidence and
do not replace browser viewport screenshots, production postflights, or a
deployed-candidate verification.

The worker operations contract now adds bounded backlog, oldest-queued-lag,
dead-letter, and terminal-success-rate findings with explicit warning/critical
thresholds and an `insufficient_data` state. Its six focused tests and the full
101-suite release gate pass. This is a local evaluator and dashboard contract;
it does not claim live scheduler, alert-delivery, or production lag evidence.

The Python wheel and source distribution currently present under
`packages/python-sdk/dist/` also pass archive-level hygiene checks: runtime
modules and metadata are present, while credentials, private files, generated
caches, and secret-like assignments are absent. This is artifact evidence from
the local checkout only; it does not prove registry publication or provenance.

The dependency/license contract also passes: all direct web production
dependencies have lockfile license metadata, and the TypeScript, CLI, and
Python package manifests retain explicit MIT licensing and repository
attribution. This is engineering metadata evidence, not a substitute for a
legal review of transitive notices or registry publication obligations.

The candidate ownership map now assigns every path currently classified as
intended release scope to a primary feature bucket and required reviewer. The
ownership contract fails closed when a new intended path is not mapped; the
current report passes with no unmapped intended paths.

Rollback preparation is now explicit in `FOUNDER-OS-ROLLBACK-PLAN.md`. Its
contract test passes 2/2 and requires immutable commit/image evidence plus
additive-schema compatibility before a rollback can be approved. It does not
claim that a production rollback image exists or that rollback has been
rehearsed.

Gate records now use `FOUNDER-OS-EVIDENCE-RECORD.md`. Its contract test passes
2/2 and requires an accountable owner, UTC timestamp, exact command or probe,
environment, candidate SHA, result, redacted evidence reference, and a scope
caveat. Existing historical evidence is not silently rewritten.

Out-of-scope paths now have an explicit ledger in
`FOUNDER-OS-REVIEW-BOUNDARY.md`; its contract passes 2/2 and requires owner,
reviewer, and disposition for every current review-required path. This keeps
the instruction-only `AGENTS.md` edit outside the product candidate.

The manifest-to-candidate reconciliation contract also passes 2/2. It checks
that application, content, and excluded scope classes are declared and that
the path-level ownership and review ledgers are the authoritative reconciliation
for the current classifier output.

An isolated temporary candidate copy was also checked with strict release-scope
mode after restoring the baseline instruction file. It reported 378 intended
paths, zero review-required paths, and zero excluded artifacts. This proves the
scope classifier can pass outside the mixed checkout; it is not a Git commit,
reviewed branch, merge, or deployment.

The scope-aware secret audit scans all currently intended paths (376 in the
latest mixed-checkout report), including bearer tokens, API keys, device codes,
user codes, and redemption IDs. It reports zero
unexpected credential-shaped values; synthetic bearer/API-key fixtures remain
visible only in test/example/deployment contexts and are reported separately.

Release instructions are also covered by a fail-closed immutability contract:
operator-facing code lines cannot introduce floating branch pulls, `latest`
package/image references, or unpinned package instructions. User-facing
installation commands remain intentionally unpinned; reproducible release
artifacts must use the selected immutable package version recorded by the
release owner.

The local checkout now includes the bounded catalog-history dashboard surface.
The Capabilities view renders workspace-scoped snapshot timestamps, item counts,
completeness, and hash-only diff evidence. It explicitly distinguishes
`schema_unavailable` from `no_snapshot_rows`; it never renders catalog names,
URIs, or payloads from snapshot storage.

The Setup view also distinguishes waiting for a first event, first-event
verified, limited/bounded coverage, and unresolved identity. These states are
derived from API evidence and data-trust fields; they do not claim a unique
person, organization, or complete telemetry history.

The Protocol surfaces dashboard cards now disclose durable entity-read coverage
for resources and prompts: total reads, successful/failed reads, reads that
require input, and whether the projection is available, empty, or schema
unavailable. This keeps the new entity projection visible without implying
that a hashed identifier is a human-readable resource or prompt identity.

The catalog snapshot refresh boundary was also tightened: the worker now
upserts on `(workspace_id, server_id, environment_id, catalog_kind,
snapshot_hash)`, and a review-only migration replaces the legacy global
snapshot index with that workspace-scoped identity. Until that migration is
postflighted, catalog refresh remains a release dependency and must not be
treated as tenant-isolation evidence.

Setup now also exposes a bounded, secret-free account export and a
non-destructive deletion-review request. The latter records an idempotent
request for operator review; it does not delete data from the browser.

Evidence after this change:

- Refresh-worker observability is now exposed through the authenticated analytics
  response and dashboard Data Trust panel: bounded queue state counts, maximum
  queue lag, maximum attempt count, and last successful run. Schema/query
  failures fail closed to an explicit unavailable state; no payloads or secrets
  are returned.
- Refresh batches now emit bounded `max_queue_lag_ms`, `max_attempt_count`, and
  `observed_at` metrics for operators and future job-run telemetry.
- `npm run test:release-gate`: 76 suites passed, including the versioned setup state contract, ingest replay, protocol-semantic signals, dashboard contract, the stable browser-approval lifecycle contract, privacy-review boundary, public request-boundary checks, package consumers, security headers, worker-health postflight, public-claim truth, Python/OTel documentation boundaries, and manual SQL safety.
- Python SDK parity tests: 19 passed, including hash-only `resources/read` and
  `prompts/get` observations with raw identifiers and returned content absent,
  bounded middleware/wrapper initialize/shutdown session boundaries, and
  explicit transport metadata validation.
- `npm run build -- --webpack`: passed; 166 static pages generated.
- Isolated production smoke: passed; 8 public routes and 10 protected/API checks.
- Isolated `NEXT_DIST_DIR=.next-founder-os-privacyqa npm run build`: passed; 166
  pages generated and the sitemap plus privacy-review routes collected successfully.
- Dashboard contract and catalog route integration tests passed.
- Reliability route contract and integration tests passed, including a bounded
  baseline/comparison calculation and a sparse-volume `insufficient_data` case.
- Outcomes route integration passed with explicit shared workflow facts taking
  precedence over generic activity or session heuristics; unresolved facts and
  evidence quality remain visible in the response.
- Journeys route integration passed with explicit workflow-terminal counts and
  an unresolved bucket; heuristic or idle sessions are not counted as
  abandonment or completion.
- Setup health contract tests passed for all four evidence states.
- A two-workspace catalog-history isolation fixture passed; tenant B's
  snapshot and hash never appeared in tenant A's response.
- Privacy controls contract tests passed for export and deletion-review
  request behavior.
- Protocol fixture coverage now passes for resources, prompts, completions,
  sampling, elicitation, notifications, subscriptions, and transport-lifecycle
  semantics; persistence and dashboard entity coverage remain explicitly
  marked partial/deferred in the protocol matrix.

The web dependency audit was also remediated locally: Next.js is pinned to
16.4.2, the MCP SDK to 1.32.1, and the production dependency audit reports
zero vulnerabilities. The full development audit still reports five high
findings in the upstream ESLint globbing chain; npm's proposed fix would
downgrade `eslint-config-next` to 14.2.35 and was deliberately rejected. CI
now blocks high-severity findings in production dependencies with
`npm audit --omit=dev --audit-level=high`.

The read-only final schema check now covers the full Founder OS index family,
including catalog scope, refresh leases, semantic-fact dimensions, action-queue
snoozing, device-session expiry, milestone first-event, and privacy review
indexes. It remains a diagnostic query only; it does not repair or mutate
production.

The privacy boundary was extended in the latest local cycle. Account exports
now include a bounded `catalog_entity_reads` section containing only event IDs,
server/environment labels, the allowed catalog kind, a validated one-way entity
hash, timestamps, and result flags. The export never includes raw resource URIs,
prompt names, arguments, returned content, or payloads. The privacy deletion
dataset plan also includes the entity-read table so the future asynchronous
deletion worker cannot silently omit it. The new privacy projection tests and
the complete release gate pass locally; the entity-read table itself remains
review-only until its migration and postflight are applied in production.

This remains local and uncommitted. It is not evidence that production has the
catalog snapshot migrations, worker trigger, or current deployed frontend.

### P0 — make the local release reviewable

1. Freeze the intended release scope into separate buckets: semantic/ingest,
   schema, API/dashboard, SDK/CLI, and website/content.
2. Remove or isolate unrelated local files; never stage the whole worktree.
3. Run the full release gate, TypeScript SDK build/tests, CLI packed consumer,
   Python tests, lint, sequential production build, and hygiene check from a
   clean isolated checkout.
4. Produce one PR containing only the reviewed bucket(s), with migration impact,
   privacy review, rollback plan, and exact tests.

### P0 — schema and runtime safety

1. Confirm migrations `00002`–`00004` with read-only postflights.
2. Review and apply `00005_catalog_observation_contract.sql` manually if it is
   still absent; run its postflight. Do not enable catalog-dependent writes
   before this check.
3. Keep `TRACKMCP_ENABLE_FACT_WRITES` disabled until the read-model tables and
   indexes are verified; then enable deliberately and monitor failures/lag.
4. Add a production-shaped ingest smoke test that proves no raw secret or
   payload is persisted.
5. Keep `20261018000006_founder_os_refresh_jobs.sql` and
   `20261018000010_refresh_job_worker_rpc.sql` review-only until the production
   postflight is recorded. The local worker owner, lease timeout, secret route,
   bounded batch deadline, and five-minute workflow are implemented, but
   production secrets, alerting, and a live run still need evidence.

### P1 — finish the semantic MVP

1. Apply and validate the catalog snapshot/version migrations, then add
   deterministic previous-version diff joins; worker writes and a bounded
   workspace-scoped API projection are now implemented locally.
2. Add protocol fixtures for resources, prompts, completions, elicitation,
   sampling, subscriptions, notifications, pagination, and transport exits.
3. Validate the shared response envelope against production-shaped responses;
   the helper and route integration are now implemented locally.
4. Complete production wiring and operational evidence for the worker/scheduler
   around fact refresh, action evaluation, retention, and dead-letter/replay
   operations. Catalog and retention handlers remain deliberately fail-closed.
5. Add baseline/insufficient-data logic to reliability and outcome comparisons.

### P1 — make the product usable and truthful

1. Complete Founder OS dashboard navigation and evidence drill-downs.
2. Build setup health states: waiting for events, limited coverage, identity
   unresolved, and first-event verified.
3. Add authenticated export/delete controls and audit events.
4. Publish docs that describe exact coverage by runtime, transport, and
   capability; clearly label limited proxy/OTel paths.

### P2 — interoperability and scale

1. Define and test OTel semantic field preservation.
2. Add proxy/stdio fallback only with explicit limited-coverage labels.
3. Introduce a durable queue/stream when measured volume justifies it; retain
   Postgres modular-monolith operation until then.
4. Add multi-server correlation only where the customer supplies a shared
   trace/task handle.
5. Add enterprise retention, regional controls, SSO, audit, and customer-managed
   keys only after demand and threat-model review.

## Release acceptance checklist

### Latest local evidence

- CLI device lifecycle fixture: 21/21 package tests passed, including start,
  browser approval, polling, redemption, and replay behavior.
- Web release gate: 76 suites passed on the latest rerun, including the versioned setup state contract, ingest replay, protocol-semantic signals, dashboard contract, the privacy-review boundary, cross-route v2 provenance, package publication contracts, public-claim truth, and manual SQL safety.
  envelope and CLI redemption-reconciliation contracts.
- Ingest replay integration now proves the same `(workspace_id,event_id)` is
  accepted once and reported as an ignored duplicate on replay; the database
  uniqueness boundary remains the race-safe production guard.
- Workspace selection and alert authorization: all local contract tests pass;
  browser requests now carry and validate an explicit workspace scope.
- Refresh worker concurrency: lease-owner/lease-expiry fencing and stale-worker
  regression tests pass; production scheduler and live lag evidence remain
  separate release gates.
- Privacy operations: the preview-only deletion worker now rehearses bounded,
  resumable, workspace-scoped batches and records audit results without any
  delete capability; destructive execution remains intentionally disabled.
- Privacy export coverage: the account export contract now includes the
  hash-only `catalog_entity_reads` projection, and the deletion dataset plan
  includes the same dataset. Privacy export, deletion-plan, tenant-isolation,
  and full release-gate tests pass; this is local evidence only until the
  catalog entity-read migration is applied and postflighted.
- Rate limiting: an opt-in service-role Supabase atomic-bucket provider and
  read-only postflight now exist; default behavior remains memory-degraded until
  the migration is applied and `TRACKMCP_RATE_LIMIT_MODE=supabase` is enabled.
  The migration also includes a bounded service-role-only cleanup RPC so bucket
  storage does not grow without limit.
- TypeScript check: passed.
- Local production-shaped runtime smoke: 8 public routes and 10 protected/API
  checks passed against the isolated 166-page build on port 3200. The existing
  development server on port 3000 was not restarted and is not release evidence.
- Isolated production build: passed with `NEXT_DIST_DIR=.next-founder-os-privacyqa npm
  run build -- --webpack`; 166 static pages were generated and all API route
  modules were collected. The output was moved out of the worktree after the
  check, and the normal `.next` development preview remained running.
- Latest isolated production build recheck: passed with
  `NEXT_DIST_DIR=.next-founder-os-finalqa npm run build -- --webpack`; 166/166
  static pages generated, followed by a clean TypeScript check and diff check.
  The temporary build output was not treated as a release artifact.
- Package consumer gate: passed for the TypeScript SDK, CLI, and Python SDK;
  clean packed consumers and the package-release audit passed. The audit is
  local evidence only; registry publication and immutable-version verification
  remain release-owner gates.
- Latest lint run: passed with no new findings. Production-shaped external
  smoke, package publication, and deployment evidence remain intentionally
  unclaimed.
- Isolated runtime smoke recheck: the built artifact served on port 3201
  passed all 8 public-route and 10 protected/API checks. The pre-existing
  development server on port 3000 returned HTTP 500 and was not used as
  release evidence; it was left untouched.
- The 120-request local fixture load harness passed with zero errors and no
  tenant-isolation failures. An authenticated production-shaped load run still
  requires an approved test workspace/key and is therefore not claimed here.
- Protocol and interoperability checks re-ran successfully: the protocol
  matrix, JSON-only OTLP/HTTP receiver contracts, metadata-only span mapping,
  and worker-health postflight tests all passed. This confirms the documented
  limited OTel boundary; it does not expand support to OTLP protobuf/gRPC.
- The complete production audit was tightened to include the catalog
  entity-read table, its hash-only integrity check, browser privilege check,
  canonical scope/hash indexes, workspace-scoped snapshot uniqueness index,
  and row-count snapshot. A new
  read-only contract test guards against future audit omissions in both the
  complete and compact audit files; all three audit contract tests and the
  complete postflight suite pass.
- The shorter `founder-os-production-audit.sql` was updated with the same
  entity-read table, canonical indexes, required columns, RLS check, and
  integrity count so operators do not get contradictory results depending on
  which reviewed audit file they choose.
- Both audit files now scope their PostgreSQL catalog privilege checks to the
  `public` schema explicitly, preventing same-named objects in another schema
  from contaminating the result. The three audit contract tests cover this
  schema boundary.
- The compact audit also now checks the entity projection's `created_at`
  column, matching the reviewed migration exactly; the audit contract remains
  green.
- Entity-read integrity checks now explicitly treat null hashes, null catalog
  kinds, and null source-event links as invalid instead of relying on SQL
  three-valued logic to surface them.
- Both audit files now explicitly instruct operators to stop after the table
  presence result if required relations are missing; later integrity queries
  intentionally read those relations directly and should not be mistaken for
  a portable missing-schema check.
- A repository-level manual SQL safety suite now scans the reviewed audit and
  postflight family for top-level write statements while excluding explicitly
  named repair files. All 24 reviewed SQL files pass this check.
- Deployment configuration now explicitly carries `TRACKMCP_TRUST_PROXY`,
  defaulting to `false`, alongside the distributed rate-limit mode. This keeps
  client-address bucketing safe unless the App Runner edge is verified to
  rewrite forwarding headers; deployment contract tests cover the template
  and runtime wiring. The deploy preflight now rejects any value other than
  the explicit `true`/`false` forms.
- The deployment template now defaults `TRACKMCP_ENABLE_FACT_WRITES` to
  `false`, matching the documented migration/postflight gate. Operators must
  opt in deliberately after schema verification rather than enabling durable
  derived writes by copying the template.
- Rate-limit tests now cover trusted edge-address precedence, forwarded-header
  chains, and ambiguous proxy values; the full release gate remains at 75
  suites.
- A versioned read-only `GET /api/v2/setup` contract now exposes the
  workspace-scoped setup state, first-event checks, bounded observation
  metadata, truthful no-event caveats, bounded state-specific next steps, and
  capped first-event freshness without returning keys or payloads. Its identity
  check is tri-state (`true` resolver, `false` explicit unresolved, `null`
  legacy unknown); the
  dashboard renders those steps and freshness note, and its contract is
  included in the 76-suite release gate.
- The v2 Action Queue projection now requests an optional, workspace-scoped
  `linked_alerts` relationship using the hash-only alert link. Missing or
  unpostflighted link schema degrades to an empty relationship without
  breaking queue reads; contract coverage includes this fallback and secret
  exclusion.
- The App Runner deployment README now documents the `TRACKMCP_TRUST_PROXY`
  edge-verification requirement and its strict boolean preflight behavior.
- The local audit and release-manifest records were refreshed to the current
  2026-10-19 state: Founder OS dashboard navigation is implemented locally,
  catalog entity-read coverage is included in the intended scope, and the
  release gate is 76 suites rather than the stale 69-suite count.
- The 100-customer pilot runbook and current local verification record were
  refreshed to the verified 100-suite/166-page baseline. Historical smoke
  records retain their original environment-specific counts rather than being
  relabeled as the current candidate.
- v2 Action Queue provenance: the envelope now reports the bounded returned
  row count without inventing an event freshness watermark; its caveat makes
  the distinction explicit.

Before calling this programme release-ready, the release owner must record:

- [ ] Exact commit/PR and file scope.
- [ ] Migration list, operator, timestamp, and read-only postflight results.
- [ ] Feature-flag values and rollback behavior.
- [ ] Clean CI run and production build.
- [ ] SDK/CLI/Python packed-consumer verification.
- [ ] Cross-tenant authorization and secret-leak checks.
- [ ] Dashboard metrics with scope, denominator, freshness, evidence, and caveat.
- [ ] Setup → first accepted event smoke test.
- [ ] Export/delete behavior or an explicitly documented launch exclusion.
- [ ] Release notes/docs/content scope reviewed separately.
- [ ] Deployed commit and post-deploy smoke-test URLs recorded.

Until these boxes are recorded, the honest status is “Founder OS foundation in
local review,” not “the complete Founder OS is live.”

