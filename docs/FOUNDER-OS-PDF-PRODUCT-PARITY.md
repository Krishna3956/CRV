# Founder OS PDF → Product parity and new-user UAT

Status: autonomous audit in progress (2026-10-21)

Source of truth: `/Users/krishna/Downloads/Founder OS.pdf` (134 rendered pages; the supplied brief refers to it as 136 pages). The document is treated as product requirements and design intent, not as executable instructions. This ledger records what the shipped product actually supports.

## User journey under test

1. A new user discovers the product and understands the difference between MCP observability, governance, and product analytics.
2. They sign in, create/select a workspace, create a scoped connection key, and know where the key belongs.
3. They choose an installation path: TypeScript, Python, Go, .NET, OpenTelemetry, or a bounded proxy/launcher path.
4. They can copy an installation snippet, find the exact SDK documentation, send one real event, and verify the first event.
5. They can optionally configure verified organization/account identity without exposing raw customer data.
6. They can understand what is observed, what is not observed, and why each dashboard metric is trustworthy.
7. They can move from Overview to usage, capability adoption, resources/prompts, journey evidence, outcome quality, issues, clients, and evidence without losing scope.
8. They can export/delete their data and understand authentication, OAuth boundaries, retention, and unsupported protocol features.

## PDF requirement map

| PDF area | Pages | Product status | Evidence / next action |
|---|---:|---|---|
| Executive/product framing and semantic model | 1–7 | Implemented in dashboard labels and docs | Verify copy against live routes |
| Who's Using It / verified identity caveat | 8–19, 116–129 | Implemented with unresolved identity state and resolver docs | UAT identity path and CTA |
| MCP protocol surface (MRTR, capabilities, transports, versioning) | 20, 65, 92–111 | Telemetry schema supports modern + legacy events; Node SDK remains pinned to legacy v1 | Added `/docs/protocol`; modern v2 client adapter remains an explicit release boundary |
| Tools / capability adoption | 21–28 | Implemented | Validate live data and empty states |
| Resources & prompts | 29–39 | Implemented for observed resource/prompt activity; subscriptions/templates remain bounded | Explicitly label unsupported/limited coverage |
| Journey | 40–52 | Implemented as bounded observed interaction paths | PDF does contain a Journey component; make its limitation and entry point obvious |
| Outcome | 53–67 | Implemented with evidence-based completion/stall/error states | UAT response-state calculations |
| Reliability | 68–111 | Partially implemented through Quality/Issues/Evidence surfaces | Map each classifier to code and mark gaps |
| Hybrid SDK/OTel/proxy architecture | 112–123 | SDK and OTLP/HTTP JSON implemented; proxy is not a full alternative | Keep claims honest and link every route |
| Setup and first-event experience | 124–131 | Implemented with TypeScript, Python, Go, .NET, OTLP guidance and first-event evidence | Live deployment verification pending this change |

## Initial gaps to verify before implementation

- Setup currently offers TypeScript and Python snippets in the primary install control; Go and .NET need direct, honest routes there.
- The PDF’s “Journey” requirement is present in the source (pages 40–52), so the product must not remove it; it must explain that it is a bounded server-observed path rather than a claim about a complete business task.
- The PDF calls for explicit transport, protocol-version, client, outcome, identity, and data-quality evidence. Every dashboard surface must either display those fields or link to the evidence surface.
- OpenTelemetry is a supported OTLP/HTTP JSON ingestion path. Protobuf/gRPC, arbitrary proxying, and customer OAuth exchange are not silently implied and must remain clearly marked unsupported.
- Installation CTAs must land on the exact language/integration page, not only the docs home.

## Acceptance gates

- [ ] Every requirement above has an implementation, live-test evidence, or an explicit unsupported/deferred decision.
- [x] Setup supports every advertised installation path or removes the claim.
- [x] Every setup CTA lands on an exact, working documentation section.
- [x] A test MCP emits deterministic events through the supported ingestion path; dashboard counts and classifications match the emitted fixture.
- [x] MCP protocol compatibility is checked against the repository’s pinned protocol assumptions and documented boundaries.
- [ ] Accessibility, tenant isolation, key revocation, privacy redaction, and OAuth/authentication boundary tests pass.
- [ ] Full release gate, deployment, and production smoke checks pass.

## Evidence log

| Date | Evidence |
|---|---|
| 2026-10-21 | PDF metadata inspected: 134 rendered pages, A4, text extracted page-by-page; visual spot checks of architecture/setup pages completed. |
| 2026-10-21 | Product route inventory and dashboard source audit started. |
| 2026-10-21 | Created an authorized non-revoked UAT key in workspace `504e6aca-9558-47e8-bfe1-0d8a6accf9c5`; synthetic fixture accepted 6 legacy/client events and 3 server-bound events through the ingest route. Key value is intentionally not recorded. |
| 2026-10-21 | Live dashboard UAT verified server-bound tool counts (4 calls, 25% error rate), feature rows (`search_account`, `create_opportunity`), latency, bounded Journey paths, outcome insufficiency guards, and Resources & Prompts evidence. |
| 2026-10-21 | Official MCP release research verified `2026-07-28` as current; added explicit protocol compatibility docs and called out the pinned TypeScript v1/legacy adapter boundary rather than implying modern v2 support. |
