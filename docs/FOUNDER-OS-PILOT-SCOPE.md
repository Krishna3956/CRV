# Founder OS 100-customer pilot scope

Version: `2026-10-19`  
This is the customer-facing scope boundary for the limited pilot. A row marked
`supported` describes an implemented contract; it does not replace the
production/operator evidence required in the work queue.

| Capability | Classification | Pilot boundary | Evidence required before a go decision |
| --- | --- | --- | --- |
| Terminal-first CLI activation | supported | `npx @trackmcp/cli init`, browser approval, CLI-only redemption, and restrictive local storage | Fresh production activation and redemption smoke |
| Existing-key reuse and diagnostics | supported | `init` reuses a valid key; `doctor` reports bounded status without printing it | Clean consumer run with a real key |
| TypeScript/Node.js SDK | supported | Server-boundary capture, local redaction, bounded fail-open delivery | Exact published package and first accepted event |
| Python SDK | supported with bounded coverage | Server-boundary capture and documented setup; no claim of client-side instrumentation | Exact published package and first accepted event |
| OTLP interoperability | limited | OTLP/HTTP JSON or protobuf, with bounded MCP mapping and local redaction; OTLP/gRPC remains out of scope | Production OTLP/HTTP smoke if included in the launch scope |
| Ingest | supported | Authenticated, workspace-derived key scope, bounded payloads, atomic batches, revocation checks | Production first-ingest and cross-workspace negative test |
| Dashboard analytics | limited | Bounded windows/pages/scans; partial or truncated evidence is disclosed | Production dashboard smoke and query-cost/latency evidence |
| Setup readiness contract | supported with bounded coverage | The dashboard reports required key, first-event, MCP-method, transport, and privacy-policy evidence; identity resolution is optional and never blocks connection | Production setup response and first-event evidence |
| Catalog history and tool projections | limited | Hash-based, bounded observations; incomplete observations do not imply removals | Production refresh and catalog evidence |
| Action Queue and alert signals | limited | Bounded, workspace-scoped reads and human lifecycle transitions; worker/scheduler evidence remains required | Production worker batch and alert delivery evidence |
| Privacy export/request | supported as review-only | Bounded export and auditable request/review states; destructive completion remains closed | Reviewed deletion worker and postflight, or explicit exclusion from scope |
| Automatic package-install authentication | out of scope | `npm install`/`pip install` remains silent; activation is an explicit CLI action | Do not advertise lifecycle-hook authentication |
| Arbitrary OTel encodings and external export | out of scope | No promise of OTLP/gRPC, arbitrary encodings, or external exporter support; bounded OTLP/HTTP protobuf is supported | Separate reviewed feature scope |
| Production scheduler SLOs | not yet evidenced | Local worker contracts exist; live cadence, lag, retries, and alert SLOs are not claimed | Operator batch and lag evidence |

## Release wording rule

Customer copy may call a capability “supported” only when its documented
boundary and local contract tests agree. “Supported” does not mean unlimited,
zero-latency, or production-proven. Use “limited” whenever a read is bounded,
derived, partial, or dependent on a worker/operator gate. Keep “out of scope”
features out of setup snippets and launch promises.

## Pilot rollback and support boundary

The release owner must name the reviewed application SHA, image digest, rollback
owner, and package versions before inviting customers. If a capability fails,
support should use the incident and pilot-support runbooks rather than asking
for secrets or changing customer data manually.
