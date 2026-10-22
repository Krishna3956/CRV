# Founder OS pilot gap ledger

Status: active autonomous audit, started 2026-10-21.

This ledger separates implemented behavior from documented boundaries. A
registry package, protocol capability, or OAuth flow is not treated as shipped
just because a README or marketing page mentions it.

| Surface | Current evidence | Status | Next proof |
| --- | --- | --- | --- |
| TypeScript server SDK | `packages/typescript-sdk`, consumer gate, published release package `0.1.12`; source candidate now fails closed for removed `tasks/list` and retains explicit-handle `tasks/get` observation without task mutation | Published 0.1.12 remains the registry baseline with its historical bounded tasks/list behavior; the unreleased source correction is covered by the consumer gate and must be included in the next approved release train | Keep compatibility checks green, update the release manifest, and publish one batched correction only after authenticated activation evidence |
| Python server SDK | `packages/python-sdk`, package consumer gate, published release package `0.1.6` | Implemented with provenance, exact PyPI artifact hashes, and clean-consumer evidence; current release gate runs 24 Python tests | Keep release and compatibility checks green; repeat activation/first-event proof before pilot claims |
| Transport observer / Node client adapter | `@trackmcp/sdk/client-adapter`; Node-only wrapper for Stdio and Streamable HTTP; metadata-only and fail-open; bounded capability-family metadata, lifecycle generations for reconnect correlation, and dedicated adapter tests | Implemented and merged through PRs #173–#175 | Run production-like client fixtures when a pilot server is available |
| Go SDK | `packages/go-sdk/trackmcp.go`; transport-neutral primitive, source package only | Implemented with source-only distribution boundary | Publish only after package provenance/release work is approved |
| .NET SDK | `packages/dotnet-sdk/TrackMcp.cs`; transport-neutral primitive, source package only | Implemented with source-only distribution boundary | Publish only after NuGet/provenance work is approved |
| OTLP/HTTP JSON or protobuf | Authenticated bounded receiver at `/api/v1/otel/v1/traces`; JSON/protobuf parsers and interoperability tests; production smoke passed for the deployed release | Implemented as metadata-only, pilot-key protobuf UAT still open; gRPC intentionally unsupported | Keep the smoke fixture in the recurring release gate; do not market OTLP/gRPC or external export |
| MCP OAuth | TrackMCP does not issue, exchange, or parse customer OAuth credentials | Explicitly unsupported by design | Customer-owned OAuth integration must emit explicit bounded outcomes |
| Dashboard/session auth | Workspace membership, connection-key scope, revocation, tenant-isolation contracts | Implemented | Repeat production smoke after releases |
| Setup density | Secondary privacy/data-flow and export/deletion explanations moved behind accessible disclosures; primary setup actions remain visible | Implemented in current change | Live browser audit after deployment |
| Public docs parity | Added Go, .NET, Authentication/OAuth, and clearly named Transport Observer documentation paths | Implemented in current change | Check links, snippets, and package-version claims in CI |
| Node client protocol observer | Client adapter now emits bounded request/response/notification observations for every identified non-tool MCP request, including catalog counts, task/MRTR result discriminators, list-changed/progress signals, modern protocol-family labels, and reconnect lifecycle generations; arguments, URIs, prompt names, and result bodies remain excluded | Implemented and merged through PRs #173–#175 with 42 SDK tests passing; authenticated analytics now exposes bounded protocol-family counts through PR #177; a production-like TypeScript SDK fixture completed against the deployed App Runner ingest origin and Supabase read-back verified `initialize`, `notifications/initialized`, and `tools/call` (`pilot_probe`) rows under the scoped production service | Keep the fixture in recurring release validation; broader transport and package-publication coverage remains pending |
| Modern cache and subscription metadata | TypeScript client adapter emits bounded `next_cursor_present`, `cache_ttl_ms`, `cache_scope`, `subscriptions/listen` request/acknowledgement markers, and list-change/progress/cancellation signal metadata without retaining cursor or subscription values | Implemented locally with regression coverage | Publish the SDK package and capture the metadata through a real modern-protocol fixture |
| Refresh and task transition projection | Accepted ingest now enqueues bounded refresh work by default; explicit task transition history is persisted by the service-role worker by default, with explicit `false` rollback flags; the bounded projection now selects `task_id` and `payload` required to derive hashed transitions; the TypeScript server wrapper records hashed task handles and explicit lifecycle state for `tasks/get`, `tasks/update`, and `tasks/cancel` | Implemented and production-verified for a non-empty worker batch; SDK lifecycle/privacy regression is merged in PR #170 with the full release gate green | Keep the worker and ingest smoke fixtures in recurring release validation; complete capability-negotiation and cross-server workflow fixtures |
| Transport disconnect evidence | Node client adapter now drains in-flight tool and non-tool requests on transport error/close into bounded `transport_error` observations before ending the session; real official Stdio child-exit and Streamable HTTP socket-disconnect fixtures now pass | Implemented locally with regression coverage | Hosted cross-language compile evidence and authenticated production disconnect UAT |
| Connection-key scope | API keys can carry optional bounded service/environment scopes; ingest rejects mismatched labels with a tenant-safe 403 while legacy NULL-scoped keys remain workspace-wide | Implemented and deployed; migration applied, read-only postflight added, release-gate/tenant-isolation coverage passed; production postflight observed 49 active workspace-wide keys, 0 invalid scopes; live smoke accepted a matching event, rejected a mismatched label with 403, and the authenticated export showed the matching event | Keep scope behavior in the recurring release smoke and rotate/revoke the temporary pilot key under the operator’s key-retention policy |

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
- [x] Run full release gate and production smoke for this change.
- [x] Verify all new docs routes in the deployed browser after rollout.
- [x] Run a production OTLP/HTTP JSON smoke with a scoped connection key and
      verify the mapped event in the authenticated export.

## Evidence log

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
