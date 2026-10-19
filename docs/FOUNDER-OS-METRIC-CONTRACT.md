# Founder OS metric contract

This is the product-facing vocabulary for the first dashboard read model. It
exists so that UI labels, API payloads, analyst queries, and future SDKs use
the same meanings. A metric is never evidence of a user outcome unless its
source explicitly says it is an outcome event.

| Key | Dashboard label | Formula | Source | Important boundary |
| --- | --- | --- | --- | --- |
| `ai_clients` | AI clients | Distinct observed `client_name` | Server telemetry | Not unique end users |
| `activity` | Activity | Observed `tool_call` count | Tool-call telemetry | Instrumented traffic only |
| `work_completed` | Work completed | Explicit completed / explicit started | Workflow outcome events | No session inference |
| `work_unresolved` | Unresolved workflows | Explicit started - completed - failed (bounded at zero) | Workflow outcome events | Missing terminal evidence; never labeled as abandonment |
| `task_pending` | Explicit task still in progress | Allowlisted task status (`working` or `input_required`) | Task event with a task ID | Pending is observed state; it is not abandonment |
| `task_completed` | Explicit task completion | Allowlisted task status (`completed`) | Task event with a task ID | Task completion is not proof of the customer's business outcome |
| `task_cancelled` | Explicit cancellation request/state | Allowlisted task status (`cancelled`) | Task event with a task ID | Cancellation is observed protocol state; worker shutdown and side-effect rollback are not inferred |
| `error_rate` | Error rate | Failed known-outcome calls / known calls | Tool-call telemetry | Unknown outcomes are not failures |
| `needs_attention` | Needs attention | Count of fired insight rules | Bounded analytics rules | Signals, not diagnoses |
| `identity_coverage` | Verified account coverage | Events with `account_identity_source=resolver` / eligible events | Resolver-labeled server telemetry | Event-weighted coverage; not unique organizations |
| `active_account_signals` | Active account signals | Distinct resolver-linked account keys with at least one event in the selected range | Resolver-labeled server telemetry | Privacy-safe dimensions; not unique people or customers |
| `active_account_signals_7d` | Active in last 7 days | Distinct resolver-linked account keys observed in the trailing seven days | Resolver-labeled server telemetry | Only available inside the selected range; not a weekly active-user claim |
| `returning_account_signals` | Returning account signals | Distinct resolver-linked account keys observed on more than one calendar day | Resolver-labeled server telemetry | Repeat activity, not retention or account identity proof |
| `account_activity_bands` | Account activity shape | Counts of resolver-linked keys with 1, 2–9, or 10+ observed events | Resolver-labeled server telemetry | Bounded bands; no raw keys or account names are exposed |
| `tool_adoption_breadth` | Capability breadth | Distinct observed tool names / bounded advertised catalog tools | Tool-call and catalog telemetry | A usage-surface ratio; not a customer adoption or demand score |
| `deployment_observations` | Deployment linkage | Distinct bounded deployment IDs observed in telemetry | Server telemetry | Count-only linkage; not deployment health, release status, or an inventory of deployments |
| `actionable_insights` | Needs attention | Bounded rule signals with affected volume, confidence, and suggested action when the evidence supports them | Analytics rule evaluation | Signals are not diagnoses; missing fields remain explicitly unavailable |
| `worker_health` | Derived-data worker health | Bounded backlog, queue lag, dead-letter count, and terminal success ratio findings | Latest workspace refresh-job projection | `insufficient_data` is not healthy; this is queue/read-model health, not customer activity or application uptime |
| `resource_events` | Resource activity | Observed resource method events | Protocol telemetry | Method observations; no resource content or URI is exposed |
| `prompt_events` | Prompt activity | Observed prompt method events | Protocol telemetry | Method observations; no prompt arguments or completion is inferred |
| `resource_entities` | Resources observed | Count of bounded hashed resource identities | Durable entity-read projection | Hash counts are not unique people or readable resource identities |
| `prompt_entities` | Prompts observed | Count of bounded hashed prompt identities | Durable entity-read projection | Hash counts are not unique people or prompt content |

## Read-model rules

1. Every metric response carries its selected time range.
2. `null`/`N/A` means the evidence is insufficient; it must not be rendered as
   zero.
3. Metrics derived from explicit events must identify that event source in the
   UI or API metadata.
4. Unknown, missing, or uninspectable data is retained as an uncertainty state
   rather than silently classified as success or failure.
5. Client names, tool names, and workspace identifiers are bounded and treated
   as dimensions—not identity proof.

The TypeScript registry at
`trackmcp-nextjs/src/lib/telemetry/metric-definitions.ts` is the executable
contract. Update the registry and its tests before adding a new product metric.

## Bounded read limits

Analytics reads are intentionally bounded and must disclose when the source
scan reaches a safety limit. The v1 projection accepts a maximum 90-day window
and scans at most 10,000 telemetry rows per request. Catalog history reads at
most 100 rows after fetching one sentinel row, catalog entity observations use
the same bounded source pattern, and the versioned tools endpoint returns at
most 100 projected rows per page using an opaque cursor. Catalog projections
cap returned tool identities at 500. These are query-safety limits, not claims
that a workspace has no older or additional data.

When a source scan reaches its limit, the response carries data-trust metadata
and the dashboard must treat the result as partial/incomplete. Consumers must
narrow the time range or use a future rollup/cursor path instead of assuming a
complete aggregate. Query plans and production latency remain operator gates;
this document records the application-level bounds only.

## Outcomes/reliability read model

`trackmcp-nextjs/src/lib/telemetry/outcomes.ts` aggregates projected facts into
a bounded, versioned response for future API and dashboard consumers. It keeps
`pending`, `unknown`, and `not_observable` counts instead of treating them as
failures or successes. `error_rate` is calculated only from known terminal
outcomes, and `workflow_completion_rate` is calculated only from explicit
terminal workflow outcomes. Both return `null` when there is no valid
denominator. Grouped results are limited to non-identity dimensions such as
service, environment, client, tool, and transport; missing dimensions are
reported as an explicit `unknown` group.

The aggregate also carries `terminal_workflow_completed` and
`terminal_workflow_outcomes`. These counts are the only denominator the
outcomes API may use for explicit workflow completion; generic tool activity or
session heuristics must not replace them.

The versioned reliability endpoint adds an evidence object. Its
`comparison_ready` flag is true only when at least two observed timeline
points are available; otherwise the state is `partial` or
`insufficient_data`. The outcomes endpoint reports `terminal_denominator` and
an `evidence_state`, plus unresolved-fact and evidence-quality disclosures, so
a missing explicit workflow outcome cannot be mistaken for a zero completion
rate.

The journeys endpoint reports observed sessions separately from explicit
workflow terminals. Its `journey_summary.unresolved` bucket includes sessions
without explicit workflow evidence; those sessions are never labeled as
abandoned merely because they went idle or lacked a terminal event.
