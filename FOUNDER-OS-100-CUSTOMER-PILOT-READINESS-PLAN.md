# Founder OS — 100-customer pilot readiness plan

**Status:** planning checkpoint; no deployment or production database mutation is authorized by this document.

**Objective:** make TrackMCP safe, understandable, and supportable for the first 100 real customers. “Ready” means the supported pilot scope works for a real customer from installation through first accepted event and honest dashboard evidence; it does not mean every long-term Founder OS capability is complete.

## Executive decision

The product is not yet ready to hand to 100 customers without qualification.

The core public surface, published packages, terminal-first CLI activation, deployment workflow, bounded telemetry, privacy boundaries, and local release contracts are in good shape. The remaining risk is not primarily another round of unit tests. The remaining risk is proof of the complete production journey and reconciliation of the dashboard against the Founder OS product model.

The pilot should remain **conditional** until the P0 production gates below are evidenced. The first pilot can be limited to TypeScript/Node SDK activation, Python server-boundary activation, metadata-only ingest, current dashboard views, and documented OTLP/HTTP JSON support. Unsupported encodings, unverified identity, destructive privacy execution, and unconfigured background scheduling must not be marketed as supported.

## What the Founder OS document actually specifies

The source vision names these business-facing dashboard tabs:

| Founder OS concept | Product question |
| --- | --- |
| Who’s Using It | Which AI tools or customers are showing up? |
| What They’re Doing | Which actions or features get used most? |
| Resources & Prompts | What information or guided help is being requested? |
| The Journey | What path does a session take from start to finish? |
| Did It Work | Which workflows completed, stalled, or were abandoned? |
| What’s Broken | Which failures, retries, or silent degradations need attention? |

The current product navigation is:

`Overview`, `Journeys`, `Capabilities`, `Quality`, `Issues`, `AI clients`, `Evidence`, and `Setup`.

This is not a simple naming mismatch. It is a partial business-first reinterpretation:

- `Overview` is a summary layer, not the full “Who’s Using It” tab.
- `AI clients` is the closest current surface to “Who’s Using It,” but identity remains bounded/self-reported and it is not yet the full account-level product in the PDF.
- `Capabilities` covers catalog observations, but is not yet the complete “What They’re Doing” experience.
- `Journeys` is the current partial implementation of “The Journey,” with bounded workflow evidence rather than the PDF’s complete durable journey model.
- `Quality` and `Issues` partially cover “What’s Broken.”
- `Evidence` is a technical drill-down layer that the PDF intentionally places below the business views.
- `Setup` is onboarding and connection management, not one of the six analytical tabs.
- There is not yet a complete, first-class `Resources & Prompts` experience.
- There is not yet a complete, first-class `The Journey` experience matching the PDF’s workflow model.
- `Did It Work` is represented by outcome/read-model work within Overview and Journeys, but is not yet a complete customer-facing tab with the PDF’s full semantics.

Therefore the current UI should not be described as the completed Founder OS dashboard. It is the first business-first slice plus technical evidence and setup foundations.

## Readiness tracks

### Track A — Production customer journey (P0)

These gates must be completed before the first 100-customer invitation:

1. Use a disposable production workspace and run the published `npx @trackmcp/cli init` flow.
2. Confirm browser auto-open, signup/sign-in handoff, workspace selection, approval, CLI redemption, and restrictive `.env.local` write.
3. Confirm the key-status response reports a live workspace and service.
4. Make one real metadata-only SDK event from the disposable project.
5. Confirm the accepted-ingest milestone appears in key status and dashboard setup.
6. Confirm the dashboard displays live-vs-example state honestly and shows the first event without fabricated counts.
7. Verify a second workspace cannot read or mutate the first workspace’s data.
8. Verify key revocation prevents the next ingest and that a replacement key works.
9. Capture the exact production evidence with no keys, event IDs, workspace IDs, or payloads in artifacts.

### Track B — Dashboard/product reconciliation (P0 for claims, P1 for breadth)

Before pilot messaging, freeze the supported dashboard promise:

1. Keep the current eight navigation items only where each has a truthful, tested state.
2. Add explicit product mapping from current views to the six Founder OS questions.
3. Decide whether the pilot exposes `Resources & Prompts`, `The Journey`, and `Did It Work` now or labels them as limited/coming later.
4. Do not rename tabs only for cosmetic similarity; change names only with a corresponding data contract and customer value.
5. Add a visible data-quality boundary wherever identity is self-reported, data is partial, or a metric is unavailable.
6. Ensure every primary button has a real destination or state transition, including Setup, Evidence, Issues, export, key lifecycle, workspace switching, and support links.
7. Perform browser visual checks at desktop and mobile widths for Overview, Setup, docs, device approval, and the key empty/loading/error states.

### Track C — Operations and support (P0)

1. Record the production SQL migration/postflight results and backup/restore contact.
2. Confirm the required service-role worker/RPC configuration and whether refresh scheduling is actually enabled.
3. Run one disposable refresh batch and record lag, retry, terminal outcome, and failure behavior.
4. Confirm the distributed rate-limit provider and its production mode.
5. Rehearse rollback to the approved image against the additive schema.
6. Publish the support runbook and pilot scope with explicit limitations.
7. Define a named pilot owner, incident channel, response target, and rollback owner.
8. Issue a written go/no-go decision with the exact customer cohort and supported capabilities.

## Current evidence snapshot

Already evidenced:

- Public production surfaces and registry metadata: 14/14 read-only smoke checks passed.
- App Runner deployment workflow: successful for the current application commit.
- Local release gate: 103 suites passed.
- CLI package `@trackmcp/cli@0.1.4` and SDK `@trackmcp/sdk@0.1.2` are published.
- Python package `trackmcp==0.1.3` is published.
- CLI device flow, browser approval contract, workspace-selection contract, privacy boundaries, OTel boundary, rate-limit contracts, and worker lifecycle contracts have local evidence.
- Full tracked-source credential-shaped-value audit: 643 intended paths scanned, zero unexpected findings.

Not yet evidenced strongly enough:

- Real production browser activation with an authenticated account.
- Real production workspace selection/creation and CLI redemption.
- Real first accepted event and dashboard data-plane verification.
- Cross-workspace negative authorization in production.
- Production key rotation/revocation behavior.
- Production worker scheduling and refresh lag.
- Multi-instance rate-limit behavior on App Runner.
- Rollback rehearsal.
- Final Founder OS tab-by-tab product acceptance against the PDF.

## The exact help needed from the founder

No password, API key, browser cookie, or service-role credential should be pasted into chat.

At the operator stage, the founder needs to do only these controlled actions:

1. Be logged into the TrackMCP browser in a disposable/test account or explicitly confirm that the existing account may be used for a disposable workspace.
2. Create or select a disposable workspace and a disposable connection key for the smoke run.
3. Run the provided authenticated smoke command with that disposable key, or operate the browser approval step while the CLI process waits.
4. Run the supplied read-only Supabase postflight SQL and return only the result tables.
5. Approve the limited pilot scope and rollback owner in writing.

The engineering side will do everything else: code, tests, review branches, merges, deployment, evidence redaction, documentation, and reconciliation.

## Go/no-go rule

The product is **GO** for a limited 100-customer pilot only when every applicable P0 row has a production evidence link and a named owner. A local test, public HTTP 200, or successful deployment alone cannot close an authenticated data-plane gate.

The product is **NO-GO** if any of these occur:

- CLI activation cannot complete without manual secret handling.
- The browser can see or receive a raw API key.
- A first event is accepted but does not become visible within the documented lag.
- One workspace can read another workspace’s data.
- Revoked keys continue to ingest.
- Dashboard language implies complete identity, journeys, outcomes, or reliability when the data is partial.
- A worker or scheduler is advertised but has not been configured and observed.
- Rollback compatibility is unknown.

## Next execution order

1. Complete the disposable production activation and first-event evidence.
2. Complete cross-workspace and key-lifecycle production evidence.
3. Complete worker/rate-limit/rollback operator evidence.
4. Reconcile the six Founder OS analytical questions against current navigation and freeze pilot copy.
5. Run the browser visual acceptance matrix.
6. Produce the final acceptance matrix and pilot go/no-go record.

Until step 6 is complete, the correct claim is “production-deployed and pilot-preparation underway,” not “ready for 100 customers.”
