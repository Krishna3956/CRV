# Founder OS protocol evidence matrix

This matrix is the product truth boundary for protocol coverage. “Observed”
means the current event envelope and dashboard can show the behavior. “Partial”
means only a bounded proxy is available. “Deferred” means the product must not
claim coverage until a fixture, persistence rule, and dashboard evidence path
exist. A missing observation is never interpreted as a successful or failed
protocol operation.

| Surface | Current evidence | Product status | Required evidence before claiming full coverage |
| --- | --- | --- | --- |
| `initialize` / negotiated protocol version | protocol event fields and versioned validation | Observed | Versioned fixtures for supported revisions |
| protocol revision boundary | Browser tester supports the legacy handshake revisions listed in its contract; a requested `2026-07-28` revision fails closed instead of being sent through the legacy handshake | Partial | Implement and conformance-test modern stateless `server/discover`, per-request metadata, `subscriptions/listen`, and the Tasks extension before claiming modern compatibility |
| `tools/list` | catalog metadata and bounded tool projections | Partial | Complete snapshot rows, pagination fixtures, historical joins; workspace-scoped timestamp cursor now exists for catalog history |
| `tools/call` | tool-call events, outcomes, latency, errors | Observed | Transport lifecycle and representative client fixtures |
| `resources/list` / `resources/read` | method-family counts, SDK-emitted SHA-256 resource-read identity counts, and a review-ready idempotent entity-read projection | Partial | Apply and postflight the entity-read migration, then verify durable read-outcome joins; raw URI identities remain unavailable by design |
| `prompts/list` / `prompts/get` | method-family counts, SDK-emitted SHA-256 prompt-read identity counts, and a review-ready idempotent entity-read projection | Partial | Apply and postflight the entity-read migration, then verify durable input/completion joins; raw names/arguments remain unavailable by design |
| pagination | bounded request metadata where emitted; catalog history and v2 tools expose opaque cursors | Partial | Add protocol-level cursor fixtures and broader truncation evidence |
| cancellation | bounded retry/interaction fields | Partial | Client and server cancellation fixtures per transport |
| progress notifications | Canonical protocol events plus a bounded semantic `progress` signal; never counted as a business outcome | Implemented locally / bounded | Add SDK/exporter emission coverage and dashboard timeline |
| list-changed notifications / subscriptions | Canonical protocol events plus bounded `catalog_changed`, `subscription_started`, and `subscription_stopped` signals | Implemented locally / bounded | Add SDK/exporter emission coverage, invalidation, reconnect, and dashboard projections |
| completions | semantic fixtures plus TypeScript server-wrapper response observation when a bounded result type is present | Partial | Completion read model, broader runtime fixtures, and dashboard evidence |
| sampling | semantic fixtures plus TypeScript server-wrapper response observation for bounded `complete` / `input_required` results | Partial | Capability-aware durable request/result persistence, broader runtime fixtures, and privacy policy |
| elicitation | semantic fixtures plus TypeScript server-wrapper response observation for bounded `complete` / `input_required` results | Partial | User-input lifecycle persistence, broader runtime fixtures, and dashboard outcome evidence |
| tasks / workflows | bounded task IDs, explicit task-state classification, `/api/v2/tasks`, and workflow correlation fields exist | Partial | Durable task expiry/late-completion history and cross-server journey joins |
| streamable HTTP | transport enum, browser tester boundary, and bounded TypeScript failed-session evidence on transport errors | Partial | Disconnect, reconnect, stream termination, and proxy fixtures |
| stdio | transport enum and SDK documentation; TypeScript/Python initialize/shutdown boundaries, bounded TypeScript session duration, and explicit Python transport metadata | Partial | Process-start/exit/crash fixtures, disconnect evidence, and local consumer evidence |
| OTLP/HTTP JSON | bounded authenticated receiver | Partial | Clean exporter-to-ingest smoke with a real key |
| OTLP protobuf / gRPC | intentionally not implemented | Unsupported | Separate receiver and interoperability review |

The matrix is deliberately explicit about boundaries so a dashboard card can
display “unknown” or “insufficient evidence” without silently converting an
unobserved protocol surface into a product claim.
