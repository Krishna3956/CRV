# Founder OS business-user UX work queue

Legend: `[x]` verified/implemented in this workstream; `[ ]` pending.

## This pass — comprehension foundation

- [x] ✅ Add business-question orientation to the Overview page.
- [x] ✅ Add a clear “what happens after setup” panel.
- [x] ✅ Clarify the signup handoff so a new account knows that a technical
      teammate connects one server and the dashboard then explains usage,
      outcomes, and issues.
- [x] ✅ Translate setup readiness states into business language while preserving
      technical evidence.
- [x] ✅ Add plain-English meaning/help for the four Overview KPIs.
- [x] ✅ Add a business question and evidence caveat to each top-level page.
- [x] ✅ Translate the highest-visibility journey, capability, resource, and
      reliability labels without changing their formulas.
- [x] ✅ Keep issue evidence and internal rule identifiers behind an explicit
      detail disclosure so business readers see the signal and next step first.
- [x] ✅ Translate the setup readiness checklist into business-language states;
      preserve the technical evidence contract underneath.
- [x] ✅ Keep Example data visibly illustrative and separate from My data.
- [x] ✅ Add contract tests for the orientation and setup copy.
- [x] ✅ Add plain-language account-activity guidance, assistant naming caveats,
      and privacy-safe signal wording to “Who’s using it”.
- [x] ✅ Add an adoption-first reading order and technical-detail boundary to
      “What they’re doing”.
- [x] ✅ Add plain-language interpretation for resource lookups, guided-help
      requests, and explicit outcomes in “Resources & prompts”.
- [x] ✅ Add a business reading guide to “Did it work” that separates explicit
      success from reliability friction and unknown evidence.
- [x] ✅ Add an action-oriented reading guide to “What’s broken” so business
      users know how to prioritize signals without treating them as diagnoses.
- [x] ✅ Add a journey reading guide that distinguishes observed paths from
      explicit stop evidence and avoids abandonment inference.
- [x] ✅ Make the post-signup dashboard loading state explain workspace
      preparation instead of showing a generic loading message.
- [x] ✅ Add an Evidence-view guide that makes technical drill-down and privacy
      boundaries clear to business readers.
- [x] ✅ Keep the internal Founder OS project name out of customer-facing
      dashboard labels; use TrackMCP language in the shell and desktop-only
      support notice.
- [x] ✅ Keep the internal Founder OS project name out of the public API
      documentation; technical readers see TrackMCP analytics terminology.
- [x] ✅ Add a requirement-by-requirement readiness matrix that separates
      branch proof, live read-only evidence, and remaining pilot gates.
- [x] ✅ Make the no-workspace “Complete setup” action navigate to Setup while
      workspace provisioning runs, so a first-time user reaches the key and
      SDK instructions instead of remaining on an empty analytics tab.
- [x] ✅ Make the Setup step rail reflect the real first action for each state:
      workspace creation, key creation, or reuse of an active key.
- [x] ✅ Rewrite no-data page previews with business language so a first-time
      reader understands what each tab will show before connecting telemetry.
- [x] ✅ Research PostHog, Amplitude, GA4, USWDS, Material, NN/g, and
      Microsoft product-writing guidance; record the source-to-change decisions
      in `FOUNDER-OS-BUSINESS-USER-UX-RESEARCH.md`.
- [x] ✅ Add table alternatives for the Overview activity chart and account
      growth chart so business users can read exact values without relying on
      hover interactions.
- [x] ✅ Add a table alternative for the capability trend chart so feature
      comparisons remain readable without visual or hover-only interpretation.
- [x] ✅ Add a table alternative for explicit outcome trends so business users
      can compare completed, failed, pending, and unknown states by period.
- [x] ✅ Add a table alternative for resource and prompt trends so information
      needs can be compared without relying on card-only visual scanning.
- [x] ✅ Add a table alternative for journey reach so observed step coverage
      can be compared without relying on progress-bar interpretation.
- [x] ✅ Move dense protocol-family and lifecycle detail behind an explicit
      “Technical protocol evidence” disclosure on the capability view.
- [x] ✅ Put the repeated capability inventory and catalog detail behind a
      second progressive-disclosure boundary so the business summary remains
      the default reading path.
- [x] ✅ Put repeated resource/prompt entity and transport detail behind a
      progressive-disclosure boundary so information-need and outcome KPIs
      remain the default reading path.
- [x] ✅ Clarify capability KPI labels so comparison values, error rates, and
      privacy-safe account-group scope are explicit to business readers.
- [x] ✅ Align the canonical metric registry and Founder OS metric contract
      with the dashboard's privacy-safe “account group” vocabulary.
- [x] ✅ Perform a read-only browser review of the current production Setup,
      Overview, Example data, and My data states; record live-vs-branch
      differences in the audit.
- [x] ✅ Run a local browser preview of the branch with Example data and Setup;
      verify the business-first navigation, visible period context, accessible
      chart tables, state-aware setup rail, and progressive technical detail.
- [x] ✅ Run a settled-route browser pass across every business-facing tab;
      verify that direct Example-data links load their own business question,
      evidence boundary, and data-source marker. Setup remains a live
      connection workflow even when the global Example-data toggle is selected.
- [x] ✅ Polish the KPI scan surface with restrained brand hierarchy and
      tabular numerals; keep the change semantic-neutral and evidence-safe.
- [x] ✅ Add a bounded Overview “At a glance” takeaway so a business reader
      gets the plain-language meaning of the selected window before reading
      KPI cards or charts; reuse read-model fields and state the evidence limit.
- [x] ✅ Run a final business-language pass on the primary dashboard path:
      replace avoidable engineering terms such as telemetry, resolver signal,
      and account signal with activity, account group, and plain-English
      evidence wording while keeping technical detail available in disclosures.
- [x] ✅ Apply the same interaction affordance contract to the first-time
      authentication path: primary sign-in/sign-up and social-provider controls
      expose a pointer cursor, visible keyboard focus, and an explicit disabled
      state so the first setup step does not look inert.
- [x] ✅ Keep the unauthenticated `/dashboard` handoff usable for both sides of
      the first journey: returning users can sign in and new users can create
      an account without guessing which entry point to choose.
- [x] ✅ Simplify Setup status states so a business reader sees “recent server
      activity”, “partial view”, and “account grouping unavailable” before
      technical evidence terminology.
- [x] ✅ Make Overview session rows business-readable: show a simple observed
      session label, call the drill-down “Open evidence”, and explain that
      reported completion—not session activity alone—is counted as success.
- [x] ✅ Add a state-aware “Recommended next step” on Overview so a new user,
      an activated user with missing outcomes, and an activated user with
      evidence-backed signals each get a truthful next action.
- [x] ✅ Keep optional key scoping out of the primary setup instruction; users
      are told to create a connection key first and can configure scopes later.
- [x] ✅ Keep active key scope behind an optional technical-details disclosure;
      automatically open it when the latest event does not match the scope so
      the business reader sees the recovery path without a persistent setup
      block.
- [x] ✅ Keep the language selector in the global header only; remove the
      duplicate sidebar control so the desktop navigation has one predictable
      location for global settings.
- [x] ✅ Give live-data load failures a safe fallback: keep `Retry` primary,
      but offer `See Example data` so a business reader can continue learning
      without substituting sample values into live data.
- [x] ✅ Keep the `Did it work` no-data/error state tied to its selected data
      source, with a plain-language explanation of what appears after a server
      connects and why a loading failure is not a health result.
- [x] ✅ Replace the blank first-load screen with a branded workspace-preparation
      state that explains account, workspace, and dashboard loading in three
      short steps.
- [x] ✅ Apply a dashboard-only visual system: warm-neutral surfaces, a
      clear emerald primary action color, semantic status text, and no
      gradients in dashboard surfaces.
- [x] ✅ Add a repo-scoped `trackmcp-business-copy` skill with customer-facing
      vocabulary, evidence-boundary rules, recovery-copy rules, and a focused
      review checklist so future copy changes do not drift back toward
      technical or over-verbose language.
- [x] ✅ Tune the dashboard type scale for business scanning: larger page and
      metric values, clearer section titles, and readable labels while keeping
      code and dense table detail compact.
- [x] ✅ Prevent deep-linked dashboard routes from briefly rendering the wrong
      data source while the URL state hydrates; show a neutral loading handoff
      and gate live-data fetches until the selected route is known.
- [x] ✅ Give an activated Setup user a direct `Open Overview` handoff after
      first activity is verified, so the setup page explains the next business
      action instead of making the reader infer where to go.
- [x] ✅ Keep observed server, environment, and deployment linkage details
      available without competing with the three-step setup path: move them
      into a collapsed `Observed connection details` disclosure and explain
      that they are bounded labels, not a deployment inventory or health check.
- [x] ✅ Keep the detailed readiness checklist out of the first setup scan:
      expose the connection status and recovery action first, then place the
      individual evidence checks and percentage behind a collapsed `Setup
      evidence` disclosure.
- [x] ✅ Translate the visible Overview data-trust labels from engineering
      vocabulary to business language (`Activity observed`, `Activity
      recency`, `Account-grouped activity`, and `Dashboard refresh`) while
      retaining the underlying evidence caveats and bounded worker metrics.
- [x] ✅ Move the Resources & prompts technical evidence boundary out of the
      default KPI scan and into the expanded detail section; keep the privacy
      and non-completion limits discoverable for engineering readers.
- [x] ✅ Keep the Overview's decision KPIs and Founder OS outcome summary
      above the expandable evidence/protocol block so a business reader sees
      the decision surface before implementation detail.
- [x] ✅ Keep the journey's opaque async-task table behind a collapsed
      `Technical task evidence` disclosure; the default journey path remains
      common paths, stop evidence, pauses, and explicit outcomes.
- [x] ✅ Keep the setup journey's credential name consistent: customer-facing
      setup copy now uses `connection key` in the error path and setup handoff;
      internal API field names remain unchanged.
- [x] ✅ Apply the same business-readable evidence language inside the Evidence
      tab: remove the engineering-only “Trace Explorer” action label, hide raw
      session identifiers from the primary table, and expose a clear “Open
      evidence” action.
- [x] ✅ Normalize evidence action capitalization across dashboard surfaces so
      the same action is always written as `Open evidence`.
- [x] ✅ Remove the last title-case `Open Evidence` labels from secondary
      journey, quality, issue, and evidence actions so business users encounter
      one consistent drill-down phrase throughout the dashboard.
- [x] ✅ Replace the remaining “semantic facts” subtitle on Outcome evidence
      with a direct explanation of what the dashboard counts and what it does
      not infer.
- [x] ✅ Replace internal-sounding Quality helper labels such as “semantic
      evidence” and “explicit workflow terminals” with business-readable
      explanations that say the values come from server-reported starts,
      failures, and final states.
- [x] ✅ Make the Setup step rail state-aware: new workspaces highlight the
      workspace/key step, keyed workspaces without activity highlight sending
      the first event, and connected workspaces stop showing a misleading
      always-active first step.
- [x] ✅ Align the capability metric vocabulary with the business question:
      `Feature uses observed`, `Feature uses in previous period`, and
      `Average features per account group` now describe the same existing
      formulas without changing their data source or denominator.
- [x] ✅ Make the People cards explicit about their evidence boundary:
      `New this period` now says it is first observed activity, not signup,
      and `Returning this period` now says it is repeat activity, not a
      retention claim.
- [x] ✅ Keep OAuth provider loading placeholders visually non-actionable until
      provider discovery completes; the hand cursor is reserved for real
      controls.
- [x] ✅ Run dashboard contracts, typecheck, lint, and production build.
- [x] ✅ Run the consolidated release gate; all 159 suites pass after fixing
      clean-checkout MCP SDK resolution and Python artifact preparation.
- [x] ✅ Give every visible sign-in/sign-up and recovery control a consistent
      pointer affordance, disabled cursor state, and keyboard focus ring so a
      first-time user can tell what is actionable before authentication.
- [x] ✅ Keep the illustrative “Who's using it” growth chart coherent with its
      KPI cards; the example now renders a weekly series ending at the stated
      active-account total instead of showing a contradictory empty chart.
- [x] ✅ Run a built local runtime smoke with the documented dashboard bypass:
      `/signin`, `/signup`, the Example-data Overview and Setup routes, `/docs`,
      and `/sitemap.xml` returned HTTP 200; this remains local evidence, not
      authenticated production evidence.
- [x] ✅ Sweep every current business dashboard view in the rebuilt standalone
      server with Example data; Overview, Who’s using it, What they’re doing,
      Resources & prompts, The journey, Did it work, What’s broken, Evidence,
      and Setup all returned HTTP 200 with TrackMCP content.
- [x] ✅ Run a fresh local development runtime smoke with the explicit,
      development-only dashboard bypass. The current branch rendered the
      My-data no-event state and the Example-data Overview in a browser; the
      public routes and fail-closed sitemap behavior were also verified.
- [x] ✅ Make the data-source switch self-explanatory for business readers:
      the header now labels the control `Data source` and clarifies whether
      the selected view is `Your workspace` or `Illustration only` without
      changing the underlying data mode or read-model behavior.
- [x] ✅ Make workspace-creation failures recoverable from the visible error
      banner: when no workspace exists, `Retry workspace setup` retries the
      create flow instead of refreshing analytics; established workspaces keep
      the separate `Retry dashboard data` action.
- [x] ✅ Keep the desktop dashboard header's data-source and language controls
      together at intermediate widths so the language button cannot wrap over
      the Example-data control.
- [x] ✅ Preserve unavailable People classification counts as `N/A`: the
      versioned read-model projection keeps `new_accounts` and
      `returning_accounts` as `null` when the bounded history scan is
      incomplete instead of converting uncertainty into zero.
- [x] ✅ Preserve unavailable durable resource/prompt read evidence as `N/A`:
      the Resources & prompts surface no longer renders zero successful/failed
      reads when the entity-read schema is unavailable; genuine `no_rows`
      evidence remains zero.
- [x] ✅ Preserve unavailable resource/prompt outcome rates as `N/A`:
      prompt and per-entity stall, error, and unknown rates no longer fall
      back to `0%` when the read model does not provide those measures.
- [x] ✅ Keep unavailable capability breadth visually neutral: when the read
      model cannot calculate breadth, the dashboard shows `N/A` with a neutral
      track instead of an empty green bar that looks like measured zero.
- [x] ✅ Keep journey reach, assistant distribution, and resource/prompt share
      bars neutral when their shares are unavailable; no green fill is shown
      unless the underlying read model provides a measured share.
- [x] ✅ Keep long connection-key histories out of the primary Setup scan:
      show the first three active keys by default, retain explicit access to
      the full active list, and keep revoked keys behind their existing
      disclosure without changing key lifecycle behavior.
- [x] ✅ Align the Setup body and DOM/accessibility order with the stated
      three-step sequence: the workspace/connection-key action appears before
      the SDK/server code, so keyboard and assistive-technology users are not
      asked to configure a server before creating the key it needs.
- [x] ✅ Put the current Setup action in the connection-status card: a new
      account can create its workspace immediately, and a keyed workspace can
      jump to the connection-key action without searching the page.
- [x] ✅ Put business interpretation before implementation detail on the
      Overview attention and outcome surfaces: signal cards lead with an
      observed-pattern explanation, while completion methodology and evidence
      source remain available behind an explicit disclosure.
- [ ] Run an authenticated runtime smoke against a real Supabase session and
      real read-model responses; the local bypass is not evidence of production
      authentication or database-backed analytics.

## Slice-by-slice follow-up

- [ ] Who’s using it: active accounts, new vs returning, growth, client
      breakdown, unknown category, and top accounts backed by the read model.
- [x] ✅ People no-data state now explains the verified account-group
      prerequisite and links a My-data reader directly to Setup; blank or
      unrecognized assistant metadata is shown as `Unrecognized assistant`
      instead of an empty label. The full read-model/runtime slice remains
      pending until authenticated evidence is available.
- [x] ✅ Overview: add period-over-period comparison from the read model's
      same-length windows; the UI shows `Not available` or `No comparable
      baseline` instead of inferring a comparison.
- [ ] What they’re doing: adoption breadth, top capabilities, trends, and
      capability detail with business labels.
- [x] ✅ What-they’re-doing scan now leads with the human-readable capability
      description and keeps the machine-facing tool identifier as secondary
      context; capability detail remains available on demand. Week labels in
      the adoption chart are also formatted for business readers.
- [x] ✅ What-they’re-doing no-data state now explains that feature activity
      appears after connection and links directly to Setup; it does not imply
      zero adoption when the read model is absent. Full adoption/read-model
      completeness remains pending authenticated verification.
- [ ] Resources & prompts: top resources, top prompts, completion/stall, and
      privacy-safe detail drill-down.
- [x] ✅ Resources & prompts now explain what will populate after connection
      when the live read model is absent, with a direct Setup action and no
      inferred activity. Full top-resource/prompt read-model coverage remains
      pending authenticated verification.
- [ ] The journey: common paths, explicit stop evidence, stall/retry, and a
      clear statement that missing events are not abandonment.
- [x] ✅ The journey view now explains what will populate after connection when
      linked work-step evidence is absent, with a direct Setup action and no
      inferred funnel. Full path/stop/retry read-model coverage remains
      pending authenticated verification.
- [ ] Did it work: outcome rates, error rates, retries, latency, and
      insufficient-data states with consistent definitions.
- [x] ✅ Did-it-work now explains the explicit workflow evidence prerequisite
      when no starts or outcomes exist; it does not turn tool activity or
      missing events into assumed success. Full reliability/outcome read-model
      coverage remains pending authenticated verification.
- [ ] What’s broken: affected volume, confidence, likely cause, recommended
      action, and evidence links for every actionable insight.
- [x] ✅ Empty Issues results now say that no confirmed incidents are not proof
      of overall health and point readers back to Overview/Evidence for context.
      Full actionability/read-model coverage remains pending authenticated
      verification.
- [ ] Setup: unify server, environment, scoped key, optional identity,
      privacy, and first-event verification into one guided story.

## Release gates

- [x] ✅ No formula or read-model changes without metric-contract review. The
      UX branch changes presentation, copy, and evidence tooling only; metric
      definitions remain in `docs/FOUNDER-OS-METRIC-CONTRACT.md` and the metric
      contract tests pass.
- [x] ✅ No business label that overstates self-reported identity. People and
      client copy remains bounded to observed assistant/account signals; this
      is covered by the business-user UX and read-model contract tests.
- [x] ✅ No “healthy” claim from missing data. Empty, unavailable, and
      insufficient-evidence states remain explicit; the business-user UX suite
      and full release gate pass this policy.
- [ ] No deployment until focused tests, production build, and authenticated
      read-only smoke checks pass.
- [ ] Browser review with a new account and an activated example/data account.
- [x] ✅ Browser review with the existing authenticated account and an
      activated Example data view (read-only); a new-account review remains
      pending.
- [ ] Run `FOUNDER-OS-BUSINESS-USER-UAT-SCRIPT.md` with at least one
      non-technical product/operations participant.

## Evidence log

- Baseline commit: `085ae29e07d2f69ed4db3b15986e417e0fe4c86f`.
- Current implementation: `trackmcp-nextjs/src/components/dashboard/DashboardApp.tsx`.
- Setup/account orchestration: `trackmcp-nextjs/src/app/dashboard/page.tsx`.
- Metric truth contract: `docs/FOUNDER-OS-METRIC-CONTRACT.md`.
- Setup truth contract: `docs/FOUNDER-OS-SETUP-UX-CONTRACT.md`.
- Product intent and tab definitions: `/Users/krishna/Downloads/Founder OS.pdf`.
