# Business-user UX local preview evidence

Date: 2026-11-03
Branch: `codex/business-user-ux-audit`
Commit under review: `7e2fd060` (`Tighten first-time dashboard explanation`)

This is local browser evidence only. It is not production evidence and does
not replace a fresh-account or real-telemetry walkthrough.

Read-only production comparison on 2026-11-03 confirms the branch is not live
yet: `https://trackmcp.com/dashboard?view=capabilities&data=example` still
shows the pre-branch navigation order and the older `TOTAL TOOL CALLS`,
`PREVIOUS PERIOD`, `OVERALL ERROR RATE`, and `AVG TOOLS PER ACCOUNT` labels.
The production shell also still uses the internal pilot notice wording. This
is recorded as a deployment-state observation only; no production mutation was
performed.

The final source-level pass also aligns the Evidence tab with the Overview
language: business readers see “Observed session”, “Evidence link”, and “Open
evidence”; raw session identifiers remain an internal routing detail.

The latest fixture correction keeps the illustrative People view internally
coherent: its weekly growth series now ends at the same 18-account total shown
by the active-account KPI. This changes Example data only; it does not alter a
live read model or any production metric formula.

The setup vocabulary pass also removed the last visible `API key` wording from
the customer-facing setup handoff and key-creation error path. The product now
uses `connection key` consistently while preserving the internal `api_key`
field names and event identifiers used by the API contract.

The evidence action label is also normalized to `Open evidence` across the
Overview, Journey, Quality, and Evidence surfaces. This is a copy-consistency
change only; the underlying trace navigation is unchanged.

The final source pass also removed the remaining title-case variants from
secondary action props and tool/issue drill-downs, so the phrase is consistent
even when the action is rendered outside the primary Evidence table.

The Outcome evidence panel now leads with the reader-facing rule — only
outcomes explicitly reported by the server count — instead of the internal
“semantic facts” term.

The current branch also passed `npm run build` after these copy changes;
Next.js generated 230 static pages. This remains local evidence only.

Final standalone-server smoke on the current build used placeholder Supabase
values plus the documented local dashboard bypass. These routes all returned
HTTP 200: Overview, Setup, Who's using it, What they're doing,
Resources & prompts, The journey, Did it work, What's broken, and Evidence.
The server was stopped after the read-only smoke; no production tab or
production data was touched.

The auth affordance pass also keeps provider-discovery skeletons visually
non-actionable (`cursor-default`) until Google or GitHub is confirmed enabled;
only actual provider buttons expose the hand cursor.

After this change, TypeScript, ESLint, the OAuth contract suite, the 87-test
business UX suite, and the production build all passed; the build generated
230 static pages.

## Latest browser confirmation

- Local route: `/dashboard?view=evidence&data=example` on the isolated branch.
- The accessibility tree showed `Observed session 1..6`, `Evidence link`,
  `Linked to session`, and `View sample evidence`; it did not expose raw session
  identifiers in the primary table.
- Local route: `/dashboard?view=overview&data=my` with the local demo bypass.
- The no-event state showed the business explanation, `Complete setup`, the
  three setup steps, and the “What you will see here” preview without
  substituting Example data into My data.
- This remains local browser evidence, not production or human-UAT evidence.
- On the activated Example-data Overview, the new “Recommended next step”
  card appeared above the KPI grid and offered “See the journey” with a
  bounded explanation of what the sample path demonstrates.
- On the rendered Setup route with no connection key, the status copy now says
  “TrackMCP cannot verify an integration until a connection key is configured
  and your server sends an event.” The optional “Advanced key scope” control
  remains a separate collapsed section rather than the primary setup path.
- A deep-linked local route `/dashboard?view=issues&data=example` opened directly
  in Example data after route hydration; the initial accessibility tree did not
  expose the misleading My-data empty state. The neutral route-loading handoff
  keeps the two data sources separate while the URL state is applied.

## Environment

- Next development server started from the isolated worktree on port `3138`.
- The local dashboard bypass was enabled only for the preview.
- Supabase values were deliberately non-production placeholders.
- No production credentials, data, deployment, or database writes were used.

## First-time My-data state

Route: `/dashboard?view=overview&data=my`

Observed in the browser accessibility tree:

- Desktop-only pilot notice is visible.
- Business-first navigation is visible: Overview, Who's using it, What
  they're doing, Resources & prompts, The journey, Did it work, What's broken,
  Evidence, and Setup.
- The activity period is explicit: `Showing last 30 days`.
- The page explains the product before technical setup:
  `TrackMCP helps product and operations teams understand how people use their
  MCP: who is showing up, what they are trying to do, whether the work
  completed, and what needs attention.`
- The no-connection state explains that a technical teammate creates a key,
  adds it to the server, and sends one real event.
- The next-step rail lists creating a connection key, adding
  `TRACKMCP_KEY`, and making one real tool call.
- `Complete setup` and `See Example data` are both available.
- The structure preview is explicitly labeled as a preview and states that
  Example data is not substituted into My data.

## Verification result

Pass for the local comprehension contract. The page answers what TrackMCP is
for, what the business user should expect after setup, and who normally owns
the technical step without presenting missing data as a product failure.

Remaining evidence required:

- Fresh authenticated account in a deployed environment.
- Real first-event ingestion and dashboard refresh.
- One non-technical product or operations participant completing the UAT
  script in `docs/FOUNDER-OS-BUSINESS-USER-UAT-SCRIPT.md`.

## Activated Example-data state

Route: `/dashboard?view=capabilities&data=example`

Observed in the browser DOM snapshot:

- The page leads with adoption and reliability before protocol detail.
- “Trend by feature” renders a visual chart and an expanded table alternative.
- The table exposes week, total calls, and per-feature values using the same
  bounded example points as the chart.
- The table is labeled `Weekly observed calls by feature` and is available
  without relying on hover text.
- The example data remains explicitly labeled as illustrative.

This confirms the activated business view has a readable path for comparing
feature usage, while the underlying metric definitions remain unchanged.

The same activated view now exposes an outcome-trend table in “Did it work,”
with explicit completed, failed, pending, and unknown values by period. These
states remain separate and are never collapsed into a single success score.

The local browser verification expanded that table successfully and exposed the
example rows `2026-08-19` and `2026-08-26` with separate values for each state.

The latest local browser pass used the isolated branch's Next.js development
server on port `3175` with the documented local dashboard bypass. The rendered
Overview showed the indigo action system, cool-neutral canvas, explicit
`Example data selected` boundary, `At a glance` summary, business-first KPI
labels, and a recommended next step. The rendered Setup view showed the
three-step activation path, connection-key language, SDK tabs, and advanced
controls behind disclosure. No production credentials or data were used.

The evidence drill-down copy now uses `Evidence details` instead of the
engineering-oriented `Trace Explorer` label. The change is covered by a
dedicated contract test and keeps the technical identifier copy inside the
secondary detail surface.

The local browser also opened one illustrative session from the Evidence tab.
The route displayed `Evidence details`, `Review one bounded interaction in
observed order`, `Example data`, and redacted event boundaries. This confirms
the new wording is visible in the actual drill-down, not only in source tests.

The latest no-data Overview preview also showed the updated indigo/neutral
empty-state treatment: the business explanation appears before setup, the
primary `Complete setup` action is distinct from `See Example data`, and the
three next steps remain visible without the former green decorative surfaces.

The Resources & prompts preview also expanded its trend table successfully,
showing period, surface, item, and calls while retaining the content/argument
privacy boundary.

The The journey preview expanded its reach table successfully, showing each
observed step with reached count and share while retaining the explicit caveat
that a missing next event is not abandonment.

### Cross-tab browser pass

After waiting for the client route state to settle, direct `data=example`
links were checked for Overview, Who's using it, What they're doing, Resources
& prompts, The journey, Did it work, What's broken, and Evidence. Each view
showed the `Example data selected` marker and its own business question before
the metrics. The observed introductions were:

- Who's using it: account activity is explicitly not a customer census.
- What they're doing: adoption and reliability come before protocol evidence.
- Resources & prompts: information needs and explicit outcomes are explained.
- The journey: observed paths are separated from guessed funnels.
- Did it work: explicit success, errors, and unknown evidence remain separate.
- What's broken: signals are ranked for investigation, not presented as
  diagnoses.
- Evidence: technical detail is positioned as a drill-down from a business
  signal.

Setup intentionally remains a live connection workflow even when the global
data toggle is set to Example data; it shows the key, SDK, first-event, and
privacy controls rather than pretending that setup itself is sample telemetry.

## Signup handoff

Route: `/signup`

The local browser preview rendered the new signup description before the form:
“Create your account. Next, a technical teammate can connect one server, and
your team can read usage, outcomes, and issues in the dashboard.” This makes
the ownership handoff and post-signup value visible before authentication is
complete.

## KPI hierarchy visual check

On the local Example-data Overview preview, the four decision KPIs render as
separate rounded white cards with a restrained brand icon treatment and
tabular numeric values. The accessibility tree exposed the same business
labels and helper text as the source contract: `Assistants using your MCP`,
`Observed work`, `Work with an explicit success`, and `Needs attention`.

This is a visual hierarchy improvement only; it does not change metric formulas
or evidence status. Verified after commit `aa63a153`.

The later account-group language correction was verified in the browser after
commit `d5af5749`: the Capabilities KPI and adoption distribution now say
`account group` and explain that missing optional identity evidence is excluded
without being turned into a named customer.

## Latest local preview after the research pass

The local dashboard was reopened from the isolated branch on port `3141` with
the same deliberately non-production placeholder Supabase values.

Verified in the rendered accessibility tree:

- Overview with Example data shows `Example data selected` and the explicit
  boundary that it is illustrative, not workspace telemetry.
- Overview now renders an `At a glance` summary before the KPI cards. It tells
  the reader that Example data is illustrative and explicitly says the summary
  is not a health or customer-count claim.
- The Overview question, KPI labels, evidence disclosure, and next-question
  actions remain visible together without requiring protocol knowledge.
- “Who's using it” now asks which **account groups** and assistants are
  showing up; the KPI, explanatory text, growth subtitle, and table all keep
  the privacy-safe account-group vocabulary.
- Setup remains a live-connection workflow even when the global Example-data
  toggle is selected. It exposes the three steps, the first-event handoff,
  CLI-first recommendation, SDK tabs, and progressive disclosure for scope,
  identity, privacy, and data controls.

This is local browser evidence only. It confirms rendered copy and hierarchy;
it does not prove production read-model data, account creation, or a real
first-event connection.

The isolated branch was also opened locally at `/signup` on port `3152`. The
browser accessibility tree showed the business handoff sentence before the
form, the Terms and Privacy links, labeled first name, last name, email,
password, and confirmation fields, the `Create account` action, and the
`Sign in` mode switch. Provider discovery remained a bounded loading state
when the preview used deliberately invalid Supabase placeholders; it did not
block the email form or cause a layout jump. This is local UI evidence only,
not proof that the production OAuth providers are enabled.

## First-time handoff preview

A fresh local bypass session was opened at `/dashboard?view=overview&data=my`
on port `3142` and the primary `Complete setup` action was activated.

The rendered flow verified that:

- The empty Overview explains the business value before showing setup detail.
- The page states that no Example data is substituted into My data.
- The primary action navigates directly to `/dashboard?view=setup&data=my`.
- Setup immediately explains the three steps: create a key, install the SDK,
  and send one real event.
- Setup names the next business outcome: who is showing up, what people are
  trying, whether work completed, and what deserves attention.
- The CLI-first recommendation, TypeScript/Python/Go/.NET tabs, first-event
  check, and progressive disclosure for advanced controls are visible in the
  same setup flow.

The local API calls returned 503 because the preview intentionally used
placeholder Supabase values. That is expected fail-closed behavior and is not
production evidence.

## Final plain-language pass

After the research pass, the primary business path was reviewed for avoidable
engineering vocabulary. The branch now uses:

- `live server activity` instead of `workspace telemetry` in the data-source
  marker;
- `account groups` instead of `account signals` or `resolver signal` in the
  primary Who's using it path; and
- `customer count or overall product health` as the plain-English boundary for
  the Overview takeaway.
- Setup status states now lead with recent server activity, partial coverage,
  and account-group availability; technical evidence remains available below
  the status summary.

The same Setup route was reopened in a local browser after this pass. Its
accessibility tree showed `Activity collection is fail-open`, `first activity
is sent`, `bounded activity metadata`, and `Connection method identified`.
This confirms the new wording is rendered in the first-time setup path rather
than only changed in source.

The activated Overview path was also reviewed in the local browser. Session
rows now present `Observed session 1`-style labels and an `Open evidence`
action, while the completion panel explains that only outcomes explicitly
reported by the server count as success.

The underlying evidence contracts and technical disclosures were not removed.
This is a copy and comprehension change, not a metric or read-model change.

## Research and first-time auth affordance pass

The branch research record was expanded using official PostHog, Amplitude,
USWDS, Nielsen Norman Group, Microsoft, and GOV.UK guidance. The resulting
decisions are recorded in `docs/FOUNDER-OS-BUSINESS-USER-UX-RESEARCH.md`: keep
the first review path curated, use one question per chart, pair visual trends
with plain-language conclusions and exact-value alternatives, reserve color for
evidence-backed states, and give every failure a recovery action.

The first-time authentication path now applies the same interaction contract as
the dashboard: email submit, social-provider, verification, password-reset,
recovery, legal, and error-recovery controls expose a pointer affordance,
visible keyboard focus, and an explicit disabled state. The source and contract
proof are in `trackmcp-nextjs/src/app/signin/page.tsx`,
`trackmcp-nextjs/src/components/OAuthButtons.tsx`, and
`trackmcp-nextjs/scripts/business-user-ux.contract.test.mjs`.

Verification after this pass:

- `npm run test:business-user-ux`: 81/81 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; 230 static pages generated.
- `npm run test:release-gate`: passed; 159 suites.
- Worktree restored to clean state after the release gate regenerated its
  synthetic UAT timestamp.

## Built runtime smoke

The production build was started through `scripts/start-standalone.mjs` with
the documented local dashboard bypass and deliberately invalid placeholder
Supabase values. The following routes returned HTTP 200 from the built server:

- `/signin`
- `/signup`
- `/dashboard?view=overview&data=example`
- `/dashboard?view=setup&data=example`
- `/docs`
- `/sitemap.xml`

The server-rendered signup response contained the expected first-run copy:
`Create your TrackMCP account`, `technical teammate can connect one server`,
and `usage, outcomes, and issues`. This is local bypass evidence only; it does
not prove a real authenticated session, a Supabase-backed workspace, or a
production deployment.

## Example-data coherence follow-up

The settled local browser pass exposed one concrete comprehension defect in the
People surface: the KPI cards showed active, new, and returning account-group
values while `Growth over time` incorrectly rendered “No account activity was
observed”. The example fixture had never supplied a growth series. The fixture
now includes a bounded weekly series ending at the same illustrative active
account total used by the KPI cards. The settled local browser preview now
shows the chart with a latest value of 18 accounts and a table disclosure.
This is an illustrative-data correction only; it changes no live read model or
metric formula.

## Capability-page progressive disclosure follow-up

After the initial research and comprehension pass, the local bypass preview
was reopened at `/dashboard?view=capabilities&data=example` on port `3152`
with deliberately invalid Supabase placeholders and the development
dashboard bypass enabled. The page rendered successfully and visibly showed:

- `What they're doing` as the business question;
- `Most-used features`, `Breadth of adoption`, `Trend by feature`, and
  `Reliability by tool` as the default reading path; and
- a collapsed `Detailed capability inventory` disclosure for repeated
  feature counts, catalog history, and the technical capability table.

This confirms the repeated technical inventory no longer competes with the
business summary on first render. It is local preview evidence only; it does
not prove the branch is deployed or that production read-model responses are
complete.

The same preview was then opened at `/dashboard?view=resources&data=example`.
It visibly showed the business question, the information-need context,
interaction outcomes, and a collapsed `Detailed resource and prompt evidence`
disclosure. Entity counts, durable-read status, and transport coverage are
available inside that disclosure rather than competing with the primary
question on first render.

## Setup progressive-disclosure follow-up

The Setup view was audited after the capability and resources passes. The
primary path now stays focused on the three activation steps, connection
status, server connection instructions, and connection-key actions. The
observed server/environment labels and deployment-linkage count are still
available, but they now sit in a collapsed `Observed connection details`
disclosure. Its copy clarifies that these are bounded labels for comparison,
not a deployment inventory or a health check. This keeps technical context
discoverable without asking a newly signed-up business user to interpret it
before connecting a server.

The same status card now keeps the individual readiness checks and percentage
behind a collapsed `Setup evidence` disclosure. The first scan shows only the
plain-language state and the action to refresh or continue; the technical
checklist remains available for engineering review.

The Overview data-trust copy was also reviewed. Visible labels now say
`Activity observed`, `Activity recency`, `Account-grouped activity`, and
`Dashboard refresh`; the underlying bounded-evidence caveats remain intact.

The Quality view's helper text was reviewed for a non-technical reader. The
surface now describes denominators as work with a reported final state and
describes semantic completion/failure as server-reported outcomes, rather
than exposing internal terms such as “explicit workflow terminals” or
“semantic evidence”. This is copy-only: the underlying formulas and
evidence-boundary rules are unchanged.

The Setup step rail was also corrected. It no longer always highlights the
first card. A new workspace highlights the first provisioning step; a
workspace with an active key but no observed activity highlights `Send one
event`; and a workspace with observed activity no longer displays a false
current-step emphasis. The active card is marked with `aria-current="step"`
and a concise `Next` label so the visual cue is also available to assistive
technology.

The capability summary was reviewed against the metric registry and Founder OS
metric contract. The default KPI labels now say `Feature uses observed`,
`Feature uses in previous period`, and `Average features per account group`.
The formulas, source telemetry, account-group boundary, and error semantics
are unchanged; this is a vocabulary improvement for business readers.

The People view now makes its two most easily misread cards explicit: `New
this period` is first observed activity rather than signup, and `Returning
this period` is repeat activity rather than a retention claim. The historical
scan and account-group formulas remain unchanged.

The Resources & prompts default path was reviewed as well. Its first scan now
starts with the business question and three decision KPIs; the technical
evidence boundary is still present inside the expanded detail section rather
than competing with the initial reading path.

The Overview order was corrected so the decision KPI row and outcome summary
appear before the expandable evidence/protocol block. This is a structural
hierarchy change, not a metric or formula change.

The Journey view was also checked for technical density. Its async task table
now sits behind a collapsed `Technical task evidence` disclosure, while the
business reading path remains common paths, where work stops, pause/resume,
and explicit outcomes.

Verification after this pass:

- `npm run test:business-user-ux`: 81/81 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed with no warnings emitted by this branch.
- `npm run build`: passed; 230 static pages generated.
- `npm run test:release-gate` passed all 159 suites on the final branch state
  (`4fdba556`) when the generated synthetic UAT report was redirected to a
  temporary path, so the tracked evidence fixture remained unchanged.
- `npm run test:business-user-ux`: 81/81 passed after the Quality helper-copy
  change.
- `npm run test:p0-truth`: 12/12 passed after the Quality helper-copy change.
- `npx tsc --noEmit --pretty false`: passed after the Quality helper-copy
  change.
- `npm run build`: passed after the state-aware Setup rail change; 230 static
  pages generated.
- `npm run test:metric-contract`: 4/4 passed after the capability vocabulary
  change.
- `npm run lint`: passed after the capability vocabulary change.
- `npm run test:release-gate`: passed all 159 suites on the capability
  vocabulary change (`d3b7871f`) with the synthetic UAT report redirected to a
  temporary path.
- `npm run build`: passed after the People-card boundary copy change; 230
  static pages generated.
- `npm run test:release-gate`: passed all 159 suites on the People-card
  boundary copy change (`302eeb6f`); the redacted output was captured in
  `/tmp/trackmcp-release-gate-final3.log`.

The rebuilt standalone server was also started with placeholder Supabase
values and the documented local dashboard bypass. Node's HTTP client returned
HTTP 200 for `/dashboard?view=setup&data=example`,
`/dashboard?view=overview&data=example`, `/signin`, and `/signup`. The server
was stopped cleanly afterward. This verifies local route rendering only; it is
not authenticated production evidence.

After the People-card copy change, the same rebuilt standalone server was
started again and every dashboard view returned HTTP 200 with TrackMCP content
under the Example-data bypass: `overview`, `clients`, `capabilities`,
`resources`, `journeys`, `quality`, `issues`, `evidence`, and `setup`. The
server was stopped cleanly. This confirms route-level rendering for the full
business navigation, not authenticated production behavior.
- Production deployment and fresh-account browser evidence remain pending.

Latest verification after `2ac7b4be`:

- Setup active-key scope is now behind a `Key details` disclosure so the
  primary setup scan stays focused on connection status, SDK instructions, and
  the first-event action.
- The disclosure opens automatically when the latest event does not match the
  configured key scope, preserving a visible recovery path for the one state
  where the technical detail is actionable.
- `npm run test:business-user-ux`: 83/83 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; 230 static pages generated.
- `npm run test:release-gate`: passed all 159 suites.
- The branch remains local and undeployed; fresh-account, production, and
  non-technical participant evidence are still required.

Latest local runtime verification after `cf0d0d40`:

- Rebuilt standalone server started with placeholder Supabase values and the
  documented local dashboard bypass.
- HTTP 200 returned for the public routes, docs, device page, sitemap index,
  sitemap, and every business dashboard view under Example data.
- `/tool-sitemap.xml` failed closed with HTTP 503 and a positive `Retry-After`
  header (`300` seconds) because no real database was configured. It did not
  return an empty successful sitemap.
- The server was stopped cleanly. This is local runtime evidence only; it is
  not authenticated production evidence.

Latest typography verification after `5e880d7b`:

- Dashboard Inter typography now uses an explicit 30px page/metric role, 17px
  section-title role, and 12px label role. Code and dense table detail remain
  compact.
- `npm run test:business-user-ux`: 85/85 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; 230 static pages generated.
- `npm run test:release-gate`: passed all 159 suites.

Latest visual-system verification after `cf0d0d40`:

- The dashboard now uses cool neutral surfaces with indigo as the primary
  action color. The public site's color tokens are unchanged outside the
  dashboard shell.
- Dashboard gradients were removed from the data-source strip and setup-step
  rail; state meaning remains expressed through text, labels, and contrast.
- The initial dashboard hydration state is no longer a blank white screen. It
  now shows the TrackMCP mark, a short explanation, and three preparation
  steps: account, workspace, and dashboard.
- `npm run test:business-user-ux`: 85/85 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; 230 static pages generated.
- `npm run test:release-gate`: passed all 159 suites.
- The branch remains local and undeployed; production visual review and human
  readability testing are still required.

Latest copy-system verification after `570ec527`:

- Added `.codex/skills/trackmcp-business-copy/SKILL.md`, a repo-scoped reusable
  workflow for dashboard, setup, analytics, and release copy.
- The skill captures the business-reader questions, consistent vocabulary,
  evidence-boundary rules, concise-copy rules, recovery-path rules, and a
  review checklist. It does not alter metric formulas or API contracts.
- The bundled `quick_validate.py` could not run because this environment lacks
  the optional PyYAML module; the skill's frontmatter and required sections
  were checked directly and the file is committed with no scaffold placeholders.

Latest shell verification after `984f2cbe`:

- The desktop language selector now appears only in the global header. The
  duplicate sidebar control was removed so global settings have one predictable
  location while the sidebar stays focused on navigation and account actions.
- `npm run test:business-user-ux`: 83/83 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; 230 static pages generated.
- `npm run test:release-gate`: passed all 159 suites after the shell change.

Latest recovery-path verification after `a00cf8db`:

- When live analytics cannot be loaded, `Retry` remains the primary action.
- The same state now offers `See Example data` as an explicit, safe fallback;
  it switches the data source rather than substituting sample values into the
  live workspace view.
- The fallback is available on the main dashboard live-data failure state;
  the quality-specific state keeps its existing retry-only behavior.
- `npm run test:business-user-ux`: 85/85 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed; 230 static pages generated.
- `npm run test:release-gate`: passed all 159 suites.
- The branch remains local and undeployed; fresh-account, production, and
  non-technical participant evidence are still required.
