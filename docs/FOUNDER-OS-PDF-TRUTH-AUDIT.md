# Founder OS PDF truth audit

Date: 2026-10-19  
Source reviewed: `/Users/krishna/Downloads/Founder OS.pdf` (134 pages, read end-to-end)  
Repository reviewed: `Krishna3956/CRV` local working tree  

This is a product-truth audit, not a release approval. It separates what the
Founder OS document describes, what the repository implements, and what still
needs an operational or product decision. Local source and tests do not prove
that a feature is deployed or available to a customer.

## Executive conclusion

The repository implements a credible, privacy-first MCP server telemetry
foundation. It does **not** yet implement every capability described in the
Founder OS document. In particular, the hybrid integration architecture is
incomplete: native SDK ingestion and a bounded authenticated OTLP/HTTP JSON
receiver exist, but OTLP/gRPC, external export, and the proxy/stdio fallback
are not implemented. Several MCP protocol surfaces
(sampling, elicitation, subscriptions, progress, cancellation, completions,
and task lifecycle) are discussed in the PDF but are not represented as a
complete, persisted, tested product model.

The current dashboard is a useful technical/semantic foundation, but it is not
yet a complete realization of the PDF's business-user information architecture.
The dashboard Setup surface now combines server/environment labels, method
choice, key management, optional identity, privacy, and first-event verification
as one coherent surface. CLI device activation remains a separate authentication
and key-redemption path; deployed browser/UAT evidence is still tracked
separately.

Therefore the correct product claim is:

> TrackMCP currently provides privacy-safe native SDK telemetry and bounded
> MCP analytics for observed server-boundary activity, with conservative facts,
> explicit data-trust caveats, and a CLI activation path.

The product must not currently claim complete OTel connectivity (the supported
boundary is JSON/protobuf and metadata-only), full MCP
protocol coverage, verified end-to-end business outcomes, or a production-ready
proxy/launcher fallback.

## What the PDF says TrackMCP must own

The source statements below are from the PDF's “Where TrackMCP should be
different” section (PDF p. 4), the technical architecture decision (p. 112),
the MVP/Next/Later sequencing (p. 119), and the simplified setup experience
(pp. 125 and 129).

The PDF's differentiation is outcome and product analytics for MCP, not a
smaller PostHog or a generic infrastructure monitor. Its five questions are:

1. Is the MCP being adopted?
2. What are people trying to do?
3. Does the work get completed?
4. Where does the experience break?
5. What should the team fix first?

Every recommendation is required to expose the observed event, evidence,
affected volume, likely cause, confidence, and suggested fix/impact. The
repository has foundations for these questions (`facts`, `outcomes`,
`reliability`, `data-trust`, and `action-queue`), but the answer is only as
strong as the events actually captured. Absence of a server event is not proof
that a user abandoned a task, and a successful tool response is not proof of a
business outcome.

## Requirement-to-reality matrix

| PDF requirement | Current repository evidence | Truth status | Required next proof or work |
|---|---|---|---|
| Outcome-first positioning | Homepage/docs copy and metric contract use observed evidence and explicit outcomes | **Implemented in local copy; release-dependent** | Product review, then publish one consistent claim set |
| Business-friendly dashboard language | Dashboard views: Overview, Journeys, Capabilities, Quality, Issues, AI clients, Evidence, Setup | **Partially implemented** | Complete business-user drill-downs and prove every metric has scope, denominator, freshness, and caveat |
| Honest client identity | `clientInfo` is labeled self-reported; unknown is retained | **Implemented** | Keep this caveat visible in all client charts and exports |
| Resolver-based account identity | SDKs hash bounded resolver output into `account_key` | **Implemented but not verified identity** | Add server-attested/workspace-keyed identity semantics before calling it “verified” |
| Metadata-first privacy | SDK redaction, bounded payloads, secret scans, no raw keys/tokens by default | **Implemented locally** | Repeat the scan on the exact release tree and review production logs |
| Native TypeScript SDK | Direct HTTPS ingestion, catalog metadata, identity resolver, bounded queue, packed-consumer coverage; npm registry currently serves `@trackmcp/sdk@0.1.19` | **Implemented and published; production deployment evidence remains release-specific** | Keep the packed consumer gate and exact candidate provenance tied to the pilot release |
| Native Python SDK | Direct HTTPS ingestion, privacy controls, catalog metadata, resolver, bounded middleware/wrapper lifecycle events, explicit transport metadata, and PyPI-style consumer coverage; PyPI currently serves `trackmcp==0.1.12` | **Implemented and published; production deployment evidence remains release-specific** | Keep unsupported middleware seams documented and exact candidate provenance tied to the pilot release |
| Streamable HTTP and stdio awareness | Event envelope has explicit transport values; TypeScript/Python middleware or adapters emit bounded initialize/shutdown boundaries, TypeScript records bounded transport-error session failures and duration, Python transport metadata is explicit, and local child-exit/socket-disconnect fixtures cover the failure boundary | **Implemented locally / bounded; production reconnect UAT remains open** | Keep transport-owned reconnect policy, proxy behavior, and authenticated production disconnect evidence explicitly separate; transport must not be inferred when unknown |
| OTel interoperability | `mapOTelSpanToTrackMCPEvent`, bounded authenticated OTLP/HTTP JSON and protobuf receiver, docs, and production smoke for the deployed release | **Implemented as a bounded OTLP/HTTP receiver** | Run a separate authenticated pilot-key protobuf UAT; OTLP/gRPC and external export remain unsupported and must not be marketed |
| Proxy/stdio launcher fallback | No complete hosted proxy or local launcher telemetry path | **Missing** | Implement only as a separate limited-coverage milestone |
| Tools analytics | `/api/v2/tools`, detail route, bounded catalog hashes/method facts, and additive opaque cursor pagination | **Implemented/limited** | Persist snapshot/version lineage and add seeded integration evidence |
| Resources analytics | Method-family/count projection plus a hash-only `resources/read` entity projection, service-role refresh persistence, bounded v2 read model, and production RLS postflight | **Implemented as a bounded privacy-safe surface** | Continue authenticated production read evidence; never expose URI/content values or infer reads from catalog listings |
| Prompts analytics | Method-family/count projection plus bounded `prompts/get` result metadata and the same hash-only entity projection; zero durable rows remain an explicit no-evidence state | **Implemented as a bounded privacy-safe surface** | Continue authenticated production prompt-read evidence; never expose prompt arguments/content or infer reads from prompt listings |
| Completions | Semantic fixtures and TypeScript/Python metadata-only response observation for explicit bounded result types; authenticated analytics exposes bounded protocol-family request/response role counts and capped suggestion metadata without retaining values | **Implemented as a bounded privacy-safe signal; full interaction joins remain partial** | Add capability-aware request/result joins and broader runtime/transport evidence; never expose suggestion values or arguments |
| Sampling | Semantic fixtures and TypeScript/Python metadata-only response observation for explicit bounded result types; authenticated analytics preserves request/response role counts and explicit input-required/unknown outcomes | **Implemented as a bounded privacy-safe signal; approval lifecycle remains partial** | Add capability-aware approval/rejection lifecycle vectors and authenticated runtime evidence; never infer approval from activity |
| Elicitation | Semantic fixtures and TypeScript/Python metadata-only response observation for explicit bounded result types; authenticated analytics preserves request/response role counts and explicit input-required/unknown outcomes | **Implemented as a bounded privacy-safe signal; user-input lifecycle remains partial** | Add capability-aware accept/decline/cancel lifecycle vectors and authenticated runtime evidence; never retain user-entered values |
| Progress/cancellation | Bounded allowlisted signal primitives across TypeScript, Python, Go, and .NET; local client/transport fixtures; authenticated daily signal timeline; values, reasons, request IDs, and payloads remain excluded | **Implemented locally / bounded** | Complete per-transport production UAT and retain the metadata-only privacy boundary |
| Subscriptions/list-changed | Bounded subscription/list-change request, acknowledgement, invalidation, and catalog-version observations; local reconnect/listener fixtures; daily signal timeline | **Implemented locally / bounded** | Complete stream close/reconnect and authenticated production UAT; do not imply durable raw subscription state |
| Task lifecycle | Semantic classification recognizes explicit task IDs and allowlisted working/input-required/completed/failed/cancelled/expired states without inferring abandonment; service-role refresh persists hash-only transition rows in `trackmcp_task_transitions`, and the bounded v2 read model exposes latest state, first/last observation, count, terminality, and evidence quality | **Implemented and production-postflight verified; cross-server joins remain partial** | Add authenticated production-shaped transition evidence when disposable task traffic is available, and keep cross-server/business-task correlation explicitly bounded |
| Conservative outcomes | Explicit workflow events and insufficient-data states exist | **Implemented locally** | Expand for protocol-specific outcomes; never infer abandonment from inactivity |
| Journeys | v2 route and bounded correlation fields exist | **Partial** | Durable correlation across requests/tasks and evidence drill-down |
| Reliability | v2 route and bounded projections exist | **Partial** | Transport/process failures, baselines, and sufficient-data policy |
| Action Queue | Candidate generation, lifecycle, read/PATCH contracts, lease-fenced worker, workspace-scoped hash-only alert/queue identity link, bounded incident relationship, and lazy delivery-attempt evidence UI exist | **Implemented as a bounded review surface; production operations remain separate** | Retain production postflight for the relationship/delivery tables and gather repeated operational metrics; never turn an attempt into a delivery claim |
| Catalog snapshots/version joins | Snapshot normalization, workspace-scoped uniqueness, persisted hash/count snapshots, bounded diffs, deployment linkage metadata, and opaque cursor semantics exist in the v2 read model | **Implemented as a bounded privacy-safe surface; production migration evidence remains release-specific** | Retain migration/postflight evidence and continue authenticated production snapshot coverage; raw catalog identities remain unavailable by design |
| Setup wizard | Dashboard Setup combines bounded server/environment labels from the first accepted event, method-specific snippets, scoped key state, optional identity, privacy, OTLP/tester links, and first-event status; CLI device activation remains the separate auth/redemption path | **Implemented and authenticated browser-UAT verified for the observed journey** | Keep no-event/partial-event states and CLI activation as separate boundaries; repeat on the final candidate when the release SHA changes |
| API key management | Dashboard/API supports workspace-, service-, and environment-scoped keys, last-use status, one-time key creation response, revocation, and rotation with overlap-safe replacement semantics; CLI device redemption stores the key without exposing it in browser responses | **Implemented locally; production lifecycle evidence remains release-specific** | Run the disposable production key lifecycle smoke on the final candidate and retain the no-secret evidence |
| First-event verification | CLI key-status reports the first accepted ingest milestone, and Setup exposes no-key, checking, waiting, verified, and identity-unresolved states with actionable no-event troubleshooting | **Implemented locally; production-shaped evidence exists but final-candidate rerun remains open** | Repeat the disposable first-event/key-status flow against the final candidate and retain the redacted result |
| Account identity optionality | SDK resolver is optional and fail-open | **Implemented** | Make “Identify your organizations — optional” the user-facing language |
| Export/delete | Bounded secret-free export, authenticated review queue, legal-hold/retention checks, deterministic deletion planning/checkpoints, and non-destructive deletion requests exist; completion remains closed without a separately reviewed executor | **Implemented as a review-only privacy boundary; destructive execution intentionally external** | Approve and review an audited asynchronous deletion worker, then retain completion evidence; do not enable deletion by implication |
| Retention | Dataset-specific retention policy, UTC cutoffs, fail-closed `retention_cleanup` worker boundary, and read-only dry-run/postflight contracts exist | **Implemented as a fail-closed policy boundary; operational execution remains external** | Add an approved scheduler, lag/dead-letter metrics, replay procedure, and operator acceptance before enabling cleanup |
| CI/release governance | CI/release gate/hygiene scripts exist locally | **Implemented locally** | Run on clean release branch and record deployed SHA |

## Design and style truth

The PDF contains a product direction, not a machine-verifiable pixel spec. It
asks for a simple, business-first interface with technical detail behind
Evidence. The current source is visually coherent (ink/paper/mint palette,
bounded cards, a single Setup destination, and business labels), but source
inspection cannot prove visual correctness.

Before calling the design complete, run a browser QA pass at desktop, tablet,
and mobile widths covering:

- logo/link hover and focus states (no unintended underline);
- keyboard navigation and visible focus;
- empty, loading, insufficient-data, error, and success states;
- long names, large numbers, unknown buckets, and truncated evidence;
- chart legends and caveats remaining visible at narrow widths;
- Setup, device approval, signup return, and first-event verification;
- dark/light browser settings and reduced motion;
- screen-reader labels for icon-only controls.

The PDF's setup recommendation should be represented as one dominant path:

1. Create/select a server and environment.
2. Install the native SDK (TypeScript or Python first).
3. Configure the scoped ingestion key.
4. Optionally configure an already-validated account resolver.
5. Send a test event and show exactly what was detected.

OTel and proxy/launcher choices belong under an “Other connection methods”
disclosure and must show their coverage limitations. The current CLI activation
flow solves authentication and key redemption, but it does not by itself replace
the server/environment setup and verification contract described in the PDF.

## Claims that must remain prohibited

Until the missing layers are built and tested, the website/docs must not claim:

- TrackMCP receives arbitrary, unbounded OTLP today; the supported boundary is limited to authenticated OTLP/HTTP JSON with bounded MCP metadata;
- TrackMCP automatically sees whole-agent tasks across multiple MCP servers;
- `clientInfo` identifies a customer or person;
- a resolver-derived hash is verified identity proof;
- no error means business success;
- idle time means abandonment;
- resources/prompts are fully cataloged when only method counts are available;
- proxy or launcher integrations provide native-SDK coverage;
- the dashboard's fixture/example data is customer production data.

The protocol rows marked “Implemented locally / bounded” are not production
interoperability claims. Their remaining UAT gates are deliberately retained in
the protocol matrix and pilot readiness ledger.

## Release strategy derived from the PDF

### Safe present-tense release

Ship only the native SDK path, bounded direct ingestion, explicit workflow
signals, conservative analytics, data-trust disclosures, and CLI activation.
Label OTel as an adapter boundary and leave proxy/launcher hidden or marked
future/limited.

### Next product milestone

Complete the single Setup contract, catalog snapshot lineage, resources/prompts
bounded facts, transport lifecycle fixtures, and production worker/scheduler.
Then run browser QA and an isolated production-shaped tenant/load test.

### Later milestone

Add OTel receiver/exporter, proxy/stdio fallback, richer MCP lifecycle semantics,
deletion execution, and enterprise deployment options only with dedicated
security and operations review.

## Acceptance gate for a 100-customer pilot

The product is ready for a controlled pilot only when all of the following are
recorded against an immutable release:

- clean web/SDK/Python/CLI builds and packed-consumer tests;
- cross-workspace authorization tests against production-shaped data;
- first-event verification from a disposable workspace;
- key rotation and revocation evidence;
- setup/device/signup return flow in real browsers;
- no-event, partial-event, insufficient-data, and outage behavior;
- catalog snapshot and read-model postflight evidence;
- load evidence against the actual deployment class, not fixture mode;
- package publication and clean install from the published versions;
- rollback commit/image and schema-compatibility record;
- documentation claims reviewed against this matrix.

## Reconciliation note — 2026-10-24

The Setup findings above were reconciled against the current source after the
identity-snippet parity release. Dashboard contracts cover the unified Setup
surface and its direct TypeScript, Python, Go, .NET, OTLP, tester, identity,
privacy, and first-event paths; the exact merge `cc70c951` also passed main CI
and App Runner production smoke/runtime-safety verification. This does not
close the separately required authenticated browser/UAT evidence gate.

