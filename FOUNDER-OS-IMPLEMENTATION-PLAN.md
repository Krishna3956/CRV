# TrackMCP Founder OS: CTO implementation plan

Status: planning baseline  
Source: Founder OS product vision, current repository inspection, and the existing TrackMCP release state  
Owner: CTO / Head of Engineering  
Decision rule: no large UI build starts until the event contract, identity model, evidence rules, and supported-protocol matrix are approved.

## 0. How to read this plan

The Founder OS PDF is a product and research document, not an executable instruction set. Its research prompts, competitive questions, and proposed screens are treated as hypotheses and requirements to validate. They do not override repository security rules, deployment controls, privacy policy, or explicit product decisions.

This plan separates:

1. What TrackMCP has today.
2. What the Founder OS is proposing.
3. What must be true before a claim can appear in the product.
4. The implementation sequence, ownership, controls, and acceptance criteria.

The PDF uses a few inconsistent names and illustrative package names. The canonical product names in this plan are TrackMCP, `@trackmcp/sdk`, `@trackmcp/cli`, and `trackmcp` for Python. Placeholder names from the PDF must not be copied into code.

## 1. Executive product decision

TrackMCP should become the outcome and product-analytics layer for MCP servers.

The product question is not primarily “what is the p95 latency?” It is:

> What happened between an agent or user wanting something and the business system actually doing something?

The product must move through five evidence-backed questions:

1. Is the MCP being adopted?
2. What are people or agents trying to do?
3. Did the work complete?
4. Where did the experience break?
5. What should the team fix first?

The product must never imply that server-local telemetry proves the success of a whole multi-server agent task. Every business metric needs a scope and evidence-quality label.

## 2. Current-state inventory

### 2.1 Current application and deployment

The current product is a Next.js application deployed through GitHub Actions to AWS App Runner. Supabase is the primary database and authentication/data-service dependency. The public website, docs, blog, device authorization, dashboard, repository directory, and API routes live under `trackmcp-nextjs`.

Current production release facts:

- `main` is deployed through the App Runner workflow.
- TypeScript and Python SDK activation paths exist.
- `@trackmcp/cli` provides one-command browser activation.
- Python `trackmcp init` and `trackmcp doctor` exist.
- Device authorization uses short-lived sessions and browser approval.
- API keys are hashed at rest and raw keys are not intended for analytics storage.
- The production release workflow has CI and App Runner deployment gates.

### 2.2 Current data foundations

The repository already contains these useful data-plane foundations:

- `trackmcp_workspaces`, `trackmcp_api_keys`, and `trackmcp_workspace_members`.
- `trackmcp_events` with workspace, event, service, environment, session, client, tool, duration, success, error, payload, and timestamps.
- Canonical event fields for schema version, server/deployment/version metadata, observation source, direction, transport, protocol method, request and session IDs, correlation handles, intent, missing capability, task/workflow IDs, client identity, retry metadata, payload policy, and redacted payloads.
- MCP server, environment, deployment, and catalog-version entities.
- Tool-quality analytics, trace analytics, validation, regressions, alerts, and alert delivery primitives.
- CLI device sessions and first accepted-ingest activation milestones.
- Submission attribution for the public MCP directory.

### 2.3 Current surface area

Current routes and surfaces include:

- Marketing homepage and feature pages.
- MCP directory, categories, new listings, tool pages, and tool sitemap.
- Docs for overview, TypeScript, Python, API, and reference.
- Dashboard, onboarding, traces, alerts, and workspace/account routes.
- Ingestion, analytics, tool-quality, traces, activation funnel, key status, device authorization, and repository APIs.
- TypeScript, Python, Go, and .NET SDK package directories.
- App Runner deployment scripts and GitHub workflows.

### 2.4 Current limitations

The current event table is a good MVP envelope but not yet a complete semantic fact model. Specifically:

- It does not yet cleanly separate raw transport, RPC, notification, catalog, outcome, and data-quality facts.
- Account identity is not a universal, verified field. MCP `clientInfo` is self-reported and cannot be treated as customer identity.
- Tool analytics are more mature than resources, prompts, subscriptions, sampling, elicitation, and transport reliability.
- Completion is not a universal binary. Tool `isError`, JSON-RPC errors, result types, elicitation actions, transport termination, and client-side validation are different signals.
- Current session/correlation fields cannot automatically produce a truthful business workflow for every MCP server.
- There is no durable, shared outcome classifier consumed by Outcomes, Reliability, Journey, and Action Queue views.
- There is no complete semantic layer that translates protocol facts into business language with evidence and confidence.
- The dashboard is not yet organized around the Founder OS information architecture.
- Generic OpenTelemetry cannot replace MCP-native instrumentation because it will not reliably carry MCP semantic fields.

## 3. Product boundaries and non-goals

### 3.1 In scope

- Native, privacy-safe MCP instrumentation for TypeScript and Python first.
- A canonical event envelope and versioned protocol compatibility matrix.
- Verified account/organization attribution through customer-provided resolver hooks.
- MCP catalog snapshots and version history.
- Adoption, tool, resource, prompt, journey, outcome, reliability, and action-queue analytics.
- Evidence and confidence labels on every derived insight.
- Near-real-time operational views and recomputable historical views.
- OTel export/interoperability, followed by constrained proxy and stdio alternatives.
- Business-friendly dashboard views plus technical evidence drill-downs.
- TrackMCP’s own query interface exposed through MCP after the semantic layer is stable.

### 3.2 Explicit non-goals for the first release

- Claiming whole-agent or whole-business-task completion when only one MCP server is observed.
- Reimplementing customer OAuth or trusting raw bearer tokens as identity.
- Collecting raw API keys, OAuth tokens, secrets, full tool arguments, resource contents, or full results by default.
- Building every language SDK, proxy, private-cloud deployment, and enterprise feature before validating the core product.
- Treating self-reported client names as verified customer identity.
- Calling “no retry observed” abandonment.
- Treating stderr, idle gaps, or missing discovery calls as definitive health failures.

## 4. Canonical product language

The dashboard should use business language first, with technical terms in evidence drawers:

| Product question | Primary label | Technical evidence behind it |
| --- | --- | --- |
| Who is using it? | People / Organizations | verified account IDs, client labels, identity source |
| What are they doing? | Tools | `tools/call` facts and catalog snapshots |
| What are they looking up or asking for? | Resources & Prompts | reads, templates, prompts, completions, subscriptions |
| What path do they take? | Journey | interaction grouping, request-state retry links, workflow IDs |
| Did it work? | Outcomes | capability-aware outcome classifier |
| What is breaking? | Reliability | failures, transport events, data trust, incidents |
| What should we fix? | Action Queue | patterns, blast radius, severity, owner, resolution |

Canonical setup language:

- Recommended: “Install the TrackMCP SDK for complete MCP analytics.”
- Alternative: “Already using OpenTelemetry? Connect TrackMCP through OTLP.”
- Limited coverage: “Cannot modify your server? Use a proxy or stdio launcher.”
- Account identity: “Identify your organizations — optional.”

## 5. Target architecture

```text
MCP server / transport
  ├─ native TrackMCP SDK events
  ├─ optional customer auth context
  ├─ optional OTel/OTLP export
  ├─ transport/process lifecycle events
  └─ catalog/discovery snapshots
          ↓
Edge ingestion API
  ├─ authenticate scoped ingestion key
  ├─ validate envelope and protocol version
  ├─ bound size/rate and redact
  ├─ deduplicate by workspace + event_id
  └─ acknowledge quickly (fail-open at SDK)
          ↓
Raw append-only event plane
  ├─ raw_rpc_events
  ├─ raw_transport_events
  ├─ raw_notification_events
  ├─ catalog_snapshots
  ├─ deployment_events
  └─ identity/account observations
          ↓
Normalization and quality layer
  ├─ schema validation
  ├─ replay/duplicate handling
  ├─ protocol-version normalization
  ├─ identity-source classification
  ├─ payload policy enforcement
  └─ data-quality facts
          ↓
Shared semantic classifier
  ├─ capability-aware result classification
  ├─ error and transport categories
  ├─ retry / requestState linkage
  ├─ outcome buckets
  ├─ workflow/interactions
  └─ catalog/deployment joins
          ↓
Derived facts and rollups
  ├─ account activity
  ├─ tool/resource/prompt usage
  ├─ journey paths and drop-offs
  ├─ outcomes and completion evidence
  ├─ reliability patterns and incidents
  └─ action queue candidates
          ↓
Read APIs / semantic query layer
  ├─ business dashboard
  ├─ technical evidence views
  ├─ exports and analyst queries
  ├─ alerts and notifications
  └─ TrackMCP MCP query server
```

### 5.1 Service boundaries

The first production implementation may remain a modular Next.js/Supabase system, but the code must preserve these boundaries:

1. **SDK/runtime boundary**: capture events without changing MCP behavior.
2. **Ingestion boundary**: authenticate, validate, bound, redact, deduplicate, acknowledge.
3. **Raw event boundary**: immutable, append-only, replayable data.
4. **Classifier boundary**: one versioned semantic interpretation of events.
5. **Aggregation boundary**: materialized/rollup facts with explicit windows.
6. **Recommendation boundary**: evidence-backed patterns and actions.
7. **Read-model boundary**: APIs optimized for dashboard questions, not raw tables.

Do not split into many deployable microservices until volume, team size, or isolation requirements justify it. Begin as a modular monolith plus background workers/queues, with contracts that permit later extraction.

### 5.2 Queue and asynchronous processing policy

The queue is for work that does not need to block the MCP response:

- SDK event buffering and bounded retry.
- Ingestion normalization and enrichment.
- Catalog snapshot comparison.
- Rollup recomputation.
- Pattern/incident detection.
- Recommendation generation.
- Alert delivery and retry.
- Retention cleanup.

The queue must not be required for the customer’s tool call to succeed. SDK telemetry is fail-open. Ingestion should return an acknowledgement quickly; derived analytics may be seconds or minutes behind raw events.

Initial implementation options:

- Supabase/Postgres append-only tables plus scheduled worker for low volume.
- A durable queue/stream when ingestion or backfill volume requires it.
- Idempotency keys on every worker operation.
- Dead-letter storage for malformed events and failed deliveries.

Every asynchronous task needs: job ID, source event/range, classifier version, attempt count, next attempt, state, error category, and replay procedure.

## 6. Canonical semantic data model

### 6.1 Dimensions

```text
workspace_dim
- workspace_id
- name
- plan
- created_at

project_dim
- project_id
- workspace_id
- name
- slug

server_dim
- server_id
- project_id
- name
- framework
- transport_family
- created_at

environment_dim
- environment_id
- server_id
- name: development | staging | production | custom
- region

deployment_dim
- deployment_id
- environment_id
- version
- commit_sha
- deployed_at
- retired_at

account_dim
- account_key (privacy-safe stable identifier)
- workspace_id
- display_name (optional, customer-provided)
- identity_source: verified_claim | resolver | self_reported | unresolved
- first_seen_at
- last_seen_at

client_dim
- client_key
- client_name
- client_version
- self_reported: true

catalog_dim
- catalog_version_id
- server_id
- environment_id
- protocol_version
- discovered_at
- source
- authorization_scope_hash (non-secret)
```

### 6.2 Canonical event envelope

Required fields:

```text
event_id
schema_version
received_at
occurred_at / started_at
workspace_id
project_id
server_id
environment_id
deployment_id (nullable)
sdk_name
sdk_version
protocol_version (nullable)
transport
event_type
mcp_method (nullable)
target_name (nullable)
request_id (nullable, never primary correlation)
session_id (nullable, with source)
interaction_id (nullable, inferred and labeled)
parent_event_id (nullable)
account_key (nullable, with identity source)
client_name / client_version (nullable, self-reported)
duration_ms (nullable)
status
result_type (nullable, open string)
jsonrpc_error_code (nullable)
error_category (nullable)
retry_number (nullable)
cancellation_source (nullable)
request_state_hash (nullable; do not store opaque raw state unless policy explicitly allows)
payload_policy
payload_size_bytes
data_quality_flags[]
```

### 6.3 Event families

Keep event families distinct even when they share an envelope:

- `rpc_request` and `rpc_result`.
- `tool_call`.
- `resource_read`.
- `prompt_call`.
- `completion_request`.
- `catalog_snapshot` and catalog-change notification.
- `subscription_started`, `subscription_updated`, `subscription_closed`.
- `progress`, `logging`, and cancellation observations.
- `sampling_exchange`, nested sampling tool turns, and sampling outcome.
- `transport_open`, `transport_close`, `stream_disconnect`, `process_start`, `process_exit`.
- `deployment_started`, `deployment_completed`, `deployment_failed`.
- `workflow_started`, `workflow_completed`, `workflow_failed` when explicitly supplied by the customer.

### 6.4 Derived fact tables

The first warehouse-like read model should include:

- `fact_tool_calls`.
- `fact_resource_reads`.
- `fact_prompt_calls`.
- `fact_completion_requests`.
- `fact_subscriptions`.
- `fact_catalog_observations`.
- `fact_transport_events`.
- `fact_outcomes`.
- `fact_data_quality`.
- `fact_account_activity`.
- `fact_interaction_events`.
- `fact_pattern_observations`.
- `fact_deployments`.

Every fact must carry `classifier_version`, `source_event_count`, `data_quality_bucket`, and `scope`.

## 7. Identity, privacy, and trust model

### 7.1 Identity rules

- MCP `clientInfo` is optional, self-reported, and directional only.
- Customer account identity must come from already-validated customer auth context.
- TrackMCP must offer a resolver hook or claim mapping; it must not reimplement customer OAuth.
- Never use a raw bearer token, raw API key, or raw OAuth subject as an analytics identifier without an explicit customer mapping policy.
- Preserve `Unresolved`, `Unrecognized`, and `Unknown` buckets rather than dropping them.
- Keep customer account identity separate from AI-client identity.
- Never use self-reported client identity for authorization or security decisions.

Recommended SDK interface:

```ts
withTrackMCP(server, {
  apiKey: process.env.TRACKMCP_KEY,
  resolveAccount: (request) => ({
    accountId: request.auth?.claims?.tenant_id ?? null,
    accountName: null,
  }),
});
```

### 7.2 Collection defaults

Default collection:

- Metadata and bounded dimensions.
- Timing and status.
- Method/target names.
- Protocol/transport/version.
- Redacted error category.
- Stable non-secret identifiers.

Opt-in collection only:

- Selected argument fields.
- Selected result fields.
- Resource contents.
- Prompt text.
- High-cardinality payloads.

Opt-in controls must support allowlists, redaction, hashing, sampling, retention, region, and per-server overrides.

### 7.3 Trust labels

Every metric and insight must expose one or more of:

- `clean_classified`.
- `legacy_defaulted`.
- `other_unclassified`.
- `unmatched_retry`.
- `duplicate_or_reconnect_affected`.
- `inferred_interaction`.
- `server_local_scope`.
- `self_reported_identity`.

The UI must not hide low-confidence rows to make charts look cleaner.

## 8. Shared classifier and outcome rules

### 8.1 One classifier, many products

Outcomes, Reliability, Journey, Tool Quality, alerts, and Action Queue must consume the same classifier output. They must never each implement their own completion or failure formulas.

The classifier output should include:

```text
capability_type
request_method
result_type
execution_error
jsonrpc_error_code
jsonrpc_error_category
retry_state
elicitation_mode
elicitation_action
cancellation_source
transport_state
protocol_version
account_key
identity_source
data_quality_bucket
outcome_bucket
failure_bucket
```

### 8.2 Outcome buckets

Minimum buckets:

- `finished`.
- `resumed_after_input`.
- `no_retry_observed`.
- `explicit_decline`.
- `explicit_cancel`.
- `sampling_declined`.
- `protocol_error`.
- `execution_error`.
- `transport_terminated`.
- `unclassified`.

“Waiting” and “walked away” must not be presented as facts. Use “retry observed” and “no retry observed within [window].”

### 8.3 Capability-aware rules

- Tool results may use `isError`.
- Resource and prompt failures must inspect top-level JSON-RPC errors; do not assume `isError` exists.
- `resultType` is open-ended; do not reduce it to a hard-coded two-value enum.
- Missing `resultType` is not automatically success. It may be legacy, absent due to an instrumentation bug, or unsupported.
- Completion requests need separate protocol verification before joining the shared outcome model.
- Structured-content client validation failures are a known blind spot unless clients report them.
- Multi-server workflows require server-local scope disclosure.

### 8.4 Retry and elicitation rules

- Match retries using exact `requestState` equality only when TrackMCP controls or understands the state generation.
- Do not match by JSON-RPC request ID.
- Do not parse opaque request state.
- Search across all later events for the account, not only the same synthetic interaction.
- Use a configurable observation window, initially 7 days pending product approval.
- Recompute classifications so late retries can change `no_retry_observed` to `resumed_after_input`.
- Separate form-mode and URL-mode elicitation.
- Keep `accept`, `decline`, and `cancel` distinct.

## 9. Dashboard and API plan

### 9.1 Navigation

Recommended navigation:

1. Overview.
2. Setup.
3. Analytics.
4. Reliability.
5. People / Organizations.
6. Settings.

Keep key management in a Setup drawer initially, not as a top-level section.

### 9.2 Overview

The Overview must answer in one screen:

- Are people using the server?
- Are workflows completing?
- What changed?
- What needs attention?
- How trustworthy is this evidence?

Initial cards:

- Active accounts.
- Tool calls.
- Outcome rate with scope/data caveat.
- Active incidents.
- Top affected account/feature.
- Data trust score.
- Latest recommendation.

### 9.3 People / Organizations

Metrics:

- Active accounts this week.
- New versus returning.
- Trend over time.
- AI-client breakdown with self-reported disclosure.
- Top accounts by activity.
- Unresolved identity bucket.
- Going-quiet accounts based on rolling activity, not last-seen alone.

Protections:

- Minimum sample sizes.
- “Insufficient data” state.
- No sensitive account data in default views.
- Identity-source label on every account row.

### 9.4 Tools

Views:

- Feature leaderboard.
- Adoption breadth.
- Trend by tool.
- Reliability by tool.
- Tool detail drawer.

Every rate displays volume. Every row can drill into catalog description, schema/version, deployment, affected accounts, and representative redacted evidence.

### 9.5 Resources & Prompts

Views:

- Top resources.
- Resource templates.
- Top prompts.
- Completion/stall where protocol evidence supports it.
- Resource/prompt trends.
- Subscription engagement.
- Catalog-change timeline.

Do not conflate resources, templates, prompts, completion requests, or subscriptions.

### 9.6 Journey

Views:

- Common paths.
- Cumulative drop-off.
- Stall → retry.

Interaction grouping is inferred and configurable. The UI must label it as inferred. Retry matching uses `requestState`, not interaction ID.

### 9.7 Outcomes

Views:

- Completion rate.
- Finished / resumed / no-retry / decline / error split.
- Trend.
- Accounts with unresolved outcomes.
- Breakdown by feature and explicit workflow.
- New versus returning comparison with sample-size safeguards.

### 9.8 Reliability

Views:

1. Health overview.
2. Failure patterns.
3. Silent and infrastructure failures.
4. Data trust and coverage.
5. Action Queue.

Health score is not completion rate. It must use documented weighted inputs, baselines, persistence checks, and severity definitions.

### 9.9 Action Queue

Application-owned issue model:

```text
issue_id
pattern_fingerprint
description
failure_type
blast_radius
severity
first_seen
last_seen
status
owner
trend
evidence_quality
resolution_note
resolved_at
time_to_resolve
```

States: `new → acknowledged → in_progress → resolved`. Priority must be auditable:

```text
priority_score = severity_weight × blast_radius × recency_multiplier
```

## 10. Setup and integration experience

The first-time setup should be one dominant path:

1. Create server/project/environment.
2. Install native SDK.
3. Copy the minimal snippet.
4. Configure the scoped key.
5. Send a test event.
6. Verify the event.
7. Start viewing data.
8. Add organization identity later if needed.

Connection states:

- Connected.
- Connected with limited coverage.
- Waiting for events.
- Authentication failed.
- SDK detected but no MCP events.
- Account identity not configured.

The Setup page should show server, environment, region, language/runtime, transport, integration method, SDK version, last event, recent event count, identity coverage, and integration health without presenting a large wizard.

Integration hierarchy:

1. Native TypeScript/Python SDK: recommended, full semantic coverage.
2. SDK through customer OTel pipeline: full coverage if MCP fields are preserved.
3. Generic OTLP: partial coverage unless semantic fields are present.
4. Proxy or stdio launcher: limited coverage.

## 11. Protocol and transport compatibility matrix

Before implementation, create a versioned matrix containing:

- Supported MCP specification versions.
- Legacy versus modern initialization/discovery behavior.
- Transport: stdio, streamable HTTP, SSE, custom.
- Catalog methods and pagination semantics.
- Resource reads and multi-content responses.
- Prompts, completions, elicitation, sampling, subscriptions.
- Error-code mappings and legacy codes.
- Cancellation, progress, notifications, and disconnect semantics.
- Structured-output validation limitations.
- Server/discover optionality.

Important rules:

- Do not infer a health failure from the absence of `server/discover`.
- Do not use empty-string cursor truthiness as pagination termination.
- Do not treat `https` resource fetches as server-observed usage.
- Do not call idle time a dead connection without transport evidence.
- Do not treat stderr as authoritative health telemetry.
- Do not flatten overloaded error code `-32602` without method/target context.
- Do not treat `-32002` as a current protocol code; mark legacy occurrences.
- Preserve sampling exchanges and nested tool-use turns.
- Track stream disconnects and process crashes separately.

## 12. API/read-model contracts

The first semantic API family should be versioned and scope-filtered:

- `GET /api/v2/overview`.
- `GET /api/v2/people`.
- `GET /api/v2/tools`.
- `GET /api/v2/tools/:name`.
- `GET /api/v2/resources`.
- `GET /api/v2/prompts`.
- `GET /api/v2/journeys`.
- `GET /api/v2/outcomes`.
- `GET /api/v2/reliability`.
- `GET /api/v2/action-queue`.
- `GET /api/v2/catalogs`.
- `GET /api/v2/data-trust`.

Local implementation status (2026-10-19): overview, data-trust, tools,
tool-detail, catalogs, action-queue, reliability, outcomes, journeys, people,
resources, and prompts projections are implemented as bounded authenticated
read surfaces. Hash-only entity-read projections for `resources/read` and
`prompts/get` are also implemented locally with privacy-export/deletion
coverage; production schema and postflight evidence remain separate.
The people projection intentionally exposes resolver coverage and client
observations only; unique people and organization counts remain `null` until
verified identity semantics exist. Resources and prompts expose observed method
families/counts plus the bounded hash-only entity-read projection; raw URIs,
prompt names, arguments, and contents remain excluded.

Every response should include:

- Query range and filters.
- Scope: workspace/project/server/environment.
- Generated-at timestamp.
- Data freshness/lag.
- Source event count.
- Truncation status.
- Evidence-quality composition.
- Classifier version.
- Caveats.

Do not expose raw tables directly to the browser. Keep dashboard queries bounded, paginated, cacheable, and authorization-scoped.

## 13. Website, docs, and product-marketing plan

### Homepage

The homepage should say what TrackMCP does in outcome language:

> Understand whether your MCP-powered work was adopted, completed, and where it broke.

The primary CTA should be “Connect your MCP server.” The installation command should invoke the native CLI/SDK flow, not a library-only command.

Secondary content should explain:

- Product analytics for MCP.
- Protocol and reliability evidence.
- Privacy-safe defaults.
- Why engineers install it and why product/operations teams use it.

### Feature pages

Prioritize pages for:

- MCP outcome analytics.
- MCP tool analytics.
- MCP reliability and data trust.
- Agent journey/drop-off analysis.
- MCP catalog/version intelligence.
- OTel interoperability.
- Setup and integration coverage.

Every page must distinguish server-local evidence from whole-agent claims.

### Documentation

Docs should be reorganized around user jobs:

1. Install and activate.
2. Connect a server.
3. Verify the first event.
4. Add organization identity.
5. Understand dashboard metrics.
6. Configure privacy and retention.
7. Troubleshoot transport and ingestion.
8. Export to OTel.
9. Use proxy/stdio fallbacks.
10. Read API/reference contracts.

Each metric page must document definition, denominator, scope, data source, missing-data behavior, protocol-version behavior, and confidence limitations.

### Release notes and blog

Release notes should cover user-visible outcomes, not internal commit history. Launch content should explain:

- Native one-command setup.
- Python and TypeScript support.
- Privacy-safe metadata-first collection.
- First-event verification.
- Account identity as an optional enhancement.
- The difference between technical telemetry and business outcomes.

## 14. Team model and ownership

### Initial team: 6–9 engineers plus product/design

1. **Technical product lead / PM**: customer discovery, paid use case, metric definitions, roadmap.
2. **Platform/data model lead**: event contract, schema, classifier, rollups.
3. **Ingestion/API engineer**: auth, validation, rate limits, idempotency, read APIs.
4. **SDK/runtime engineer**: TypeScript/Python instrumentation and fail-open behavior.
5. **Analytics/semantic engineer**: outcomes, journeys, reliability, evidence/confidence.
6. **Frontend/dashboard engineer**: overview, analytics, drill-downs, accessibility.
7. **Security/privacy engineer**: redaction, identity, retention, audit, threat model.
8. **QA/reliability engineer**: contract tests, protocol fixtures, load/failure tests.
9. **Developer experience/docs engineer**: CLI, setup, docs, examples, migration guides.

Shared part-time roles:

- Product designer.
- Technical writer/developer advocate.
- Customer solutions engineer.

Do not staff 50 people before validated demand. Expand only when multiple SDKs, enterprise deployment, private-cloud, compliance, and customer support justify parallel teams.

### Ownership matrix

| Area | Direct owner | Required reviewers |
| --- | --- | --- |
| Event envelope | data/platform | SDK, security, QA |
| Identity resolver | security/platform | product, SDK |
| Outcome classifier | analytics | protocol, QA, product |
| Ingestion | API/platform | security, reliability |
| Dashboard | frontend | designer, analytics, product |
| Docs/setup | DX | SDK, support, product |
| OTel/proxy | integrations | platform, security |
| Production deploy | platform/reliability | CTO, release owner |

## 15. GitHub and agent operating rules

### Branching and publishing

- No agent pushes directly to `main`.
- Every change starts on a named `codex/<scope>` branch.
- Each commit has one coherent purpose and a truthful message.
- Generated files are committed only when the package contract requires them.
- Secrets, exports, campaign assets, local CSVs, `.env` files, and build outputs are never committed.
- Release branches are cut only after the target commit, migrations, package versions, and docs are identified.

### Pull request gates

Every PR must include:

- Scope and non-goals.
- Files changed.
- Migration impact.
- Security/privacy impact.
- Rollback plan.
- Tests run and results.
- Build result.
- Deployment impact.
- Product/user-facing copy impact.

Required checks:

- TypeScript/build/lint.
- SDK/package tests and packed-consumer tests.
- Contract tests for API and schema changes.
- Migration contract test.
- Data-redaction and secret-leak test.
- Accessibility/content checks for UI changes.
- No forbidden tracked artifacts.

### Agent coordination

- Agents may inspect and implement within their assigned scope.
- Agents must not silently broaden scope, merge unrelated work, or publish packages without a release owner.
- Agents report commit SHA, branch, changed files, validation, assumptions, and blockers.
- Integration agent owns conflict resolution and final branch assembly.
- The CTO agent decides whether a blocker is real, deferrable, or a release stop.

### Merge policy

- Merge only after CI passes and required reviewers approve.
- Schema migrations must be applied in the documented order and verified before dependent application code is enabled.
- Production deploys are automatic only from approved `main` commits.
- Rollbacks use a known-good immutable image/commit; never rewrite history.
- Package publishing is versioned, provenance-enabled where supported, and verified from a clean consumer.

## 16. Delivery phases

### Phase 0 — product truth and validation (2–3 weeks)

Deliverables:

- Canonical naming table.
- Supported MCP version matrix.
- Buyer/user interviews and competitive test.
- First paid use case.
- Event/identity/privacy contract.
- Claims TrackMCP can and cannot make.
- Metric glossary.

Exit criteria: product and engineering sign off on scope, definitions, evidence, and non-goals.

### Phase 1 — semantic foundation (4–6 weeks)

Deliverables:

- Versioned canonical envelope.
- Raw event family tables or partition strategy.
- Identity resolver hooks.
- Catalog snapshots and version joins.
- Data-quality facts.
- Idempotent ingestion and bounded replay.
- Shared classifier skeleton.
- Retention and redaction controls.

Exit criteria: replayable fixtures produce deterministic classified facts with no raw secrets.

### Phase 2 — native SDK reliability (4–6 weeks)

Deliverables:

- TypeScript SDK complete semantic events.
- Python SDK parity for supported transports.
- Fail-open buffering, retry, limits, drop counters.
- Test event and verification status.
- Account resolver and identity-source labels.
- SDK conformance suite.

Exit criteria: representative TypeScript and Python MCP servers can install, activate, emit, and verify events without changing server behavior.

### Phase 3 — core analytics MVP (6–8 weeks)

Deliverables:

- Overview.
- Setup.
- People/Organizations.
- Tools.
- Outcomes.
- Data trust disclosures.
- Technical evidence drill-downs.

Exit criteria: a customer can answer adoption, usage, completion, affected accounts, and evidence-quality questions from one workspace.

### Phase 4 — journeys and reliability (6–8 weeks)

Deliverables:

- Resources & Prompts.
- Journey paths and drop-off.
- Request-state retry matching.
- Transport/process reliability.
- Baseline/persistence pattern detection.
- Action Queue.
- Alerts linked to issue records.

Exit criteria: a known seeded regression is detected, explained, assigned, and resolved end to end.

### Phase 5 — interoperability and expansion (8–12 weeks)

Deliverables:

- OTel export/OTLP ingestion boundary.
- stdio launcher.
- HTTP proxy with explicit limited coverage.
- Go/C# SDK parity based on demand.
- Additional protocol/version fixtures.

Exit criteria: integration coverage and limitations are visible in Setup and docs; no alternative path falsely claims native coverage.

### Phase 6 — product intelligence and scale (ongoing)

Deliverables:

- Evidence-backed recommendations.
- TrackMCP MCP query server.
- Multi-server correlation where customers provide a shared task/trace handle.
- Enterprise retention, private deployment, regional controls, SSO, audit, and customer-managed keys as demand requires.

## 17. QA and verification strategy

### Contract fixtures

Build fixtures for:

- Modern and legacy protocol versions.
- Each transport.
- Tool success/error/input-required.
- Resource reads with multiple contents.
- Prompt success/error/input-required.
- Completion requests and `hasMore`.
- Elicitation accept/decline/cancel, form and URL modes.
- Sampling complete/error/declined/truncated.
- Subscriptions and list-changed notifications.
- Stream disconnect, process crash, graceful shutdown.
- Catalog pagination, empty-string cursors, cursor expiry, authorization-scoped catalogs.
- Structured content plus ordinary content.
- Duplicate/replay/out-of-order events.
- Missing identity and self-reported identity.

### Assertions

- No secret appears in raw, derived, logs, error messages, URLs, or analytics payloads.
- Ingestion is idempotent.
- SDK telemetry failure never changes MCP response.
- Derived facts are deterministic for the same input and classifier version.
- Late retries update prior outcomes.
- Low-volume comparisons become insufficient-data, not misleading percentages.
- All dashboard numbers include scope, freshness, and evidence quality.
- Backfills do not double-count.

### Performance and operations

- Bounded event payload size.
- Per-key and per-workspace rate limits.
- Queue lag metrics.
- Ingestion p50/p95/p99.
- Classifier throughput.
- Rollup freshness.
- Dead-letter count.
- Retention job health.
- Dashboard query latency and truncation rate.

## 18. Security and privacy gates

Before production exposure of any new telemetry:

- Threat-model ingestion and identity resolution.
- Validate key scope and rotation/revocation.
- Confirm no token passthrough.
- Confirm audience/resource validation before identity resolution.
- Redact secrets and personal data before persistence.
- Enforce workspace/server/environment authorization on every read.
- Define retention for raw, derived, and audit data.
- Log operator access to sensitive evidence.
- Provide customer deletion/export controls.
- Review cross-tenant cache and catalog isolation.
- Security-review proxy/gateway designs for confused-deputy risks.

## 19. Metrics for the company and product

### Product activation

- SDK install → activation completion.
- Activation → first accepted event.
- First event → repeat activity.
- Time to first verified event.
- Setup abandonment by step.
- Native versus alternative integration coverage.

### Product value

- Weekly active workspaces.
- Workspaces with verified account identity.
- Workspaces with repeat usage.
- Insights viewed and acted upon.
- Action Queue issues resolved.
- Time from regression to detection.
- Time from detection to resolution.
- Customer-reported usefulness.

### Data quality

- Clean classified event percentage.
- Unresolved identity percentage.
- Unmatched retry percentage.
- Duplicate/replay percentage.
- Queue lag and rollup freshness.
- Coverage by protocol/transport/capability.

### Business validation

- Interview evidence by persona.
- Paid conversion by first use case.
- Competitive displacement reason.
- Retention of workspaces after first insight.
- Cost per observed event and per active workspace.

## 20. Decisions required before Phase 1 begins

These are the few questions that must be answered by product/CTO, not guessed by engineers:

1. Which MCP specification versions are first-class in v1?
2. Is the first paid use case tool reliability, workflow completion, or adoption intelligence?
3. What is the official no-retry observation window?
4. Are outcomes request-level, explicit-workflow-level, or both in MVP?
5. Which customer identity claims/resolvers are supported first?
6. What raw payload, if any, may be stored under opt-in policy?
7. What are raw and derived retention periods?
8. What is the minimum sample size for comparisons?
9. Which transports are fully supported versus limited coverage?
10. Which metrics are allowed to be called “completion,” “failure,” or “health”?
11. What are severity weights and Action Queue ownership defaults?
12. Which enterprise/security requirements are launch blockers?
13. What is the OTel boundary and minimum semantic field set?
14. What evidence threshold permits an automated recommendation?
15. What is the initial pricing and packaging hypothesis?

## 21. Immediate next 10 engineering tickets

1. Create canonical naming and compatibility decision record.
2. Write event-envelope v2 and identity/privacy contract.
3. Add protocol fixture harness and classifier test vectors.
4. Split raw transport/RPC/notification/catalog concerns in the persistence design.
5. Add account resolver hooks and verified/self-reported identity fields to SDK events.
6. Implement catalog snapshot/version joins (worker writes and bounded API
   projection are local; previous-version diff joins remain).
7. Implement capability-aware shared outcome classifier.
8. Implement data-trust facts and dashboard disclosure contract.
9. Build `/api/v2/overview` and `/api/v2/tools` read models behind feature flags.
10. Build Setup → first event verification and instrument its activation metrics.

## 22. Definition of done for the new platform

The Founder OS project is not done when the homepage and dashboard look complete. It is done for an initial launch when:

- A customer can install a supported SDK in one clear path.
- The server continues working if TrackMCP is unavailable.
- The first event is verified and its provenance is visible.
- Account identity is optional, explicit, and privacy-safe.
- Tools/resources/prompts/transport events are classified consistently.
- Outcomes distinguish facts from inferences.
- Journey retry matching uses the correct protocol state handle.
- Reliability shows both failures and data trust.
- Every dashboard metric exposes scope, freshness, denominator, and caveats.
- A regression can create an Action Queue issue with evidence and owner.
- A customer can export or delete their data according to policy.
- CI, migrations, package releases, and deployment are governed by the GitHub rules above.
- Documentation explains what TrackMCP knows, how it knows it, and what it cannot know.

