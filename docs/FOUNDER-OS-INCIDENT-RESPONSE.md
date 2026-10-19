# Founder OS pilot incident response

This runbook is an evidence-first response guide for the 100-customer pilot.
It is diagnostic and reversible. It does not run SQL, rotate keys, delete data,
or deploy a rollback by itself.

## Evidence rules

Record the candidate/deployed SHA, image digest, region, UTC timestamps, route
and status category, provider mode, latency/error summary, and a redacted
incident reference. Never record API keys, device codes, redemption IDs,
cookies, bearer values, service-role credentials, customer emails, or raw
payloads. Use a disposable workspace for any reproduction.

## Triage matrix

| Signal | First evidence | Safe first action | Escalate when |
| --- | --- | --- | --- |
| 401/403 spike | Route, workspace scope, key-status category, deploy SHA | Stop assuming it is a product outcome; compare auth/config changes and test one disposable key | Cross-workspace behavior changes, revoked keys are accepted, or secret leakage is suspected |
| 429 spike | `x-trackmcp-rate-limit-mode`, `Retry-After`, route scope, provider health | Preserve the retry window; inspect whether mode is `supabase` or `memory_degraded`; do not disable limits blindly | Distributed RPC is unavailable, false positives persist, or edge limits disagree |
| Ingest 5xx/latency | Accepted/rejected counts, p95/p99, provider/database error category | Confirm SDK remains fail-open; narrow the test batch and inspect service health | Data is partially persisted, duplicate counts rise, or customer serving is affected |
| Dashboard stale/partial | `data_trust` generated time, source count, returned count, truncation, refresh lag | Label the view partial/stale and narrow the time range; do not convert missing data to zero | Freshness exceeds the agreed pilot threshold or tenant scope is uncertain |
| Worker backlog/lag | Queue state, lease owner, attempt count, last error category, oldest age | Allow lease recovery and bounded retry; do not manually mutate rows in the request path | Stale worker can complete recovered work, retries exceed policy, or terminal failures rise |
| Database/RPC failure | Postflight result, RPC availability, migration/release SHA | Keep feature-gated writes disabled and preserve the last known-good read path | RLS/service-role boundaries fail or rollback compatibility is unknown |

## Decision boundaries

1. If tenant scope, key validity, or RLS behavior is uncertain, stop the pilot
   path and fail closed. Do not diagnose from aggregate counts alone.
2. If telemetry delivery is unavailable, serving may continue because SDK
   delivery is fail-open; record the loss window and do not claim complete data.
3. If a refresh lease is stale, allow the reviewed worker recovery path to
   reclaim it. Do not run ad-hoc updates that bypass lease fencing.
4. If a release is implicated, compare deployed SHA and image digest with the
   reviewed candidate before choosing rollback. Rollback is an operator action
   and requires the additive-schema compatibility decision.
5. If a privacy request or possible secret exposure is involved, preserve the
   audit reference, restrict access, and route to the privacy/security owner.

## Recovery evidence

Close an incident only when the triggering signal, affected scope, first
observed and recovered timestamps, mitigation, validation result, and known
limitations are recorded. “No failures observed” is not evidence of recovery.
For a pilot go/no-go decision, link the incident record to the release SHA and
the relevant Founder OS queue item.
