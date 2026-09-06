# PRD-P1-03: Tool-Quality Analytics

Status: Finalized for implementation approval; implementation not yet authorized
Workstream: Priority 1, Workstream 3
Dependencies: P0 event contract, P0 privacy and bounded capture, P0 trace explorer, P1-01 correlation handles, P1-02 intent and missing-capability capture

## 1. Product goal

Turn observed MCP catalog and event data into bounded, workspace-scoped answers about which tools are unused, failing, producing observable empty results, repeatedly called, associated with explicit workflow friction, or changing around a quality regression.

The product must remain honest about the server boundary. It measures observed protocol and application signals; it does not see private model reasoning, know which tools were considered but not selected, or prove why a workflow did not complete.

## 2. Scope

### In scope

- A dedicated authenticated `GET /api/v1/tool-quality` endpoint.
- Bounded application-level catalog reconstruction from timestamped catalog events.
- Historical joins from each tool call to the catalog snapshot effective at that call timestamp.
- Tool call share, error, observable empty-result, retry, repeat-call, catalog-change, and explicit workflow-path metrics.
- Client and intent-source breakdowns subject to minimum-volume rules.
- A clearly labeled Tool Quality dashboard view under the existing Quality area.
- Documentation for metric semantics, evidence boundaries, and insufficient-data states.
- Focused unit, integration, adversarial, API, workspace-isolation, and UI contract tests.

### Out of scope

- Client-side or host-side instrumentation.
- Private model reasoning, prompts, completions, or token-cost analysis.
- Inferred user intent or inferred tool consideration.
- Causal claims about model behavior or tool descriptions.
- Alerts, regression notifications, scheduled monitoring, or outbound delivery.
- MCP gateways, proxies, client adapters, or generic agent tracing.
- New identity or actor models.
- Payload capture changes or privacy-transform changes.

## 3. Product principles

1. **Observable facts first.** Counts, hashes, timestamps, explicit retry numbers, explicit workflow states, and server-returned outcomes are observations.
2. **Derived metrics are labeled.** Rates, shares, percentiles, snapshot joins, and repeat-call patterns are calculations over observed events.
3. **Associations are not causes.** A tool can be associated with an incomplete workflow without being the cause of that outcome.
4. **No selection inference.** The product uses `tool_call_share`, not `selection_rate`. It does not claim to know when a tool was considered but not selected.
5. **No completion inference.** Completion metrics use explicit workflow events and explicit workflow paths only. Session endings and successful tool responses do not establish completion.
6. **Insufficient evidence is visible.** Below-threshold values are `null` or carry an `insufficient_data` state.
7. **Live and sample data remain distinct.** Sample dashboard values must never be presented as workspace observations.

## 4. Canonical metric definitions

All metrics are calculated within the selected authenticated workspace and time range. An event is eligible only when it has the fields required by that metric and is not a duplicate rejected by ingest.

### 4.1 Tool call share

`tool_call_share` is:

```text
calls for the tool / all eligible tool calls in the selected scope
```

It is an observable share of received tool calls. It must not be labeled or described as a selection rate, preference score, opportunity rate, or evidence that a client considered the tool.

### 4.2 Error rate

```text
failed eligible calls / eligible calls with a known outcome
```

An eligible call is failed when the canonical event has `is_error = true` or `success = false`. Calls with neither a known success nor an error outcome are excluded from both numerator and denominator.

### 4.3 Observable empty-result rate

```text
structurally empty successful results / successful calls whose result is inspectable
```

The result is inspectable only when:

- the event payload is present;
- the payload is not metadata-only;
- the payload and result are not marked with a truncation marker; and
- the result structure is available without guessing from a missing field.

The implementation must use a documented structural predicate for empty results. It may count an explicitly present empty MCP result structure, such as an empty `content` array, but must not infer emptiness from a missing payload, an unavailable result, a truncated result, or a successful response with no inspectable result structure. Textual content is not empty merely because it is short or absent from a metadata-only event.

### 4.4 Retry rate

```text
calls with retry_number > 0 / calls with known retry metadata
```

Calls without known retry metadata are excluded from the denominator. This metric describes explicit retry metadata and does not prove a re-ask.

### 4.5 Observed repeat call

An observed repeat call is the same tool called at least twice within five minutes in the same session or correlation group, excluding calls explicitly marked as retries.

The UI label is **Observed repeat call**. It must never be labeled **Confirmed re-ask**, **user frustration**, or equivalent inferred language. Calls cannot be grouped when there is no usable session or correlation grouping value.

### 4.6 Advertised but unused tools

A tool is advertised when it appears in an observed `tools/list` catalog snapshot. A tool is unused for that snapshot when no matching tool call occurs while that snapshot is effective.

The implementation must preserve snapshot time boundaries and must not compare calls only with the latest catalog. The result should identify the catalog description and schema hashes supporting the classification.

### 4.7 Catalog changes

Catalog comparisons group calls by the effective description and schema hashes from the catalog snapshot advertised at the time of the call. A before/after comparison is eligible only when both sides meet the catalog-comparison minimum volume.

The output must say that the metric changed after or around a catalog change. It must not say that the description or schema caused the change.

### 4.8 Completion by explicit tool path

Tool paths are attributed only when:

- events share an explicit `workflow_id`;
- the events can be ordered by timestamp; and
- the workflow has explicit started and completed lifecycle events.

The metric is:

```text
explicitly completed workflows / explicitly started workflows with a known path
```

Session endings, successful tool responses, and inferred sequences are not completion evidence. Workflows with no known path are excluded from this metric.

### 4.9 Successful tools associated with low explicit completion

A tool may be listed as associated with low explicit completion when it appears in explicit workflow paths whose completion rate is below the approved threshold and whose workflow sample meets the minimum-volume rule.

For this implementation the approved threshold is fixed at `0.80` and is not configurable. The exact eligibility rule is:

- explicit completion rate is strictly below `0.80`;
- at least 20 eligible workflows have an explicit `completed` or `failed` terminal outcome;
- the tool path has at least 30 associated eligible calls; and
- missing or unknown workflow outcomes are excluded from the rate.

The response and dashboard label are **Associated with low explicit completion**. This is an association for investigation, never a causal claim or evidence of an LLM/model problem.

This is an association for investigation. It must not imply that the tool caused the incomplete workflow or that the model made an error.

### 4.10 Client and intent-source breakdowns

Breakdowns may be shown by `client_name` and `intent_source` using the same metric definitions as the overall view. Each segment must satisfy both the call-count and session-count minimum-volume rules before rates or comparisons are shown.

## 5. Minimum-volume rules

These thresholds are normative:

- Tool-level metrics: at least 30 eligible calls.
- Client or intent-source comparisons: at least 30 calls and 10 sessions per segment.
- Explicit workflow completion: at least 20 explicitly started workflows.
- Low explicit completion association: at least 20 eligible workflows with an explicit terminal outcome and at least 30 associated eligible calls, with a strictly below `0.80` completion rate.
- Catalog comparisons: at least 30 eligible calls on each side of the catalog change.

Below a threshold, return `null` for the metric and include `insufficient_data` in the applicable evidence state. Counts may remain visible when useful, but a count must not be formatted as a reliable rate.

## 6. API contract

### Endpoint

```http
GET /api/v1/tool-quality?days=30
Authorization: Bearer <workspace-api-key>
```

The endpoint must also support the existing authenticated dashboard session behavior. It must use the same workspace resolution and authorization rules as `/api/v1/analytics`.

### Query bounds

- `days` defaults to `30`.
- `days` accepts integer values from `1` through `90`.
- The application-level source-event scan must remain bounded by the current analytics limit of 10,000 rows for the selected workspace and period.
- Catalog reconstruction, group sizes, and response arrays must be bounded; no unbounded payload or event replay may be returned.
- Results must have deterministic ordering, with tool names and breakdown keys used as tie-breakers.
- Every database read must include the authenticated workspace predicate.

If the bounded source scan cannot establish complete evidence for a metric, the response must expose the limitation through `insufficient_data` or an equivalent bounded state rather than silently presenting a partial comparison as complete.

### Response shape

The response is a JSON object with this contract:

```json
{
  "range_days": 30,
  "source_event_count": 1200,
  "tools": [
    {
      "name": "search_docs",
      "observed": {
        "call_count": 120,
        "successful_call_count": 116,
        "failed_call_count": 4,
        "known_outcome_call_count": 120,
        "inspectable_successful_result_count": 80,
        "known_retry_call_count": 120,
        "retry_call_count": 3,
        "session_count": 42
      },
      "metrics": {
        "tool_call_share": 0.18,
        "error_rate": 0.0333,
        "observable_empty_result_rate": 0.025,
        "retry_rate": 0.025,
        "observed_repeat_call_rate": 0.1
      },
      "catalog_snapshots": [
        {
          "name": "search_docs",
          "description_hash": "sha256...",
          "schema_hash": "sha256...",
          "effective_from": "2026-09-01T00:00:00Z",
          "effective_to": null,
          "eligible_call_count": 120
        }
      ],
      "completion_association": {
        "explicit_workflow_count": 22,
        "explicitly_started_count": 22,
        "explicitly_completed_count": 18,
        "completion_rate": 0.8182,
        "status": "associated_with_low_explicit_completion"
      },
      "breakdowns": {
        "clients": [],
        "intent_sources": []
      },
      "insufficient_data": []
    }
  ],
  "tool_paths": [
    {
      "path": ["search_docs", "create_issue"],
      "associated_call_count": 30,
      "started_workflow_count": 20,
      "terminal_workflow_count": 20,
      "completed_workflow_count": 15,
      "completion_rate": 0.75,
      "status": "associated_with_low_explicit_completion",
      "insufficient_data": []
    }
  ],
  "catalog_comparisons": [],
  "insights": [],
  "truncated": false
}
```

The example values are illustrative only. The implementation must not ship these values as sample or live data.

Metric fields are nullable. `insufficient_data` is a bounded list of stable reason codes such as `tool_volume`, `segment_volume`, `workflow_volume`, `catalog_volume`, `missing_grouping`, `uninspectable_result`, or `bounded_source_scan`.

`insights` may contain only bounded, non-causal associations. Each insight must identify the metric, sample counts, scope, and relevant catalog hashes when applicable.

## 7. Catalog reconstruction

The first implementation uses bounded application-level reconstruction from timestamped catalog events. It must:

1. Load only workspace-scoped events within the bounded selected period.
2. Identify catalog snapshots from observed `tools/list` catalog events.
3. Order snapshots by `started_at` and retain each tool’s description and schema hashes.
4. Join each tool call to the most recent snapshot effective at that call’s timestamp for the same observable scope.
5. Preserve the call’s observed tool description/schema hashes as evidence.
6. Avoid collapsing all history into the latest catalog.

The existing `trackmcp_catalog_versions` table must not be populated or repurposed as part of this PRD unless a reviewed query-plan decision proves that event-based reconstruction is insufficient. No migration is planned by default.

## 8. Dashboard requirements

Add a **Tool Quality** view under the existing **Quality** area.

The view must:

- distinguish **Observed**, **Derived**, and **Association** sections or labels;
- show tool call share, error rate, observable empty-result rate, retry rate, and observed repeat-call indicators;
- show eligible counts and minimum-volume states;
- show client and intent-source breakdowns only when their segment thresholds are met;
- show catalog description/schema hash context for catalog comparisons;
- show explicit workflow-path completion separately from session heuristics;
- link to bounded traces where a usable session or correlation handle exists;
- preserve the existing sample/live-data labeling;
- use “Observed repeat call,” never “confirmed re-ask”;
- avoid wording that attributes causality to a tool, description, schema, client, or model.

Sample data must be visibly labeled and must not be mixed with live API responses.

## 9. SDK and documentation requirements

No SDK runtime changes are expected. P0/P1-01/P1-02 already provide the required event fields: catalog metadata, description/schema hashes, retries, client identity, intent source, session provenance, correlation provenance, and explicit workflow events.

Update documentation to cover:

- the `/api/v1/tool-quality` endpoint;
- `tool_call_share` terminology;
- error, empty-result, retry, repeat-call, catalog, and workflow-path semantics;
- minimum-volume and `insufficient_data` behavior;
- live versus sample data;
- observation versus association boundaries;
- the fact that server-boundary telemetry cannot reveal considered-but-unselected tools, private reasoning, or confirmed re-asks.

Expected documentation surfaces:

- `src/app/docs/api/page.tsx`
- `src/app/docs/reference/page.tsx`
- `packages/typescript-sdk/README.md` only if metric interpretation affects public SDK guidance
- `../packages/python-sdk/README.md` only if metric interpretation affects public SDK guidance

## 10. Tests and acceptance criteria

### Unit tests

- `tool_call_share` uses all eligible tool calls in scope.
- Error-rate denominator excludes calls without known outcomes.
- Empty-result numerator excludes metadata-only, missing, unavailable, and truncated payloads.
- Empty-result detection uses only a present structural result.
- Retry-rate denominator excludes calls without retry metadata.
- Repeat calls require the same tool, a five-minute window, and the same session or correlation group.
- Explicit retries are excluded from repeat-call patterns.
- Workflow completion requires explicit workflow IDs, timestamps, starts, and completions.
- Session endings and successful tool responses do not count as completion.
- All minimum-volume thresholds produce `null` or `insufficient_data`.
- Catalog snapshots are joined by effective timestamp, including catalog changes.
- Metrics are deterministic and do not claim causality.

### Integration/API tests

- API-key authentication and signed-in workspace authentication.
- Unauthorized requests are rejected.
- Workspace A cannot observe catalog, event, workflow, or tool-quality data from workspace B.
- `days` validation and 1–90 day bounds.
- Source-event and response bounds are enforced.
- Stable ordering and bounded arrays.
- Legacy events and null P1 fields remain safe.
- Duplicate events do not inflate quality metrics.
- Client and intent-source breakdown thresholds are enforced.
- Catalog before/after comparisons require volume on both sides.
- Correlation grouping does not fall back to request IDs.

### Dashboard/documentation tests

- Tool Quality is reachable under Quality.
- Live and sample states are visibly distinct.
- Insufficient data is rendered honestly.
- Observed repeat calls are not labeled as confirmed re-asks.
- Association copy does not claim causality or LLM failure.
- Tool-quality links preserve bounded trace and workspace behavior.
- API documentation matches the implemented response shape.

### Acceptance criteria

P1-03 is complete only when:

1. A reviewer can identify the catalog snapshot, tool path, client, intent source, denominator, sample count, and evidence behind every displayed quality metric.
2. The dedicated endpoint is authenticated, workspace-scoped, bounded, deterministic, and separate from the existing aggregate analytics endpoint.
3. Every metric follows the definitions and minimum-volume rules in this document.
4. Catalog changes are reconstructed historically rather than replaced by the latest snapshot.
5. Empty, retry, repeat-call, completion, and insufficient-data semantics are tested adversarially.
6. The dashboard labels observation, derivation, and association separately.
7. No UI, API, SDK, or documentation text claims private model visibility, confirmed re-asks, true selection opportunities, or causal model/tool failure.
8. No client instrumentation, alerts, gateways, migrations, or unrelated roadmap functionality is included.

## 11. Rollout and rollback

1. Begin only after P1-02 live authenticated verification is complete.
2. Branch from the latest merged `main` and open one focused implementation PR after this PRD is approved.
3. Implement the endpoint and dashboard behind existing authenticated surfaces.
4. Validate with synthetic catalog changes, low-volume data, empty/truncated payloads, explicit retries, repeated calls, and workflow paths.
5. Run lint, production build, TypeScript SDK tests, Python tests, focused API/UI tests, and `git diff --check`.
6. Deploy through the existing main/App Runner workflow only after review.
7. Verify authenticated and unauthenticated API behavior, workspace isolation, live dashboard labeling, response bounds, and database error logs.

The implementation should require no database migration. If query-plan evidence proves a new index is necessary, add only a forward-only migration after separately documenting staging application and rollback considerations.

Rollback is an application rollback to the previous main commit when no migration is present. A migration, if later approved, must be independently staged and verified before production deployment.

## 12. Risks and unresolved implementation questions

- The detailed PRD is now defined by this document; any change to denominators, thresholds, response fields, or empty-result rules requires review before coding.
- True tool-selection opportunities remain unobservable; `tool_call_share` must not be renamed.
- Repeat calls remain an observed server-boundary pattern and cannot establish a re-ask.
- Metadata-only and truncated payload modes reduce the denominator for empty-result metrics.
- A bounded 10,000-event source scan may yield `bounded_source_scan` rather than a complete comparison for high-volume workspaces.
- Application-level catalog reconstruction may require later query optimization, but it must not silently change the historical join semantics.
- Workflow attribution is unavailable for events without explicit `workflow_id` and explicit lifecycle events.
