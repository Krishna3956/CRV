# Founder OS 100 Customer Readiness Ledger

Last updated: 2026-10-20
Owner: Codex engineering execution
Pilot target: 100 customers

This ledger is the operational source of truth for the autonomous readiness goal. It is updated when work is implemented, verified, submitted for review, merged, deployed, or found to be incomplete. A checked item means that the stated evidence exists; it does not mean that an adjacent item is complete.

## Current status

| Area | Status | Evidence / next gate |
| --- | --- | --- |
| Founder OS specification audit | In progress | PDF/DOCX requirements extracted; tab/data contract reconciliation continues; MCP tester and authenticated production smoke now cover the bounded resource-template/read-model contract |
| Tab 1 — Who's using it | Implemented and deployed | Live and example read models, privacy caveats, account-unavailable state; production route/security smoke passed |
| Tab 2 — What they're doing | Implemented and deployed | Leaderboard, adoption, trend, reliability, detail, descriptions; production route/security smoke passed |
| Tabs 3–6 | Existing foundation; audit pending | Resources & prompts, journey, outcomes, reliability need full specification evidence review |
| Example/live data parity | Merged and deployed | PR #57 merged; all Founder OS read models now have bounded example fixtures |
| Privacy and tenant isolation | Verified locally | Privacy review, tenant isolation, security headers, accessibility contracts pass |
| CI/CD deployment | Verified | PRs #58–#61 repaired the release gate, ECR digest verification, opaque App Runner IDs, and hostname normalization; PRs #64–#65 added and rendered safe MCP resource-template discovery; PR #67 routes scheduled cleanup through App Runner using AWS OIDC; PR #69 adds authenticated Founder OS read-model smoke coverage |
| Production deployment | Verified for current release | Run #98 (main `2dcad4a`) completed in 7m01s for the deploy job through App Runner and read-only production smoke; the redacted `production-smoke-2dcad4a06a4e5574cae96ba671d5c5b278f4d533` artifact was uploaded |
| Supabase production schema | Read-only verified | Required tables/functions and RLS checks pass; no unsafe blanket migration run |

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

Current estimate: **6/10 gates complete (60%)**. The deployed path is healthy through `2dcad4a`; tab-specific live-data assertions, load/failure/recovery evidence, retention-worker evidence, and pilot operations remain open.

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
- The first scheduled cleanup run (#1) failed at the Cloudflare edge with an HTML 403 challenge; the fix is merged and deployed. A subsequent scheduled execution remains an operational follow-up rather than a guessed success.

## In progress

### Release path

- [x] Merge the release-gate, ECR verification, operation-ID, and smoke-origin fixes.
- [x] Re-run deployment from the merged release.
- [x] Capture App Runner operation, service readiness, and production smoke evidence in run #95.
- [x] Capture post-resource-template deployment evidence in run #97.
- [x] Capture post-rate-limit-cleanup deployment evidence in run #98.
- [ ] Add rollback/recovery evidence and a bounded deployment-class load test.

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
- [ ] Run deployment-class load/failure/recovery tests; fixture-only evidence is insufficient.
- [ ] Verify Supabase refresh worker, queue lag, retry/dead-letter behavior, rate-limit persistence, and retention dry-run evidence.
- [ ] Verify CLI activation, key revocation, cross-workspace authorization, export, privacy review, and deletion-request boundaries.
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
- `main` currently points to merged release `2dcad4a`; run #98 is the latest fully passing App Runner production smoke for the Founder OS release.

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
