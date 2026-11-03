# Business-user UX local preview evidence

Date: 2026-11-03
Branch: `codex/business-user-ux-audit`
Commit under review: `a51293e3` (`Record emerald palette verification`)

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

The latest metric-trust verification also passed the focused business-user
suite (103/103), TypeScript, and the production build. Resource and prompt
outcome rates now preserve unavailable stall, error, and unknown measures as
`N/A` rather than implying a measured `0%`.

The same pass verified that unavailable capability breadth uses a neutral
visual track instead of an empty green bar, so `N/A` cannot be mistaken for a
measured zero.

Journey reach, assistant distribution, and resource/prompt share bars now
follow the same neutral-unavailable visual contract. This is a presentation
change only; the underlying read models and formulas are unchanged.

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

## Latest local runtime route check

On the current branch, a local Next.js runtime with placeholder Supabase
configuration returned HTTP 200 for all nine dashboard surfaces:

- Overview (`view=overview&data=example`)
- Setup (`view=setup&data=my`)
- Who's using it (`view=clients&data=example`)
- What they're doing (`view=capabilities&data=example`)
- Resources & prompts (`view=resources&data=example`)
- The journey (`view=journeys&data=example`)
- Did it work (`view=quality&data=example`)
- What's broken (`view=issues&data=example`)
- Evidence (`view=evidence&data=example`)

The same runtime returned HTTP 200 for `/sitemap-index.xml` and
`/sitemap.xml`. `/tool-sitemap.xml` returned HTTP 503 with
`Retry-After: 300`, because the placeholder database was intentionally
unavailable. This is the expected fail-closed behavior: the runtime does not
serve an empty successful sitemap when its database read cannot complete.

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
`Observed work`, `Reported completion`, and `Needs attention`.

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

The unauthenticated route was also rendered in a local browser at
`http://127.0.0.1:3199/dashboard` with placeholder Supabase values. After the
bounded auth hydration settled, the accessibility tree showed the heading
`Open your TrackMCP dashboard.`, the explanation for returning and new users,
and separate `Sign in to continue` and `Create an account` links. The local
server returned HTTP 200 and was stopped cleanly; no production session or
data was touched.
- `npm run test:release-gate`: passed all 159 suites.
- The branch remains local and undeployed; fresh-account, production, and
  non-technical participant evidence are still required.

## Current verification after `7e2fd060` / `48f4dcf7`

- The first-time dashboard explanation now uses a short business-oriented
  description: TrackMCP shows who is using the MCP, what they are trying to
  do, whether work completed, and what needs attention. The technical setup
  boundary remains explicit without making the empty state a paragraph.
- `npm run test:business-user-ux`: 87/87 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed; 230 static pages generated.
- `npm run test:release-gate`: passed all 159 suites.
- A fresh standalone runtime with deliberately non-production Supabase
  placeholders returned HTTP 200 for `/`, `/docs`, both SDK docs, `/device`,
  the Example-data Setup dashboard, `/sitemap-index.xml`, and `/sitemap.xml`.
- `/tool-sitemap.xml` returned HTTP 503 with `Retry-After: 300`, proving the
  database-backed sitemap fails closed rather than returning an empty success.
- The isolated worktree is clean. No merge, deployment, or production data
  change was performed.
- Fresh authenticated-account setup, a real first event, and non-technical
  participant UAT remain open gates; this evidence is local and synthetic.

## Fresh browser verification after `53fb22c6`

- Started the current branch with `next dev` on port `3193`, deliberately
  using placeholder Supabase values and the development-only
  `NEXT_PUBLIC_LOCAL_DASHBOARD_BYPASS=true` flag.
- Opened `/dashboard?view=overview&data=my` in a browser. The rendered My-data
  state showed the business orientation sentence, the three setup steps, the
  `Complete setup` action, the `See Example data` action, and the preview cards
  without substituting sample values into the live state.
- Switched to Example data in the same browser session. The rendered Overview
  showed the explicit Example-data banner, the business-oriented `At a glance`
  summary, the recommended next step, four decision KPIs, evidence-aware
  attention signals, observed sessions, and explicit outcomes.
- The screenshot and accessibility tree showed the neutral/indigo dashboard
  hierarchy, two navigation groups (`Understand` and `Investigate & act`), and
  no blank workspace screen after the development-only handoff.
- This is stronger than source-only evidence but remains local bypass evidence:
  it does not prove a real Supabase login, real workspace data, or a deployed
  production read model.

## Business-tab sweep after `5ea24d8b`

Using the same local development bypass and Example-data source, a browser
route sweep rendered every current business-facing dashboard view with TrackMCP
content and the intended heading:

| Route state | Rendered heading |
| --- | --- |
| `clients` | Who's using it |
| `capabilities` | What they're doing |
| `resources` | Resources & prompts |
| `journeys` | The journey |
| `quality` | Did it work |
| `issues` | What's broken |
| `evidence` | Evidence |
| `setup` | Setup |

This confirms route reachability and the business-facing vocabulary in the
current build. It does not prove that a real workspace has populated read-model
responses for every view.

## Setup journey inspection after `4739c007`

The local Example-data Setup route was inspected in a fresh browser session on
port `3195` with the development-only local dashboard bypass and deliberately
non-production Supabase placeholders. The visible path is coherent for a
technical teammate while remaining understandable to a business user reading
the page later:

- The page starts with a short explanation of what the dashboard will show
  after the first real event.
- The primary rail is explicit: create a connection key, install the SDK, and
  send one real event.
- The connection state is plain-language (`Not connected`) with a single
  recovery action (`Refresh setup check`).
- The SDK panel exposes TypeScript, Python, Go, and .NET tabs; the TypeScript
  default shows the install command and a minimal wrapper example.
- Advanced key scope, observed connection details, optional identity, privacy,
  data controls, and alternate connection methods are collapsed rather than
  competing with the activation path.
- The page recommends `npx @trackmcp/cli init` before a manual package-manager
  install and explains the required sequence: create a key, set
  `TRACKMCP_KEY`, restart the server, make one real tool call, then refresh.

The browser request returned HTTP 200. The setup read-model calls returned
HTTP 503 because the preview intentionally used placeholder Supabase values;
this confirms the page's safe no-connection rendering, not production setup
success. No source code or production data was changed during this inspection.

## Palette revision preview after `af45a856`

The dashboard palette was revised locally after review of the current rendered
Example-data Overview. The previous implementation mixed a dashboard indigo
override with legacy green setup accents and indigo-tinted shadows. The new
dashboard tokens use warm neutral surfaces and deep teal for primary actions;
green is reserved for confirmed success states, while amber/red/blue remain
semantic warning, failure, and information colors.

The preview rendered the Example-data Overview successfully with the revised
tokens and retained the same business hierarchy, copy, navigation, KPI values,
and evidence boundaries. No analytics or API behavior changed. This is a local
visual verification only; production has not been changed.

## Blue analytics palette revision after `53e77497`

The first teal revision was rejected in review as too distinctive for a
business analytics product. The dashboard now uses a restrained blue primary
(`--color-brand: #2563eb`) on cool-neutral surfaces (`#f8fafc`, white cards,
slate text, and slate borders). This follows a familiar SaaS convention:
blue is reserved for navigation, focus, and action; success, warning, and
failure remain semantic states rather than competing with the primary action
color. Dashboard shadows and chart fills use the same blue family, with no
gradient added and no data or metric formulas changed.

The revised palette passed the business-user contract suite, TypeScript, and
the production build in the isolated worktree. It is not deployed.

## Rendered blue palette and workspace handoff after `ccac8e58`

The local development-only dashboard bypass was opened at
`/dashboard?view=overview&data=example` on port `3198` with deliberately
non-production Supabase placeholders. The rendered page visibly showed:

- a white shell with a slate-neutral canvas and clear blue primary actions;
- the blue selected navigation state, date-range controls, and Example-data
  toggle without gradients or success-green overload;
- the business-first Overview hierarchy: source state, at-a-glance meaning,
  recommended next step, interpretation guidance, KPIs, and evidence detail;
- a single global language control and an explicit `Connect your MCP` path.

The route returned HTTP 200 and the accessibility tree exposed the expected
business labels. This is local Example-data evidence only; no authenticated
production session or live read model was used.

## Consolidated release gate after `18f4a398`

`npm run test:release-gate` passed all 159 suites after the blue palette and
workspace-loading changes. The gate includes the business-user contracts,
dashboard and setup routes, package-consumer checks, tenant isolation,
privacy/safety checks, production-smoke contracts, and the bounded MCP
protocol/SDK suites. The synthetic customer fixture rewrote only its tracked
timestamp during the gate; that generated timestamp was restored so the
fixture remains unchanged. This is source-level release evidence, not proof
of a real authenticated production session or live read-model completeness.

## Signed-up user entry inspection after `80596208`

The local `/signup` route was opened in a fresh browser session with the same
non-production placeholders. The accessibility tree showed:

- a clear `Create your TrackMCP account` heading;
- a concise expectation that a technical teammate connects one server and the
  business team then reads usage, outcomes, and issues;
- Google/GitHub discovery kept in a stable loading footprint while provider
  availability is resolved;
- the email form with first name, last name, email, password, and confirmation;
- a single `Create account` action and an explicit sign-in escape hatch;
- terms and privacy links before account creation.

The route returned HTTP 200. This verifies the local entry experience and
accessible content structure, but it does not verify provider configuration,
email delivery, or a real Supabase account creation.

## Final palette verification after `10d00500`

- `npm run test:business-user-ux`: 87/87 passed.
- `npm run build`: passed; 230 static pages generated.
- `git diff --check`: passed.

## Measured versus unavailable resource/prompt share tracks

The resource/prompt distribution bars now use a visible neutral background
track for measured shares and a quieter line track when the share is
unavailable. The green fill is still rendered only when the read model provides
an actual share. This keeps a measured zero, a measured non-zero share, and
missing evidence visually distinct without changing any metric values.

Verification after this slice:

- `npm run test:business-user-ux`: 104/104 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed; 230 static pages generated.
- `git diff --check`: passed.
- No production deployment or authenticated production data write was
  performed.

## Fresh no-workspace Setup browser pass after `a51293e3`

Local route exercised:

`http://127.0.0.1:3140/dashboard?view=setup&data=my`

The route rendered in the local development server with the development-only
dashboard bypass and placeholder Supabase values. The accessibility tree
confirmed the intended first-session sequence:

1. The source state is explicitly `Your workspace`.
2. The page explains the post-setup value before technical controls: who is
   showing up, what they are trying, whether work completed, and what needs
   attention.
3. The three setup steps are visible in order: create a connection key, install
   the SDK, and send one event.
4. With no workspace key, the connection state says `Create a connection key
   to begin`, keeps refresh disabled, and exposes technical checks only under
   `Setup evidence`.
5. The TypeScript setup path is visible by default, with Python, Go, and .NET
   available as semantic tabs. The CLI recommendation and manual fallback are
   both explicit.
6. Advanced key scope, observed connection details, optional identity, data
   privacy, export/deletion, and alternate connection methods remain collapsed
   below the primary path.

This verifies the local first-time information hierarchy and keyboard-readable
labels. It does not prove authenticated workspace creation, key persistence, or
first-event ingestion against production; those remain Tier 3 gates.

The consolidated `npm run test:release-gate` was rerun after the People
projection change and passed all 159 suites. The generated synthetic UAT
fixture timestamp was restored to its tracked value before this evidence was
recorded.

## Resource and prompt read-projection boundary

The Resources & prompts surface now distinguishes a durable entity-read
projection that is unavailable from a projection that is available but has no
rows. The former renders `N/A` for read outcome counts and explains that the
projection is unavailable; the latter continues to render zero. Method-level
observations remain separate and unchanged.

Verification:

- `npm run test:business-user-ux`: 101/101 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `git diff --check`: passed.

The consolidated `npm run test:release-gate` was rerun after this slice and
passed all 159 suites. The generated synthetic fixture timestamp was restored
to its tracked value before the evidence update was recorded.
- The isolated worktree is clean.

The final cleanup removed the last indigo-tinted dashboard shadows so the
dashboard no longer mixes the previous indigo accent with the new teal action
system. This remains local branch evidence; no merge or deployment was made.

## Metric language pass after `93372622`

The first-scan KPI labels were tightened for business readers without changing
their formulas or source fields:

- `Feature activity` and `Feature activity, previous period` replace the more
  technical `feature uses` wording.
- `Features used per account group` states what the breadth metric represents.
- `Information lookups` replaces the protocol-specific `resource lookups` label.
- `Guided-help completed` makes the prompt completion percentage readable while
  retaining the explicit-outcome caveat in the helper copy.
- `Work waiting for an answer` replaces `work waiting for information`.
- `Strong evidence` replaces `High confidence` for issue signals so users do
  not read evidence strength as statistical certainty.

Contract tests and TypeScript passed after the copy-only metric revision. The
underlying read models, calculations, and privacy boundaries were not changed.

## Warm-neutral and lighter green palette revision after `250cfd5f`

The previous cool-neutral and saturated-blue dashboard palette was replaced
with a warm-neutral canvas and lighter green action color. Lighter green is
used for approachable accents, with darker green reserved for active controls;
the neutral surfaces preserve contrast for tables and analytics cards. This is
a visual-system change only: data, formulas, routes, and backend contracts are
unchanged.

The chart fills, focus ring, loading handoff, and dashboard shadows were
updated to the same token family. The branch remains local and not deployed.

## Rendered lighter-green dashboard check after `e3ef7bed`

The local development dashboard was opened at
`/dashboard?view=overview&data=example` with the development-only bypass and
deliberately non-production Supabase placeholders. The accessibility tree
confirmed the business-first navigation, Example-data disclosure, overview
takeaway, recommended next step, outcome caveat, and evidence actions after
the green palette revision. The production build and focused business-user
suite passed after the check. This remains local preview evidence only.

## Current branch verification after `3a925b16`

- `npm run test:business-user-ux`: 87/87 passed.
- `npm run test:metric-contract`: 4/4 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed; 230 static pages generated.
- `git diff --check`: passed.
- `npm run test:release-gate`: passed all 159 suites.

The completion KPI now reads `Reported completion` in the Overview, metric
registry, contracts, and metric documentation. This is a label/helper-copy
change only; the explicit-outcome formula, read models, and evidence boundary
are unchanged. The synthetic UAT runner refreshed its timestamp during the
gate and the tracked fixture was restored afterward. No production deployment
or authenticated real-account smoke was performed.

## Overview period comparison in the current branch

- `npm run test:business-user-ux`: 88/88 passed.
- `npm run test:metric-contract`: 4/4 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed; 230 static pages generated.

The Overview now includes a compact `Compared with the previous period` block
when the analytics read model returns same-length comparison fields. It uses
`capability_activity.previous_period_calls` for observed work and
`who_is_using_it.previous_period_active_accounts` for active account groups.
If a previous window is absent, the UI says `Not available`; if the baseline is
zero, it says `No comparable baseline` rather than inventing a percentage.
No backend formula or read-model field was changed.

## Muted green dashboard palette after the current review

The dashboard-only accent was softened after review of the rendered interface.
The previous saturated green tokens were replaced with a muted green system:

- `--color-brand: #2f7d5b` for links, bars, and focus accents.
- `--color-brand-strong: #256b4b` for active navigation and primary controls.
- `--color-brand-soft: #e8f3ec` for low-emphasis state surfaces.
- `--color-mint: #eef4f0` and `--color-mint-ink: #285e43` for secondary green
  surfaces.

The values preserve the product meaning of green for actions and healthy
signals, but reduce saturation so the analytical workspace does not read as a
page of success alerts. Warning, error, and information colors remain separate.
The public-site tokens and dashboard data/read models were not changed.

Local visual evidence: the Example Overview at
`/dashboard?view=overview&data=example` rendered the business-first navigation,
period comparison, source-state banner, and overview panels with the muted
palette. Verification after the change:

- `npm run test:business-user-ux`: 88/88 passed.
- `npm run test:metric-contract`: 4/4 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed; 230 static pages generated.
- `git diff --check`: passed.

This is local branch evidence only; no production deployment was performed.

## People no-data recovery path in the current branch

The `Who's using it` view now keeps a missing live read model honest and
actionable. In My-data mode it says `Account activity will appear after
connection`, explains that verified account-group activity is required, and
links directly to Setup. It does not substitute Example data or imply that a
missing account signal means zero customers. Blank or unrecognized assistant
metadata is rendered as `Unrecognized assistant` rather than an empty label.

The contract suite covers the copy, Setup route, and unknown-category label;
the implementation does not change analytics formulas, identity handling, or
privacy boundaries.

## Capabilities no-data recovery path in the current branch

The `What they’re doing` view now has an explicit My-data empty state when the
capability read model is absent. It explains that feature activity will appear
after connection, names the business questions the view will answer (feature
use, breadth of adoption, and reliability friction), and links directly to
Setup. This prevents a blank inventory or zero-looking surface from being read
as “nobody is using the server.” Example and live data remain separate.

## Resources and prompts no-data recovery path in the current branch

The `Resources & prompts` view now gives the same explicit guidance when both
its interaction and surface read models are absent. It explains that the page
will show information requests, guided-help interactions, and their observed
outcomes after connection, with a direct Setup action in My-data mode. The
existing `N/A` values remain truthful, and no example or inferred activity is
introduced.

## Journey no-data recovery path in the current branch

The `The journey` view now explains its live-data prerequisite when linked work
steps are absent. It tells a My-data reader that common paths, explicit stops,
pauses, and observed retries will appear after connection, links to Setup, and
explicitly avoids creating a funnel from missing events. Example and live data
remain separate.

## Outcome no-data guidance in the current branch

The shared `Did it work` outcome panel now explains why a blank completion
surface is not a success or failure: completion requires an explicit workflow
start and final state from the server. When neither exists, the panel tells the
reader that outcome evidence will appear after connection and keeps tool
activity separate from business outcomes. No formula or read-model field was
changed.

## Issues empty-state interpretation in the current branch

An empty confirmed-incident response now reads `No confirmed incidents in this
period` and explicitly says that this is not proof that everything is healthy.
The copy directs a business reader to Overview and Evidence for broader context,
so an empty alert list is not mistaken for a complete health assessment.

## Data-source scope labels after `1fbc3286`

The local development dashboard was opened at
`http://127.0.0.1:3198/dashboard?view=overview&data=my` with the documented
non-production Supabase placeholders and local dashboard bypass. The browser
accessibility tree exposed the header label `Data source` and the selected
scope `Your workspace`. Switching the same control to
`/dashboard?view=overview&data=example` exposed `Illustration only`, while the
page also retained its `Example data selected` banner and illustrative-data
boundary. This confirms that the scope label changes with the selected mode
without substituting data or changing the read model.

Current verification for this slice:

- `npm run test:business-user-ux`: 97/97 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed; 230 static pages generated.
- `npm run test:release-gate`: passed all 159 suites.
- No production deployment, authenticated production session, or database
  write was performed.

## Fresh browser verification after `98054f78`

The isolated branch was served at
`http://127.0.0.1:3198/dashboard?view=overview&data=example` with the
development-only dashboard bypass and placeholder Supabase values. The
rendered accessibility tree confirmed:

- `Data source` with `Illustration only` and the example-data boundary.
- The business-first Overview order: at-a-glance, recommended next step,
  KPIs, period comparison, evidence detail, activity, attention, sessions,
  and outcomes.
- The `Needs attention` KPI helper reads `Observed patterns worth a closer
  look`; the panel explains that observed patterns and confirmed incidents are
  separate.
- The sample outcome surface shows reported completion and keeps the
  evidence rule visible without exposing internal identifiers.

The server returned HTTP 200 for the rendered dashboard route and was stopped
cleanly after the read-only check. No production browser tab, account, key,
workspace, or database state was touched.

## Quality no-data boundary in the current branch

The `Did it work` view now keeps its selected data source visible even when the
quality response is unavailable. My-data mode explains that explicit outcomes
and feature reliability appear after the server connects; Example mode explains
that the illustrative response needs to be retried. The loading state does not
present a missing response as healthy or unhealthy, and no metric or formula
changed. Its fallback description also names the selected source explicitly, so
an Example-data failure cannot be mislabeled as a My-data failure.

Verification:

- `npm run test:business-user-ux`: 98/98 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed; 230 static pages generated.
- `git diff --check`: passed.

## First-session sign-in and signup handoff in the current branch

The unauthenticated dashboard route now explains both entry paths in one
sentence: returning users can sign in, while new users can create an account.
The page exposes separate `Sign in to continue` and `Create an account`
actions, so a new visitor does not have to infer that `/dashboard` is also a
signup entry point. The existing bounded auth hydration, workspace creation,
and setup handoff behavior is unchanged.

Verification:

- `node --test src/app/dashboard/page.contract.test.mjs`: 8/8 passed.
- `npm run test:business-user-ux`: 98/98 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed; 230 static pages generated.

## Production Setup comparison (read-only)

The currently deployed production tab was inspected without changing state at
`https://trackmcp.com/dashboard?view=setup&data=example`. It still presents
the older `Founder OS` pilot notice and exposes a long active-key history in
the primary Setup scan, alongside technical scope and identity controls. This
confirms that the branch's Setup-density improvements are not live yet. No
key, workspace, identity setting, or other production state was changed.

## Outcome and attention interpretation after `98054f78`

The Overview KPI now describes non-empty attention output as `Observed
patterns worth a closer look` instead of exposing a missing confidence value
in the primary scan. The attention panel and Issues panel explicitly separate
observed patterns from confirmed incidents. The `Did the work complete?`
surface now leads with the business states a reader can interpret; the
completion methodology and evidence source remain available under the
collapsed `How completion is calculated` disclosure. No formula, read-model
field, or evidence classification changed.

Verification after this slice:

- `npm run test:business-user-ux`: 97/97 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed; 230 static pages generated.
- `git diff --check`: passed.
- No production deployment, authenticated production session, or database
  write was performed.

## Lighter green dashboard palette after `b48c8165`

The dashboard-only visual tokens now use a lighter green accent while keeping
the stronger green available for readable text and active controls:

- `--color-brand: #4aa879`
- `--color-brand-strong: #347d5b`
- `--color-brand-soft: #eff9f3`
- `--color-mint: #f5fbf7`
- `--color-mint-ink: #327354`

Only `trackmcp-nextjs/src/app/globals.css` changed for this slice. Public
brand tokens, layout, copy, metrics, formulas, and behavior were not changed.

## Emerald dashboard palette after the follow-up color review

The muted eucalyptus primary was replaced with a familiar emerald system after
review feedback that the lighter green did not read like a conventional SaaS
analytics product. The dashboard now uses `#15803d` for primary actions,
`#166534` for stronger text and active controls, and `#f0fdf4`/`#ecfdf5` only
for pale surfaces. Layout, copy, metrics, formulas, and behavior are
unchanged. The color remains dashboard-scoped; public brand surfaces are not
changed. This is local branch evidence until deployment.

Verification after this slice:

- `npm run test:business-user-ux`: 98/98 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed; 230 static pages generated.
- `git diff --check`: passed.
- No production deployment or authenticated production data write was
  performed.

## Workspace setup retry recovery after the current branch change

The dashboard error banner now selects its retry operation from the current
setup state. Before a workspace exists, it invokes workspace creation and is
labelled `Retry workspace setup`; after a workspace exists, it keeps the
existing `Retry dashboard data` behavior. This prevents a failed first-login
workspace provision from sending the user into an analytics refresh that
cannot resolve the missing workspace.

Verification after this slice:

- Dashboard, workspace-route, and dashboard-page contract tests: 107/107
  passed together.
- `npm run test:business-user-ux`: 100/100 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed; 230 static pages generated.
- No production deployment, authenticated production session, or database
  write was performed.

## Dashboard header control grouping after the current branch change

The header's data-source and language controls now use a non-wrapping,
shrink-protected group at desktop widths. This keeps `Example data`, `My data`,
and the language selector visually separate instead of allowing the language
button to wrap over the data-source toggle. The controls' actions, labels, and
data-mode behavior are unchanged.

Verification:

- `npm run test:business-user-ux`: 100/100 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `git diff --check`: passed.

A fresh local browser pass at
`http://127.0.0.1:3200/dashboard?view=overview&data=example` returned HTTP 200
with the development-only dashboard bypass. The accessibility tree showed
`Data source`, `Illustration only`, and the language selector as separate
controls, followed by the business-first Overview order (`At a glance`,
`Recommended next step`, KPIs, comparison, evidence, activity, attention,
sessions, and outcomes). The local server was stopped cleanly; no production
session or database state was touched.

The consolidated `npm run test:release-gate` was rerun after the header-control
fix and passed all 159 suites. The release gate changed only the generated
timestamp in the synthetic UAT fixture during execution; that timestamp was
restored to its tracked value before this evidence update was recorded.

## People read-model uncertainty preservation

The `/api/v2/people` projection previously bounded missing or `null`
`new_accounts` and `returning_accounts` through the non-null integer helper,
which could turn insufficient history into `0`. The projection now uses a
nullable bounded integer helper for those fields. The existing UI contract can
continue to render `N/A` and the `insufficient_data` classification without
changing the source analytics formulas.

Verification:

- People route contract and integration tests: 3/3 passed, including explicit
  `null` preservation.
- `npm run test:business-user-ux`: 100/100 passed.
- `npx tsc --noEmit --pretty false`: passed.
- `git diff --check`: passed.
