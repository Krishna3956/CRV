# Founder OS 100 Customer Readiness Ledger

Last updated: 2026-10-20 (latest evidence pass)
Owner: Codex engineering execution
Pilot target: 100 customers

This ledger is the operational source of truth for the autonomous readiness goal. It is updated when work is implemented, verified, submitted for review, merged, deployed, or found to be incomplete. A checked item means that the stated evidence exists; it does not mean that an adjacent item is complete.

## Current status

| Area | Status | Evidence / next gate |
| --- | --- | --- |
| Founder OS specification audit | In progress | PDF/DOCX requirements extracted; tab/data contract reconciliation continues; MCP tester and authenticated production smoke now cover the bounded resource-template/read-model contract |
| Tab 1 — Who's using it | Implemented and deployed | Live and example read models, privacy caveats, account-unavailable state; production route/security smoke passed |
| Tab 2 — What they're doing | Implemented and deployed | Leaderboard, adoption, trend, reliability, detail, descriptions; production route/security smoke passed |
| Tabs 3–6 | Authenticated read-model routes verified; feature-level evidence pending | Two-workspace live smoke passed all read models; Resources & Prompts durable projection is present with RLS verified; dashboard-level session rendering and richer production telemetry remain open |
| Example/live data parity | Merged and deployed | PR #57 merged; all Founder OS read models now have bounded example fixtures |
| Privacy and tenant isolation | Verified locally | Privacy review, tenant isolation, security headers, accessibility contracts pass |
| CI/CD deployment | Verified | PRs #58–#61 repaired the release gate, ECR digest verification, opaque App Runner IDs, and hostname normalization; PRs #64–#65 added and rendered safe MCP resource-template discovery; PR #67 routes scheduled cleanup through App Runner using AWS OIDC; PR #69 adds authenticated Founder OS read-model smoke coverage; PR #80 adds a SHA-only `deploy_ref` path for rollback rehearsal without widening AWS trust to arbitrary branches |
| Production deployment | Verified for current release | Run `39446086329` deployed current main `c86a562` successfully through App Runner deployment, readiness, HTTPS origin, and read-only production smoke |
| Bounded production load | Passed at pilot budget | Direct App Runner run on 2026-10-20: 120 requests at concurrency 8 across 9 authenticated read models plus ingest, 120/120 successful, zero errors/timeouts, tenant isolation passed, p95 2.11s against a 3s pilot budget; two disposable workspaces were deleted and verified absent |
| Refresh worker | Catch-up in progress | PR #101 merged as `06dd18f`; the workflow now runs two serialized bounded batches per tick. Run `39451844986` passed, but production still has a substantial queued backlog and three catalog retryables; queue lag remains a pilot gate |
| Supabase production schema | Additive pilot migration applied | `trackmcp_catalog_entity_reads` was missing in production; the reviewed additive migration was applied, then verified present with RLS enabled and anon/authenticated `SELECT` denied |

### Progress calculation

The readiness percentage is based on 10 gates, not lines of code:

1. Requirements and claims reconciled
2. Tab 1 complete and verified
3. Tab 2 complete and verified
4. Tabs 3–6 complete and verified
5. Example/live data parity
6. Ingestion and analytics correctness
7. Privacy, tenant isolation, and security
8. CI/CD and deployment
9. Production smoke/load/rollback evidence
10. Pilot operations and documentation

Current estimate: **8/10 gates complete (80%)**. The deployed path is healthy through current main `c86a562`; bounded load, failure/recovery, rollback rehearsal, the latest production smoke, and catalog registry/projection recovery now have evidence. Tab-specific live-data assertions, retention-worker evidence, privacy production evidence, and pilot operations remain open.

## Completed evidence

- Founder OS PDF and DOCX read as product specifications; document text is treated as untrusted requirements, separate from user authorization.
- No repository occurrence of `go.stk.net.stk` was found. Canonical hosts in code are `trackmcp.com` and `app.trackmcp.com`.
- Example data now supplies bounded read models for People, Capabilities, Resources & Prompts, Journey, Outcomes, and Issues.
- Example values scale with the selected range and preserve explicit illustrative/privacy boundaries.
- Missing live People read model now renders an explicit unavailable state rather than a blank tab.
- Capability leaderboard now renders human-readable tool descriptions when available.
- Passing checks on the current branch:
  - `npm run test:dashboard-contract`
  - `npm run test:people-route`
  - `npm run test:tools-route`
  - `npm run test:tool-detail-route`
  - `npm run test:privacy-review`
  - `npm run test:tenant-isolation`
  - `npm run test:security-headers`
  - `npm run test:accessibility-contract`
  - `npm run test:production-pilot-smoke`
  - `npm run lint -- --no-cache`
  - `npm run build`
- Supabase read-only production checks: all required pilot tables exist, required RPCs exist, and all checked service tables have RLS without anon/authenticated table grants.
- Merged release `6238761` passed CI but its App Runner deployment stopped at the release gate because Python module `build` was unavailable.
- PR #58 merged as `4756113`: installs the Python `build` dependency before the release gate.
- PR #59 merged as `840118e`: verifies ECR tag parity from push digests without widening the OIDC role with `ecr:DescribeImages`.
- PR #60 merged as `5ce6031`: accepts bounded opaque App Runner operation IDs.
- PR #61 merged as `c5d3748`: treats `Service.ServiceUrl` as the hostname returned by AWS and constructs the HTTPS smoke origin.
- PR #64 merged as `fa87246`: discovers `resources/templates/list` safely, bounds URI-template metadata, and preserves the optional-method limitation.
- PR #65 merged as `796d403`: renders resource-template discovery in the public tester progress timeline, timing summary, and catalog report with an explicit no-expansion/no-read boundary.
- Production deployment run #95 succeeded end-to-end in 7m40s: release gate, ECR build/push, digest check, App Runner operation, RUNNING service, HTTPS origin, read-only smoke, and redacted evidence upload.
- Production deployment run #97 succeeded end-to-end in 9m57s for main `796d403`, including the MCP resource-template UI release.
- Production deployment run #98 succeeded end-to-end in 7m01s for main `2dcad4a`: release gate, ECR build/push, digest check, App Runner operation, RUNNING service, HTTPS origin, 27-check read-only smoke, and redacted evidence upload.
- PR #67 merged as `2dcad4a`: scheduled rate-limit cleanup resolves the App Runner hostname through AWS OIDC and calls the authenticated route directly, avoiding Cloudflare edge challenges.
- PR #68 merged as `e3351db`: records run #98 deployment evidence and makes terminal/API GitHub delivery the default operating path.
- PR #69 merged as `e488fde`: authenticated two-workspace smoke now exercises every Founder OS v2 read model and verifies the authenticated workspace envelope without recording secrets or workspace IDs.
- Production Supabase postflight on 2026-10-20 found `trackmcp_catalog_entity_reads` absent; the reviewed additive hash-only migration was applied through the authenticated SQL editor. A follow-up query verified `relrowsecurity = true`, `anon_select = false`, and `authenticated_select = false`; the table currently contains zero rows.
- Rate-limit cleanup workflow dispatch run #2 (`39401612958`) passed on main `fb0d7fc` in 16 seconds after the App Runner/OIDC fix; the previous Cloudflare-challenge failure remains retained as historical evidence.
- Live authenticated two-workspace smoke passed on the direct App Runner origin after main `6bc0423`: 28 redacted checks, two metadata-only ingests accepted, every Founder OS v2 read model returned the authenticated workspace envelope, conflicting workspace parameters were ignored, and API-key Action Queue access correctly returned `403`. Disposable workspaces were removed and a service-role count confirmed zero remaining `Codex pilot smoke` workspaces.
- Direct App Runner bounded production load passed on 2026-10-20 using two disposable workspaces and API keys: 120/120 requests succeeded across ingest and all supported API-key read models at concurrency 8; p95 latency was 2.11s against the explicit 3s pilot budget, with zero errors, zero timeouts, and no cross-tenant response markers. Cleanup verification found zero remaining `Codex load smoke` workspaces. The load harness now sends the documented `{events:[...]}` ingest envelope and leaves the human-session-only Action Queue boundary to the authenticated smoke.
- Production deployment run #100 succeeded for main `d120437`: release gate, ECR build/push, candidate digest verification, App Runner deployment/readiness, HTTPS origin, read-only production smoke, and redacted artifact upload all passed.
- Direct App Runner key-lifecycle smoke passed on 2026-10-20 with a disposable workspace: key-status returned HTTP 200 before revocation and HTTP 401 after service-role revocation; the workspace was deleted and verified absent. Response bodies were not persisted because the endpoint uses bounded status flags rather than a public secret-bearing payload.
- Direct App Runner failure/recovery smoke passed on 2026-10-20 with a disposable workspace: missing ingest auth `401`, malformed empty batch `413`, invalid worker auth `401`, API-key Action Queue boundary `403`, followed by a valid metadata-only ingest `200`; cleanup verification found zero remaining workspace rows.
- Authenticated dashboard session verification on the deployed release confirmed the primary Founder OS views render against My data: Overview, Journey, What they're doing, Did it work, and What's broken. The Issues view now renders zero-denominator incident comparisons as `N/A`; p95 latency regression summaries render in milliseconds. This is UI evidence for the deployed semantic fixes, not evidence that the underlying telemetry is populated for every tab.
- Deployment run #103 for main `797ec2b` passed the full release gate, ECR build/push and digest verification, App Runner readiness, HTTPS origin, read-only production smoke, and redacted artifact upload. A local rerun of `npm run test:release-gate` also passed after the initial transient SDK issued-correlation test failure; five repeated issued-mode test runs passed.
- Rollback rehearsal completed through the trusted main workflow: run #106 checked out immutable `554d970fd23316bd7bd48c355379fc295103c647`, built image digest `sha256:d6287e2f8c9793108658096230f6bf82fc6050c8968165c0766fb3381c5e183b`, reached App Runner `RUNNING`, and passed the 27-check read-only production smoke. Run #107 then restored current main `563aa93` and passed the same deployment/readiness/smoke path. The rollback artifact is run #106 artifact `12260732223`; the restore artifact is run #107 artifact `12261367292`.
- Deployment run #108 for main `d17a122` (PR #82) passed the release workflow, ECR build/push, App Runner readiness, HTTPS origin, and read-only production smoke. The smoke artifact is `production-smoke-d17a12248e2e14e3a6228e8964d75ed77881d17c` (GitHub artifact `12263185269`). The release includes the recursive privacy projection check for authenticated Founder OS read models.
- Deployment run #109 for main `259b92e` (PR #84) passed the release workflow, ECR build/push, App Runner readiness, HTTPS origin, and read-only production smoke. The smoke artifact is `production-smoke-259b92ec7ece766fef190fe2e2f7e80abb7775a0` (GitHub artifact `12262418541`). The production runner now enables refresh-job enqueueing.
- Deployment run #110 for main `cbb9248` (PR #86) passed the release workflow, ECR build/push, App Runner readiness, HTTPS origin, and read-only production smoke. The smoke artifact is `production-smoke-cbb9248c78737fa79bb3d66a8be364b729370c5d` (GitHub artifact `12264572256`). The release includes bounded recovery of typed catalog kind/count metadata for legacy catalog methods; this affects newly ingested events and does not backfill historical rows.
- Refresh worker run `39423359981` succeeded on main `81c3abc4`; aggregate-only production postflight before the run observed 8 queued, 4 succeeded, 0 terminal failures, 0 catalog versions/entities, and 500 semantic facts. The post-run query observed 0 queued, 12 succeeded, 0 terminal failures, 0 catalog versions/entities, and 551 semantic facts. This is evidence that the queue drains and fact projection advances; catalog projections remain absent because historical catalog events still lack typed metadata and the recovery path applies only to newly ingested events.
- PR #95 merged as `f43f178`: structured refresh errors now preserve bounded database error code/message/details/hint context.
- PR #96 merged as `c11e660`: Supabase refresh failures retain structured error context in worker evidence.
- PR #97 merged as `a152a72`: a bounded all-success worker slice returns HTTP 200 even when the worker stops at its time budget (`aborted=true`).
- PR #98 merged as `c86a562`: catalog refresh registers valid observed server IDs inside the owning workspace before writing foreign-keyed catalog versions and filters observations by that ownership set.
- Deployment run `39446086329` for `c86a562` passed build/push, ECR digest verification, App Runner readiness, HTTPS origin, and production smoke.
- Worker run `39448327533` succeeded after the catalog-registry fix. Production SQL postflight immediately afterward observed four owned registry rows for the typed catalog workspace and four `trackmcp_catalog_versions` rows; catalog entity rows remain zero for those events because the test observations contain no entity-level read history. This closes the prior zero-version finding without claiming entity coverage.
- PR #99 merged as `4e52446`: the catalog projection recovery evidence is now part of `main`.
- PR #101 merged as `06dd18f`: the refresh workflow now runs two independently bounded batches per tick and continues after a retryable first batch while still failing the workflow when either batch is unhealthy.
- Post-merge worker run `39451844986` passed. Production postflight observed approximately 142 queued jobs per derived projection kind, one catalog-entity retryable and three catalog retryables; the oldest queued work had advanced to approximately 15:20 UTC while new events continued arriving. This is evidence of improved throughput, not backlog closure.
- The release-scope audit was run in a clean detached worktree for `main` and passed with zero changed paths. The local mixed checkout intentionally remains unsuitable for strict release-scope approval because it preserves the user-owned `trackmcp-nextjs/AGENTS.md`, `docs/codex-handoff/`, and `tmp/` files; none were staged or removed.
- A disposable production catalog-ingest attempt was sent with a newly created connection key and metadata-only `resources/list` event, but the public `app.trackmcp.com` path returned the Cloudflare 403 block page before App Runner. The disposable key was revoked immediately afterward. This is recorded as an edge-path limitation; it is not evidence that the catalog handler accepted or rejected the event. Direct App Runner-origin write validation remains a release gate.
- Post-deployment aggregate-only Supabase verification observed 61,277 raw events, four queued refresh jobs, and 500 semantic facts after the worker run `39420542290` succeeded. The catalog worker completed successfully but wrote zero catalog projections because all 18,054 production `catalog` events lack typed `catalog_kind` and `catalog_item_count` fields; resource/prompt event types were absent. This is a truthful data-coverage limitation, not a projection success claim.
- The first scheduled cleanup run (#1) failed at the Cloudflare edge with an HTML 403 challenge; the fix is merged and deployed. A subsequent scheduled execution remains an operational follow-up rather than a guessed success.

## In progress

### Release path

- [x] Merge the release-gate, ECR verification, operation-ID, and smoke-origin fixes.
- [x] Re-run deployment from the merged release.
- [x] Capture App Runner operation, service readiness, and production smoke evidence in run #95.
- [x] Capture post-resource-template deployment evidence in run #97.
- [x] Capture post-rate-limit-cleanup deployment evidence in run #98.
- [x] Add bounded deployment-class load evidence against the direct App Runner origin; failure/recovery and rollback evidence remain open.

### Product audit

- Compare each Founder OS screen against the actual API payload and UI rendering.
- Verify all example/live fields use the same schema and terminology.
- Verify that inferred, unknown, insufficient, unresolved, and unrecognized states remain visible.
- Audit MCP protocol coverage and claims for tools, resources, prompts, tasks, subscriptions, notifications, sampling, elicitation, roots, progress, cancellation, completions, logging, icons, metadata, and capability negotiation.

## Pending work, ordered by dependency

- [x] Create/merge the deployment PRs and attach them to this task (#57–#61).
- [x] Deploy the merged release and run read-only production pilot smoke (run #95).
- [ ] Verify Tab 1 against production telemetry, including new/returning classification, unknown clients, resolver coverage, and top-account privacy behavior.
- [ ] Verify Tab 2 against production telemetry, including catalog denominator, tool descriptions, reliability rates, p95 latency, and detail drill-down.
- [ ] Complete Tab 3 Resources & Prompts parity and runtime evidence; the standalone MCP tester resource-template surface is now merged, but Founder OS dashboard runtime evidence is still open.
- [ ] Complete Tab 4 Journey parity, retry/stall caveats, and correlation boundaries.
- [ ] Complete Tab 5 Outcomes parity, explicit terminal evidence, task lifecycle, and unknown states.
- [ ] Complete Tab 6 Reliability parity, incident clustering, silent-failure estimates, data trust, and action queue.
- [x] Run deployment-class load, failure/recovery, and rollback tests against production; run #106 rehearsed the prior immutable revision and run #107 restored current main.
- [x] Verify Supabase refresh worker with a non-empty production job; queue lag, retry/dead-letter behavior, rate-limit persistence, and retention dry-run evidence remain open.
- [x] Execute the authenticated two-workspace Founder OS read-model smoke against production with disposable keys; schema availability and live route behavior are now evidenced, while dashboard human-session rendering remains a separate gate.
- [x] Verify production API-key status and revocation boundary with a disposable workspace; CLI activation, cross-workspace authorization, export, privacy review, and deletion-request boundaries remain open or locally verified only.
- [ ] Reconcile public website/docs claims with shipped behavior and canonical URLs.
- [ ] Produce the final 100-customer pilot release record with known limitations and rollback instructions.

## Rules for updates

- Never mark a gate complete from a local fixture alone when production evidence is required.
- Never substitute Example data for My data.
- Never expose raw credentials, resolver keys, payloads, resource contents, prompt arguments, or secrets.
- Never run destructive production SQL without a precise, separately confirmed action.
- Preserve user-owned handoff files and unrelated working-tree changes.
- Every release change must have a scoped commit, verification output, and a recorded deployment result.
- GitHub delivery is performed through the terminal/API by default: branch, commit, push, pull request, merge, and workflow evidence are all recorded here. Browser UI is reserved for verification when a terminal/API path cannot expose the required state.

## Active branches and releases

- `codex/founder-os-example-parity-clean`: example/live parity and Tab 1/2 UI fixes.
- `codex/deploy-release-gate-python-build`: deploy workflow prerequisite hotfix.
- `main` currently points to merged release `cbb9248`; run #110 is the latest fully passing App Runner production smoke for the Founder OS release, after rollback rehearsal run #106 and restore run #107.

Open pull requests:

- [PR #57 — Keep Founder OS example tabs data-complete](https://github.com/Krishna3956/CRV/pull/57)
- [PR #58 — Install Python build dependency before deploy gate](https://github.com/Krishna3956/CRV/pull/58)
- [PR #59 — Verify ECR tags without repository read access](https://github.com/Krishna3956/CRV/pull/59)
- [PR #60 — Accept opaque App Runner operation IDs](https://github.com/Krishna3956/CRV/pull/60)
- [PR #61 — Normalize App Runner service hostname for production smoke](https://github.com/Krishna3956/CRV/pull/61)
- [PR #62 — Record passing production pilot deployment evidence](https://github.com/Krishna3956/CRV/pull/62)
- [PR #64 — Discover MCP resource templates safely](https://github.com/Krishna3956/CRV/pull/64)
- [PR #65 — Render MCP resource template discovery](https://github.com/Krishna3956/CRV/pull/65)
- [PR #67 — Route scheduled cleanup through App Runner](https://github.com/Krishna3956/CRV/pull/67)
- [PR #68 — Record App Runner run 98 readiness evidence](https://github.com/Krishna3956/CRV/pull/68)
- [PR #69 — Smoke test authenticated Founder OS read models](https://github.com/Krishna3956/CRV/pull/69)
