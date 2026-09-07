# Chart and metric recommendations

## Metric contract

| Business metric | Definition | Eligible source | If unavailable |
| --- | --- | --- | --- |
| AI clients observed | Distinct client metadata values observed at the server boundary | Client metadata | `Not available yet` + explain missing client metadata |
| Activity | Server-observed tool-call count in the selected period | Server-boundary events | `No activity yet` or `Not enough evidence yet` |
| Work completed | Completed explicit workflow outcomes ÷ terminal explicit workflow outcomes | Explicit workflow outcome events | `Not enough evidence yet` or `No explicit workflow outcome data` |
| Needs attention | Count of supported actionable signals meeting evidence/volume rules | Analytics + quality + approved issues | `No actionable signals yet` |
| Capability error rate | Failed calls ÷ calls with known outcome | Capability quality | Withhold metric and show denominator reason |
| Capability latency | p50/p95 of eligible observed durations | Server-observed timing | `Not enough evidence yet` when sample minimum is unmet |
| Retry rate | Explicit/known retries ÷ eligible calls | Retry-aware event fields | Withhold if grouping or denominator is missing |
| Empty-result rate | Observable empty results ÷ inspectable successful results | Result visibility fields | Explain redaction/inspection limitation |
| Returning AI clients | Clients with observed repeat activity in a defined period | Supported client identity model | Do not substitute sessions |

## Overview charts

### Activity over time

- Chart: bars for daily comparison; line only when period density makes trend more important than count.
- X-axis: date in the selected range.
- Y-axis: `Observed activity` count.
- Optional second series: `Explicit work completed`, only when workflow outcomes exist.
- Caption: `Server-observed activity in the selected period.`
- Tooltip/table: exact count, date, source, and bounded/partial marker.
- Do not call a session heuristic completion.

### AI clients observed

- Chart: horizontal ranked bars or exact table.
- X-axis: observed activity count or share, with denominator.
- Y-axis: client application name.
- Label: `AI clients observed`, not users.
- If only metadata is present, say `Client metadata observed at the server boundary.`

### Capability usage

- Chart: horizontal bars for top capabilities by activity.
- X-axis: observed requests.
- Y-axis: capability name.
- Pair with a table containing error rate, p95, retries, and explicit completion association.

### Journeys

- Chart: ordered journey step view only for explicit, sufficiently complete workflow data.
- Nodes: explicit workflow events and terminal outcome.
- No funnel shape unless each stage's denominator and ordering are proven.
- Show `Started`, `Completed`, `Failed`, and `No explicit outcome` separately.

### Issues

- Chart: no default chart. Use a ranked issue table with evidence state, affected scope, period, and next action.
- Optional trend sparkline only when the issue has comparable time periods.

### Quality

- Chart: sorted table is primary; scatter plot is optional for a later study.
- If scatter is used: X-axis p95 latency, Y-axis error rate, point size activity, color only for evidence state.
- Always provide the table equivalent.

## Axis and labeling rules

- Every chart has a visible human-readable title and an accessible data table.
- Rates expose numerator/denominator near the value.
- Time axes share the global selected period.
- Exact values are available without hover-only dependence.
- No 3D charts, decorative donuts, unsupported gauges, mixed units, or rainbow palettes.

## Narration rules

If the API can prove it, narrate the decision:

> Activity increased 18% in the selected period, driven mostly by Claude connections.

If it cannot prove it, narrate the limitation:

> Activity is visible, but explicit task outcomes are not available yet.
