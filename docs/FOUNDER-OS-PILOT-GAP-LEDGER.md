# Founder OS pilot gap ledger

Status: active autonomous audit, started 2026-10-21.

This ledger separates implemented behavior from documented boundaries. A
registry package, protocol capability, or OAuth flow is not treated as shipped
just because a README or marketing page mentions it.

| Surface | Current evidence | Status | Next proof |
| --- | --- | --- | --- |
| TypeScript server SDK | `packages/typescript-sdk`, consumer gate, release package `0.1.2` | Implemented | Keep release and compatibility checks green |
| Python server SDK | `packages/python-sdk`, package consumer gate, release package `0.1.4` | Implemented | Keep release and compatibility checks green |
| Transport observer / Node client adapter | `@trackmcp/sdk/client-adapter`; Node-only wrapper for Stdio and Streamable HTTP; metadata-only and fail-open; dedicated adapter tests | Implemented, now explicitly documented | Run production-like client fixtures when a pilot server is available |
| Go SDK | `packages/go-sdk/trackmcp.go`; transport-neutral primitive, source package only | Implemented with source-only distribution boundary | Publish only after package provenance/release work is approved |
| .NET SDK | `packages/dotnet-sdk/TrackMcp.cs`; transport-neutral primitive, source package only | Implemented with source-only distribution boundary | Publish only after NuGet/provenance work is approved |
| OTLP/HTTP JSON | Authenticated bounded receiver at `/api/v1/otel/v1/traces`; parser and interoperability tests | Implemented, protobuf/gRPC intentionally unsupported | Continue smoke coverage with a real collector fixture |
| MCP OAuth | TrackMCP does not issue, exchange, or parse customer OAuth credentials | Explicitly unsupported by design | Customer-owned OAuth integration must emit explicit bounded outcomes |
| Dashboard/session auth | Workspace membership, connection-key scope, revocation, tenant-isolation contracts | Implemented | Repeat production smoke after releases |
| Setup density | Secondary privacy/data-flow and export/deletion explanations moved behind accessible disclosures; primary setup actions remain visible | Implemented in current change | Live browser audit after deployment |
| Public docs parity | Added Go, .NET, Authentication/OAuth, and clearly named Transport Observer documentation paths | Implemented in current change | Check links, snippets, and package-version claims in CI |
| Node client protocol observer | Client adapter now emits bounded request/response/notification observations for every identified non-tool MCP request, including catalog counts, task/MRTR result discriminators, and list-changed/progress signals; arguments, URIs, prompt names, and result bodies remain excluded | Implemented locally with regression coverage | Deploy the SDK package and run a production-like client fixture before claiming live coverage |
| Refresh and task transition projection | Accepted ingest now enqueues bounded refresh work by default; explicit task transition history is persisted by the service-role worker by default, with explicit `false` rollback flags | Implemented locally with worker-handler coverage | Apply/postflight migrations and capture a non-empty production worker batch |
| Transport disconnect evidence | Node client adapter now drains in-flight tool and non-tool requests on transport error/close into bounded `transport_error` observations before ending the session | Implemented locally with regression coverage | Run production-like Stdio and Streamable HTTP disconnect/reconnect fixtures |
| Connection-key scope | API keys can carry optional bounded service/environment scopes; ingest rejects mismatched labels with a tenant-safe 403 while legacy NULL-scoped keys remain workspace-wide | Implemented locally with migration and integration coverage | Apply/postflight the additive migration and expose scope selection in the deployed Setup UI |

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
