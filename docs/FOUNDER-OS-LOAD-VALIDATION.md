# Founder OS production-shaped load validation

`trackmcp-nextjs/scripts/production-load-harness.mjs` is a bounded local harness for measuring the ingest path and Founder OS v2 read paths before a production pilot. It never contacts production by default: without `--base-url`, it starts an in-memory fixture server that models two tenants.

## Run the fixture test

```bash
cd trackmcp-nextjs
node scripts/production-load-harness.mjs --requests 120 --concurrency 8 --timeout-ms 10000 --report /tmp/trackmcp-load-report.json
```

Latest local fixture evidence (2026-10-19): 240 requests at concurrency 16,
0 errors, p50 3.24 ms, p95 23.69 ms, p99 35.82 ms, maximum 40.43 ms, and zero
tenant-isolation failures. This is fixture-server evidence only and must not be
read as App Runner or Supabase capacity evidence.

The latest repeat run on 2026-10-19 UTC used the documented 120-request,
concurrency-8 shape with the 10-second timeout: 0 errors, 0 timeouts, p50
2.17 ms, p95 16.06 ms, p99 25.34 ms, maximum 29.86 ms, zero 4xx/5xx and
transport failures, and zero tenant-isolation failures. It remains fixture
evidence only.

The default budgets are p95 ≤ 750 ms and error rate ≤ 1%. The report also fails if a tenant response contains the other tenant's marker. Exit code `0` means all budgets passed; `1` means a measured budget failed; `2` means invalid invocation.

## Initial pilot envelope and acceptance criteria

This is the deliberately bounded **first-wave** profile for a 100-customer
pilot. It is a test target, not a capacity promise and not permission to send
traffic to production. The release owner must approve or replace each number
in the go/no-go record before any deployment-class run.

| Dimension | Initial target | What must be retained for production evidence |
| --- | --- | --- |
| Enrolled workspaces | At most 100 customer workspaces | Cohort count and candidate SHA/image digest |
| Concurrent active workspaces | 25 during the first launch window | Test-host sizing and observed concurrency |
| Telemetry sources | 1 telemetry-producing server per active workspace | Source count and accepted/rejected ingest totals |
| Ingest shape | Up to 60 events/minute/source; batches of 1, 10, 50, and 100 | Per-batch latency, 4xx/5xx split, timeout count, and request budget |
| Dashboard reads | At most 1 open dashboard session/active workspace; one refresh/minute/session | p50/p95/p99 by route, error rate, memory/CPU, and database/RPC behavior |
| Activation | 10 simultaneous disposable device flows | Start/poll/redeem success, expiration/replay behavior, and rate-limit mode |
| Refresh recovery | A disposable queued batch becomes terminally successful or terminally failed with bounded retries; no stale lease may mutate recovered work | Queue depth/oldest age, attempts, lag, retry result, and redacted error category |

The fixture budgets are p95 ≤ 750 ms, error rate ≤ 1%, and zero timeouts or
cross-tenant markers. A deployment-class run uses the same budgets unless the
release owner documents a stricter approved budget. It must also record memory
and queue behavior, which the local fixtures cannot prove. Never relax a
failing budget during a run to obtain a pass.

### Stop, recovery, and rollback rules

Stop new invitations and stop the affected pilot path immediately when any of
these occurs: a tenant-isolation or credential-scope doubt; raw protected data
or key exposure; a non-zero load-test timeout; error rate above 1%; p95 above
the approved budget; unbounded queue growth, lease-fencing uncertainty, or
terminal failures beyond the declared retry policy; or an inability to map the
running image to the reviewed candidate. Preserve redacted evidence and follow
`FOUNDER-OS-INCIDENT-RESPONSE.md`; do not repair production state with ad-hoc
SQL or manual queue mutation.

Resume only after the incident record identifies affected scope, first observed
and recovered UTC times, mitigation, validation result, remaining limitation,
and release identifier. If the release is implicated, use the reviewed
additive-schema rollback plan and the immutable image/commit identifiers in
`FOUNDER-OS-ROLLBACK-PLAN.md`. The release owner must send the pre-approved
customer-impact update through the support path recorded in the go/no-go
record; this document intentionally does not invent a customer contact.

## Exercise a local Next server

Start a local production server separately, then point the harness at loopback:

```bash
npm run build -- --webpack
npm run start -- --hostname 127.0.0.1 --port 3101
TRACKMCP_LOAD_KEY_A='a local test key' \
TRACKMCP_LOAD_KEY_B='b local test key' \
node scripts/production-load-harness.mjs \
  --base-url http://127.0.0.1:3101 \
  --requests 120 --concurrency 8
```

Only explicitly supplied local test keys are used. The harness does not read `.env.deploy`, AWS settings, Supabase credentials, API keys, or production configuration. Do not use real customer keys. Use a disposable local database or mocked route adapter if the local server is configured to write ingest events.

## Interpreting results

- `latencyMs` reports p50/p95/p99/max overall and per route.
- `errorRate` includes transport failures and all non-2xx responses.
- `statusClasses` splits successful responses, 4xx, 5xx, other HTTP responses,
  and transport failures. A 4xx/5xx split is required in the retained
  deployment-class report; never use the aggregate error rate to hide it.
- Every request is bounded by `--timeout-ms` (default 10 seconds, maximum 120 seconds). A timeout is reported separately and fails the run even when the error-rate budget would otherwise allow it.
- `tenantIsolationFailures` counts bodies containing the opposite fixture tenant marker.
- Read routes are sampled evenly; every fifth request is an ingest request. This is intentionally a smoke/load shape, not a capacity claim.
- A passing local run does **not** prove App Runner capacity, distributed rate limiting, Supabase performance, or OTel ingestion. Those require a separately approved environment and representative data.

Production use is intentionally not automated. Before any external run, review the target, credentials, data-write behavior, request count, and budget with the release owner.

## Activation and first-event profiles

`trackmcp-nextjs/scripts/activation-load-harness.mjs` is a separate local
fixture harness for the CLI lifecycle (`start`, `poll`, `redeem`) and ingest
batch sizes of 1, 10, 50, and 100 events. It refuses non-loopback hosts by
default, caps requests/concurrency, and reports the profiles separately so a
passing analytics read load cannot hide an activation failure.

Example fixture evidence (2026-10-19, 60 requests per profile, concurrency 8):

- ingest profile: 0 errors, 0 timeouts, p50 3.22 ms, p95 21.95 ms, p99 26.29 ms;
- activation profile: 0 errors, 0 timeouts, p50 2.23 ms, p95 3.13 ms, p99 4.11 ms.

The latest repeat (2026-10-19 UTC, 120 requests per profile, concurrency 8)
also passed: ingest p50 2.87 ms, p95 17.40 ms, p99 24.35 ms, maximum 25.48
ms; activation p50 1.75 ms, p95 4.12 ms, p99 5.11 ms, maximum 8.16 ms. Both
profiles had zero errors and zero timeouts.

These results are synthetic fixture-server evidence only. They do not prove
App Runner capacity, Supabase write throughput, distributed limiter behavior,
or customer-facing activation success. A production-shaped run must use a
disposable account/key, an approved request budget, and a retained report.
