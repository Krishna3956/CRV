# Founder OS 100 Customer Readiness Ledger

Last updated: 2026-10-21 (fresh Supabase postflight after PR #120 merge)
Owner: Codex engineering execution
Pilot target: 100 customers

This ledger is the operational source of truth for the autonomous readiness goal. It is updated when work is implemented, verified, submitted for review, merged, deployed, or found to be incomplete. A checked item means that the stated evidence exists; it does not mean that an adjacent item is complete.

## Current status

| Area | Status | Evidence / next gate |
| --- | --- | --- |
| Founder OS specification audit | In progress | PDF/DOCX requirements extracted; tab/data contract reconciliation continues; MCP tester and authenticated production smoke now cover the bounded resource-template/read-model contract |
| Tab 1 — Who's using it | Implemented and deployed | Live and example read models, privacy caveats, account-unavailable state; production route/security smoke passed |
| Tab 2 — What they're doing | Implemented and deployed | Leaderboard, adoption, trend, reliability, detail, descriptions; production route/security smoke passed |
| Tabs 3–6 | Authenticated read-model routes verified; production telemetry now observed, feature-level assertions still pending | Production event audit observed `resources/list` (4,933), `resources/templates/list` (3,869), `prompts/list` (3,405), `workflow` (150), `completion/complete` (8), and `tools/call` (1,567); dashboard-level session rendering, outcome correlation, and richer reliability assertions remain open |
| Example/live data parity | Merged and deployed | PR #57 merged; all Founder OS read models now have bounded example fixtures |
| Privacy and tenant isolation | Verified locally | Privacy review, tenant isolation, security headers, accessibility contracts pass |
| CI/CD deployment | Verified | PRs #58–#61 repaired the release gate, ECR digest verification, opaque App Runner IDs, and hostname normalization; PRs #64–#65 added and rendered safe MCP resource-template discovery; PR #67 routes scheduled cleanup through App Runner using AWS OIDC; PR #69 adds authenticated Founder OS read-model smoke coverage; PR #80 adds a SHA-only `deploy_ref` path for rollback rehearsal without widening AWS trust to arbitrary branches |
| Production deployment | Verified for current release | Run `39474489090` deployed merged main `3bd3178` successfully through App Runner deployment, readiness, HTTPS origin, and read-only production smoke |
| Bounded production load | Passed at pilot budget | Direct App Runner run on 2026-10-20: 120 requests at concurrency 8 across 9 authenticated read models plus ingest, 120/120 successful, zero errors/timeouts, tenant isolation passed, p95 2.11s against a 3s pilot budget; two disposable workspaces were deleted and verified absent |
| Refresh worker | Transport and retry-state recovery verified; freshness still open | PR #109 merged as `3a2271f`, PR #111 merged as `9db56b0` (deferred cancellation), PR #112 merged as `f792418` (timeout-tolerant scheduler), and PR #114 merged as `9f727ba` (Supabase adapter preserves deferred outcomes). Fresh deployment run `39470996281` succeeded; corrected worker run `39472093696` processed four bounded batches with zero failures/retryables; production postflight observed `243` queued, `0` retryable, `0` running, `12` catalog versions, and `0` catalog entity reads. Queue freshness and entity-read coverage remain pilot gates. |
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

Current estimate: **6/10 gates complete (60%)**. The deployed application path and bounded load evidence are healthy, but the readiness claim is deliberately reduced until the refresh worker is stable again and Tabs 3–6, production privacy/retention evidence, and pilot operations are closed. Tab 1/2 code is deployed; their final production-data assertions remain open.

## Latest checkpoint — 2026-10-20

### 2026-10-21 status check

- At the time of this check, worker dispatch `39479147302` is actively running on merged main `ae15bb1`; its single `refresh` job is still in progress. PR #121 is open with Go and .NET checks green and the web/JavaScript gate still running. No readiness percentage is advanced until these terminal results and the next Supabase postflight are recorded.
- Worker dispatch `39479523130` was subsequently cancelled after remaining in the refresh-batch step beyond its five-minute job ceiling without a terminal GitHub update. The workflow now adds an explicit process-level `timeout` around each curl (`94afe0d`) and classifies hard-kill exit codes as bounded timeouts; this must be exercised by a fresh worker run before freshness evidence can advance.
- Local verification pass completed while the worker ran: dashboard contract `43/43`, People `2/2`, Resources `2/2`, Prompts `2/2`, Outcomes `2/2`, Journey `2/2`, and Reliability `3/3`; these validate the shipped read-model contracts but do not replace production assertions.
- Fresh read-only Supabase production postflight observed `0` catalog entity-read rows, `0` privacy requests, `0` privacy deletion batches, `539` queued refresh jobs, and `0` retryable refresh jobs. This confirms transport/retry health but leaves freshness, entity-read coverage, and end-to-end privacy lifecycle execution open.
- Main CI for merge `ae15bb1` passed after PR #120. The merge changed only CI/docs paths, so no App Runner deployment was triggered; the previously deployed application release remains the production runtime under evidence.
- The previous apparent hour-long `sleep` was bounded polling of remote GitHub/App Runner state, not an uncontrolled local process. Current work is active and uses short, inspectable API calls.
- PR #119 (`docs: record authenticated dashboard runtime evidence`) was merged as `7e3725a`. Its GitHub CI checks passed; the Vercel status was non-required and failed because the provider reported a deployment rate limit, not because of an application test failure.
- PR #120's original GitHub web CI jobs remained non-terminal for more than a day despite the workflow's 30-minute timeout; those stale runs were cancelled and a fresh CI run will be created from the next ledger commit. This is recorded as a CI-runner-state issue, not an application test result.
- The latest deployed main release remains healthy: App Runner deployment run `39474489090` passed production smoke. This does not make the pilot gate complete because entity-read coverage, production privacy lifecycle execution, and Tabs 3–6 feature-level assertions remain open.
- Current readiness remains **6/10 gates (60%)**. A credible pilot-ready estimate is not a clock-time promise until the remaining production evidence is closed; the fastest path is several focused engineering/verification passes, not waiting on the current Vercel rate limit.

- The apparent hour-long `sleep` was bounded polling/waiting on remote GitHub/App Runner workflow state; no uncontrolled local process is intentionally sleeping now.
- PR #111 (deferred cancellation) and PR #112 (timeout-tolerant worker scheduler) are merged and deployed.
- Run `39467045273` exposed the next concrete blocker: App Runner returned 502/503 upstream connection failures after the first batch timeout. The workflow recorded the failure correctly; it did not silently claim success.
- Fresh deployment run `39470996281` succeeded after the stale deployment waiter was cancelled. Worker run `39472093696` then completed four bounded batches with `0` failed, `0` retryable, and `0` transport errors.
- PR #114 (`9f727ba`) fixed the production adapter defect that converted deferred deadline work into retryable rows. Postflight after the corrected deployment showed `243` queued, `0` retryable, `0` running, `12` catalog versions, and `0` catalog entity reads.
- Production telemetry coverage audit observed live MCP lifecycle/catalog/outcome signals: `initialize` 19,453; `notifications/initialized` 19,445; `resources/list` 4,933; `resources/templates/list` 3,869; `prompts/list` 3,405; `tools/call` 1,567; workflow 150; and explicit `completion/complete` 8. These counts support Tab 3–5 evidence but do not by themselves prove business outcomes or entity-read coverage.
- Reliability audit observed `tools/call` 1,568 events with 139 `is_error` rows and p95 duration 31,514.5 ms; `completion/complete` has 8 rows, all marked error. This is a real Tab 6/Outcome risk that must be surfaced in the dashboard and investigated before a 100-customer claim; it is not smoothed away by aggregate success counts.
- Error classes are now classified from production metadata-only rows: `MESSAGE_TOO_LONG` 24, `DECISION_NOT_READY` 19, `FEATURE_NOT_AVAILABLE` 14, `CALLABLE_HTTP_ERROR` 11, `INVALID_FIELD` 8, `protocol_error` 8, `PERSONAS_NOT_READY` 7, and `INTERNAL_ERROR` 6. Payloads were not queried or recorded.
- Production actionability postflight observed one open `trackmcp_action_queue` item and 42 firing alert incidents: 2 `p95_latency_regression` incidents are `critical`/`sufficient`, while 40 are explicitly `insufficient_data`. This verifies that Tab 6 has live action and uncertainty states rather than only static charts.
- PR #116 (`3bd3178`) deployed successfully in App Runner run `39474489090`; the production smoke job completed green after the Tab 6 critical-evidence ordering change.
- Production privacy postflight found no rows in `trackmcp_privacy_requests` or `trackmcp_privacy_deletion_batches` (the workflow has not been exercised in pilot data), while both tables have RLS enabled and direct `SELECT` denied to `anon` and `authenticated`. This verifies the boundary, not end-to-end deletion execution.
- Authenticated dashboard runtime smoke on `app.trackmcp.com/dashboard` verified live Issues, Outcomes, and Resources & Prompts rendering: critical/sufficient incidents precede insufficient-data records; Outcomes shows `N/A` with no explicit terminals; Resources & Prompts reports bounded methods and hashed entities while showing no durable reads and no raw content.
- No raw credentials or payloads were written to this ledger. User-owned `docs/codex-handoff/`, `tmp/`, and `trackmcp-nextjs/AGENTS.md` remain untouched and unstaged.
- Next engineering action: surface and investigate the observed reliability/error evidence in Tabs 5–6, close entity-read coverage and privacy/retention production gates, then produce the final pilot release record.

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
- PR #104 merged as `da77e2a`: the refresh workflow now runs three independently bounded batches per tick with a finite four-minute job ceiling; deployment run `39457030010` passed production smoke, and worker run `39457963679` processed 34 + 38 + 41 jobs with zero retryable or failed results.
- PR #105 merged as `29a22cb`: due retryable refresh jobs are prioritized ahead of queued work so failures cannot starve behind continuously replenished ingest jobs. The additive function replacement was applied to production and worker run `39458887748` processed the prior retry lane first; the old five retryables cleared, leaving one cancellation-only retry from the bounded time boundary.
- Post-priority production aggregate postflight observed `517` queued jobs, `1` retryable job with maximum attempt `1`, oldest queued work at `2026-10-20 16:04:01 UTC`, `12` catalog versions, and `0` catalog entity reads. This confirms retry starvation is fixed while overall freshness remains outside the pilot budget.
- Final post-priority worker run `39460772552` processed 37 + 40 + 36 jobs with zero retryable or failed results. The following aggregate postflight observed `417` queued jobs, `0` retryable jobs, oldest queued work at `2026-10-20 16:09:05 UTC`, `12` catalog versions, and `0` catalog entity reads.
- Post-merge worker run `39451844986` passed. Production postflight observed approximately 142 queued jobs per derived projection kind, one catalog-entity retryable and three catalog retryables; the oldest queued work had advanced to approximately 15:20 UTC while new events continued arriving. This is evidence of improved throughput, not backlog closure.
- Subsequent successful worker runs `39452634471` and `39452959789` increased successful counts and advanced the oldest queued work. The latest compact production postflight observed 532 queued jobs across all four derived kinds, four retryable jobs (maximum attempt count four), four catalog versions, and no destructive SQL. The queue is moving but remains outside the pilot freshness budget.
- The release-scope audit was run in a clean detached worktree for `main` and passed with zero changed paths. The local mixed checkout intentionally remains unsuitable for strict release-scope approval because it preserves the user-owned `trackmcp-nextjs/AGENTS.md`, `docs/codex-handoff/`, and `tmp/` files; none were staged or removed.
- A disposable production catalog-ingest attempt was sent with a newly created connection key and metadata-only `resources/list` event, but the public `app.trackmcp.com` path returned the Cloudflare 403 block page before App Runner. The disposable key was revoked immediately afterward. This is recorded as an edge-path limitation; it is not evidence that the catalog handler accepted or rejected the event. Direct App Runner-origin write validation remains a release gate.
- Local route, refresh-worker, retention, privacy, and tenant-isolation contract suites pass; the repository-wide release gate remains intentionally blocked in this mixed checkout by preserved user-owned handoff and temporary files, while a clean detached release-scope audit remains the authoritative check.
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
- `main` currently points to `7e3725a` (ledger evidence merge); run `39474489090` is the latest fully passing App Runner production smoke for the Founder OS release.

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
