# Plain-English terminology contract

## First-level replacement dictionary

| Current/technical term | First-level label | Supporting explanation |
| --- | --- | --- |
| Overview | Overview | How is your MCP product doing? |
| Tool calls | Activity | Requests observed at the server boundary |
| Sessions | Journeys / observed activity | A connected sequence of observed activity; not a person |
| Workflows | Journeys | Explicit task paths with lifecycle outcomes |
| Completion | Work completed | Only explicit workflow outcome events qualify |
| Trace Explorer | Evidence | The bounded technical event timeline behind a signal |
| Tool Quality | Capability quality | How reliably and quickly capabilities behave |
| Tools | Capabilities | Actions your MCP product makes available |
| Catalog | What you offer | Timestamped advertised capabilities |
| Clients | AI clients | Client applications observed at the server boundary |
| Reliability | Stability | Observed errors, latency, retries, and degradation |
| Intent & Gaps | Needs and gaps | Supplied context and explicit missing-capability reports |
| Outcomes | Work completed | Explicit business or workflow outcomes |
| Releases | Changes | Deployment or catalog context when available |
| Correlation handle | Evidence link | Request grouping used to connect observed events |
| Provenance | Data source | Where an observation or context value came from |
| Insufficient data | Not enough evidence yet | Minimum-volume or missing-grouping rule prevents a conclusion |
| Payload | Event detail | Captured content subject to redaction and bounds |
| Bounded result | Result has a limit | Some events may be omitted because the response is capped |
| Sample mode | Example data | Illustrative values, not the workspace's live activity |
| My data | Your data | Data observed for the selected workspace |

## Copy patterns

Use:

- “AI clients observed” rather than “users”;
- “Activity increased” rather than “tool calls spiked” in the business layer;
- “Associated with” rather than “caused by”;
- “Not enough evidence yet” rather than a zero or healthy badge;
- “Example data” rather than “Sample mode” in first-level UI;
- “Open evidence” only when the destination is the technical evidence for the current issue;
- “See capability quality” or “View journeys” rather than `View all`.

Avoid as first-level copy:

- Trace Explorer;
- correlation;
- provenance;
- catalog;
- session;
- tool quality;
- payload;
- bounded;
- server-observed;
- “connected to live telemetry” or “updated just now” unless the API proves it.

## Technical disclosure pattern

Every complex metric gets an info affordance or “How this is calculated” disclosure with four lines:

1. What it means in plain language.
2. How it is calculated.
3. What it does not prove.
4. What to inspect next.

Example:

> **Work completed** means the share of explicit workflow outcomes marked completed. It does not infer success from a session ending or from a tool response. Open Journeys to see the underlying outcomes.
