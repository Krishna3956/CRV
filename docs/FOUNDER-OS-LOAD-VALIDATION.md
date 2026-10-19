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

The latest repeat run on 2026-10-19 used the documented 120-request,
concurrency-8 shape with the 10-second timeout: 0 errors, 0 timeouts, p50
2.02 ms, p95 14.24 ms, p99 23.78 ms, maximum 27.83 ms, and zero
tenant-isolation failures. It remains fixture evidence only.

The default budgets are p95 ≤ 750 ms and error rate ≤ 1%. The report also fails if a tenant response contains the other tenant's marker. Exit code `0` means all budgets passed; `1` means a measured budget failed; `2` means invalid invocation.

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

These results are synthetic fixture-server evidence only. They do not prove
App Runner capacity, Supabase write throughput, distributed limiter behavior,
or customer-facing activation success. A production-shaped run must use a
disposable account/key, an approved request budget, and a retained report.
