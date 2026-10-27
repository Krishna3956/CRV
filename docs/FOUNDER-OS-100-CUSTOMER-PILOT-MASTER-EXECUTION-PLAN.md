# Founder OS 100 customer pilot master execution plan

## Purpose and operating rule

This is the control document for making TrackMCP safe and useful for a
100-customer Founder OS pilot. It is deliberately not a feature wish list.
Every item must end in one of four evidence states:

- **Implemented and locally verified**: source, focused tests, and a clean
  build prove the behavior in this checkout.
- **Production verified**: a redacted, repeatable result proves the exact
  deployed release and configuration behaved as intended.
- **Operator decision required**: an accountable person must choose scope,
  execute approved SQL, use a disposable credential, or approve a release.
- **Deferred and not claimed**: the product and pilot materials must not imply
  that this capability exists.

No missing event may become a claim that a customer abandoned work, completed
work, has a verified identity, or obtained a business result. No item is done
because a check box exists; it is done only with the stated acceptance evidence.

## Current control state

| Area | Current state | What this means |
| --- | --- | --- |
| Tab 1 Who's using it | implemented locally and pushed in `bc1b645` | Requires production workspace evidence before pilot claim |
| Tab 2 What they're doing | implemented locally and pushed in `1506630` | Requires production workspace evidence before pilot claim |
| Tabs 3 through 6 | implemented locally, with privacy-bounded v2 contracts | Each still requires the listed disposable-production evidence before a pilot claim |
| Build and regression suite | locally passed on the earlier candidate | Re-run from a clean checkout of the final release SHA |
| Schema/migrations | code and reviewed SQL exist | Production execution and postflight are still open |
| Auth and tenant isolation | local tests exist | Disposable production negative tests are still open |
| Worker and rate limits | code/tests exist; production queue read-back shows 5,689 succeeded and 28 queued jobs | Retry/terminal-failure detail, scheduler SLOs, and distributed rate-limit evidence remain open |
| Deployment | main-only GitHub Action | Feature-branch commits are not production deployments |

## Non-negotiable constraints

1. Never commit, log, display, or export raw API keys, bearer tokens, device
   codes, redemption IDs, cookies, raw customer payloads, prompt arguments,
   resource contents, full URLs, email addresses, or IP addresses.
2. Never run production Supabase SQL from this checkout. An authorized operator
   executes reviewed SQL and saves only redacted results.
3. Never use example data as if it were workspace data.
4. Never use an absent event as proof of abandonment, success, failure, or
   identity.
5. Browser approval never receives an ingestion key. CLI redemption is a
   separate bounded credential flow.
6. The first pilot is desktop-only. The product must say this plainly wherever
   a narrow view would otherwise imply support.
7. Every dashboard metric needs range, denominator, freshness, trust state,
   and a truthful empty/insufficient/error state.
8. Never stage broadly. Every commit uses explicit file paths and preserves the
   pre-existing `trackmcp-nextjs/AGENTS.md` change.
9. The product may claim only metadata-bounded OTLP/HTTP JSON or protobuf
   support; not gRPC, full OpenTelemetry, a proxy fallback, or complete MCP
   coverage.

## Pilot release definition

The pilot consists of the following supported customer journey:

1. A customer installs the published CLI and native SDK.
2. They explicitly authenticate with `npx @trackmcp/cli init`.
3. They create/select a workspace, approve a device session in the browser,
   and the CLI redeems the key once into a restrictive local file.
4. Their server emits bounded, metadata-first telemetry through the SDK or the
   documented OTLP/HTTP JSON or protobuf adapter.
5. The workspace dashboard presents observed account/client/tool/resource/
   journey/outcome/issue evidence with explicit uncertainty and privacy bounds.
6. Support can diagnose setup, first-event, key, telemetry, and dashboard
   evidence states using the pilot runbook.

The pilot does not include unsupported protocol features, an inference of
business success from a tool response, raw customer content analytics, or
mobile/tablet product support.

## Dependency map

```text
release scope + candidate SHA
  -> clean build + package provenance
  -> deployed image + additive schema postflight
  -> disposable activation + first accepted event
  -> tenant/key negative tests + dashboard evidence
  -> non-empty worker + rate-limit + load/recovery evidence
  -> pilot support/rollback rehearsal
  -> signed go/no-go decision
```

A downstream gate never substitutes for an upstream gate. For example, a
successful local dashboard test does not prove a production migration, and an
idle scheduler run does not prove that a queued job can be processed.

## Workstream 1 Release governance and evidence ledger

### Completion criteria

- [ ] A release owner names the exact pilot cohort, supported capabilities,
  pilot start date, incident contact, and rollback owner.
- [ ] A candidate commit SHA is chosen after all intended product changes land.
- [ ] A clean worktree at that SHA contains no credentials, CSV exports,
  campaign files, or generated artifacts.
- [ ] A release manifest lists code, migration, package, image, and evidence
  versions by immutable identifier.
- [ ] Every production observation is redacted and includes UTC time, actor
  role, environment, command/action, result, and link/reference.
- [ ] A go/no-go record explicitly distinguishes open risks from accepted risks.

### Required evidence

`git status --short`, `git diff --check`, scoped manifest, clean-checkout
release-gate output, deployment SHA/image, postflight outputs, smoke outputs,
and rollback result.

## Workstream 2 Customer activation and credentials

### Build and local-contract checklist

- [x] Device session creation, approval, polling, one-time redemption, replay
  protection, and restrictive local storage have contract coverage.
- [x] Browser approval does not display a raw connection key.
- [x] Existing/revoked/invalid/unavailable key statuses are distinct in the CLI.
- [x] Installation remains silent; authentication is an explicit `init` action.
- [ ] Browser QA verifies pending, invalid, expired, denied, approved, and
  already-redeemed device states at desktop width.
- [ ] Browser QA verifies sign-up/sign-in returns to the original approval flow.
- [ ] Browser QA verifies one and multiple workspace memberships.

### Production proof checklist

- [ ] A disposable user starts `npx @trackmcp/cli init` from a clean project.
- [ ] The browser flow creates/selects the intended disposable workspace.
- [ ] Approval succeeds without showing a raw key in the browser.
- [ ] CLI redemption succeeds exactly once and the stored file is restrictive.
- [ ] `doctor`/key-status reports the expected workspace and service state.
- [ ] A second redemption attempt is rejected without exposing sensitive state.
- [ ] Key creation, use, rotation, revocation, and post-revocation ingest are
  proven against the disposable workspace.

## Workstream 3 Ingestion, privacy, and protocol truth

### Must remain true

- [x] Ingest authenticates by key hash and bounds request bytes, events,
  strings, object depth, arrays, and timestamps.
- [x] SDKs fail open: telemetry delivery failure does not break a customer MCP
  server call.
- [x] Default telemetry is metadata-first and redacts sensitive content.
- [x] Account resolver output is one-way and optional; self-reported client
  metadata is never identity proof.
- [x] Resources/prompts are represented by bounded/hash-only evidence.
- [x] OTLP receiver is authenticated, JSON/protobuf, and metadata-bounded.

### Still required

- [ ] Repeat secret-scope scanning on the exact final candidate and package
  artifacts.
- [ ] Use a disposable server to send accepted, rejected, malformed, duplicate,
  unknown-client, unresolved-identity, and resolver-linked events in production.
- [ ] Verify redacted server/application logs for all disposable flows.
- [ ] Record exact protocol claims in customer-facing docs and reject claims
  not backed by fixture plus runtime evidence.
- [ ] Decide whether resource subscriptions, list-change notifications,
  completions, progress, cancellation, elicitation, and task lifecycle are
  supported pilot surfaces or explicitly deferred.

## Workstream 4 Dashboard foundations

### Shared acceptance contract for every tab

- [ ] Workspace scope is authenticated server-side for each read and write.
- [ ] Data source explicitly says My data or Example data.
- [ ] Loading, unavailable, unauthorized, empty, limited, and ready states are
  visually distinct.
- [ ] Each number has a selected range and documented denominator.
- [ ] Data trust exposes source count, truncation, observed-through/freshness,
  and the appropriate limitation.
- [ ] Raw identifiers, payloads, keys, contents, prompt arguments, and unsafe
  catalog identities never reach the browser.
- [ ] Keyboard focus, text alternatives, contrast, and reduced-motion behavior
  pass the primary-flow accessibility review.
- [ ] Desktop visual QA covers common/long names, large values, no-data,
  partial-data, and API-failure states.

## Workstream 5 Tab 1 Who's using it

### Product question

Which resolver-linked accounts and self-reported AI clients are showing up, and
is their observed activity changing over time?

### Implemented local contract

- [x] Current active resolver-linked account count.
- [x] New versus returning classification from bounded lifetime first-seen
  history, with an insufficient-data state if that scan cannot support it.
- [x] UTC Monday weekly account growth.
- [x] Client breakdown with a visible self-reported caveat and an Unrecognized
  category.
- [x] Privacy-safe ranked account activity with no resolver key or account name
  sent to the browser.
- [x] Versioned People projection exposes the complete safe read model.

### Final acceptance evidence

- [ ] Production workspace shows known and unrecognized client metadata.
- [ ] Production workspace shows resolver-linked and unresolved observations
  without calling either a verified person/customer.
- [ ] First-seen classification is verified with an account observed before and
  during the selected range.
- [ ] Cross-workspace request cannot read People data from another workspace.
- [ ] Screenshot/evidence includes the client caveat and data-trust context.

## Workstream 6 Tab 2 What they're doing

### Product question

Which server capabilities are observed in use, how broadly are they adopted,
and which have the strongest observed reliability signals?

### Implemented local contract

- [x] Tool-call volume, prior-period comparison, error rate, and resolver-only
  adoption breadth.
- [x] Weekly top-feature trend with top series plus an aggregated Other series.
- [x] Reliability rows sort by error risk and retain call-volume context.
- [x] Click-through detail has bounded description, volume, error/latency,
  weekly trend, and ranked resolver-linked activity without identities.

### Final acceptance evidence

- [ ] Disposable workspace has multiple tool calls across at least two tools.
- [ ] A controlled explicit error and `input_required` response appear as
  separate signals.
- [ ] Tool detail never exposes account keys, raw arguments, or results.
- [ ] Tool list/catalog observations are identified as observed server data,
  not a complete customer-product inventory.

## Workstream 7 Tab 3 Resources and prompts

### Product question

What information is requested and what guided interactions are used, while
keeping resource URI/content and prompt names/arguments private by default?

### Required engineering decisions before claiming completion

- [x] Pilot decision: no customer opt-in label display yet. Default remains
  hash-only/method-family because raw URI and prompt identifiers are sensitive.
- [x] Use explicit completion, input-required, explicit error, and unknown
  evidence states. Missing result type is never converted to success or error.
- [x] Apply the same input-required possibility to `resources/read` and
  `prompts/get`; resource reads are not automatically successful by absence of
  an error.
- [x] Preserve retry linkage (`interaction_id`, request-state/retry evidence)
  so a stall then retry is not reported as unrelated customer journeys.
- [x] Keep subscription/list-change/catalog signals separate from one-time
  reads/calls.
- [x] Include resource templates/catalog versions only with bounded/hash-safe
  identity and an explicit completeness state.
- [x] Add UI detail only when its data contract has a safe bounded identity;
  otherwise show aggregate evidence and explain the restriction.

### Acceptance evidence

- [x] Fixtures cover resource read complete, input-required, error, retry,
  unknown/missing type, prompt complete, prompt input-required, and prompt error.
- [x] Dashboard renders resource/prompt aggregates without content or inputs.
- [ ] Production disposable evidence proves at least one supported surface or
  the tab is labelled limited before the pilot.

## Workstream 8 Tabs 4 through 6

### Tab 4 The journey

- [x] Use only bounded server-observed interaction/session paths.
- [x] Present stalls and retries as evidence, never as abandonment.
- [x] Distinguish explicit error, input-required, and unknown terminal state.
- [x] Verify correlation collisions, late responses, reused IDs, and
  cross-server limitations in fixtures; paths are server-scoped and terminal
  evidence is the latest observed event.

### Tab 5 Did it work

- [x] Use explicit workflow/task/semantic outcome evidence only.
- [x] Keep completed, failed, pending, unknown, and not-observable separate.
- [x] Do not translate a successful tool response into business completion.
- [x] Verify a later explicit completion supersedes an earlier expiry where the
  task-lifecycle contract supports it, without exposing a raw task handle.

### Tab 6 What's broken

- [x] Rank observed issue signals with affected volume and confidence, only
  after the minimum evidence volume is reached.
- [x] Link to bounded evidence, not raw request/response content.
- [x] Describe recommendations as signals, not root-cause diagnoses.
- [x] Verify queue action state transitions and operator visibility are
  workspace-scoped.

## Workstream 9 Setup, support, and customer understanding

- [x] Reconcile the CLI activation path and dashboard Setup surface into one
  coherent customer story: server/environment, connection method, scoped key,
  optional identity resolver, privacy, first event, and data trust.
- [x] Keep the browser as approval/setup surface and CLI as key redemption
  surface.
- [x] State that identity resolution is optional and must consume already
  validated server context, not raw credentials.
- [x] Test setup no-workspace/no-key/no-event/limited-coverage/error states.
- [ ] Publish customer-facing limitations, support path, incident expectations,
  and desktop-only boundary after scope approval.

## Workstream 10 Database, workers, and operations

### Operator-only gates

- [ ] Execute the approved additive production migrations.
- [ ] Save the migration record and read-only postflight results for account
  identity, read models, CLI authorization, rate limits, refresh jobs/catalogs,
  queue links, and privacy paths.
- [ ] Confirm database region, backup/recovery posture, and restoration owner.
- [ ] Confirm worker secret and scheduler configuration after postflight.
- [x] Process a non-empty production refresh queue: run `39600868382` drained
  32 queued jobs across five bounded batches with 32 succeeded, 0 retryable,
  0 failed, 0 timed out, and max attempt count 1. This closes the processing,
  retry, terminal-failure, and redacted-error evidence for that run; an agreed
  pilot lag SLO and multi-run scheduler cadence baseline remain required.
- [ ] Confirm rate-limit mode is distributed if the pilot claims it; otherwise
  expose the memory-degraded limitation and do not make the claim.

### Engineering checks

- [x] Lease fencing, retry bounds, idempotency, and fail-closed cleanup paths
  have local tests.
- [x] Implement and test a feature-gated ingest enqueue path for every
  non-destructive refresh job class. Production enablement remains gated on the
  migration, RPC postflight, and an external worker configuration.
- [x] Define and locally test secret-free findings for queue depth, lag,
  failures, ingest errors, authorization anomalies, and rate-limit spikes.
- [ ] Verify the production dashboard/alert adapter, source freshness,
  deduplication/cooldown, and approved notification delivery for those findings.

## Workstream 11 Performance, failure recovery, and rollback

- [x] Document the initial pilot traffic/load envelope and local acceptance
  budgets in `FOUNDER-OS-LOAD-VALIDATION.md`. This is an engineering target,
  not evidence that the deployed environment can sustain the target.
- [ ] The release owner approves or revises that envelope for the actual
  cohort, host sizing, and selected data region before an external run.
- [ ] Run deployment-class load evidence, not just local fixture tests.
- [ ] Capture p50/p95/p99, timeout, 4xx/5xx, memory, and queue behavior.
- [ ] Exercise transient ingest/database/worker failure and recover safely.
- [ ] Identify the prior approved image/commit and test rollback against the
  additive schema.
- [x] Document the operator stop rule, recovery evidence requirements, and
  customer-impact communication path in the incident and load-validation
  runbooks.
- [ ] The release owner records the actual customer contact and rollback owner
  in the go/no-go record before invitations are sent.

## Workstream 12 Packages and public claims

- [x] Reconcile the current local package paths with immutable npm/PyPI
  artifact evidence. The TypeScript and Python SDK source paths differ from
  the installed registry artifacts; the CLI path does not.
- [x] Publish changed SDK code only under a new approved version; the current
  candidate under review is `@trackmcp/sdk@0.1.21`, `@trackmcp/cli@0.1.10`, and
  `trackmcp==0.1.13`, prepared from the reviewed source head for the gated
  publication workflow. The prior published train (`0.1.20`/`0.1.10`/`0.1.12`)
  remains the registry baseline until candidate verification completes.
  Authenticated activation and first-event UAT remain separate operational gates.
  Historical versions remain explicitly labeled in the package readiness record.
- [x] Install each exact published package into a clean consumer target; npm
  pack and pip download resolved the exact published release train from the
  public registries; retain the recorded integrity values in the package
  readiness record and repeat this check after subsequent release trains.
- [ ] Repeat the customer activation/first-event path from those clean
  published-package targets; disposable production activation/first-event
  evidence remains open.
- [x] Locally contract-test public docs, website, SDK READMEs, release notes,
  CLI boundary copy, and dashboard wording for the supported/limited/deferred
  capability boundary.
- [ ] Repeat the public-claim review against the final published package
  versions and deployed candidate before inviting customers.
- [x] Inspect the supplied Word reference and record the visual-identity
  boundary. It has no stand-alone, unambiguous approved logo asset, so no mark
  was recreated or changed by inference.
- [ ] Obtain an approved source asset or named owner decision before any
  Traccp/Founder OS branding release; do not mix unapproved marks.

## Required go/no-go record

The release owner may mark the pilot **GO** only when every P0 production gate
above has production evidence, each exception has an explicit owner/expiry,
and the deployed image/package/schema identifiers match the release record.

The release is automatically **NO-GO** if any of the following occurs:

1. A cross-workspace authorization result leaks or mutates another workspace.
2. A browser page exposes a raw ingestion key or a telemetry surface exposes
   protected content/identity material.
3. A migration/postflight result does not meet the reviewed schema/privilege
   contract.
4. A non-empty refresh batch cannot recover/retry within its declared policy.
5. The package version being installed is not the exact reviewed artifact.
6. Rollback cannot be performed against the candidate schema/image plan.
7. A customer-facing claim exceeds the implemented and evidenced protocol or
   product boundary.

## Execution rhythm for this autonomous goal

1. Re-read this plan and the relevant PDF section before each tab/workstream.
2. Inspect the existing implementation before writing code.
3. Change the narrowest safe boundary, then add a regression test first or
   alongside it.
4. Run focused tests, TypeScript, lint, build, and proportionate release checks.
5. Commit only scoped files, push the feature branch, and record the SHA here
   or in the release evidence ledger.
6. Do not convert a local pass into a production claim.
7. When an item requires external authority, leave it explicitly open rather
   than guessing or bypassing it.

## Source documents

This plan consolidates, but does not replace, the detailed engineering queue,
pilot runbook, launch-readiness audit, vertical-slice contract, protocol
matrix, metric contract, and codex handoff records. Those files remain the
granular test/evidence ledger; this file controls sequencing and decision
quality.
