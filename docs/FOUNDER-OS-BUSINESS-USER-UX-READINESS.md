# Founder OS business-user UX readiness matrix

Date: 2026-11-03  
Branch: `codex/business-user-ux-audit`  
Latest verified commit: local branch `HEAD` (recorded by the branch log)

This matrix is the release-readiness companion to the UX audit and work
queue. It intentionally separates source-level proof, read-only browser proof,
and evidence that requires a real account, deployment, or human participant.

Latest branch verification: `npm run test:release-gate` passed all 159 suites
after the setup-language pass (`aa3b381a`). The branch remains local and
has not been merged or deployed.

## Requirement coverage

| Requirement | Current status | Evidence | What is still needed |
| --- | --- | --- | --- |
| A newly signed-up user understands that a workspace is being prepared | **Implemented and tested** | `trackmcp-nextjs/src/app/dashboard/page.tsx`; `src/app/dashboard/page.contract.test.mjs` | Fresh-account browser verification |
| Legacy `/onboarding` entry point does not fork the setup story | **Verified in source** | `trackmcp-nextjs/src/app/onboarding/page.tsx` redirects to `/dashboard`; `trackmcp-nextjs/src/app/dashboard/onboarding/page.tsx` does the same | Fresh-account navigation check after deployment |
| A user with no workspace does not get trapped before setup | **Implemented and tested** | `DashboardApp.tsx` routes “Complete setup” to Setup while provisioning; setup-state contract; workspace route contract | Fresh-account verification against production auth/session state |
| Setup explains the three required steps | **Implemented and tested** | `DashboardApp.tsx`; state-aware setup rail; 79 business UX tests | Confirm copy with a non-technical participant |
| Setup explains what appears after the first event | **Implemented and tested** | `BusinessContext` “What you will get after setup”; business UX contract | Fresh-account browser verification |
| My data and Example data are visibly separate | **Implemented and tested; verified live read-only** | `DataSourceStrip`; Example data contract; authenticated Chrome review | Verify after deployment of this branch |
| Overview answers who, what, outcome, and attention questions | **Implemented and tested** | Overview business-question copy, KPI helpers, period context, and chart-table fallback; 79 business UX tests | Verify deployed rendering |
| “Who’s using it” explains account signals versus people/customers | **Implemented and tested** | `ClientsView`; metric contract; business UX tests | Confirm with a business participant |
| “What they’re doing” leads with adoption and reliability | **Implemented and tested** | `CapabilitiesView`; business UX tests; technical protocol detail is progressively disclosed | Verify deployed rendering |
| “Resources & prompts” explains information need and explicit outcomes | **Implemented and tested** | `ResourcesPromptsView`; business UX tests | Verify deployed rendering |
| “The journey” avoids abandonment inference | **Implemented and tested** | `JourneysView`; Founder OS metric contract; business UX tests | Confirm wording with a business participant |
| “Did it work” separates explicit success, failure, pending, and unknown | **Implemented and tested** | `QualityView` and `OutcomeEvidencePanel`; business UX tests | Verify real telemetry states in production |
| “What’s broken” gives an investigation order without claiming diagnosis | **Implemented and tested** | `IssuesView`; issue contracts; business UX tests | Verify action-queue permissions and live incident states |
| Evidence is a technical drill-down with privacy boundaries | **Implemented and tested** | `EvidenceView`; business UX tests | Verify trace rendering after deployment |
| Technical protocol language is secondary, not the default business path | **Implemented in the reviewed surfaces** | BusinessContext guidance in capabilities/resources/evidence; audit | Human usability test to confirm comprehension |
| Metric labels and formulas remain aligned | **Implemented and tested** | `docs/FOUNDER-OS-METRIC-CONTRACT.md`; metric registry tests | Metric review when read models change |
| Example data is illustrative and not presented as workspace telemetry | **Implemented and tested; verified live read-only** | Example data contract and browser review | Verify deployed branch |
| No fabricated health, success, identity, or abandonment claims | **Implemented and tested** | Data-trust contracts, outcome contracts, issue contracts | Production smoke test with real no-data and partial-data states |
| The complete Founder OS read-model surface is backed by production data | **Not yet proven** | Current source contains the views and API contracts | Read-model completeness audit against real production responses |
| A non-technical person can complete the full journey unaided | **Not yet proven** | UAT script exists at `FOUNDER-OS-BUSINESS-USER-UAT-SCRIPT.md` | Run the script with a real participant |
| The branch is live in production | **Not yet done** | No merge/deployment performed from this branch | Review, merge, deploy, authenticated smoke tests |

## Evidence tiers

### Tier 1 — verified in the isolated branch

- Source changes are committed and the worktree is clean.
- TypeScript, ESLint, business UX contracts, metric contracts, and production
  build pass.
- The business UX contract suite passes 79/79 tests, including state-aware
  setup steps, accessible chart tables, capability KPI vocabulary, and
  progressive protocol disclosure.
- The build generated 230 static pages.
- Dashboard and read-model route contracts pass for Overview, Setup, People,
  Journeys, Outcomes, Resources, Prompts, Reliability, and Data Trust.
- Accessibility, PDF parity, documentation navigation/version, mobile layout,
  and pointer/focus contracts pass.
- Pilot scope, support, status-template, runbook, and acceptance-record
  contracts pass; these artifacts keep the release claims bounded and
  secret-safe.
- The consolidated `npm run test:release-gate` passes all 159 suites after
  making the customer-endpoint UAT use the same MCP SDK dependency instance as
  the adapter and ensuring the package-release audit builds the Python wheel
  and sdist when a clean checkout has no generated artifacts.

### Tier 2 — verified in the current production browser, read-only

- Business-first navigation exists.
- Setup exposes the three-step path, Example data, and no-data guidance.
- The first-time no-data state now explains TrackMCP's business value before
  asking a user to interpret setup steps: who is showing up, what they are
  trying to do, whether work completed, and what needs attention.
- The signup screen now sets the same expectation before authentication ends:
  a technical teammate connects one server, then the dashboard explains
  usage, outcomes, and issues.
- Example data is visibly labeled as illustrative.
- The live Overview still uses some older KPI labels, proving that the branch
  changes are not currently deployed.

The branch also provides an accessible table alternative for the capability
trend chart, so feature comparison does not depend on chart hover behavior.

### Tier 3 — still required before pilot readiness

- Fresh-account setup in the deployed branch.
- A real first-event connection and dashboard refresh.
- A non-technical participant completing the UAT script.
- Production smoke tests against the deployed commit.
- Confirmation that all read models return truthful no-data, partial-data, and
  example-data states in production.

Local runtime note: the standalone server starts successfully. With no
Supabase URL/key it returns HTTP 500 for the homepage because the server cannot
construct its data client. With deliberately non-production placeholder
values, `/`, `/docs`, both SDK docs, `/device`, the example dashboard route,
`/sitemap-index.xml`, and `/sitemap.xml` returned HTTP 200 with the expected
security headers. The database-backed `/tool-sitemap.xml` correctly failed
closed with HTTP 503. This is expected safety behavior, not production
evidence; a real authenticated environment is still required.

The release-gate result is source-level evidence only. It does not replace a
fresh-account browser walkthrough, a real first event, or a production smoke
run against this branch.

## Release interpretation

This branch is a verified business-comprehension improvement, not a claim that
the entire Founder OS product is complete. The correct next release decision is
to deploy only after the Tier 3 evidence is gathered and any failed UAT item is
fixed or explicitly accepted.
