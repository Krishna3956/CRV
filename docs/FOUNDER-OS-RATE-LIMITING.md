# Founder OS rate limiting boundary

The CLI device-session and key-status endpoints use the `RateLimitProvider`
interface in `trackmcp-nextjs/src/lib/cli/rate-limit.ts`.

## Current behavior

The default provider is a bounded in-process memory provider. Every response
that is rate-limited includes `x-trackmcp-rate-limit-mode: memory_degraded`.
This is intentionally not described as distributed protection: buckets are
lost on restart and are not shared between App Runner instances. The fallback
fails open only if its bounded bucket map is exhausted, so memory pressure does
not turn into a platform-wide outage. The edge/WAF remains the hard boundary.

Forwarded client addresses are ignored by default. Set
`TRACKMCP_TRUST_PROXY=true` only when the deployment's edge strips incoming
forwarding headers and rewrites them. Otherwise clients could spoof
`X-Forwarded-For` and evade or amplify a per-client limit.

## Production provider contract

Before calling this distributed, production-grade protection, provide an
implementation of `RateLimitProvider` backed by Redis, a managed edge limiter,
or an equivalent atomic store. It must:

1. atomically increment a key with a server-side expiry;
2. return the remaining retry time from the same atomic decision;
3. bound key cardinality and reject malformed/unbounded keys;
4. fail closed for the protected endpoint when the provider is unavailable,
   or explicitly return a documented degraded mode approved by security;
5. preserve the same scope prefixes (`device-start`, `device-poll`,
   `key-status`) and never include raw API keys or device codes in a key;
6. expose provider health and degraded-request counts.

The repository now includes a review-only Supabase atomic-bucket adapter in
`src/lib/cli/supabase-rate-limit.ts` and migration
`supabase/migrations/20261018000014_rate_limit_buckets.sql`. It is opt-in via
`TRACKMCP_RATE_LIMIT_MODE=supabase`; the default remains the bounded memory
provider. When opted in, the adapter calls a service-role-only RPC and fails
closed if the RPC is unavailable. Apply the migration and run its read-only
postflight before enabling that mode; the local contract tests do not prove
that production has the table or function.

An unset mode preserves the bounded memory fallback for local development. Any
non-empty value other than `supabase` fails closed; a configuration typo cannot
silently disable distributed protection.

The App Runner deployment template now carries `TRACKMCP_RATE_LIMIT_MODE` into
runtime configuration. It intentionally defaults to empty, so a redeploy
cannot enable distributed mode before its database postflight.

The same template carries `TRACKMCP_TRUST_PROXY`, defaulting to `false`. Set it
to `true` only when the App Runner edge is known to strip client-supplied
forwarding headers and rewrite them with the real client address. Leaving it
false is safer than assuming a proxy boundary that has not been verified.

When `TRACKMCP_ENABLE_FACT_WRITES="true"`, the deployment guard now rejects an
empty rate-limit mode. This prevents a multi-instance pilot from silently
combining durable derived writes with process-local rate-limit counters. Set
`supabase` after the rate-limit migration and read-only postflight are verified;
use `memory` only for explicitly limited single-process environments.

The same review-only migration includes the service-role-only
`trackmcp_cleanup_rate_limit_buckets` RPC. A scheduled maintenance invocation
must remove only bounded, expired buckets; it must not run in a request path.
The postflight checks that anonymous and authenticated roles cannot execute the
RPCs, and that the `service_role` can execute both the consume and cleanup
functions. This catches both accidental public exposure and an incomplete
worker grant before distributed mode is enabled.

The repository also includes a secret-authenticated cleanup route and the
serialized daily workflow `.github/workflows/founder-os-rate-limit-cleanup.yml`.
It requires `TRACKMCP_RATE_LIMIT_CLEANUP_URL` and the existing worker secret;
missing secrets fail loudly instead of reporting a false successful cleanup.

## Secret-free anomaly signal contract

`src/lib/telemetry/operational-anomalies.ts` defines bounded local signals for
429 spikes and 401/403 authorization anomalies. It evaluates a 15-minute
window, requires at least 20 observations, returns counts/rates only, and
never returns event identifiers, headers, keys, or payloads. Warning and
critical thresholds are review triggers, not a production alerting SLO. A
future worker may persist or deliver the signal only after its workspace scope,
deduplication, cooldown, and notification policy are reviewed.

## Verification checklist

- Unit tests cover window expiry, scope separation, retry-after calculation,
  forwarding-header safety, and bounded-map behavior.
- Load-test every protected endpoint across at least two instances.
- Verify that a client cannot evade limits by changing untrusted forwarding
  headers.
- Verify that a provider outage produces the explicitly approved behavior.
- Confirm edge limits are configured for the public device-start route before
  a multi-customer launch.

## Pilot threshold proposal (owner review required)

These are the current application thresholds and the proposed support/alert
interpretation. They are not a production SLO and are not approval from a
product or support owner until the release ledger records that review.

| Route | Bucket key | Current limit | Review trigger | Support interpretation |
| --- | --- | ---: | --- | --- |
| Device session start | Trusted client address | 10 / 60 seconds | Any sustained 429s or more than 5% rejected starts | Check automation/abuse; do not ask customers to retry rapidly. |
| Device session poll | Device-code hash | 120 / 10 minutes | 429s, repeated `slow_down`, or poll volume near 120 | Verify CLI interval handling and session expiry. |
| Device session redeem | Device-code hash (proposed edge gate) | 5 / 60 seconds | Any repeated redeem conflict or burst | Preserve redemption idempotency; never issue a second key for a replay. |
| Key status | Authorization-header hash | 30 / 60 seconds | 429s or a spike in invalid/revoked responses | Verify key status without requesting or logging the secret. |

The browser approval route remains protected by authenticated workspace
membership and should also be covered by the deployment edge before a broad
pilot. Owner review must confirm the thresholds against expected pilot
concurrency, false-positive tolerance, and the support escalation path. Any
change must update the route contract tests and this table together.
