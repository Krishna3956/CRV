# MCP Server Reliability Report — Data Collection Specification

Status: collection-ready; do not publish findings until the minimum sample and quality gates below are met.

This is the next high-impact content asset for TrackMCP. It should become a defensible original-research report, not another generic “what is MCP observability?” article. The report can earn links, give sales conversations a concrete benchmark, and create a reason for MCP server teams to instrument their production traffic.

## What we are trying to learn

The report should answer four questions for MCP server maintainers:

1. Where do production MCP calls fail or become slow?
2. Which failure modes are visible only when the full request lifecycle is measured?
3. How do reliability patterns differ by transport, client, tool type, and deployment environment?
4. Which operating practices correlate with better completion and recovery?

The public report must use aggregate data only. It must never expose workspace names, user identity, raw arguments, tool payloads, API keys, or a server that can be identified without permission.

## Required data sources

### A. TrackMCP telemetry

Use only production events from consenting workspaces with a defined observation window. At minimum, retain these fields for analysis:

| Dimension | Fields |
|---|---|
| Time | `started_at`, observation window, timezone normalization |
| Identity | anonymous workspace cohort ID, server ID, deployment ID |
| Protocol | `transport`, `protocol_version`, `mcp_method`, `sdk_version` |
| Client | normalized `client_name` and an `unknown` bucket |
| Tool | normalized tool category, not raw sensitive names where disclosure is possible |
| Outcome | `success`, `is_error`, `error_class`, `error_code`, `retry_number` |
| Performance | `duration_ms`, payload size bucket |
| Workflow | anonymous `session_id`/`workflow_id`, calls, completion state |

Do not use `payload` for the public report. If payload-derived categorization is needed, compute it inside the controlled analysis environment and discard raw values after classification.

### B. Controlled compatibility tests

Create a small reference MCP server with deterministic tools and run the same test cases against supported clients, transports, and protocol versions. Record:

- connection success and time to ready;
- tool discovery success and discovered tool count;
- valid call success;
- malformed arguments and structured-error behavior;
- timeout and retry behavior;
- auth failure behavior;
- reconnect behavior;
- whether errors are surfaced as transport errors, protocol errors, or successful HTTP responses containing an application error.

Every test run needs a timestamp, client version, server build, transport, protocol version, test case ID, and raw result retained privately for reproducibility.

### C. Search and conversion data

Export monthly from Google Search Console and the analytics providers:

- query, page, country, device, clicks, impressions, CTR, average position;
- landing page views for report and supporting articles;
- `content_cta_clicked`;
- `auth_request_started`;
- `signup_request_sent`;
- `workspace_created`;
- `api_key_created`;
- `first_telemetry_seen`.

The new content events intentionally carry only page path, CTA label, and broad surface (`blog`, `docs`, `directory`, or `marketing`). Joining should be done on anonymous event/session identifiers supplied by the analytics platform, not on email addresses.

## Event definitions

Use these definitions consistently in the report and dashboard:

| Metric | Definition |
|---|---|
| Call error rate | Calls with `is_error = true` divided by all tool calls, excluding test traffic |
| Transport failure rate | Calls with no valid protocol response or transport-level failure divided by attempted calls |
| P95 latency | 95th percentile of `duration_ms` for completed tool calls; report sample size |
| Retry rate | Calls with `retry_number > 0` divided by all attempted calls |
| Session completion | Sessions with a defined terminal success outcome divided by sessions with enough events to classify |
| Discovery success | Controlled tests where the expected tool catalog is returned correctly |
| Content activation rate | Unique content-attributed signup requests that later produce `first_telemetry_seen`, divided by unique content-attributed signup requests |

Never combine transport failures, tool/application errors, and user-requested business failures into one “error” number without showing the classification.

## Minimum quality gates before publishing

Do not publish a numeric benchmark until all of these are true:

- at least 10 independent production workspaces or an explicitly disclosed smaller cohort;
- at least 30 days of observations, or a clearly labeled shorter launch-period study;
- at least 10,000 eligible tool calls overall;
- every published percentage has its denominator and an uncertainty note;
- no single workspace contributes more than 25% of eligible calls unless the report says so;
- client, transport, and protocol-version buckets smaller than 100 calls are grouped as “other” or omitted;
- test traffic, local demos, synthetic examples, and duplicate event IDs are excluded;
- a second person can reproduce each published table from a versioned query or notebook;
- privacy review confirms that no row, label, or quote re-identifies a customer;
- product claims are separated from observed industry data.

If the gates are not met, publish a “TrackMCP MCP Reliability Measurement Framework” based on the controlled test methodology and clearly label it as a framework, not an industry benchmark.

## Report structure

Target length: 2,500–4,000 words plus charts and a methodology appendix.

1. **Executive answer (100–150 words):** what was measured, sample size, window, and the three most useful findings.
2. **Reliability model (250–400 words):** distinguish connection, discovery, call, application, workflow, and recovery reliability.
3. **Benchmark snapshot:** error rate, P95 latency, retry rate, completion rate, and sample sizes.
4. **Failure-mode analysis:** transport/protocol/application/auth/configuration categories.
5. **Client and transport comparison:** show only sufficiently large buckets.
6. **Workflow completion:** explain why successful individual tool calls do not guarantee a completed agent task.
7. **Operational recommendations:** instrumentation, SLOs, structured errors, timeouts, retries, auth handling, and incident review.
8. **Methodology and limitations:** inclusion rules, missing data, cohort bias, definitions, and reproducibility details.
9. **TrackMCP measurement walkthrough:** a short product CTA after the reader has seen the problem and methodology.

## Charts worth producing

Use a restrained set of original charts:

- reliability funnel: connections → discovery → calls → successful calls → completed workflows;
- error taxonomy by lifecycle stage;
- P50/P95/P99 latency distribution with sample sizes;
- retry rate and completion rate by transport or client bucket;
- cohort chart showing how measurement coverage changes after instrumentation.

Each chart needs a plain-language title, a one-sentence answer below it, date range, denominator, and a link to methodology. Avoid decorative charts that do not support a decision.

## Analysis workflow

1. Lock the observation window and eligibility rules before looking for a favorable result.
2. Build a clean aggregate table keyed by cohort, date, transport, client bucket, tool category, and outcome class.
3. Run data-quality checks: duplicate IDs, impossible durations, missing timestamps, invalid success/error combinations, and outlier payload sizes.
4. Compute the core metrics with denominators and confidence intervals where appropriate.
5. Suppress or merge small cohorts.
6. Have an independent reviewer reproduce the tables.
7. Draft findings as observations, then separately write recommendations.
8. Add TrackMCP product proof only where the product actually supports the workflow described.
9. Publish the report, methodology, downloadable chart images, and a short changelog.

## Success criteria after publication

Review at 30 and 90 days. The report is working only if it produces qualified behavior, not merely page views:

- organic impressions and non-brand query growth;
- backlinks or cited references from relevant MCP/agent engineering sources;
- report-to-signup request rate;
- signup-request-to-workspace rate;
- workspace-to-first-telemetry rate;
- assisted conversions on the supporting observability, security, and SLO articles.

If it earns impressions but not activation, improve the report’s CTA, proof, and quickstart path before producing another benchmark. If it earns neither impressions nor references after a meaningful distribution cycle, stop expanding the research asset and redirect effort to directory quality, compatibility documentation, or product-led proof.

## Current implementation note

The site now emits the following content-funnel events through the existing Vercel Analytics integration:

- `content_cta_clicked` on shared TrackMCP CTAs;
- `auth_request_started` when a sign-in or signup request begins;
- `signup_request_sent` / `signin_request_sent` after the auth email request succeeds;
- `workspace_created` after workspace setup succeeds;
- `api_key_created` after an API key is created;
- `first_telemetry_seen` the first time a real workspace returns telemetry.

The CTA passes non-sensitive page attribution to the signup URL, and the auth flow stores it locally for later product-activation events. Validate event delivery in the production analytics dashboards after deployment; local development intentionally does not send Vercel Analytics events.
