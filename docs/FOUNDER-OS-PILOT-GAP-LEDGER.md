# Founder OS pilot gap ledger

Status: active autonomous audit, started 2026-10-21.

## 2026-10-27 — separate AWS cadence evidence from worker-run cadence

- The refresh-health report now exposes `aws_scheduler_cadence_gate` in
  addition to the stricter `scheduled_cadence_gate`. The former is proven only
  when the enabled AWS Lambda metrics window contains at least three
  invocations and zero errors; the latter still requires three observed
  scheduled worker summaries.
- This closes the previous reporting ambiguity without treating CloudWatch
  invocation metrics as authenticated response-content or end-to-end business
  UAT evidence. Regression coverage and the workflow summary contract pass.
- Health run `40446554951` retained artifact `12708936081` and reports the AWS
  cadence gate as `proven` (3 invocations, 0 errors); the stricter worker-run
  gate remains pending at 0/3.

## 2026-10-27 — refresh-worker recovery clears current backlog

- Explicit recovery run `40446099143` completed successfully with ten bounded
  batches, zero failures/retries/timeouts, and `max_queue_lag_ms: 0`; redacted
  artifact `12707938220` records `freshness_slo: no_backlog_observed`.
- This is not treated as scheduled-cadence proof: it was a manual
  `workflow_dispatch`, so the AWS EventBridge 0/3 cadence gate remains open.

## 2026-10-27 — scheduler enabled and cadence evidence refreshed

- Enablement workflow `40445610213` succeeded with the existing non-secret
  Secrets Manager ARN reference; scheduler artifact `12708211784` contains
  only stack/resource metadata, Lambda metrics, and log-stream metadata.
- Follow-up health workflow `40445804232` retained `12708665678`: AWS scheduler
  evidence is enabled with four invocations and zero errors, but the pilot
  `scheduled_cadence_gate` remains `pending` at 0/3 scheduled worker samples.
  This strengthens external evidence without changing the HOLD decision.

## 2026-10-27 — scheduler health versus pilot cadence boundary

- Added `scheduled_cadence_gate` to the redacted refresh-health report. AWS
  scheduler metrics may establish operational health, but the pilot cadence
  gate remains `pending` until three actual scheduled worker samples are
  observed. The workflow summary now prints both statuses separately.
- Added regression coverage for pending AWS-metrics-only evidence and proven
  scheduled-run evidence. Full release gate, lint, and the 177-route build pass
  on `170807a`; this clarifies the open gate without falsely closing it.

## 2026-10-27 — scheduler IAM and secret-resolution boundary

- The AWS console change requested by the operator was applied successfully:
  inline policy `TrackMCPRefreshSchedulerDeploy` now allows only
  `lambda:InvokeFunction` on the deployed refresh-scheduler function ARN
  (no wildcard invocation permission). AWS confirmed the policy update.
- The subsequent disabled-first dispatches reached the real Lambda invocation
  boundary, proving the IAM fix. The workflow was corrected to invoke by ARN
  while deriving the function name for `/aws/lambda/<name>` log metadata, and
  to report non-secret invocation failures deterministically.
- Runs `40430683487` through `40431733945` remain fail-closed because the
  Lambda response is `Error: refresh worker is not configured`. The existing
  replicated secret ARN is known and was supplied without reading its value;
  the Lambda environment contains the token key but the Secrets Manager
  dynamic reference is resolving empty at runtime. Added a non-secret
  deployment nonce (`SecretRefreshNonce`) so explicit deployments re-evaluate
  the reference; the latest run still reproduced the empty resolution.
- No authenticated refresh request, CloudWatch log-stream evidence, or DLQ
  depth evidence exists yet. The EventBridge schedule remains disabled. This
  is an external configuration/provider boundary, not a first-100 GO signal.
- The post-change local release gate passed all 139 suites (`release_gate_rc=0`);
  the hosted failure is therefore isolated to the deployed secret resolution,
  not an unverified local regression.

> Reconciliation note: this initial scheduler subsection records the earlier
> disabled-first failures. It is superseded by the later entries dated
> 2026-10-27: the dedicated secret mapping, IAM permissions, enabled schedule,
> successful authenticated smoke, and AWS cadence evidence are now verified.

## 2026-10-27 — scheduler smoke IAM-read fix

- The first disabled-first authenticated scheduler dispatch (`40429342755`)
  successfully updated the stack but failed before invoking Lambda because the
  workflow used singular `cloudformation:DescribeStackResource`, while the
  deploy role only permits the plural `DescribeStackResources` action.
- Changed the status-only evidence step to use the permitted plural API and
  select the named function/DLQ resources. No secret, log event, request body,
  or response content is read or retained. Added the workflow to the release
  ownership map so the strict audit remains fail-closed and deterministic.
- Focused scheduler workflow tests pass 6/6; handler tests pass 3/3; the full
  release gate passes 139 suites; lint and the production build pass. This is
  a workflow-read fix only: the authenticated production invocation, DLQ/log
  evidence, enabled schedule, and three scheduled samples remain open gates.
- The follow-up dispatch (`40429899603`) showed that the stack's resource-list
  query can return `null` under the deployed role, so the smoke now resolves
  the function ARN and DLQ URL from the stack's already-published outputs and
  reports all resource metadata without a restrictive JMESPath filter. That
  run failed closed before invocation with function `None`; it did not execute
  a refresh request or enable the schedule. The corrected workflow is covered
  by the 6/6 focused suite and 139-suite release gate and is queued for the
  next disabled-first dispatch.

## 2026-10-27 — authenticated production scope smoke

- The post-deployment workflow `40429116070` completed successfully against
  immutable commit `5e26564ad446f11f712de66cf0594a0b803a7d70`. Its redacted
  artifact `production-auth-smoke-5e26564ad446f11f712de66cf0594a0b803a7d70`
  passed the read-only key-status, conflicting-workspace, Founder OS v2,
  legacy analytics, API-key Action Queue denial, revoked-key, and privacy-key
  checks. No key creation, rotation, revocation, ingest, or dashboard mutation
  was performed.
- This refreshes tenant-isolation/authentication evidence for the deployed
  candidate; it does not close the separate key-lifecycle, backup/PITR,
  scheduler-cadence, privacy-acceptance, or release-owner gates.

## 2026-10-27 — handler-test deployment evidence

- App Runner deployment workflow `40428391413` completed successfully for
  commit `5e26564ad446f11f712de66cf0594a0b803a7d70`. The workflow completed
  immutable image verification, rollout readiness, and the read-only
  production smoke. This confirms the handler-test change is deployed; it does
  not imply that the scheduler is enabled or that authenticated refresh cadence
  evidence exists.

## 2026-10-27 — scheduler handler contract coverage

- Added direct tests for the refresh-scheduler Lambda: bounded authenticated
  POST shape and `max_jobs` limit, fail-closed missing configuration, upstream
  status classification, abort-signal propagation, and the rule that response
  content is never read. The test is now included automatically in the release
  gate (`139` suites).
- Added the test path to the review-boundary ledger. Focused handler tests,
  full release gate, lint, and production build all pass. This improves local
  confidence but does not claim an authenticated production invocation or
  recurring scheduler freshness evidence.

## 2026-10-27 — disabled-first authenticated scheduler smoke path

- Extended the manual scheduler workflow with an explicit
  `run_authenticated_smoke` input, defaulting to `false` and refusing to run
  unless `enable_schedule=false`. When selected, it invokes the deployed
  Lambda once and retains only the status code, log-stream metadata, and DLQ
  depth; it never reads the secret, fetches log events, or stores raw payloads.
- Added contract coverage and operator documentation for this path. The
  focused scheduler workflow suite passes 6/6; the full release gate passes
  138 suites; lint and the Next.js production build pass. The smoke has not
  been invoked against production, so the authenticated Lambda/log/DLQ gate
  remains open and the recurring schedule remains disabled.

## 2026-10-27 — production route and release-gate recheck

- Re-ran the credential-free production pilot smoke against `https://trackmcp.com`.
  It passed all 36 bounded checks, including public documentation routes,
  security headers, sitemap/tool-sitemap reachability, public claim boundaries,
  registry metadata, and unauthenticated protection of the analytics, ingest,
  OTLP, device, refresh, rate-limit, and privacy-review endpoints. The redacted
  report is retained locally at `/tmp/trackmcp-pilot-smoke-20261027.json` and
  contains no credentials or response bodies.
- Re-ran the full local release gate after the latest deployment; all 138
  suites passed, including accessibility, docs navigation/version contracts,
  tenant isolation, OTLP JSON/protobuf, transport observer, modern MCP fixture,
  package consumers, and worker/scheduler contracts. This strengthens recurring
  validation but does not close the external scheduler, backup/PITR, privacy,
  pilot-scope, or release-owner gates.

## 2026-10-27 — latest hosted deployment verification

- App Runner deployment run `40426236860` completed successfully for the
  scheduler endpoint smoke change (`0c36da1`). GitHub reported the deploy job
  successful, and the AWS console showed `trackmcp-web` Running with the new
  deployment succeeded. This confirms the release path remains healthy; it
  does not close the disabled scheduler, privacy, backup/PITR, or release-owner
  acceptance gates.

## 2026-10-27 — scheduler resource evidence hardening

- The manual scheduler workflow now reports CloudFormation outputs and the
  non-secret states of the Lambda, schedule, DLQ, and both CloudWatch alarms.
  The SAM template exposes only resource identifiers and names; it does not
  expose the worker token or secret bundle. The workflow contract and full
  release gate (137 suites) pass, and the change is pushed on main as
  `ae2128c`.
- This improves the evidence path but does not claim an enabled schedule or
  successful endpoint invocation. The external scheduler gate remains open
  until those checks and three fresh samples are retained.

## 2026-10-27 — refresh scheduler operator evidence

- Expanded `workers/refresh-scheduler/README.md` with a secret-safe operator
  sequence: manual Lambda invocation, CloudWatch log inspection, generated
  schedule lookup, alarm inspection, DLQ depth, and controlled stack removal.
  The instructions explicitly require 401 checks for unauthenticated and bad
  bearer requests and keep the recurring schedule disabled until acceptance.
- Added documentation-contract coverage to the alert worker suite. The worker
  suite passes 8/8 and the full local release gate passes 137 suites.

## 2026-10-27 — scheduler evidence artifact retention

- The manual scheduler workflow now writes its non-secret CloudFormation
  outputs and resource states to JSON files and uploads a 14-day GitHub Actions
  artifact. This preserves evidence beyond transient log retention while
  excluding token values and response bodies. The scheduler contract and full
  137-suite release gate pass; hosted deployment remains pending for this
  change.

## 2026-10-27 — hosted deployment evidence

- App Runner deployment run `40424325288` completed successfully for
  `18519fe`. The provider console showed the service `Running`; the workflow
  completed the read-only production smoke, immutable release-identity check,
  runtime-safety audit, and redacted evidence uploads. This closes hosted
  deployment evidence for the scheduler-observability change, but does not
  close the separate recurring-scheduler or release-owner gates.
- Authenticated production smoke run `40425382400` for the same deployed
  candidate completed successfully. The smoke result is retained as hosted
  evidence; it does not imply that the recurring refresh schedule is enabled
  or that first-100 release approval has been granted.

## 2026-10-27 — repeatable scheduler endpoint boundary smoke

- Added `scripts/refresh-scheduler-endpoint-smoke.mjs`, a terminal-safe smoke
  harness that accepts only an HTTPS refresh URL, sends unauthenticated and
  deliberately invalid-token probes, enforces a 10-second timeout, and prints
  only status metadata. It never reads the worker secret. The contract is now
  included in the full release gate, which passes 138 suites.
- This makes the recorded production 401 evidence reproducible; it does not
  substitute for authenticated Lambda/log/DLQ checks or recurring samples.

## 2026-10-27 — modern request metadata and browser-tester parity

- The published TypeScript modern client (`@trackmcp/sdk@0.1.19`) now adds
  bounded `io.modelcontextprotocol/clientInfo` and
  `io.modelcontextprotocol/clientCapabilities` metadata to ordinary requests
  and stream subscriptions, while preserving caller-supplied task capability
  metadata. The client identity is bounded and defaults to the SDK package
  name/version; no credentials, URLs, prompts, arguments, or result content
  are retained.
- The browser MCP tester now applies the same bounded metadata to modern
  `server/discover` and subsequent requests. Contract coverage is 26/26 MCP
  tester tests; the TypeScript SDK suite is 100/100; the full local release
  gate is 137 suites; lint and the Next.js production build (177 pages) pass.
- Protocol matrix language now records this parity, while keeping the modern
  revision status `Partial` until server cache behavior, stream close/reconnect,
  MRTR, and Tasks interoperability are exercised against an authenticated
  production fixture. This is an explicit boundary, not a compatibility claim.
- Mainline commit `b3ac136` is pushed to `origin/main`. The corresponding
  hosted CI run `40416521863` is currently pending; App Runner/Vercel hosted
  checks remain external evidence and are not treated as locally verified.

## 2026-10-27 — transport observer documentation discoverability

- Added a first-class `Transport observer` destination to both desktop and
  compact documentation navigation. It targets the existing TypeScript
  `#transport-observer` section, where the official Stdio, Streamable HTTP, and
  SSE boundaries are documented.
- Added a route/anchor contract so navigation cannot point at a missing page or
  orphaned section. Documentation navigation is now 8/8; lint and the full
  local release gate are green across 137 suites.
- PR #607 was merged to `main` as commit `9acd152`. Hosted deployment remains
  an external check and is not claimed from local evidence alone.

## 2026-10-27 — real modern-protocol fixture coverage

- Added a real local HTTP Streamable MCP fixture to the TypeScript SDK suite.
  It exercises `server/discover`, bounded `tools/list` cache hints, per-request
  client capability metadata, and a real `subscriptions/listen` SSE stream.
  The fixture asserts that subscription identifiers and private values never
  appear in the returned projection.
- SDK tests now pass 102/102; the repository lint and full release gate pass
  (137 suites). This closes the local interoperability-fixture gap while the
  authenticated production stream/interoperability gate remains explicitly
  open.
- PR #608 was merged to `main` as commit `a9b1126`.

This ledger separates implemented behavior from documented boundaries. A
registry package, protocol capability, or OAuth flow is not treated as shipped
just because a README or marketing page mentions it.

| Surface | Current evidence | Status | Next proof |
| --- | --- | --- | --- |
| TypeScript server SDK | `packages/typescript-sdk`, consumer gate, published `0.1.19`; source fails closed for removed `tasks/list` and retains explicit-handle `tasks/get` observation without task mutation | Published and registry-verified by workflow `40271909727`; npm integrity recorded in `FOUNDER-OS-PACKAGE-RELEASE-READINESS.md` | Authenticated activation/first-event evidence remains a separate pilot gate |
| Python server SDK | `packages/python-sdk`, package consumer gate, published `0.1.12` | Published and registry-verified by workflow `40271909727`; wheel/sdist digests recorded in `FOUNDER-OS-PACKAGE-RELEASE-READINESS.md` | Authenticated activation/first-event evidence remains a separate pilot gate |
| Transport observer / Node client adapter | `@trackmcp/sdk/client-adapter`; Node-only wrapper for Stdio and Streamable HTTP; metadata-only and fail-open; bounded capability-family metadata, lifecycle generations for reconnect correlation, and dedicated adapter tests | Implemented and merged through PRs #173–#175 | Hosted cross-language compile evidence and authenticated transport UAT |
| Go SDK | `packages/go-sdk/trackmcp.go`; transport-neutral primitive, source package only | Implemented with source-only distribution boundary | Publish only after package provenance/release work is approved |
| .NET SDK | `packages/dotnet-sdk/TrackMcp.cs`; transport-neutral primitive, source package only | Implemented with source-only distribution boundary | Publish only after NuGet/provenance work is approved |
| OTLP/HTTP JSON or protobuf | Authenticated bounded receiver at `/api/v1/otel/v1/traces`; JSON/protobuf parsers and interoperability tests; the deployed candidate has a write-enabled protobuf UAT with a mapped event and redacted evidence | Implemented as metadata-only and production-UAT verified for the deployed candidate; gRPC intentionally unsupported | Keep the JSON/protobuf fixture in the recurring release gate; do not market OTLP/gRPC or external export |
| MCP OAuth | TrackMCP does not issue, exchange, or parse customer OAuth credentials | Explicitly unsupported by design | Customer-owned OAuth integration must emit explicit bounded outcomes |
| Dashboard/session auth | Workspace membership, connection-key scope, revocation, tenant-isolation contracts | Implemented | Repeat production smoke after releases |
| Setup density | Secondary privacy/data-flow and export/deletion explanations moved behind accessible disclosures; primary setup actions remain visible | Implemented in current change | Live browser audit after deployment |
| Public docs parity | Added Go, .NET, Authentication/OAuth, and clearly named Transport Observer documentation paths | Implemented in current change | Check links, snippets, and package-version claims in CI |
| Node client protocol observer | Client adapter now emits bounded request/response/notification observations for every identified non-tool MCP request, including catalog counts, task/MRTR result discriminators, list-changed/progress signals, modern protocol-family labels, and reconnect lifecycle generations; arguments, URIs, prompt names, and result bodies remain excluded | Implemented and merged through PRs #173–#175 with 42 SDK tests passing; authenticated analytics now exposes bounded protocol-family counts through PR #177; a production-like TypeScript SDK fixture completed against the deployed App Runner ingest origin and Supabase read-back verified `initialize`, `notifications/initialized`, and `tools/call` (`pilot_probe`) rows under the scoped production service | Keep the fixture in recurring release validation; broader transport and package-publication coverage remains pending |
| Modern cache and subscription metadata | TypeScript client adapter emits bounded `next_cursor_present`, `cache_ttl_ms`, `cache_scope`, `subscriptions/listen` request/acknowledgement markers, and list-change/progress/cancellation signal metadata; the modern client exposes bounded task/catalog/resource subscription listeners and metadata-only `callTool` task-result recognition without retaining cursor, raw URI, tool result, or subscription values | Implemented and shipped in the published `@trackmcp/sdk@0.1.19`; real local Streamable HTTP discovery/catalog/subscription fixture merged in PR #608; authenticated production stream interoperability remains open | Preserve the fixture in recurring release validation; complete authenticated production stream UAT and keep the no-replay/no-durable-subscription boundary |
| Refresh and task transition projection | Accepted ingest now enqueues bounded refresh work by default; explicit task transition history is persisted by the service-role worker by default, with explicit `false` rollback flags; the bounded projection now selects `task_id` and `payload` required to derive hashed transitions; the TypeScript server wrapper records hashed task handles and explicit lifecycle state for `tasks/get`, `tasks/update`, and `tasks/cancel` | Implemented and production-verified for a non-empty worker batch; SDK lifecycle/privacy regression is merged in PR #170 with the full release gate green | Keep the worker and ingest smoke fixtures in recurring release validation; complete capability-negotiation and cross-server workflow fixtures |
| Transport disconnect evidence | Node client adapter now drains in-flight tool and non-tool requests on transport error/close into bounded `transport_error` observations before ending the session; real official Stdio child-exit and Streamable HTTP socket-disconnect fixtures now pass | Implemented locally with regression coverage | Hosted cross-language compile evidence and authenticated production disconnect UAT |
| Connection-key scope | API keys can carry optional bounded service/environment scopes; ingest rejects mismatched labels with a tenant-safe 403 while legacy NULL-scoped keys remain workspace-wide | Implemented and deployed; migration applied, read-only postflight added, release-gate/tenant-isolation coverage passed; production postflight observed 49 active workspace-wide keys, 0 invalid scopes; live smoke accepted a matching event, rejected a mismatched label with 403, and the authenticated export showed the matching event | Keep scope behavior in the recurring release smoke and rotate/revoke the temporary pilot key under the operator’s key-retention policy |
| Refresh scheduler cadence | Added `workers/refresh-scheduler`: a bounded Node.js 22 Lambda, five-minute AWS Scheduler template, dedicated plaintext Secrets Manager dynamic reference, scheduler-only invoke/DLQ IAM permissions, CloudWatch alarms, disabled-by-default rollout instructions, and a manual OIDC/SAM deployment workflow with endpoint/secret validation and status-only output | Implemented and deployed. App Runner now maps the dedicated `trackmcp/refresh/worker` ARN; `AppRunnerInstanceRole` and `GitHubActionsDeployRole` have the exact required permissions. Disabled-first hosted run `40435009405` passed Lambda authentication, log metadata, and DLQ evidence. EventBridge schedule enablement run `40435330718` succeeded. The separate GitHub worker now resolves the same dedicated secret; manual run `40435694603` passed 10 bounded batches with zero failures/backlog. Rolling health `40436113909` remains warning because historical stale/failure runs and cadence gaps are still present; the next post-fix scheduled samples remain required. | Keep the schedule enabled, observe a clean scheduled sequence within the 15-minute freshness budget, then reassess the release-owner gate |

## 2026-10-24 — Python runtime boundary smoke

The Python SDK now has a dependency-free `packages/python-sdk/smoke.py` harness
that starts a local HTTP ingest fixture, exercises the real `flush()` path, and
asserts metadata-only protocol direction, hash/count-only catalog observations,
and bounded transport-failure evidence. Private catalog names, URIs, and cursors
are checked against the serialized request body. Hosted CI runs this smoke next
to the existing Go and .NET runtime harnesses; it does not claim authenticated
production transport UAT.

## Acceptance gates

- [x] Transport observer behavior is real code, not a placeholder claim.
- [x] Transport observer boundaries name supported transports and unsupported
      browser/Edge/SSE/custom cases.
- [x] Setup first viewport keeps key creation, SDK selection, copy action, and
      verification guidance visible.
- [x] Long privacy and data-control explanations are disclosed on demand.
- [x] Go and .NET docs do not claim registry publication before it exists.
- [x] OAuth documentation separates customer authorization from TrackMCP
      ingestion and refuses token collection claims.
- [x] Node client transport documentation and tests include the official SSE
      transport alongside stdio and Streamable HTTP.
- [x] Run full release gate and production smoke for this change.
- [x] Verify all new docs routes in the deployed browser after rollout.
- [x] Run a production OTLP/HTTP JSON smoke with a scoped connection key and
      verify the mapped event in the authenticated export.

## Evidence log

- 2026-10-27: Read-only authenticated production smoke workflow
  `40417989302` completed successfully for immutable mainline commit
  `5edbd441288dde5226d5694855bf81223936c722`. GitHub retained the redacted
  artifact `production-auth-smoke-5edbd441288dde5226d5694855bf81223936c722`.
  This confirms the configured authenticated smoke path for the candidate; it
  does not close first-ingest, key-lifecycle mutation, recovery, scheduler
  cadence, rollback, load/SLO, or final release-owner acceptance gates.

- 2026-10-27: App Runner deployment workflow `40417930214` completed its
  deploy job successfully (`121904990539`) for the immutable `5edbd44`
  candidate. The provider rollout, read-only production smoke, runtime
  identity, and runtime-safety checks are therefore recorded as hosted
  evidence for this candidate; the separate scheduler, recovery, sustained
  freshness, rollback/load, and release-owner gates remain open.

- 2026-10-26: App Runner workflow `40374059804` deployed immutable main
  `7c9edcda6ec5b313a38287d185d53f956b7d3be7`. Release gate, image binding,
  rollout, read-only production smoke, runtime identity, and runtime-safety
  checks passed. The production smoke retry harness was corrected in PR #561
  so each idempotent attempt receives a fresh timeout signal; the full local
  release gate passed 137 suites. Sustained freshness and other external pilot
  gates remain explicitly open.

- 2026-10-26: Scheduler secret handling was reconciled with the App Runner
  runtime bundle. That shared bundle was verified in AWS to contain an empty
  `TRACKMCP_REFRESH_WORKER_SECRET` value, so it could not authenticate the
  worker. The SAM template now resolves the dedicated Secrets Manager secret's
  plaintext `SecretString`; App Runner was remapped to that dedicated ARN,
  and hosted run `40435009405` subsequently passed the authenticated
  smoke/evidence gate without reading or copying the secret value. The worker
  contract test covers the plaintext dynamic reference.

- 2026-10-26: GitHub API inspection of the refresh workflow showed scheduled
  invocations arriving 1–3 hours apart despite the `*/5 * * * *` declaration
  (for example, successful schedule runs at 06:03, 12:46, and 15:17 UTC).
  This confirms the existing GitHub cron is not a sufficient pilot freshness
  scheduler. A deployable AWS Scheduler-backed refresh invoker was added with
  a five-minute rate, bounded `max_jobs:100` calls, Secret Manager token
  resolution, scheduler-only Lambda/DLQ permissions, and disabled-by-default
  enablement. Local scheduler, IAM-template, lint, and worker tests pass. AWS
  enablement remains an external deployment gate.

- 2026-10-26: Authenticated production scope smoke workflow `40260222918`
  passed against `https://trackmcp.com` at immutable release SHA
  `c49217d91a4e36703e62cbf6eec73b7392f29222`. Two disposable workspace keys
  authenticated every Founder OS v2 and legacy analytics read model; conflicting
  workspace parameters were ignored, API-key Action Queue mutations returned
  403, and a revoked key returned 401. This closes the read-only tenant-
  isolation smoke, not first-ingest/activation or worker/SLO evidence.

- 2026-10-26: Refresh workflow `40261716029` drained 28 queued jobs with
  28 successes, no retries/failures/timeouts, and max attempt count 1, but
  observed a stale 6,058,024 ms queue lag against the 900,000 ms freshness
  budget. Immediate follow-up workflow `40261789193` found no backlog. This is
  evidence of a drainable backlog and healthy worker execution, not sustained
  freshness-SLO proof; cadence/alerting evidence remains open.

- 2026-10-24: Go and .NET server SDKs now accept an explicit, allowlisted
  caller-verified transport label (`stdio`, `streamable_http`, `sse`, or
  `custom`) for transport failure observations. The label is bounded metadata;
  URLs, headers, exception text, and payloads remain excluded. Runtime smokes
  assert `stdio` and `streamable_http` survive serialization, while Go unit
  coverage rejects unsupported labels. This improves cross-language transport
  attribution but does not claim transport-owned reconnect policy or production
  disconnect UAT.

- Transport observer implementation and tests are present in the TypeScript
  package; `packages/typescript-sdk/test/client-adapter.test.mjs` covers the
  Node export boundary, transport support, fail-open behavior, and client-only
  observation semantics.
- Previous full release gate passed 115 suites. This change requires a fresh
  release-gate run before its deployment is considered complete.
- 2026-10-21: PR #150 passed Go, .NET, and web CI; App Runner deployment
  `39560665525` completed successfully with its release gate and production
  smoke steps. Live browser QA confirmed Setup disclosures, the resolver card,
  the Go SDK docs route, and the expanded SDK/OAuth navigation.
- 2026-10-21: The Node client adapter protocol observer was extended beyond
  `tools/call`. It now emits metadata-only request/response observations for
  catalog, task, subscription, progress, cancellation, completion, sampling,
  elicitation, and other identified MCP methods. The SDK build and all 38
  package tests pass; deployment and published-package evidence remain open.
- 2026-10-21: A production OTLP/HTTP JSON smoke sent a current-time
  `tools/call` span through the authenticated receiver with a scoped key. The
  endpoint returned HTTP 200 with `accepted_spans: 1`, and the authenticated
  export returned the mapped `otel-json-pilot`/`current_lookup` event. The
  receiver advertises bounded protobuf metadata support while OTLP/gRPC remains unsupported.
- 2026-10-21: PR #165 fixed a production projection omission: the refresh
  handler had not selected `task_id` or `payload`, so valid task evidence was
  reduced to a pending transport fact and no transition row could be written.
  The full 116-suite release gate passed, CI and App Runner deployment for
  `3b209533988d4ef913120e0e46d0c65abd0d5930` succeeded, and worker run
  `39587728104` processed a directly queued production test event. The
  read-only postflight returned `transitions=1`, `working=1`, `hashed=true`
  for `task-postdeploy-direct-20261021`. The direct database fixture proved the
  deployed worker/read-model path. A fresh bounded scoped fixture then sent a
  real authenticated task event to the App Runner origin and received HTTP 200
  with one accepted event; worker run `39588635256` produced one `working`
  transition with a non-null hash at `2026-10-21T10:59:34.941Z`. This closes the
  ingest-to-transition proof without retaining the fixture secret.
- 2026-10-21: Refresh worker run `39600868382` completed five concurrent
  bounded batches against the production App Runner origin. It processed 32
  queued jobs (`7+6+6+6+7`), with 32 succeeded, 0 retryable, 0 failed, 0
  timed out, and max attempt count 1. Reported maximum queue lag was
  4,858,742–5,708,193 ms across the slices. This closes non-empty processing
  and failure/retry evidence for the run; an agreed pilot lag SLO and a
  multi-run cadence baseline remain open.

- 2026-10-22: Protocol pagination evidence was reconciled with the executable
  fixtures. The modern TypeScript client now has cursor-following coverage for
  tools, resources, and prompts, including repeated-cursor termination and
  explicit truncation; the v2 tools route covers opaque cursor pages and
  malformed-cursor bounds. The protocol matrix now records these as verified
  local evidence while retaining durable catalog snapshot/history joins and
  cross-language exporter pagination as open boundaries. The protocol-matrix
  test, 14 modern-client tests, lint, 176-route build, and full 122-suite
  release gate passed. No package was published and no package version was
  bumped; this remains part of the coordinated release train.

- 2026-10-22: Transport documentation was reconciled with the shipped Node
  adapter. `SSEClientTransport` is an explicitly supported Node client-adapter
  transport with selection/mismatch regression coverage; it is not an
  unsupported browser or proxy path. A real SSE disconnect fixture and
  authenticated production disconnect UAT remain open, so SSE lifecycle parity
  is still marked partial.

- 2026-10-22: Added a real local SSE lifecycle fixture to the Node adapter
  suite. It starts an official SSE transport, completes an initialize exchange,
  holds an in-flight `tools/call`, destroys the server event stream, and verifies
  a bounded metadata-only `transport_error` tool observation without leaking
  result content. The adapter package now has 25 passing tests; authenticated
  production disconnect UAT and transport-owned reconnect policy remain open.

- 2026-10-22: Added a real Streamable HTTP task lifecycle fixture. It returns a
  server-directed task from `tools/call`, then exercises `tasks/get`,
  `tasks/update`, `tasks/cancel`, and a final `tasks/get`. The fixture verifies
  four bounded lifecycle states, shared hashed task identity, exact method
  ordering, and that the raw handle/input never appears in telemetry. The Node
  adapter suite now has 26 passing tests; capability-aware task creation,
  cross-server joins, and authenticated production interoperability remain open.

- 2026-10-22: Hardened the `/api/v2/tasks` projection after an integration test
  demonstrated that unexpected upstream fields could otherwise be forwarded.
  The route now allowlists a bounded task hash, state, timestamps, observation
  count, terminal flag, and evidence quality; raw handles and arbitrary payload
  fields are discarded. Contract and integration coverage both pass.

- 2026-10-22: Hardened the `/api/v2/catalogs` projection after the privacy
  audit found that stored snapshot arrays and diff objects were not fully
  allowlisted. Catalog versions now emit only valid SHA-256 hashes, bounded
  counts, allowlisted diff statuses/counts, and bounded diff hash arrays.
  Integration coverage injects raw names and a private diff field and verifies
  neither reaches the response.

- 2026-10-22: Hardened the `/api/v2/people` projection after the same privacy
  audit found broad client and Founder OS identity-model passthrough. The route
  now emits bounded client labels/call counts, bounded growth and account-band
  metrics, ranked activity counts, and explicit identity coverage fields only;
  raw account keys and arbitrary client/model properties are discarded. The
  contract and malicious-field integration test pass.

- 2026-10-22: Hardened the `/api/v2/journeys` projection. Correlated session
  rows now expose only bounded session/correlation labels, client/tool counts,
  timing, and allowlisted completion/correlation states; arbitrary workflow
  properties are discarded. The journey integration fixture injects a private
  field and verifies it is not returned while explicit terminal accounting is
  unchanged.

- 2026-10-22: Hardened the `/api/v2/outcomes` projection. Outcome rows,
  semantic task states, evidence-quality counts, and grouped aggregates now
  use bounded numeric/rate fields and allowlisted keys; arbitrary outcome or
  aggregate properties are discarded. The integration fixture injects private
  fields into both shapes and verifies they do not reach the response.

- 2026-10-22: Added a shared public `data_trust` projection and applied it to
  `/api/v2/data-trust`. Provenance now exposes only bounded timestamps, counts,
  the truncation flag, and the observed watermark; arbitrary upstream fields
  are discarded. Unit, contract, and adversarial route integration tests pass.

- 2026-10-22: Hardened the `/api/v2/tools` Capabilities projection. Tool
  metrics, catalog metadata, unused-tool names, and insight cards now use
  bounded field-by-field projections with hash validation and explicit page
  limits; arbitrary tool/insight properties are discarded. Existing filter,
  opaque-cursor, malformed-cursor, and malicious-field integration tests pass.

- 2026-10-22: Added shared bounded projections for `/api/v2/resources` and
  `/api/v2/prompts`. Observed methods/entity counts, activity metrics, outcome
  rows, breakdowns, and trend points now use allowlisted fields with bounded
  numbers/text and protocol-specific filtering. Integration tests inject
  private nested payloads and verify they cannot cross the public envelope.

- 2026-10-22: Hardened the `/api/v2/protocol-activity` and
  `/api/v2/reliability` projections to use the shared bounded `data_trust`
  provenance contract instead of forwarding arbitrary analytics metadata.
  Protocol-family activity now has an adversarial integration test, and the
  reliability fixture verifies private provenance fields are discarded.

- 2026-10-22: Applied the same bounded provenance projection to the remaining
  public v2 analytics surfaces: catalogs, people, journeys, tasks, outcomes,
  resources, prompts, tools, and tool detail. A release-gate contract now
  checks every public v2 analytics handler for the shared projection and
  rejects raw `data_trust` forwarding.

- 2026-10-22: Extended the modern TypeScript client with explicit Tasks
  `tasks/update` and `tasks/cancel` methods. Task IDs are sent in the required
  `Mcp-Name` routing header, input-response keys are bounded, request bodies
  have a 64 KiB limit, and cancellation is documented as cooperative rather
  than an asserted terminal state. The client still fails closed for the
  removed `tasks/list` operation and does not create tasks or subscribe to
  notifications. SDK tests now pass 68/68 plus the packed consumer check.

- 2026-10-22: Added a bounded `waitForTask` helper to the modern TypeScript
  client. It respects `pollIntervalMs`, stops only at explicit terminal task
  states, supports caller abort signals, and returns an explicit timeout result
  when its poll/time budget is exhausted. Task results and input payloads are
  not returned by the helper; task status remains observation-only. SDK tests
  now pass 70/70 plus the packed consumer check.

- 2026-10-22: Reconciled the public protocol documentation with the modern
  client task controls. The docs now distinguish caller-requested task updates
  and cooperative cancellation from unsupported task creation, notification
  subscriptions, and result-payload retrieval; a protocol-matrix contract
  prevents the old "never mutates task state" wording from returning.

- 2026-10-22: Added bounded modern task-status stream support to the TypeScript
  client through Streamable HTTP `subscriptions/listen`. The adapter validates
  task filters, enforces HTTPS/localhost and request/response/time/event bounds,
  accepts only task notification envelopes, and projects task metadata without
  returning result or input payload values. The listener reports explicit
  truncation and supports caller abort/timeout signals and sanitized callbacks;
  it is intentionally not a durable reconnect/subscription manager. SDK tests
  now pass 72/72 plus the packed consumer check.

- 2026-10-22: Corrected modern Tasks extension negotiation in the TypeScript
  client. `tasks/get`, `tasks/update`, `tasks/cancel`, and
  `subscriptions/listen` now advertise `io.modelcontextprotocol/tasks` through
  the required per-request client-capability metadata, while preserving bounded
  task routing and payload projection. Regression tests assert the exact
  capability envelope; SDK tests remain 72/72 plus the packed consumer check.

- 2026-10-24: Extended the dependency-free .NET runtime smoke harness to cover
  metadata-only `elicitation/create` result projection and a bounded transport
  failure in addition to catalog and cancellation signals. The harness asserts
  that input values, private result fields, catalog names/URIs/cursors, and
  transport details do not cross the serialized ingest boundary. The local
  machine does not have the `dotnet` toolchain, so hosted CI remains the
  authoritative compile/runtime result; no production or publication claim is
  inferred from this source change.

- 2026-10-25: Go and .NET protocol-signal helpers now preserve the same
  caller-verified transport label for cancellation and other allowlisted
  notifications. Runtime smokes assert direction plus `stdio`/
  `streamable_http`; unsupported labels fail closed. This closes the local
  cross-language attribution gap while production transport UAT remains open.

- 2026-10-25: Go and .NET catalog observers now retain bounded modern cache
  hints (`cache_ttl_ms` up to 24 hours and `cache_scope` limited to `public` or
  `private`) alongside cursor presence. Runtime smokes and Go unit coverage
  reject oversized TTLs and unsupported scopes; these are freshness/sharing
  hints only and do not claim cache conformance or snapshot consistency.

- 2026-10-25: The modern TypeScript client now exposes privacy-safe
  `readResource` and `getPrompt` methods. They send bounded caller-selected
  reads but return only SHA-256 identity hashes, content/message counts, and an
  optional error bit; raw resource bodies, prompt messages, and argument values
  never leave the adapter. Tests cover wire methods, privacy, and fail-closed
  identifiers. Cross-transport production UAT and durable read-outcome joins
  remain partial.

- 2026-10-22: Tightened the modern task read model to the Tasks extension's
  bounded lifecycle contract. Task status is now allowlisted, valid lifecycle
  timestamps and status messages are retained for operational UX, and result,
  error, input-request, and arbitrary private fields remain excluded. Unknown
  task states fail closed; SDK tests cover metadata retention and rejection.

- 2026-10-22: Hardened bounded task-status subscriptions. Listener timeouts and
  caller aborts now preserve already-sanitized events while marking the result
  truncated, and duplicate task filters are normalized rather than rejected.
  Unsafe identifiers still fail closed and stream/event/byte bounds remain
  enforced; SDK tests cover normalized filters and bounded delivery.

- 2026-10-22: Added a bounded `listenForUpdates` API for the 2026-07-28
  `subscriptions/listen` catalog/resource filters. It supports tools, prompts,
  resources list-change notifications, and resource updates; returns only event
  kinds plus one-way SHA-256 URI hashes; projects the server's honored filter
  without raw URIs or subscription IDs; and recognizes graceful stream close.
  Fixed byte/event/time bounds, abort handling, and no replay/reconnect policy
  remain explicit. SDK tests now pass 74/74 plus the packed consumer check.

- 2026-10-22: Added metadata-only modern `callTool` support. The client sends
  bounded tool arguments with the Tasks extension capability, recognizes
  `complete`, `input_required`, and server-directed `task` results, and returns
  only content counts, input-request keys, error flags, or sanitized task
  metadata. Tool arguments, content, errors, and task result payloads are never
  returned or retained. SDK tests now pass 76/76 plus the packed consumer
  check.

- 2026-10-22: Hardened modern request serialization. Non-serializable tool
  arguments now fail closed as a typed bounded protocol error instead of
  escaping as a raw JSON runtime exception. Regression coverage is included;
  SDK tests now pass 77/77 plus the packed consumer check.

- 2026-10-25: The coordinated package release train completed through the
  guarded GitHub Actions workflow `40129661973`. `@trackmcp/sdk@0.1.16`,
  `@trackmcp/cli@0.1.7`, and `trackmcp==0.1.9` are published with registry
  verification, provenance, and clean-consumer checks. The exact immutable
  integrity/checksum evidence is recorded in
  `FOUNDER-OS-PACKAGE-RELEASE-READINESS.md`; authenticated production
  activation and first-event UAT remain external gates.

- 2026-10-22: Completed the local TypeScript SDK artifact audit for the same
  release train. `npm pack --dry-run --ignore-scripts` produced a 10-file
  package containing the README, manifest, declarations, and compiled exports;
  the local tarball integrity was
  `sha512-xSGDkNtdFNkUKZp459Sesu04nKkjAL6KrBH41TKoBqX8jooh0S11IuZgDnqbA6t1rMJq7soeAybGFqtnyFzdqg==`.
  Build and clean packed-consumer verification passed. This is local artifact
  evidence only, not registry publication or provenance evidence.

- 2026-10-22: Re-ran the product-surface readiness contracts after the modern
  client changes. Dashboard behavior coverage passed 55/55 checks, including
  Setup first-event states, OTel and transport links, example/live data
  separation, mobile header behavior, and info disclosures. Accessibility and
  docs-navigation contracts also passed; enabled controls retain pointer
  affordance and keyboard focus, and every sidebar destination resolves to a
  real route or section. No speculative UI change was made where executable
  evidence already passed.

- 2026-10-22: Corrected modern `tools/call` Streamable HTTP routing so the
  metadata-only SDK path sends the required `Mcp-Name` header matching the
  requested tool. Wire-level coverage now asserts the header while preserving
  the bounded task/result projection; SDK tests remain green.

- 2026-10-22: Added cross-language parity for bounded protocol notifications.
  Python, Go, and .NET SDKs now expose an allowlisted metadata-only signal
  helper for progress, cancellation, and catalog/resource/prompt changes.
  Progress values, cancellation reasons, URIs, and caller payloads are not
  accepted; Python regression coverage passes. Dashboard timeline and
  transport-specific runtime fixtures remain explicitly open.

- 2026-10-22: Added the same `recordProtocolSignal` contract to the TypeScript
  server SDK and its `withTrackMCP` surface. The signal set is allowlisted and
  payload-free; SDK regression coverage now passes 78/78 plus the packed
  consumer check. No package version was changed; this remains part of the
  next coordinated release train.

- 2026-10-22: Added a bounded daily protocol-signal timeline to authenticated
  analytics and the Overview lifecycle panel. The projection includes only
  allowlisted signal counts, is capped to the selected window, and never
  forwards event payloads or identifiers. Analytics integration and dashboard
  contracts pass; transport-specific and production UAT remain separate gates.

- 2026-10-22: Extended the modern capability-family read model with bounded
  observed/error/input-required/unknown outcome counts for completion,
  sampling, elicitation, tasks, and other protocol families. The dashboard
  renders these as protocol evidence only; unknown states remain explicit and
  no business-completion claim is inferred. Analytics integration and dashboard
  contracts pass; durable family-specific persistence remains open.
- 2026-10-27: Production scheduler remediation progressed through the AWS
  control plane. The App Runner runtime mapping was changed to the dedicated
  `trackmcp/refresh/worker` secret, but the first update rolled back because
  `AppRunnerInstanceRole` lacked `secretsmanager:GetSecretValue` for that ARN.
  The inline `ReadRuntimeSecrets` policy was then narrowed/extended in IAM to
  include that exact dedicated ARN; AWS confirmed `Policy ReadRuntimeSecrets
  updated.` The App Runner service was subsequently updated successfully with
  the exact dedicated ARN. Hosted scheduler run `40432719225` reached
  CloudFormation successfully but its authenticated smoke ran before the
  IAM/App Runner rollout completed and returned worker HTTP 401. Hosted run
  `40434168737` proved the Lambda smoke path authenticated, but its metadata
  step exposed a missing `logs:DescribeLogStreams` permission on the GitHub
  deploy role; that permission was added scoped to the exact function log
  group.

- 2026-10-27: Hosted scheduler run `40434634021` ran after the IAM fix. The
  authenticated refresh Lambda returned the expected success status and
  CloudWatch log-stream metadata access succeeded. The evidence step then
  exposed a workflow defect: `ApproximateNumberOfMessagesVisible` is a
  CloudWatch metric name, not a valid SQS `GetQueueAttributes` attribute. The
  workflow and refresh-scheduler runbook now request the valid
  `ApproximateNumberOfMessages`; the contract suite and complete local
  release gate (139 suites) pass. Hosted run `40435009405` then passed
  end-to-end: authenticated Lambda invocation returned status 200, the
  scheduler DLQ depth was 0, and metadata-only CloudWatch log evidence was
  uploaded as artifact `12704070739`. The recurring schedule remains
  intentionally disabled pending sustained-sample and release-owner gates.

- 2026-10-27: Enabling the EventBridge schedule exposed a separate cadence
  path defect: the GitHub refresh-worker workflow was still reading the empty
  legacy `TRACKMCP_REFRESH_WORKER_SECRET` repository secret. The workflow now
  resolves the same dedicated plaintext Secrets Manager ARN used by the
  production scheduler through the existing OIDC deploy role, masks the value
  immediately, and never persists it. The refresh-worker contract and the
  complete 139-suite release gate pass. Manual worker run `40435694603` then
  completed successfully with ten bounded batches, zero failures, zero
  backlog, and no freshness alert. A fresh scheduled worker run is still
  required to establish the sustained cadence baseline.

- 2026-10-27: The bounded health workflow `40436113909` inspected the current
  redacted worker artifacts. It found 8 samples (3 scheduled), but correctly
  remains `warning` because historical stale/failing runs produce
  `freshness_budget_exceeded`, `worker_failures_observed`, and
  `schedule_cadence_gap`; the worst observed queue lag is 13,654,611 ms.
  This is not a readiness signal. The dedicated-secret fix has passed a manual
  worker run, and the next scheduled samples must be observed before the
  freshness/SLO gate can be reconsidered.

- 2026-10-27: Added an opt-in metadata-only AWS cadence evidence mode to the
  scheduler deployment workflow. It records Lambda invocation/error metric
  datapoints and the latest log-stream timestamps for the enabled function;
  it never fetches log events, request bodies, or secret values. The focused
  scheduler contract and complete 139-suite release gate pass. This gives the
  release gate a direct AWS-scheduler observation path while GitHub cron
  cadence remains unreliable.

- 2026-10-27: Saved the missing `cloudwatch:GetMetricData` permission on the
  `GitHubActionsDeployRole` policy `TrackMCPRefreshSchedulerDeploy`, scoped to
  all CloudWatch resources because this read action does not support a
  resource-level ARN. Hosted evidence run `40437009030` completed successfully.
  Its metadata-only artifact recorded five Lambda invocations across the
  20-minute window (1, 1, 1, and 2 per five-minute datapoint), zero Lambda
  errors, and five recent log-stream timestamps. The scheduler's AWS evidence
  path is therefore operational; this does not yet close the separate
  sustained cadence/freshness gate, which still requires clean scheduled
  worker samples and a fresh health report.

- 2026-10-27: Read-only production postflight confirmed that the durable
  semantic-fact path is materializing in Supabase: `trackmcp_semantic_facts`
  contains 36,186 rows, with recent rows observed through
  `2026-10-27T02:11:06Z`; the sample contains bounded protocol-family metadata
  (including `prompts`, `resources`, and `control_signal`) and no raw payload
  fields were selected. The refresh-job table contains 7,889 rows; the latest
  sampled 100 jobs were all `succeeded` across fact projection and catalog
  refresh kinds. This closes the previously unproven “facts are not
  materialized” deployment dependency. It does not close family-specific
  lifecycle UAT or prove completion/input-required joins for every protocol
  family; those remain explicitly separate gates.

- 2026-10-27: Ran a bounded authenticated protocol-family UAT against the
  deployed ingest path using the existing pilot smoke credential. Three
  protocol events (completion, elicitation, and tasks) plus a sampling event
  were accepted individually; the sampling fixture used the valid
  `input_required` result vocabulary. After the manual refresh-worker run
  `40437722676`, Supabase read-back found durable rows for completion
  (`completed`), elicitation (`pending`), sampling (`pending`), and tasks
  (`completed`) under the dedicated UAT service label. The selected fact
  columns contained only bounded family/role/outcome metadata; method names,
  request bodies, and result payloads were not selected or retained in the
  evidence. This closes the first authenticated durable family-outcome
  materialization check; broader customer traffic coverage, cross-server
  joins, and transport-owned lifecycle UAT remain open.

- 2026-10-27: Merged PR #610 (`9056968`) to make the refresh-health workflow
  observe the production AWS scheduler directly. The workflow now assumes the
  existing OIDC deploy role, reads only Lambda invocation/error metrics for a
  bounded 20-minute window, and adds redacted scheduler evidence to the health
  report. A healthy AWS metric window clears the misleading GitHub-cron
  cadence-gap reason without suppressing worker failures, stale queue lag, or
  AWS errors. Added regression/contract coverage; the full release gate passed
  139 suites, lint passed, and the production build generated 177 routes.

- 2026-10-27: The first AWS-aware health run `40438521938` exposed one Lambda
  error in its 20-minute window (4 invocations, 1 error), and the follow-up
  scheduler evidence run `40438606882` localized it to the `02:24Z` five-minute
  datapoint. The redacted resource/log-stream metadata path still succeeded;
  no log bodies or secret values were read. A read-only Supabase check found
  the latest 50 refresh jobs all `succeeded`, so the error is not currently
  reproduced as a durable failed-job row. The health report now correctly
  retains `aws_scheduler_errors_observed` and keeps the release gate open
  pending repeated zero-error windows or a safe status-only root-cause trace.

- 2026-10-27: Health rerun `40438869799` still observed the same single error
  within its rolling window (5 invocations, 1 error), so the warning is
  persistent rather than cleared by one additional sample. The error remains
  isolated to the AWS scheduler metric; the bounded refresh-job read-back has
  no current non-success rows. Keep the scheduler/release gate open until a
  subsequent window ages out the datapoint or a safe root-cause trace is
  available.

- 2026-10-27: Extended the authenticated protocol-family UAT with `roots/list`
  and `logging/setLevel` events. Both were accepted by production ingest and
  refresh-worker run `40439005667` succeeded. Supabase read-back found one
  durable `roots` fact and one durable `logging` fact, each with a completed
  outcome and protocol-response role under the UAT service label. The
  production roots/logging rows remain bounded metadata only; raw filesystem
  roots, log levels, and message content were not retained. This closes the
  first authenticated coverage check for those families while broader
  transport and capability-advertisement UAT remains open.

- 2026-10-27: Merged PR #611 (`592b74e`) to preserve late ingest refresh
  batches. The ingest refresh dedupe key now includes the production batch
  fingerprint, while retaining the legacy compact key for the explicit
  window-only fallback. This prevents an event arriving after a successful
  15-minute refresh job from being silently absorbed by that terminal job.
  Focused ingest/refresh tests passed (30 tests), the complete release gate
  passed (139 suites), lint passed, and the production build generated 177
  routes. App Runner deployment run `40439886536` is in progress; prompt
  entity projection UAT is intentionally pending until the new image is
  running.

- 2026-10-27: App Runner deployment `40439886536` completed successfully for
  merged commit `592b74e`; the workflow's release gate, image digest check,
  rollout wait, read-only production smoke, release-identity check, and
  runtime safety-flag audit all passed. Production first-ingest smoke
  `40440634836` and authenticated production smoke `40440625122` also passed.
  Using the deployed App Runner host, sent a unique authenticated `prompts/get`
  event with a SHA-256 entity-name hash; refresh-worker run `40440770324`
  succeeded. Supabase read-back confirmed a `catalog_kind=prompts` entity row
  for that exact source event and a new fingerprinted `catalog_entity_recompute`
  job in `succeeded` state. This closes the previously failing late-batch
  prompt-entity projection path. The public custom domain remains Cloudflare-
  protected for direct local curl; the direct App Runner host was used for the
  bounded UAT and no raw payload was selected.

- 2026-10-27: Health run `40440890332` completed with AWS scheduler evidence
  healthy (3 invocations, 0 errors in the bounded window). The overall report
  remains `warning` only because its retained sample includes two historical
  worker failures and cadence breaches; the latest worker run
  `40440770324` processed 20 jobs with zero failures and stayed within the
  freshness budget. This is an honest warning state, not a release claim that
  scheduler history is clean.

- 2026-10-27: Ran an authenticated production-like Streamable HTTP
  interoperability fixture against the deployed App Runner ingest origin.
  The official MCP `StreamableHTTPClientTransport` completed `initialize`,
  `notifications/initialized`, `tools/list`, and `tools/call` through the
  TrackMCP client adapter. The adapter reported zero dropped events, hook
  errors, privacy errors, malformed messages, unmatched messages, duplicate
  messages, or expired requests. Supabase read-back for the scoped service
  found nine client observations, all `transport=streamable_http` with
  `payload_policy=metadata`, plus nine durable semantic facts including a
  completed tool call and completed session facts. This closes the
  production-like Streamable HTTP telemetry path; customer-owned MCP endpoint
  interoperability, transport-owned reconnect, proxy, and disconnect UAT
  remain separate open gates.

- 2026-10-27: The SSE evidence/matrix reconciliation passed the complete
  139-suite release gate, lint, and the 177-route production build. The
  change is documentation/evidence-only and does not require a new App Runner
  rollout; the already deployed adapter/runtime is the candidate exercised by
  the UAT.

- 2026-10-27: Health run `40441666990` is now `healthy`: zero failed worker
  runs, zero report reasons, four AWS scheduler invocations, zero AWS errors,
  76 jobs processed, and maximum queue lag of 105,384 ms. The report still
  records one cadence breach and zero GitHub-scheduled samples in its bounded
  window, so this closes the current worker failure/error warning but does not
  yet prove a sustained scheduled-worker SLO across multiple scheduled
  samples.

- 2026-10-27: Added the repeatable secret-gated `production-transport-smoke`
  workflow and script. It starts bounded local MCP fixtures for the official
  Streamable HTTP and SSE transports, sends only metadata observations to the
  configured HTTPS production origin, writes a mode-0600 redacted report, and
  explicitly disclaims replay, durable subscriptions, transport-owned
  reconnect, OAuth exchange, and customer-server conformance. The direct
  App Runner run passed both transport checks with zero dropped, hook, privacy,
  malformed, unmatched, duplicate, or expired-message diagnostics. Contract
  coverage passed; the release gate now runs 141 suites. Lint, the 177-route
  production build, and `git diff --check` passed. Workflow execution remains
  manual and skips safely when its dedicated repository secret is absent.
  Manual dispatch `40442041930` completed successfully and confirmed that the
  repository currently has no `TRACKMCP_TRANSPORT_SMOKE_KEY`; the write step
  skipped and no credential or production mutation occurred.

- 2026-10-27: Ran an authenticated production-like SSE interoperability
  fixture against the deployed App Runner ingest origin. The official MCP
  `SSEClientTransport` completed initialization and a tool request against a
  local SSE fixture, then the fixture deliberately closed the stream. The
  adapter reported zero dropped events, hook errors, privacy errors, malformed
  messages, unmatched messages, duplicate messages, or expired requests.
  Supabase read-back found six `transport=sse` client observations with
  `payload_policy=metadata`, including bounded initialization, tool-call, and
  session transport errors; six durable semantic facts classified the
  explicit failures without retaining response content. This closes the
  production-like SSE failure-observation path; customer-owned endpoint
  interoperability and transport-owned reconnect guarantees remain open.

- 2026-10-27: Added `docs/FOUNDER-OS-100-CUSTOMER-READINESS-SNAPSHOT.md` as
  the concise first-100 handoff. It records the current engineering-green
  evidence (141-suite release gate, lint, 177-route build, deployment and
  bounded transport checks), the hosted transport-secret configuration skip,
  and the remaining release-owner/infrastructure/protocol gates. It keeps the
  release status explicitly **HOLD** and makes no readiness claim beyond the
  retained evidence.

- 2026-10-27: Reconciled the PDF truth audit with the implemented bounded
  Action Queue and catalog-snapshot surfaces. The audit now records the
  workspace-scoped alert relationship, lazy delivery-attempt evidence, and
  persisted hash/count snapshot/diff read model as implemented bounded
  capabilities, while retaining production-postflight and operational-metric
  caveats. No unsupported delivery or raw-identity claim was added.

- 2026-10-27: Reconciled the protocol rows for completions, sampling, and
  elicitation with the current SDK and analytics evidence. They now record
  bounded privacy-safe request/response role counts and explicit
  input-required/unknown outcomes as implemented signals, while retaining
  capability-aware approval/acceptance lifecycle joins as partial. No user
  values, suggestion values, prompt content, or approval claims are inferred.

- 2026-10-27: Reconciled the PDF privacy rows with the implemented review-only
  boundary. Secret-free export, authenticated privacy review, legal-hold and
  retention checks, deterministic deletion planning/checkpoints, and the
  fail-closed retention-cleanup worker contract are implemented. Destructive
  deletion and scheduled cleanup remain deliberately disabled pending an
  approved executor, operational metrics, replay procedure, and owner
  acceptance; no deletion claim was added.

- 2026-10-27: Synchronized `docs/FOUNDER-OS-PROTOCOL-MATRIX.md` with the
  bounded completions, sampling, and elicitation evidence already covered by
  the SDKs and analytics projections. The matrix now names the implemented
  request/response-role and explicit-outcome signals while retaining lifecycle
  joins and authenticated UAT as partial requirements.

- 2026-10-27: Reconciled the PDF truth audit for Journeys and Reliability.
  Their bounded v2 projections, explicit workflow/task evidence, path/funnel
  analysis, baseline comparisons, queue health, and insufficient-data states
  are implemented evidence surfaces. Cross-server identity and sustained
  production SLO acceptance remain explicit external boundaries.

- 2026-10-27: Reconciled the first-100 external-gate register with the latest
  source verification. It now names `main` at `29096bc` as the docs-only
  source checkpoint and records the current 141-suite, lint, and 177-route
  build evidence without relabeling the deployed runtime or closing any
  operator/infrastructure gate.

- 2026-10-27: Added `test:external-gates` to the release gate. The contract
  protects the register's HOLD status, current source/deployed-image
  distinction, required external gate inventory, and current **142-suite**
  evidence. The readiness snapshot and release record were updated to match;
  historical checkpoints remain unchanged.

- 2026-10-27: Advanced the external-gate register's source checkpoint to
  `36eaed1` after the gate-guard documentation commit. The deployed runtime
  identity remains unchanged; the contract test requires this explicit update
  whenever the source checkpoint moves.

- 2026-10-27: Added the PDF product-parity contract and reconciled the active
  source checkpoint to `50ab08e`; the full release gate now runs **143 suites**.
  The parity contract protects bounded Reliability truth, the explicit
  write-enabled secret gate, and unsupported OTLP/proxy boundaries.

- 2026-10-27: Rechecked the official MCP 2026-07-28 specification release and
  synchronized the protocol matrix: modern-era discovery is stateless and the
  legacy roots/logging/sampling flows are deprecated in favor of modern/MRTR
  semantics. Legacy telemetry remains bounded and supported; modern lifecycle
  evidence is still explicitly partial until capability-aware request/result
  UAT exists.

- 2026-10-27: Audited the only remaining open GitHub PR (#425). Its immutable
  runtime identity, `/api/health` release marker, deployment verification, and
  related tests are already present on current `main`; no unique diff remained
  necessary. Closed the superseded PR with an explanatory comment so obsolete
  release work is not presented as pending.

- 2026-10-27: Recovered the refresh-scheduler deployment on `main` at
  `3746a33`. Deployment workflow `40448579066` succeeded and artifact
  `12709257776` records four Lambda invocations with zero errors plus the
  schedule/DLQ/alarm outputs. The optional CloudWatch metric-filter resource
  was removed because the current OIDC role is not authorized for
  `logs:DescribeMetricFilters`; the Lambda still emits a non-sensitive
  scheduled-success marker, while metric projection remains an explicit
  external gate. Release gate remains green at 143 suites.

- 2026-10-27: Added the bounded CloudWatch Logs marker-count path to the
  refresh health workflow (`9299fea`). Health run `40449251681` proves the AWS
  Lambda cadence gate (4 invocations, 0 errors) but records the end-to-end
  marker projection as unavailable because the OIDC role lacks log-event query
  permission. The report now distinguishes unavailable evidence from zero
  successes; no log payloads are exposed.

- 2026-10-27: Added `docs/aws/TrackMCPRefreshHealthLogReadPolicy.json` as a
  least-privilege IAM handoff for the remaining scheduler health boundary.
  It is contract-tested and grants only the two read actions required by the
  bounded marker count. The native AWS session was signed out during the
  attempted control-plane check, so the policy remains unapplied and the
  end-to-end cadence gate remains explicitly pending.
