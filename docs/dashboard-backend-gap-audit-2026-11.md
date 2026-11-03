# Dashboard backend-gap audit — 2026-11

Status: implementation audit for the research-to-dashboard goal
Date: 2026-11-03

This audit answers one question: can a business-facing dashboard value be
traced to a bounded backend source, or is it only presentation? It is based on
the merged dashboard data contract, the current analytics handler, and the
dashboard component. It does not treat Example data as production evidence.

## Verified end-to-end paths

| Business surface | UI | Typed response | Server source/calculation | Boundary |
| --- | --- | --- | --- | --- |
| Overview activity | `DashboardApp.tsx` `Overview` | `Analytics.total_events`, `tool_calls`, `clients`, `timeline` | `src/app/api/v1/analytics/handlers.ts` reads workspace-scoped `trackmcp_events`, bounds the scan, and preserves `data_trust` | Observed events, not customer count |
| Explicit outcomes | Overview, Journeys, Did it work | `outcome_activity`, `workflows`, `completion_rate`, `completion_source` | `aggregateTrackMCPFacts`, task lifecycle aggregation, and explicit workflow events | Missing outcome is unknown, not failure |
| Assistants and account groups | Who's using it | `who_is_using_it`, `account_summary` | Resolver-linked account keys and client fields from server observations; raw keys are removed before response | Privacy-safe groups, not named people |
| Capability adoption | What they're doing | `capability_activity`, `tool_adoption`, `tools` | Bounded tool/call aggregation plus catalog observations | Advertised versus observed is explicit |
| Resource/prompt use | Resources & prompts | `interaction_surfaces`, `resource_prompt_activity` | Protocol method observations, linked retry/outcome projections, hashed entity counts | Content, URIs, and arguments stay out of browser |
| Journey evidence | The journey, Evidence | `journey_activity`, `workflows`, `TraceResponse` | Safely correlated session/interaction/workflow events | A path is an observed server path, not a complete business task |
| Reliability and issues | Did it work, What's broken | `ToolQualityResponse`, `issue_activity`, `insights`, incidents/action queue | Tool-quality aggregation, alert/incident routes, action queue projections | A signal is not an automatic diagnosis |
| Setup readiness | Setup | `/api/v2/setup`, workspace/key routes, analytics | Key state, first accepted event, transport/MCP/privacy checks | Readiness is evidence, not a health probe |

## Backend gaps that remain real

These are not hidden by the UI and should not be presented as complete until a
read model and focused test exist:

1. **Account concentration read model** — current top-account-group values are
   privacy-safe and real, but there is no durable, named-customer model. This is
   intentional; adding names would violate the privacy boundary.
2. **Resource/prompt entity analytics** — method-level activity and bounded hash
   counts are available. Content-level semantics, URI-level reporting, and
   prompt-argument analytics are intentionally unsupported.
3. **Deployment joins** — `deployment_summary` reports observed deployment
   linkage counts only. It is not release health, rollout success, or a
   deployment inventory.
4. **Replay/heatmaps** — not implemented. Adding them requires a separate
   privacy/retention review and is outside the current pilot contract.
5. **Saved views/exports** — not implemented as persisted product features.
   Export is a product decision and schema/API review, not a UI-only add-on.
6. **MCP protocol families** — the analytics response exposes bounded family
   observations and capability gaps. It does not claim support for protocol
   semantics that the SDK/observer did not emit.

## Rules for the next implementation slices

- Do not add a KPI to `DashboardApp.tsx` unless its field exists in
  `analytics-types.ts` or a dedicated authenticated response type.
- Do not add a server calculation without a bounded query, a data-trust state,
  and a focused test that distinguishes zero from unavailable evidence.
- Do not turn Example-mode values into live fallback values.
- Do not expose raw identity keys, payloads, prompt arguments, resource URIs,
  API keys, or deployment secrets to the browser.
- When a gap is product-intentional (for example replay or named accounts),
  show a concise boundary note or omit the surface; never invent the metric.

## Evidence

- `docs/dashboard-data-contract-2026-11.md`
- `trackmcp-nextjs/src/lib/telemetry/analytics-types.ts`
- `trackmcp-nextjs/src/app/api/v1/analytics/handlers.ts`
- `trackmcp-nextjs/src/components/dashboard/DashboardApp.tsx`
- `trackmcp-nextjs/src/components/dashboard/dashboard-data-contract.test.mjs`
- `trackmcp-nextjs/src/components/dashboard/DashboardApp.contract.test.mjs`
- Release gate result before this audit: 159 suites passed on commit
  `87d3add1`/merged release `affb0890`.
