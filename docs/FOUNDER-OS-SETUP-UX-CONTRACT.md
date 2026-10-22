# Founder OS setup UX contract

This contract translates the setup section of the original Founder OS PDF into
the smallest customer-facing flow. It is intentionally separate from the
backend device-auth implementation.

## Primary path

The Setup page has one recommended path: **Native TrackMCP SDK**. The customer
should not need to understand MCP transports, OpenTelemetry, proxies, or
account identity before the first event arrives.

1. Create or select an MCP server and environment.
2. Generate a server/environment-scoped ingestion key; show it once and provide
   rotation/revocation through a compact key manager.
3. Choose TypeScript or Python and copy the exact install command/snippet.
4. Configure the key in the customer process. Metadata-only, fail-open behavior
   is the default.
5. Optionally connect an already-validated organization/tenant resolver. Never
   ask for an OAuth token and never block anonymous analytics.
6. Send a test event and show a checklist of what TrackMCP actually detected.

The CLI device authorization flow is an activation shortcut for obtaining a
connection key. It is not proof that a server has emitted an MCP event and must
not be presented as integration verification until ingestion observes one.

The versioned read-only contract at `GET /api/v2/setup` is the canonical
machine-readable status surface for this flow. It is workspace-scoped, accepts
either a signed-in member session or a connection key, bounds the requested
window to 1–90 days, and returns only state/check metadata plus a bounded
first-event timestamp/type. It never returns a secret, payload, or raw
identity. The dashboard may render richer guidance, but it must preserve the
same states and caveat language.

The optional `checks.account_resolver_observed` value is tri-state: `true`
means the latest event carried the explicit resolver source, `false` means the
latest event explicitly reported unresolved identity, and `null` means the
latest row predates the identity-source contract or otherwise lacks evidence.
The UI must not render `null` as either a resolved or unresolved customer.

For `server_created` and `waiting_for_first_event`, the response also carries
at most three bounded `next_steps`. These are operational guidance—not proof
that a process is running or that a business workflow completed. The dashboard
must keep the no-event caveat visible alongside the steps. When an event exists,
`first_event.ingestion_lag_seconds` is a bounded freshness indicator capped at
90 days; it is not infrastructure uptime or a delivery-time SLA.

`connected` is deliberately stricter than “a row exists”: the latest event
must include an MCP method, a recognized transport, and a payload-policy
marker. A received event missing any of that bounded evidence is
`connected_limited_coverage`, with remediation steps. This protects customers
from a green setup screen when TrackMCP only has generic or legacy telemetry.

## State vocabulary

The UI must use one of these explicit states:

- `server_created`
- `key_ready`
- `waiting_for_first_event`
- `connected_limited_coverage`
- `connected`
- `authentication_failed`
- `sdk_detected_no_mcp_event`
- `identity_not_configured`
- `insufficient_evidence`
- `integration_error`

Do not turn absent data into a green success state. Include last-event time,
freshness, coverage, and a short caveat in the same surface as each status.

## Other connection methods

Keep these collapsed under “Other connection methods”:

- **TrackMCP SDK through an existing OTel pipeline**: available through the
  bounded authenticated OTLP/HTTP JSON or protobuf receiver; OTLP/gRPC and external export
  remain unsupported until separately implemented and verified.
- **Generic OTel**: limited MCP semantics; requires customer instrumentation
  conventions and does not automatically provide account identity.
- **HTTP proxy or stdio launcher**: limited coverage and not currently a
  substitute for native SDK instrumentation.

## Privacy copy

Use this language consistently:

> TrackMCP observes the server boundary. Arguments, results, resource contents,
> OAuth tokens, and API keys are off by default. Account identity is optional
> and comes only from a resolver reading an identity your server has already
> validated.

## Verification checklist

The first-event checklist may show:

- API key accepted;
- SDK/event schema recognized;
- MCP method observed;
- transport observed;
- event persisted;
- privacy policy applied;
- account resolver observed (optional);
- last-event timestamp and ingestion lag.

It must not claim “workflow completed” merely because a tool call returned
without an error. Business completion requires an explicit application outcome
or a clearly labeled, bounded inference.

