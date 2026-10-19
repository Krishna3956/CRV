# Founder OS refresh jobs

Founder OS read models are derived data. They must not be rebuilt synchronously
inside an ingest request or a dashboard request. A bounded worker processes
durable jobs and records whether the work succeeded, should be retried, or is
permanently failed.

## Job kinds

| Kind | Responsibility | Idempotency boundary |
| --- | --- | --- |
| `fact_projection` | Project accepted events into semantic facts | `(workspace_id, source_event_id, fact_version)` |
| `action_queue_refresh` | Re-evaluate bounded facts into action-queue signals | `(workspace_id, evaluation_key, policy_version)` |
| `catalog_recompute` | Rebuild catalog observations/read-model snapshots | `(workspace_id, observation_window, classifier_version)` |
| `catalog_entity_recompute` | Project idempotent hash-only `resources/read` and `prompts/get` observations | `(workspace_id, source_event_id, catalog_kind, entity_hash)` |
| `retention_cleanup` | Produce and then apply an approved retention batch | `(workspace_id, dataset, cutoff, policy_version)` |

The durable job key is a dedupe key, not an event payload or a secret. Each
worker must re-check workspace scope and policy version before writing.

## Lifecycle

`queued → running → succeeded` is the normal path. A transient failure becomes
`retryable` with bounded exponential backoff (1 minute, 5 minutes, 25 minutes,
2 hours, 10 hours; capped at 12 hours). After the configured attempt limit,
the job becomes `failed`. A running job whose lease expires may be reclaimed by
another worker; the attempt count still increments, preventing an infinite
crash loop. Terminal jobs are never claimed again.

The policy implementation is `src/lib/telemetry/refresh-jobs.ts`. It is pure
so the production adapter can use Supabase RPC/conditional updates, while tests
can exercise all transitions without a database.

The execution boundary is `src/lib/telemetry/refresh-worker.ts`. The single-job
entry point is `runRefreshJobOnce`; external schedulers and queue consumers may
use `runRefreshJobBatch` with a maximum of 100 jobs and an abort signal. The
batch runner is deliberately not a scheduler: it does not poll indefinitely,
and stops when the store is idle, the caller cancels it, or its bounded
wall-clock deadline expires. The default deadline is 45 seconds; callers may
lower it or choose another value up to 60 seconds, while the scheduled route
still owns its request-level abort.

## Worker requirements

1. Claim with a conditional predicate on state and lease expiry; never select
   then update without a claim predicate.
2. Use a stable dedupe key and upsert conflict handling for every projection.
3. Bound each invocation by a wall-clock deadline and item count. The local
   batch boundary caps one invocation at 100 jobs and 45 seconds by default
   (with a hard 60-second maximum); the production trigger must still impose
   its own request-level deadline as a second safety boundary.
4. Store error codes and redacted bounded details only; never raw event payloads,
   credentials, request headers, or full URLs.
5. Record a dry-run report before retention cleanup. Cleanup is a separate,
   explicitly approved operation, not an implicit retry.
6. Expose job lag, retry count, failed count, and last successful run as data
   trust fields in the dashboard. The analytics response now returns bounded
  `refresh_status` counters from the latest 100 workspace jobs, and the
  dashboard renders them as operational freshness evidence. The response uses
  `degraded` whenever queued, running, retryable, or failed rows are present;
  `available` is reserved for a non-empty all-terminal-success sample. “No
  job” is not evidence of “no activity.”

7. Fence result writes by lease owner and lease expiry. A worker that finishes
   after its lease has been reclaimed must receive a rejected transition; it
   must never be allowed to overwrite the replacement worker's result. The
   pure helper `recordRefreshJobResultForOwner` enforces this boundary and the
   Supabase adapter must mirror it with a conditional `WHERE lease_owner = ?
   AND lease_until > now()` update.

8. Keep the claim and result transition on the same job identity. A worker
   cannot use a dedupe key alone to complete work, because a dedupe key may be
   reused across retries or policy versions.

The review-only SQL migrations create the durable table/indexes and the
service-role-only RPC claim/result boundary. They have not been executed by
this checkout. The RPC postflight must show both functions present, executable
by `service_role`, and not executable by `anon` or `authenticated`. A
deployment can use the secret-authenticated `POST /api/internal/refresh/run`
route and the review-ready `.github/workflows/founder-os-refresh-worker.yml`
  schedule. The route aborts after 45 seconds, below the workflow's 55-second
  request deadline, and carries cancellation into the bounded batch. It returns
  a non-2xx response when the batch contains retryable or failed jobs (or is
  aborted), so the external scheduler cannot mark degraded work as successful
  and suppress the next retry. Idle and fully successful batches remain 2xx.
  The workflow fails loudly when either secret is absent (so a green scheduled run cannot mask
  a worker that never ran), serializes scheduled/manual runs, and retries transient
  curl failures within the bounded request deadline. Configure
  `TRACKMCP_REFRESH_WORKER_URL` and `TRACKMCP_REFRESH_WORKER_SECRET` only after
  the migrations and postflight checks pass.

The App Runner deployment template now maps
`TRACKMCP_REFRESH_WORKER_SECRET` from the same Secrets Manager JSON object into
runtime secrets. A fresh deployment therefore has the secret expected by the
scheduled workflow; the secret value itself remains outside the repository.

The current handlers project raw events into bounded semantic facts, refresh
Action Queue candidates, and write privacy-safe catalog version rows from the
newest eligible catalog observation. Catalog history is joined into the
workspace-scoped browser projection. Retention cleanup remains fail closed
until an approved dry-run batch exists; that limitation may not be treated as
silently successful.
