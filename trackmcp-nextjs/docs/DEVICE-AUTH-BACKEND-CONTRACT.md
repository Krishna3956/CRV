# CLI device authorization backend contract

All endpoints are HTTPS-only and return `cache-control: no-store` when they
contain one-time material. Device codes are held by the CLI in memory; the
database stores only hashes.

## Create a session

`POST /api/v1/cli/device/sessions`

```json
{
  "client_version": "0.2.0",
  "platform": "darwin-arm64",
  "package_manager": "npm",
  "sdk_package": "@trackmcp/sdk"
}
```

Returns `201` with `device_code`, `user_code`, `verification_uri`,
`verification_uri_complete`, `expires_in: 600`, and `interval: 5`. The device
code is never logged or placed in the browser URL.

## Browser approval

`POST /api/v1/cli/device/sessions/approve`

Requires the existing Supabase browser session. The body contains
`user_code` and an explicitly selected `workspace_id`. The user must be a
workspace member. It never returns a key.

The stable status contract is:

| Condition | HTTP | Body |
|---|---:|---|
| normal approval | 200 | `{ "status": "approved" }` |
| session already approved | 200 | `{ "status": "already_approved" }` |
| session already redeeming/redeemed | 409 | `{ "status": "already_redeemed" }` |
| expired | 410 | `{ "status": "expired" }` |
| denied or workspace not accessible | 403/409 | `{ "status": "denied", "reason_category": "user_denied" }` |
| malformed or unknown code | 400/404 | `{ "status": "invalid" }` |
| unexpected service failure | 500 | `{ "error": "..." }` with no secret material |

An unexpired `pending` session with a valid authenticated workspace approval
request follows the normal-approval row and becomes `approved`.

Approval is idempotent: a repeated approval after the first successful update
returns `already_approved`. Approval never creates or redeems a key; only the
CLI redemption endpoint can receive the raw key.

## Poll

`POST /api/v1/cli/device/sessions/poll`

```json
{ "device_code": "..." }
```

Returns one of `authorization_pending`, `slow_down`, `approved`, `denied`, or
`expired`, with a bounded server-directed interval. Polling never creates or
redeems a key. Durable `last_polled_at`, `poll_count`, expiry, and a process
rate limiter provide layered abuse protection.

## Redeem

`POST /api/v1/cli/device/sessions/redeem`

```json
{
  "device_code": "...",
  "redemption_id": "random-client-retry-id",
  "key_name": "optional-bounded-project-label"
}
```

`redemption_id` is optional for compatibility; clients should provide a random
value and reuse it on retries. The server hashes it and derives the one initial
key deterministically from the session and a server-only derivation secret.
That lets a lost response be safely retried without storing the raw key or
creating a duplicate. Concurrent claims are serialized by the session status
and the unique key hash. A different retry identity receives a non-secret
`already_redeemed` response. The matching retry receives the same raw key over
TLS exactly as needed to recover a lost response.

## Key status

`GET /api/v1/cli/key-status`

```http
Authorization: Bearer tmcp_...
```

Returns only bounded status: `valid`, `invalid`, or `revoked`, plus
`workspace_available` and `service_available`. It never returns payloads,
email, membership lists, or the key.

## Reporting

`GET /api/v1/activation/funnel` is read-only and requires the service admin
header. Browser activation facts are accepted through the authenticated,
bounded `POST /api/v1/activation/events` endpoint. The report combines those
facts with device sessions and first accepted ingest milestones. NPM downloads
remain separate aggregate data and are never treated as unique users.
