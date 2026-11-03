# Founder OS business-user UX readiness matrix

Date: 2026-11-03  
Branch: `codex/business-user-ux-audit`  
Latest verified commit: `3e201ffa` (`Record rendered dashboard palette preview`)

This matrix is the release-readiness companion to the UX audit and work
queue. It intentionally separates source-level proof, read-only browser proof,
and evidence that requires a real account, deployment, or human participant.

Latest branch verification: `npm run test:business-user-ux` passed all 87 suites
after the authentication-affordance, research, signed-out handoff, illustrative
People-growth coherence, setup-vocabulary consistency, evidence-action-label,
outcome-copy, Quality helper-copy, final route-smoke, and auth-affordance passes
(`aca9981f`; runtime evidence was recorded in `be5ee919`). The consolidated
`npm run test:release-gate` passed all 159 suites on the current People-card
boundary-copy state (`302eeb6f`) with the synthetic UAT report redirected to a
temporary path so the tracked evidence fixture remained unchanged.
The branch remains local and has not been merged or deployed. A fresh local
development browser pass now verifies both the My-data no-event state and the
Example-data Overview on the current branch; this remains bypass evidence, not
real Supabase authentication or production data.

Final current-branch build: `npm run build` passed with 230 static pages
generated after the dashboard palette revision. TypeScript and ESLint also
passed. The full `npm run test:release-gate` passed all 159 suites on
`7e2fd060`; the palette-only revision then passed the focused 87-suite
business-user contract suite and a fresh production build.
This is still local build evidence; it does not prove a production deployment
or authenticated production rendering.

## Requirement coverage

| Requirement | Current status | Evidence | What is still needed |
| --- | --- | --- | --- |
| A newly signed-up user understands that a workspace is being prepared | **Implemented and tested** | `trackmcp-nextjs/src/app/dashboard/page.tsx`; `src/app/dashboard/page.contract.test.mjs` | Fresh-account browser verification |
| Legacy `/onboarding` entry point does not fork the setup story | **Verified in source** | `trackmcp-nextjs/src/app/onboarding/page.tsx` redirects to `/dashboard`; `trackmcp-nextjs/src/app/dashboard/onboarding/page.tsx` does the same | Fresh-account navigation check after deployment |
| A user with no workspace does not get trapped before setup | **Implemented and tested** | `DashboardApp.tsx` routes “Complete setup” to Setup while provisioning; setup-state contract; workspace route contract | Fresh-account verification against production auth/session state |
| Setup explains the three required steps | **Implemented and tested** | `DashboardApp.tsx`; state-aware setup rail; 87 business UX tests | Confirm copy with a non-technical participant |
| First-time sign-in/sign-up controls look actionable and remain keyboard-visible | **Implemented and tested** | `src/app/signin/page.tsx`, `src/components/OAuthButtons.tsx`; business UX contract | Confirm affordance and copy in a fresh-account browser walkthrough |
| Setup explains what appears after the first event | **Implemented and tested** | `BusinessContext` “What you will get after setup”; business UX contract | Fresh-account browser verification |
| Setup gives an activated user a direct next action into the business dashboard | **Implemented and tested** | `SetupView` shows `Open Overview` after verified, limited, or identity-limited activity; business UX contract | Confirm with a real first-event account |
| My data and Example data are visibly separate | **Implemented and tested; verified live read-only** | `DataSourceStrip`; Example data contract; authenticated Chrome review | Verify after deployment of this branch |
| Overview answers who, what, outcome, and attention questions | **Implemented and tested** | Overview business-question copy, KPI helpers, period context, and chart-table fallback; 87 business UX tests | Verify deployed rendering |
| Overview gives an evidence-aware next action | **Implemented and tested; verified locally** | `OverviewNextStep` in `DashboardApp.tsx`; local Example-data browser preview; business UX contract | Verify routing and copy with a fresh production account |
| “Who’s using it” explains account signals versus people/customers | **Implemented and tested** | `ClientsView`; metric contract; business UX tests | Confirm with a business participant |
| “What they’re doing” leads with adoption and reliability | **Implemented and tested; verified in local preview** | `CapabilitiesView`; business UX tests; technical protocol detail and repeated capability inventory are progressively disclosed | Verify deployed rendering |
| “Resources & prompts” explains information need and explicit outcomes | **Implemented and tested; verified in local preview** | `ResourcesPromptsView`; business UX tests; repeated entity and transport detail is progressively disclosed | Verify deployed rendering |
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
- The business UX contract suite passes 87/87 tests, including state-aware
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
- A read-only production comparison on the current capabilities route also
  shows the pre-branch navigation order and older KPI labels. The branch is
  therefore not live; this is a deployment-state observation, not a production
  data failure.

The branch also provides an accessible table alternative for the capability
trend chart, so feature comparison does not depend on chart hover behavior.

The local capability preview keeps `Most-used features`, `Breadth of adoption`,
`Trend by feature`, and `Reliability by tool` in the default reading path;
repeated inventory and catalog detail are collapsed under `Detailed capability
inventory`.

The local Setup preview keeps the three-step activation story and the `Connect
the server`/`Connection keys` actions in the primary path. Observed server,
environment, and deployment-linkage metadata is available under the collapsed
`Observed connection details` disclosure, with copy that explicitly says it is
not a deployment inventory or health check. This follows the same progressive
disclosure rule as the capability and resources views.

The connection status card now keeps the recovery action and plain-language
state in the first scan. Its individual evidence checks and percentage remain
available under a collapsed `Setup evidence` disclosure, so engineering teams
can inspect readiness without making a newly signed-up user decode eight
technical checks before connecting a server.

Overview's data-trust panel now uses business-readable labels for the same
bounded evidence: `Activity observed`, `Activity recency`, `Account-grouped
activity`, and `Dashboard refresh`. The explanatory caveats still make clear
that evidence recency is not a service-health claim and that refresh jobs do
not prove customer activity.

The Resources & prompts view now keeps its primary scan on lookup volume,
guided-help volume, and explicit completion evidence. The privacy and
non-completion boundary remains available inside the expanded technical detail
section instead of appearing as another block of protocol vocabulary above the
KPIs.

Overview now follows the same order: decision KPIs and the Founder OS outcome
summary render before the expandable evidence/protocol section. This makes the
default reading path answer the business question before exposing how the
evidence was collected.

The Journey view follows the same hierarchy. Common paths, stop evidence,
pause/resume behavior, and explicit outcomes remain in the default path; the
opaque async-task table is available under `Technical task evidence` for
engineering review.

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

The dashboard palette was revised again after review: primary actions now use
a restrained analytics blue on cool-neutral surfaces rather than the previous
teal treatment. The goal is a familiar SaaS visual language with green kept
for semantic success states. This is a local, verified change only.

The first-load workspace handoff was aligned to the same palette so a new user
does not see a separate slate/indigo loading surface before entering the
dashboard. The local Example-data browser preview showed the updated blue
navigation, controls, source-state banner, and business-first Overview.

The release-gate result is source-level evidence only. It does not replace a
fresh-account browser walkthrough, a real first event, or a production smoke
run against this branch.

After the loading-state and palette revisions, the consolidated release gate
was rerun and passed all 159 suites. The gate passed in the isolated worktree;
it does not change the Tier 3 status because authenticated production and
human business-user UAT evidence are still outstanding.

## Release interpretation

This branch is a verified business-comprehension improvement, not a claim that
the entire Founder OS product is complete. The correct next release decision is
to deploy only after the Tier 3 evidence is gathered and any failed UAT item is
fixed or explicitly accepted.
