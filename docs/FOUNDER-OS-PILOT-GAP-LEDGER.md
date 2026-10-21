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
- [ ] Run full release gate and production smoke for this change.
- [ ] Verify all new docs routes in the deployed browser after rollout.

## Evidence log

- Transport observer implementation and tests are present in the TypeScript
  package; `packages/typescript-sdk/test/client-adapter.test.mjs` covers the
  Node export boundary, transport support, fail-open behavior, and client-only
  observation semantics.
- Previous full release gate passed 115 suites. This change requires a fresh
  release-gate run before its deployment is considered complete.
