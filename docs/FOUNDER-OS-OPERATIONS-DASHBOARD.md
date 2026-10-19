# Founder OS operational health contract

This is the local contract for the worker and queue health dashboard/alert
adapter. It is intentionally separate from the scheduler and notification
transport. The evaluator consumes only bounded status summaries and never
returns payloads, keys, customer identifiers, or error bodies.

## Findings

`evaluateWorkerHealth` emits four findings for each bounded observation window:

| Metric | Measurement | Warning | Critical | Launch interpretation |
| --- | --- | ---: | ---: | --- |
| `backlog` | queued job count | 25 | 100 | sustained backlog needs worker/retry review |
| `lag` | oldest queued age | 5 minutes | 15 minutes | freshness is degraded; do not present derived data as current |
| `dead_letter` | terminal dead-letter count | 1 | 5 | inspect the failure class before replay |
| `success_rate` | completed / terminal jobs | below 95% | below 80% | worker or dependency health is degraded |

All findings use `insufficient_data` when the sample is too small or the
measurement is unavailable. A missing sample is never rendered as a healthy
zero. Inputs are capped at 10,000 records, timestamps are bounded, and output
contains only counts, ratios, thresholds, and reason categories.

## Operator wiring boundary

The current implementation is a deterministic local contract. A production
adapter still has to supply aggregate status summaries from the reviewed
worker/read model, expose freshness and source count, and route warning/critical
states to the approved alert channel. It must preserve the same thresholds and
must not attach raw `last_error` or payload fields.

The dashboard should show the finding state, observed value, evaluation window,
sample count, and a remediation link. It should show “insufficient data” when
the worker has not produced enough observations, rather than “0 failures.”

## Recovery actions

- Backlog/lag: inspect lease ownership and allow the fenced recovery path to
  reclaim stale work; do not mutate rows from a request handler.
- Dead letters: inspect the bounded error category, then replay only through
  the reviewed idempotent path.
- Success rate: compare dependency health and retry saturation before changing
  thresholds.

Production scheduler configuration, alert delivery, and live lag evidence remain
operator gates in the pilot queue.
