# Founder OS: External Standards and Security Decisions

Status: local review record (2026-10-19)

This record captures decisions made from primary standards and specifications. It is advisory design input for the local Founder OS implementation. It does not authorize a deployment, a Supabase migration, or a change to production data.

## Executive decisions

1. TrackMCP should use OpenTelemetry-compatible names and shapes at the transport boundary, while keeping Founder OS business facts as a separate, versioned domain layer.
2. Event names must be stable and low-cardinality. Dynamic values belong in attributes, never in event names.
3. Request and outcome events are different concepts. A request with a duration belongs to a span/operation; a state transition or point-in-time outcome belongs to an event. Founder OS must not infer a completed business outcome merely because a request returned without an error.
4. Prompt text, tool arguments, tool results, resource contents, authorization tokens, API keys, raw referrer URLs, IP addresses, and email addresses are not collected by default. If content capture is ever introduced, it must be explicit opt-in, bounded, redacted, and separately retained.
5. `clientInfo` and `serverInfo` are claimed software metadata for display, logging, and debugging. They are not identity proof, authorization evidence, or a security boundary.
6. High-cardinality or privacy-sensitive attributes are opt-in. The default Founder OS payload should contain only bounded identifiers, low-cardinality classifications, timing, protocol/method names, status, and coarse error categories.
7. Account identity is pseudonymous and resolver-provided. It must be documented as a claim, not a verified person identity. Do not silently turn an SDK-provided account identifier into a cross-product identity.
8. MCP authorization belongs at the HTTP/resource boundary and should follow the MCP OAuth discovery/PKCE model when TrackMCP itself protects a resource. API-key ingestion and MCP user authorization remain separate credential domains.

## Evidence from authoritative sources

### OpenTelemetry event conventions

OpenTelemetry defines events as named occurrences at meaningful points in time, such as checkpoints, state changes, and outcomes. Operations with a meaningful duration should be modeled as spans, while properties describing the whole operation belong on span attributes. Event names must uniquely identify a stable event structure and must not contain dynamic values. Attributes should be documented, bounded, and selected for filtering, grouping, aggregation, or correlation.

Source: [OpenTelemetry semantic conventions for events](https://opentelemetry.io/docs/specs/semconv/general/events/)

### OpenTelemetry requirement levels and privacy

OpenTelemetry's requirement-level guidance says attributes that are expensive, high-cardinality, security-sensitive, or privacy-sensitive should be `Opt-In`; required attributes should be only those that are essential and reliably available. This directly supports keeping content fields and detailed identifiers out of the default SDK payload.

Source: [OpenTelemetry attribute requirement levels](https://opentelemetry.io/docs/specs/semconv/general/attribute-requirement-level/)

### OpenTelemetry GenAI and MCP attributes

The OpenTelemetry GenAI conventions include MCP attributes such as protocol version, method name, resource URI, and session ID. The conventions also warn that input/output messages may contain sensitive information and support filtering or truncation. Founder OS should reuse compatible attribute names where their semantics match, but should not copy sensitive content into its default event model.

Sources: [OpenTelemetry GenAI attributes](https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/), [OpenTelemetry MCP attributes](https://opentelemetry.io/docs/specs/semconv/registry/attributes/mcp/)

### OpenTelemetry log/event data model

The OpenTelemetry log data model separates the source/resource, timestamp, event name, and attributes. It is designed to preserve meaning across systems rather than force a single vendor storage format. Founder OS should therefore preserve source timestamps and an observed/received timestamp, and keep transport normalization separate from product classification.

Source: [OpenTelemetry Logs Data Model](https://opentelemetry.io/docs/specs/otel/logs/data-model/)

### MCP identity metadata

The current MCP specification guidance treats `clientInfo` and `serverInfo` as implementation metadata intended for display, logging, and debugging. They are self-reported and must not be used for behavior or security decisions. Founder OS may record bounded software name/version fields, but must never use them as account identity or authorization.

Source: [MCP TypeScript SDK protocol revision guidance](https://ts.sdk.modelcontextprotocol.io/v2/migration/support-2026-07-28)

### MCP authorization

MCP authorization guidance models an HTTP MCP server as a protected resource. The resource returns a `401` challenge and discovery metadata; an authorization server performs OAuth authorization code flow with PKCE and issues tokens. The resource validates the token but does not issue it. Founder OS should preserve this separation if it adds protected MCP resources.

Sources: [MCP Apps authorization guidance](https://apps.extensions.modelcontextprotocol.io/api/documents/authorization.html), [MCP Ruby server authorization guidance](https://ruby.sdk.modelcontextprotocol.io/server/authorization/)

### Data minimization and pseudonymisation

GDPR Article 5 requires purpose limitation and data minimization: personal data must be adequate, relevant, and limited to what is necessary. Pseudonymisation reduces risk but does not automatically remove data-protection obligations. A plain unsalted SHA-256 of a low-entropy user identifier can be linkable and must not be described as anonymous.

Source: [EUR-Lex GDPR, Article 5](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679)

## Decisions for the Founder OS implementation

### 1. Two-layer telemetry model

Maintain two explicit layers:

- **Transport layer:** OTel-compatible spans/events and MCP attributes (`mcp.method.name`, `mcp.protocol.version`, bounded session/request identifiers, timing, status, error type).
- **Product layer:** Founder OS facts and classifications (`completed`, `failed`, `pending`, `unknown`, `not_observable`; evidence quality; data-quality flags; work-completed and needs-attention facts).

The product layer is a projection of transport evidence. It must never overwrite raw evidence or pretend that an unobservable result is a success.

### 2. Required default event fields

For accepted events, the default contract should require only:

- contract version and classifier version;
- event name and source timestamp;
- received timestamp assigned by the ingestion service;
- workspace scope;
- bounded service/tool identity;
- protocol and operation/method name when available;
- coarse outcome/status and bounded error category when observed;
- a correlation/request identifier only when needed for bounded retry/session analysis;
- optional pseudonymous account key plus its source (`resolver` or `unresolved`).

The server should reject or drop fields outside the allowlist rather than storing arbitrary user payloads.

### 3. Content policy

Default: do not persist prompt content, tool arguments, tool results, resource bodies, headers, authorization tokens, API keys, cookies, full URLs, IPs, email addresses, or arbitrary exception messages.

If a future diagnostic mode needs content:

- require an explicit workspace-level opt-in;
- show the retention period before enabling it;
- redact secrets and known PII before serialization;
- cap bytes, nesting depth, array lengths, and string lengths;
- sample rather than capture every event;
- store it in a separately permissioned table/bucket;
- make deletion and export possible;
- never include it in aggregate dashboard queries by default.

### 4. Identity policy

The existing `account_key` is a bounded pseudonymous correlation key, not an identity assertion. Keep `account_identity_source` and expose it in data-quality diagnostics. If stronger cross-workspace unlinkability is required, prefer a server-side keyed HMAC (with rotation/versioning) over plain SHA-256. Never accept a raw email or raw account ID as an analytics key.

### 5. Outcome policy

Classify only from explicit evidence:

- explicit success/completion event or trusted protocol response → `completed`;
- explicit error/decline/cancel → `failed` or a distinct decline/cancel subtype;
- retry/pending/accepted-but-not-final → `pending`;
- contradictory evidence → `unknown` plus `conflicting_evidence`;
- no valid observation → `not_observable`.

Absence of an error is not evidence of business completion. “No retry observed” must remain distinct from “abandoned.”

### 6. MCP metadata policy

Record `clientInfo`/`serverInfo` only as bounded metadata for debugging and segmentation. Do not use them to resolve a user, authorize a request, grant workspace access, or infer an organization. Require a separate authenticated account/workspace association for those actions.

### 7. Authorization policy

Keep three concerns separate:

- CLI device authorization: short-lived user code, browser approval, one-time redemption, no API key in browser;
- ingestion credential: TrackMCP connection/API key, sent only to the ingest endpoint and stored locally with restrictive permissions;
- MCP resource authorization: OAuth discovery, PKCE, bearer-token verification, and scopes when a TrackMCP-served MCP resource is protected.

Do not reuse an ingestion key as an OAuth access token, and do not put either credential in telemetry attributes or logs.

## Gaps to close before calling Founder OS production-ready

1. **Engineering boundary implemented on 2026-10-29:** the ingest validator now
   enforces the top-level field contracts plus an explicit `_trackmcp`
   metadata allowlist and bounded nested payload depth, keys, items, nodes,
   strings, and bytes. Keep the focused negative tests in the release gate;
   this does not by itself approve payload capture or close production privacy
   acceptance.
2. **Engineering boundary implemented on 2026-10-29:** server-side ingest now
   redacts named secret/privacy/error fields and drops email addresses, IPv4/
   IPv6 network addresses, and full HTTP(S) URLs from arbitrary payload strings;
   focused negative tests cover headers/tokens/API keys, emails, IPs, URLs,
   exception text, and nested objects. This does not approve payload capture or
   close production privacy acceptance.
3. Add a retention job for raw events, derived facts, and optional diagnostics, with documented durations and a dry-run report.
4. Add a workspace privacy/settings surface for telemetry opt-in, content diagnostics, retention, and deletion/export requests.
5. Add OTel interoperability tests that round-trip Founder OS events without changing event names or timestamps.
6. Add an identity-key version field before adopting server-side HMAC; this permits safe rotation without silently joining different pseudonym spaces.
7. Add MCP OAuth discovery/401/PKCE integration tests if TrackMCP becomes a protected MCP resource.
8. Add a data-quality dashboard showing evidence quality and source coverage; never hide “unknown” or “not observable” behind success percentages.
9. Add a versioned migration/read-model strategy so metric definitions can evolve without rewriting historical facts.
10. Document the controller/processor and subprocessor responsibilities for any hosted telemetry or export integration before enabling content capture.

## Release gate

The next Founder OS release should not be considered complete until the following are true:

- all default attributes have an explicit requirement level and cardinality budget;
- all sensitive fields are covered by negative tests;
- no dashboard metric labels unobserved activity as completed;
- identity source and data-quality flags are visible to operators;
- retention and deletion behavior are documented and exercised;
- SDK, ingest, derived facts, and dashboard agree on the same contract and version;
- no production migration or deployment is performed from this document alone.

