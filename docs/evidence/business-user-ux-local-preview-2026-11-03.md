# Business-user UX local preview evidence

Date: 2026-11-03
Branch: `codex/business-user-ux-audit`
Commit under review: `d30cf7da`

This is local browser evidence only. It is not production evidence and does
not replace a fresh-account or real-telemetry walkthrough.

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

The underlying evidence contracts and technical disclosures were not removed.
This is a copy and comprehension change, not a metric or read-model change.
