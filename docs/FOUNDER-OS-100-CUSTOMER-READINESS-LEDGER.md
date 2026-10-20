# Founder OS 100 Customer Readiness Ledger

Last updated: 2026-10-20
Owner: Codex engineering execution
Pilot target: 100 customers

This ledger is the operational source of truth for the autonomous readiness goal. It is updated when work is implemented, verified, submitted for review, merged, deployed, or found to be incomplete. A checked item means that the stated evidence exists; it does not mean that an adjacent item is complete.

## Current status

| Area | Status | Evidence / next gate |
| --- | --- | --- |
| Founder OS specification audit | In progress | PDF/DOCX requirements extracted; tab/data contract reconciliation continues |
| Tab 1 — Who's using it | Implemented locally | Live and example read models, privacy caveats, account-unavailable state; merge/deploy verification pending |
| Tab 2 — What they're doing | Implemented locally | Leaderboard, adoption, trend, reliability, detail, descriptions; merge/deploy verification pending |
| Tabs 3–6 | Existing foundation; audit pending | Resources & prompts, journey, outcomes, reliability need full specification evidence review |
| Example/live data parity | Fixed in branch | All Founder OS read models now have bounded example fixtures; PR pending/awaiting checks |
| Privacy and tenant isolation | Verified locally | Privacy review, tenant isolation, security headers, accessibility contracts pass |
| CI/CD deployment | Hotfix prepared | Deploy gate failed because Python `build` was missing; hotfix branch and PR preparation complete |
| Production deployment | Not yet verified after hotfix | Must pass CI, deploy, App Runner smoke, and rollback evidence |
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

Current estimate: **4/10 gates complete (40%)**. Tabs 1 and 2 are implemented locally but remain deployment-gated, so this estimate will not be raised until their merged production path is verified.

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

## In progress

### Release path

- Submit and merge the deployment release-gate hotfix from `codex/deploy-release-gate-python-build`.
- Submit and merge the example-parity branch `codex/founder-os-example-parity-clean`.
- Re-run deployment from the merged release.
- Capture App Runner operation, image digest, health, and production smoke evidence.

### Product audit

- Compare each Founder OS screen against the actual API payload and UI rendering.
- Verify all example/live fields use the same schema and terminology.
- Verify that inferred, unknown, insufficient, unresolved, and unrecognized states remain visible.
- Audit MCP protocol coverage and claims for tools, resources, prompts, tasks, subscriptions, notifications, sampling, elicitation, roots, progress, cancellation, completions, logging, icons, metadata, and capability negotiation.

## Pending work, ordered by dependency

- [ ] Create/merge the two prepared PRs and attach them to this task.
- [ ] Deploy the merged release and run authenticated production pilot smoke.
- [ ] Verify Tab 1 against production telemetry, including new/returning classification, unknown clients, resolver coverage, and top-account privacy behavior.
- [ ] Verify Tab 2 against production telemetry, including catalog denominator, tool descriptions, reliability rates, p95 latency, and detail drill-down.
- [ ] Complete Tab 3 Resources & Prompts parity and runtime evidence.
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

## Active branches and releases

- `codex/founder-os-example-parity-clean`: example/live parity and Tab 1/2 UI fixes.
- `codex/deploy-release-gate-python-build`: deploy workflow prerequisite hotfix.
- `main` currently points to merged release `6238761`; its deployment failed before AWS execution at the Python artifact gate.

Open pull requests:

- [PR #57 — Keep Founder OS example tabs data-complete](https://github.com/Krishna3956/CRV/pull/57)
- Deployment hotfix PR: prepared locally; submit after the GitHub branch comparison is refreshed.
