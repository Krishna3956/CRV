# Founder OS business-user UX readiness matrix

Date: 2026-11-03  
Branch: `codex/business-user-ux-audit`  
Latest verified commit: `2ebc481f` (`docs: point UX readiness at current head`)

This matrix is the release-readiness companion to the UX audit and work
queue. It intentionally separates source-level proof, read-only browser proof,
and evidence that requires a real account, deployment, or human participant.

Latest branch verification: `npm run test:business-user-ux` passed all 106 suites
after the authentication-affordance, research, signed-out handoff, illustrative
People-growth coherence, setup-vocabulary consistency, evidence-action-label,
outcome-copy, Quality helper-copy, final route-smoke, and auth-affordance passes.
The consolidated `npm run test:release-gate` passed all 159 suites on the
current branch with the synthetic UAT report restored to its tracked fixture value
after the run. The branch remains local and has not been merged or deployed.
A fresh pull-request CI run (`41579733520`) also passed the required
web/JavaScript, Go, and .NET jobs for the current branch. The latest source
verification remains anchored to `2ebc481f` because the subsequent commits
only record evidence. The pull request remains open; this is validation
evidence, not merge or deployment evidence.
The Vercel Preview check for this commit is externally rate limited and did not
produce a preview; this is recorded in
`docs/evidence/business-user-ux-vercel-preview-rate-limit-2026-11-03.md` and
does not contradict the passing repository CI checks.
A fresh local
development browser pass now verifies both the My-data no-event state and the
Example-data Overview on the current branch; this remains bypass evidence, not
real Supabase authentication or production data.
The latest browser pass also verified the updated attention/outcome reading
order and plain-language helper copy on the Example-data Overview.
The quality no-data path now preserves the same source context and explains
what will appear after connection instead of presenting a generic failure
state.

The latest metric-trust pass keeps missing prompt/resource outcome rates
explicit: `N/A` is shown for unavailable stall, error, and unknown rates rather
than silently rendering `0%`. This preserves the distinction between a real
zero and an unavailable projection.

Capability breadth now uses the same visual contract: an unavailable breadth
measure renders `N/A` with a neutral track rather than an empty green bar that
could be read as measured zero.

Journey reach, assistant distribution, and resource/prompt share bars now use
the same rule: unavailable shares render a neutral track and no green fill,
while measured zero remains distinguishable from missing evidence.

Final current-branch build: `npm run build` passed with 230 static pages
generated after the dashboard palette revision. TypeScript and ESLint also
passed. The full `npm run test:release-gate` passed all 159 suites on the
current branch, and the focused 104-suite business-user contract suite passed
after the Setup key-density and outcome-interpretation revisions.
This is still local build evidence; it does not prove a production deployment
or authenticated production rendering.

## Requirement coverage

| Requirement | Current status | Evidence | What is still needed |
| --- | --- | --- | --- |
| A newly signed-up user understands that a workspace is being prepared | **Implemented and tested** | `trackmcp-nextjs/src/app/dashboard/page.tsx`; `src/app/dashboard/page.contract.test.mjs` | Fresh-account browser verification |
| Legacy `/onboarding` entry point does not fork the setup story | **Verified in source** | `trackmcp-nextjs/src/app/onboarding/page.tsx` redirects to `/dashboard`; `trackmcp-nextjs/src/app/dashboard/onboarding/page.tsx` does the same | Fresh-account navigation check after deployment |
| A user with no workspace does not get trapped before setup | **Implemented and tested** | `DashboardApp.tsx` routes “Complete setup” to Setup while provisioning; setup-state contract; workspace route contract | Fresh-account verification against production auth/session state |
| Setup explains the three required steps | **Implemented and tested** | `DashboardApp.tsx`; state-aware setup rail; 97 business UX tests | Confirm copy with a non-technical participant |
| First-time sign-in/sign-up controls look actionable and remain keyboard-visible | **Implemented and tested** | `src/app/signin/page.tsx`, `src/components/OAuthButtons.tsx`; business UX contract | Confirm affordance and copy in a fresh-account browser walkthrough |
| Setup explains what appears after the first event | **Implemented and tested** | `BusinessContext` “What you will get after setup”; business UX contract | Fresh-account browser verification |
| Setup gives an activated user a direct next action into the business dashboard | **Implemented and tested** | `SetupView` shows `Open Overview` after verified, limited, or identity-limited activity; business UX contract | Confirm with a real first-event account |
| My data and Example data are visibly separate | **Implemented and tested; verified live read-only** | `DataSourceStrip`; Example data contract; authenticated Chrome review | Verify after deployment of this branch |
| Overview answers who, what, outcome, and attention questions | **Implemented and tested** | Overview business-question copy, same-window period comparison, KPI helpers, period context, and chart-table fallback; 97 business UX tests | Verify deployed rendering |
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
| The complete Founder OS read-model surface is backed by production data | **Production baseline verified; UX branch still pending deployment** | Successful authenticated production smoke run `41568279966` on `main` at `9e79371f2f4218aef912b531f0b4692764b8ff08`; twelve `/api/v2/*` read-model routes and legacy read models returned 200 for two scoped workspaces | Repeat against the deployed UX branch and verify rendered no-data, partial-data, and example-data states |
| A non-technical person can complete the full journey unaided | **Not yet proven** | UAT script exists at `FOUNDER-OS-BUSINESS-USER-UAT-SCRIPT.md` | Run the script with a real participant |
| The branch is live in production | **Not yet done** | No merge/deployment performed from this branch | Review, merge, deploy, authenticated smoke tests |

## Evidence tiers

### Tier 1 — verified in the isolated branch

- Source changes are committed and the worktree is clean.
- TypeScript, ESLint, business UX contracts, metric contracts, and production
  build pass.
- The business UX contract suite passes 97/97 tests, including state-aware
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

- The first authenticated smoke attempt for this candidate (`41577636745`)
  failed before any checks because production returned HTTP 503 for the first
  workspace key-status request; subsequent direct probes observed HTTP 502 from
  the App Runner/Envoy edge. The origin recovered and a read-only retest
  (`41580849155`) then passed all 39 authenticated checks. The historical
  failure and the recovered result are recorded in
  `docs/evidence/business-user-ux-production-auth-smoke-2026-11-03.md` and
  `docs/evidence/business-user-ux-production-auth-smoke-recovered-2026-11-03.md`.
  This clears the current availability gate for the deployed baseline, but it
  is not UX-branch production evidence because the branch remains undeployed.
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

The dashboard palette was softened after review: primary actions now use a
lighter, calmer green on warm-neutral surfaces rather than a saturated
emerald. The dashboard-only primary is `#63c893`, with `#438d68` reserved for
stronger text and active controls; `#f3fcf6` and `#f8fdf9` are surface-only
values. This is a color-only change: layout, copy, metrics, and behavior are
unchanged. Public-site color tokens remain separate.

The dashboard data-source control now makes its scope explicit in the header:
`Your workspace` for live data and `Illustration only` for Example data. This
is a comprehension-only change; it does not alter the selected mode, formulas,
or read-model responses. It remains branch evidence until the deployed
dashboard is reviewed.

Setup now keeps a long connection-key history out of the primary scan by
showing the first three active keys and an explicit `Show all active keys`
control. Revoked keys remain behind the existing disclosure. This is a
presentation-only change; key creation, rotation, revocation, and scope
behavior are unchanged. It remains branch evidence until the deployed Setup
view is reviewed.

The first-load workspace handoff was aligned to the same palette so a new user
does not see a separate slate/indigo loading surface before entering the
dashboard. The local Example-data browser preview showed the updated green
navigation, controls, source-state banner, and business-first Overview.

The release-gate result is source-level evidence only. It does not replace a
fresh-account browser walkthrough, a real first event, or a production smoke
run against this branch.

The People surface now has a clearer My-data empty state: when the privacy-safe
account read model is not present, the user is told that account activity will
appear after connection and is given a direct Setup action. Blank or
unrecognized assistant metadata is labeled `Unrecognized assistant`. This is a
source-level comprehension improvement; authenticated read-model completeness
and production behavior remain unverified.

The `What they're doing` surface now uses the same recovery contract when its
capability read model is absent: it explains what will populate after the first
connection and links to Setup instead of leaving a business reader with an
empty capability inventory. This is also source-level evidence only.

The `Resources & prompts` surface now explains its live-data prerequisite when
both interaction read models are absent, including what the page will show
after connection and a direct Setup action. This improves comprehension without
changing the `N/A` metric semantics or adding inferred activity.

The Journey surface now uses the same no-data contract when linked work-step
evidence is absent: it explains the future path/stop/retry view, links to Setup,
and does not infer a funnel from missing events. This remains source-level
evidence until a real authenticated read-model response is exercised.

The outcome panel now gives an explicit no-data explanation when no workflow
starts or final states are present. It tells business readers that completion
requires server-reported outcome evidence and keeps observed tool activity from
being interpreted as success. Formula and read-model semantics are unchanged.

Empty confirmed-incident results now use the same evidence boundary: the UI
says `No confirmed incidents in this period`, explicitly avoids a whole-system
health claim, and points readers to Overview and Evidence for broader context.

The Overview attention and outcome surfaces now lead with plain-language
interpretation: attention signals are described as observed patterns worth a
closer look, confirmed incidents remain a separate evidence type, and the
completion methodology is available behind `How completion is calculated`.
The underlying outcome source, formulas, and read models are unchanged. This
is branch evidence until the deployed dashboard is reviewed.

The `Did it work` no-data/error path now keeps the selected source visible and
uses separate My-data and Example-data recovery explanations. A missing quality
response is not presented as a health result; this is a presentation-only
change with no metric or formula change. The fallback description names the
selected source explicitly, so an Example-data failure cannot be mislabeled as
a My-data failure.

The unauthenticated `/dashboard` handoff now exposes both first-session entry
paths: `Sign in to continue` for returning users and `Create an account` for
new users. This removes a signup dead end without changing authentication or
workspace provisioning behavior.

Workspace creation errors now keep the first-session recovery path actionable:
when no workspace exists, the visible error banner says `Retry workspace setup`
and invokes the workspace-creation flow. Once a workspace exists, the same
banner remains a data-refresh action. This closes a setup dead end without
changing workspace or key persistence semantics.

The dashboard header now keeps the data-source toggle and language selector in
one non-wrapping control group at desktop widths, preventing the language
control from visually colliding with `Example data`. This is a layout-only
affordance fix; the two controls retain their existing actions and labels.

A fresh local browser pass on the Example-data Overview exposed the same
business-first reading order and showed `Data source` with `Illustration only`
beside the language selector. The local route returned HTTP 200; this remains
local evidence and does not replace authenticated production review.

The versioned People read-model projection now preserves unavailable
new-versus-returning counts as `null`. Business surfaces can therefore render
`N/A` when the bounded history scan is incomplete instead of presenting an
unsupported zero. This is a metric-truth fix; it does not change the underlying
account resolver or formulas.

The Resources & prompts surface now applies the same boundary to durable
entity-read metrics. When the read projection is unavailable, read success,
failure, and input-needed counts show `N/A`; a real `no_rows` projection still
shows zero. This prevents a schema availability problem from looking like
healthy or empty activity.

The full release gate was rerun after this change and passed all 159 suites;
the generated synthetic fixture timestamp was restored to its tracked value
after the run.

The latest full release gate was rerun after this projection change and passed
all 159 suites. The generated synthetic fixture timestamp was restored after
the run; no production data was written.

After the loading-state and palette revisions, the consolidated release gate
was rerun and passed all 159 suites. The gate passed in the isolated worktree;
it does not change the Tier 3 status because authenticated production and
human business-user UAT evidence are still outstanding.

## Release interpretation

This branch is a verified business-comprehension improvement, not a claim that
the entire Founder OS product is complete. The correct next release decision is
to deploy only after the Tier 3 evidence is gathered and any failed UAT item is
fixed or explicitly accepted.
