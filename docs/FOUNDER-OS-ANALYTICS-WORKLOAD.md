# Founder OS analytics workload thresholds

This is a review policy, not a production SLO or a claim about current
customer volume. It gives the operator and release owner a deterministic point
at which to investigate query plans, rollups, or deeper cursor pagination.

| Observation | Review trigger | Response |
| --- | ---: | --- |
| v1 source scan | 8,000 rows | Mark the read `near_cap` and inspect query-plan/latency evidence. |
| v1 source scan | 10,000 rows | Mark the read capped/partial; narrow the window or use a reviewed rollup path. |
| Per-window source volume | 25,000 rows | Review a rollup or pre-aggregation design before increasing scan limits. |
| Catalog page | 100 rows plus one sentinel | Continue with an opaque cursor; never increase the page silently. |
| Catalog identity cap | 500 identities | Disclose truncation and review a versioned projection/rollup. |
| Cursor depth | 50 pages | Review query plans and a better cursor/index strategy. |

The current application bounds remain the source of truth: a maximum 90-day
v1 window, a 10,000-row event scan, 100-row catalog pages, and bounded v2
cursor reads. The policy module at
`trackmcp-nextjs/src/lib/telemetry/analytics-workload-policy.ts` is a pure
assessment helper; it does not alter a route, raise a limit, or claim that a
rollup exists.

Before changing a bound, record the workspace shape, query plan, p95/p99
latency, error rate, freshness impact, and rollback path. A larger limit is not
an acceptable substitute for a measured projection or rollup when the source
scan is repeatedly capped.
