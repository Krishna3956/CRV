# PRD: TrackMCP Business-First Dashboard Redesign

**Status:** Draft for product and design review. No implementation is authorized by this document alone.

**Owner:** Product / Design / Engineering

**Scope:** Authenticated TrackMCP dashboard and its transition from marketing promise to product experience

**Primary platform:** Desktop browser on a laptop, especially 1280 x 800 and 1440 x 900

**Supersedes:** The interaction and information-architecture recommendations in `PRD-DASHBOARD-UX-AND-IA.md` where this document is more specific.

**Core decision:** TrackMCP should feel like product analytics for MCP-powered products, not like an internal protocol-debugging console.

---

## 1. Executive decision

The dashboard must be redesigned around the questions a business, product, or platform owner asks:

1. Who is using our MCP product?
2. What are they trying to do?
3. Are they getting useful work done?
4. Where does the experience break down?
5. What should we investigate or fix next?

The current dashboard contains much of the underlying capability, but its vocabulary and hierarchy are still developer-first. Labels such as `Sessions`, `Workflows`, `Trace Explorer`, `Tool Quality`, `Catalog`, `Intent & Gaps`, and `Outcomes` require the user to already understand TrackMCP’s internal model. The user should not need to bring a developer into the room to interpret the home screen.

The redesign is not a request to hide technical truth. It is a request to put the product meaning first and reveal technical evidence at the moment it becomes useful.

The correct product model is:

> TrackMCP helps teams understand how their MCP-powered product is being used, whether work gets done, where it breaks, and what to fix next.

The dashboard should express that model in plain language, with technical details available through deliberate secondary actions.

---

## 2. What was audited

### 2.1 Live product audit

On 7 September 2026, the authenticated dashboard was inspected in a real browser at laptop width. The following live views were inspected:

- Overview
- Sessions
- Workflows
- Trace Explorer
- Tool Quality
- Intent & Gaps
- Reliability
- Outcomes
- Configure
- live-data mode
- sample-data mode

The live workspace contained synthetic canary activity (`p1-05-canary-probe`). It showed 60 calls, 0 sessions, 0 errors, and no explicit workflow outcomes. This was useful for checking honesty of empty and insufficient states, but it is not representative customer behavior.

The dashboard correctly avoided inventing sessions and completion. Tool Quality correctly exposed minimum-volume and insufficient-data explanations. Sample mode was explicit and clearly marked. These are strengths to preserve.

### 2.2 Public website audit

The public site was inspected through:

- Homepage: `/`
- Features: `/features`
- Pricing: `/pricing`
- Docs: `/docs`
- Public navigation and footer destinations

The public website already communicates a stronger business promise than the dashboard:

- “See how your MCP is being used.”
- “See who uses your MCP server, what they are trying to do, whether the work gets done, and what to fix next.”
- “Get the answer, not another dashboard.”
- “TrackMCP tells you what the data means, and what to do about it.”

The dashboard does not yet deliver that promise in its first interaction. It presents the evidence vocabulary before the business answer.

Operational note: the apex `https://trackmcp.com` returned a Cloudflare 502 during one audit attempt, while `https://www.trackmcp.com` rendered successfully. This is separate from the dashboard redesign but should be tracked as a public-site reliability issue.

### 2.3 Product feedback audit

The existing product-gap analysis and Product Hunt feedback identify recurring needs:

- per-tool diagnosis, not just tool counts;
- understanding why agents retry or stop;
- distinguishing a successful HTTP response from useful work;
- arguments and results with safe privacy controls;
- proactive regression detection;
- a trustworthy workflow view;
- a product/business explanation rather than another developer-only dashboard.

The commercial wedge is MCP tool quality and workflow completion. The interface must make that understandable to a product owner while preserving evidence for an engineer.

---

## 3. User and positioning reset

### 3.1 Primary audience

#### Product owner / business stakeholder

They want to know whether their MCP capability is helping users and where investment is required. They do not necessarily know MCP protocol terms.

They should be able to understand the Overview without knowing:

- what a trace is;
- what a tool call is;
- what an MCP catalog is;
- what a correlation handle is;
- what intent provenance means;
- what a session heuristic is.

#### Platform or product operations owner

They want adoption, stability, issue prioritization, and evidence for a conversation with engineering.

#### Engineer / investigator

They need request-level evidence, timing, client metadata, redaction state, correlation details, payload visibility, and bounded event timelines.

The engineer is important, but the engineer is not the only person the product is for.

#### First-time evaluator

They need to understand the promise quickly, see a believable example, connect a server, and know what the dashboard will answer after the first event arrives.

### 3.2 Jobs to be done

The dashboard must support these jobs in order:

1. **Understand:** “What is happening with our MCP product?”
2. **Orient:** “Is the data live, complete, and trustworthy?”
3. **Prioritize:** “What is the most important issue right now?”
4. **Explain:** “What are people trying to do, and where do they stop?”
5. **Act:** “What should I ask my team to fix?”
6. **Prove:** “Show me the underlying evidence.”

The current product begins too close to job 6.

### 3.3 Promise boundary

TrackMCP can honestly explain observed server-boundary behavior, client metadata when available, explicit workflow outcomes, tool quality, latency, errors, retries when supplied, catalog changes, and bounded traces.

TrackMCP must not imply that it can see:

- private model reasoning;
- the full host conversation;
- the user’s true intent unless explicitly supplied;
- answer correctness without an explicit outcome;
- causality from an association;
- complete payloads when redaction or truncation applies;
- a real end-user identity when only a client name is known.

Business language must be simple, but it must not become dishonest.

---

## 4. Design principles

### 4.1 Answer first, evidence second

Every major screen starts with an answer or a decision-support statement. The underlying data and technical terminology appear below it or behind an explicit “See evidence” action.

### 4.2 One screen, one story

The Overview is not a sitemap of every metric. It is one story:

> How much is the MCP product being used, whether work is getting done, and what needs attention.

Deep analysis belongs on secondary pages.

### 4.3 Progressive disclosure

Show the small set of information that most users need first. Reveal specialized details when a user asks for them. Advanced options must have labels that accurately predict what they reveal.

This follows established usability guidance: progressive disclosure improves learnability and efficiency when the primary screen contains only the most important choices and secondary features have clear information scent.

### 4.4 Use the user’s words

Use “AI clients,” “people,” “tasks,” “work completed,” “issues,” “capabilities,” and “evidence” where those labels are accurate. Use “MCP tool,” “session,” “trace,” and “correlation” in secondary explanations or technical views.

### 4.5 Every number needs a question

Do not show a metric because it exists in the API. Show it because it helps the user answer a product question or choose an action.

### 4.6 Every issue needs an action

An issue card must say:

- what happened;
- how strong the evidence is;
- who or what is affected;
- what the user can inspect next.

### 4.7 Color is semantic, not decorative

Green means a supported positive or healthy state. It must not be used merely to make the interface feel active. “Live data” is a data-source state, not a health score.

### 4.8 Technical depth is a feature, not the default language

The product should be approachable at the first layer and rigorous at the second. Business users should not be punished for not knowing the implementation vocabulary.

---

## 5. Research-backed design rules

The following rules are incorporated from the research reviewed for this PRD:

1. **Audience first:** dashboard content must be selected based on who makes decisions with it, not on which fields the backend happens to expose.
2. **One-screen overview:** a dashboard is an overview and entry point into deeper reports, not a dense report page containing every detail.
3. **Top-left priority:** the most important information belongs at the top and toward the left in the reading path.
4. **Visual emphasis:** if every metric has the same size, weight, and contrast, none of them is prioritized.
5. **Correct visual encoding:** use lines for change over time, bars for comparison, tables for exact lookup, and journey views only when the underlying sequence is sufficiently complete.
6. **Avoid chart decoration:** do not add pies, donuts, gauges, gradients, or illustrations unless they make the decision materially easier.
7. **Plain labels:** avoid acronyms and jargon in navigation, headings, and first-level explanations.
8. **Consistent metric definitions:** the same metric must mean the same thing everywhere and show its denominator or data source near the number.
9. **Progressive disclosure:** keep specialized configuration and protocol detail out of the primary path.
10. **Information scent:** links and buttons must tell users what they will find next. “Review evidence” is acceptable only when the evidence destination is clear; “Learn more” is not an operational action.
11. **Accessibility:** color cannot be the only state cue; text, icons, labels, keyboard support, and contrast must carry meaning.
12. **Usefulness over minimalism:** a quiet interface is not automatically a clear interface. Hierarchy must be visible through type, scale, placement, grouping, and meaningful emphasis.

Primary references:

- [Microsoft Power BI dashboard design tips](https://learn.microsoft.com/en-us/power-bi/create-reports/service-dashboards-design-tips)
- [Microsoft: dashboards for business users](https://learn.microsoft.com/en-us/power-bi/explore-reports/end-user-dashboards)
- [Microsoft Power BI accessibility guidance](https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-accessibility-creating-reports)
- [Nielsen Norman Group: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [Nielsen Norman Group: Information Scent](https://www.nngroup.com/articles/information-scent/)
- [Google Design: Reviewing the Design Review](https://design.google/library/reviewing-the-design-review)
- [Google Design: From Minimal to Meaningful](https://design.google/library/minimal-meaningful)
- [Amplitude: How to build an analytics dashboard](https://amplitude.com/blog/analytics-dashboard)
- [Amplitude: UX analytics](https://amplitude.com/blog/ux-analytics)
- [TrackMCP product feedback and gap analysis](MCP-analytics-product-gap-analysis.md)

---

## 6. New information architecture

The current navigation exposes too many technical nouns with similar visual weight. Replace it with task-based destinations.

### 6.1 Primary navigation

The left rail should contain no more than five primary jobs:

1. **Overview** — How is our MCP product doing?
2. **Adoption** — Who is using it and what are they using?
3. **Journeys** — What are people trying to do and where do they stop?
4. **Quality** — Which capabilities are working, slow, failing, or being retried?
5. **Issues** — What should we investigate or fix next?

### 6.2 Secondary navigation

Place less frequent and more technical destinations under a clearly labeled secondary area or contextual links:

- **AI clients** — current Clients view
- **Capabilities** — Tools and Catalog combined conceptually
- **Work completed** — current Outcomes view
- **Evidence** — current Trace Explorer
- **Changes** — current Releases view
- **Setup** — current Configure view

The exact implementation can preserve existing routes for compatibility, but the visible labels and hierarchy should be business-first.

### 6.3 Recommended label mapping

| Current label | Recommended first-level label | Technical explanation |
|---|---|---|
| Overview | Overview | The health and usage summary for this workspace |
| Sessions | Journeys | A connected sequence of observed activity |
| Workflows | Work completed | Explicit evidence that a task started, finished, or failed |
| Trace Explorer | Evidence | The technical event timeline behind an issue |
| Tools | Capabilities | The actions your MCP product makes available |
| Tool Quality | Capability quality | How reliably and quickly capabilities behave |
| Catalog | Capabilities / What you offer | What the server advertised over time |
| Clients | AI clients | The client applications observed connecting |
| Reliability | Stability | Errors, speed, retries, and observed degradation |
| Intent & Gaps | Needs and gaps | Context supplied by callers and explicit missing-capability reports |
| Outcomes | Work completed | Explicit business or workflow outcomes |
| Releases | Changes | Deployment and catalog context when available |
| Configure | Setup | Connect the server and manage access |

“Trace Explorer,” “correlation handle,” “catalog,” and “provenance” should remain available in technical detail, but not be the first words a business user sees.

### 6.4 Do not add a permanent primary tab for every backend concept

Do not give separate first-level navigation weight to every API response family. If two pages answer one business question, combine them behind one business label and use tabs or contextual links inside the page.

---

## 7. Dashboard shell and chrome

### 7.1 Left navigation

- Keep a left rail on laptop screens.
- Use approximately 224–240px width, not a visually dominant 248px wall of equal-weight options.
- Show five primary destinations.
- Use sentence case, not all-caps navigation labels.
- Use icons as recognition support, never as the only label.
- Give the active destination a strong but restrained background and text treatment.
- Put Setup at the bottom.
- Put account and sign-out controls below Setup, visually separated.
- Do not repeat Configure as both a top-right icon and a navigation destination.
- Use expandable “More” or contextual links for technical pages.

### 7.2 Top bar

The top bar should answer “what workspace and data am I looking at?”

Left:

- workspace name;
- optional environment selector;
- page title and one-line purpose.

Right:

- data source selector: **Your data / Example data**;
- date range selector;
- refresh;
- optional last refreshed timestamp;
- account menu.

Do not hide the data source inside a low-contrast switch labeled “My data.” “Your data” and “Example data” are clearer to non-developers.

### 7.3 Data source control

Use a labeled segmented control or select with explicit words:

- **Your data**
- **Example data**

When Example data is selected:

- show an unmistakable “Example data” badge;
- explain that values are illustrative;
- never call example activity “live”;
- never preserve a selected live trace, session, or correlation identifier;
- use a CTA: “Connect your server” or “Return to your data.”

### 7.4 Date range control

Date range is a global filter and belongs in the top bar, adjacent to the data source control. It should use human language:

- Last 7 days
- Last 30 days
- Last 90 days
- Custom range, only when the API and product support it honestly

Show the selected period beneath the page title or in the toolbar. Do not repeat a different period inside every card.

### 7.5 Typography

The problem with the current font experience is not only the font file. It is the combination of small uppercase labels, weak scale contrast, dense captions, and similar weights everywhere.

Required changes:

- Use one highly legible UI family for the product surface: Inter or Geist Sans.
- Reserve a display face for marketing pages, not the operational dashboard.
- Use sentence case for headings and navigation.
- Remove letter-spaced all-caps labels from ordinary metric names.
- Minimum body text: 14px.
- Minimum secondary text: 12px, never below 12px for essential meaning.
- Page title: 28–32px, weight 650–700.
- Section heading: 18–20px, weight 600.
- Card metric: 28–36px with tabular numerals.
- Card label: 12–13px, weight 600, sentence case.
- Helper text: 13–14px, line height at least 1.4.
- Technical IDs and code: Geist Mono or equivalent, only where appropriate.
- Avoid using bold everywhere. Weight must communicate hierarchy.

### 7.6 Color

Use a neutral canvas and a small semantic palette:

- Ink: primary text and key numbers.
- Muted ink: explanations and secondary metadata.
- Brand green: active product identity and confirmed positive state.
- Blue: information, links, and selected neutral navigation state.
- Amber: attention, incomplete evidence, or needs review.
- Red: confirmed error, failure, or urgent degradation only.
- Gray: unavailable, legacy, sample boundary, and neutral state.

Rules:

- Never use green merely because data is live.
- Never use red for insufficient data.
- Never use color without text or icon reinforcement.
- Keep charts to one dominant series plus one comparison series unless a third series is genuinely necessary.
- Avoid saturated rainbow charts.

### 7.7 Surfaces and borders

The current dashboard uses too many visually equivalent white bordered boxes. Establish three surface levels:

1. **Canvas:** the page background and navigation background.
2. **Content surface:** primary white surface with no heavy shadow and one subtle border or divider.
3. **Attention surface:** lightly tinted amber, blue, or red surface reserved for an actionable status.

Rules:

- Do not put a border around every sentence or small metric.
- Use spacing and typography before adding another card.
- Use one elevated or tinted “What needs attention” panel as the primary visual anchor.
- Use tables for exact comparisons instead of turning every row into a card.
- Radius should be consistent and restrained, approximately 8–12px.
- No decorative gradients in the operational product.

---

## 8. Overview page specification

### 8.1 Page purpose

The Overview must answer this in under 10 seconds:

> Is our MCP product being used, are people getting useful work done, and what should we look at next?

### 8.2 Header copy

Preferred:

**How is your MCP product doing?**

“See who is using it, what they are trying to do, whether work gets done, and where to focus next.”

Avoid:

- “Overview” as the only explanation;
- “See what happened recently, identify the next investigation” as the primary business framing;
- unexplained server/telemetry language above the fold.

### 8.3 Status strip

For live data:

**Your data is connected**

“We have observed activity from your MCP server in this period.”

Show, when available:

- last refreshed time;
- last event received time;
- workspace/environment;
- a Setup link.

For a key with no event:

**Your server is connected to TrackMCP, but no activity has arrived yet**

Primary action: **Check setup**

For no key:

**Connect your MCP server**

Primary action: **Start setup**

For Example data:

**You are viewing an example workspace**

Primary action: **Connect your server**

### 8.4 KPI row

Use four high-level cards. Do not force technical metrics into the hero row simply because they are available.

Recommended order:

1. **AI clients** — how many client applications were observed;
2. **Activity** — observed requests/tool calls, with a plain-language caption;
3. **Work completed** — explicit workflow completion only;
4. **Needs attention** — number of supported actionable signals, or a neutral “No issues detected” state.

If the backend cannot provide one of these values, show “Not available” with a reason. Never substitute sessions for completed work or use a session heuristic without saying so.

Technical detail should be available through the card’s info action:

- “AI clients” means client metadata observed at the server boundary.
- “Activity” means observed server-boundary tool calls.
- “Work completed” requires explicit workflow outcome events.
- “Needs attention” counts only signals with sufficient evidence.

### 8.5 Primary content order

At 1280 x 800, the first viewport should contain:

1. page title and promise;
2. data source and period;
3. connection state;
4. four KPI cards;
5. a short “What needs attention” panel;
6. the beginning of the activity trend.

Do not place a large setup checklist above live metrics when live activity exists.

### 8.6 Main panels

#### Panel A: What needs attention

This is the most important panel below the KPI row.

Each issue must have:

- plain-language title;
- affected capability or journey;
- evidence strength;
- time period;
- one primary action.

Examples:

- “`send_email` is failing more often than other capabilities.” → **See capability quality**
- “People start this journey but often do not reach an explicit result.” → **See journeys**
- “A capability is advertised but has not been used in this period.” → **See capabilities**
- “Not enough evidence to rank issues yet.” → **Connect more activity**

Do not show an “issue” when the only fact is insufficient data.

#### Panel B: Activity over time

- X-axis: date/time in the selected period.
- Y-axis: observed activity count.
- Optional second line: explicitly completed work only, never a heuristic completion line.
- Use bars or a line based on density; bars for daily comparison, line for trend.
- Include an accessible data table.
- Explain whether the series is server-observed, client-observed, sample, bounded, or partial.

#### Panel C: What people are trying to do

Use explicit workflow paths where available. If not available, show a neutral state:

“We do not yet have explicit task outcomes. Add workflow outcome events to measure work completed.”

Do not rename a session heuristic as a business journey.

#### Panel D: Who is using it

Use a horizontal bar chart or ranked table:

- X-axis: observed activity or share.
- Y-axis: AI client names.
- Display counts and percentages.
- Label it “AI clients observed,” not “users,” unless a supported identity model exists.

### 8.7 Overview actions

Use action labels that predict the destination:

- See what needs attention
- See AI clients
- View journeys
- View capability quality
- Open technical evidence
- Connect your server

Avoid generic labels:

- Learn more
- Explore
- View all
- Review evidence, when no evidence scope is named

---

## 9. Page specifications

### 9.1 Adoption

Business question: **Who is using the MCP product, and which capabilities matter?**

Show:

- AI clients observed;
- activity trend;
- most-used capabilities;
- capabilities with zero observed use;
- returning activity only when a valid identity or client-level definition exists.

Do not call client names end users. Do not present a client count as a user count.

### 9.2 Journeys

Business question: **What are people trying to do, and where does work stop?**

Show:

- explicit workflow paths;
- started, completed, and failed outcomes;
- step sequence where timestamps are reliable;
- completion source;
- insufficient-data explanations.

First-level copy should say “Journeys” or “Work completed.” A secondary explanation may say “Technical workflow events.”

### 9.3 Quality

Business question: **Which capabilities are helping or hurting the experience?**

Show:

- capability usage;
- observed error rate and denominator;
- latency with p50/p95 only when actually computed;
- empty or uninspectable result states;
- retries and repeated calls;
- catalog/schema/description changes;
- server-observed scope;
- minimum-volume rules.

Use “Capability quality” as the first-level label. “Tool” may appear in the supporting copy and technical details.

### 9.4 Issues

Business question: **What should we fix next?**

This page should unify supported issues from reliability, capability quality, intent/gaps, and P1-05 regressions. It must not be a generic feed of all events.

Every issue requires:

- evidence;
- confidence/volume state;
- affected scope;
- first action;
- technical detail path.

P1-05 alert states must be labeled separately from observational signals:

- Observed signal
- Regression alert
- Insufficient evidence
- Resolved

Do not imply an alert is a causal diagnosis.

### 9.5 Evidence

Business question: **What exactly did the server observe?**

Keep Trace Explorer functionality, but present it as evidence entered from an issue, journey, capability, or session. The first screen should explain:

“Technical evidence behind an observed issue. It may be bounded, redacted, or missing client-side context.”

The technical view must retain:

- event timeline;
- server/client observation source;
- correlation quality and handle source;
- redaction and truncation;
- completion source;
- bounded result status;
- session and workspace scope.

### 9.6 Capabilities

Combine Tools and Catalog conceptually. Use tabs inside one page only if both views are needed:

- **Usage** — what gets called;
- **What you offer** — what was advertised;
- **Changes** — description/schema drift over time.

This prevents the user from learning that “Tools” and “Catalog” are separate product concepts.

### 9.7 Setup

Business-first setup should say:

“Connect your MCP server to see how it is being used.”

The technical steps remain available:

- create or choose an API key;
- install SDK;
- add wrapper;
- make one real call;
- return to the dashboard.

Do not lead with environment variables or package names before explaining why setup matters.

---

## 10. Metric and terminology contract

### 10.1 Plain-language dictionary

| Avoid as the primary label | Use first | Technical detail may say |
|---|---|---|
| Tool calls | Activity / Capability requests | Server-observed tool calls |
| Sessions | Journeys / Connections | Observed MCP sessions |
| Workflows | Journeys / Work completed | Explicit workflow events |
| Trace Explorer | Evidence | Bounded event timeline |
| Tool Quality | Capability quality | Tool-level quality metrics |
| Catalog | What you offer / Capabilities | Timestamped catalog |
| Clients | AI clients | Client metadata |
| Reliability | Stability | Observed errors and latency |
| Intent & Gaps | Needs and gaps | Intent provenance and missing capability |
| Outcomes | Work completed | Explicit workflow outcomes |
| Releases | Changes | Deployment/catalog comparisons |
| Correlation handle | Evidence link / request grouping | Correlation handle |
| Provenance | Data source | Observation or intent source |
| Insufficient data | Not enough evidence yet | Minimum-volume rule |

### 10.2 Copy rules

- One idea per sentence.
- Explain acronyms on first use.
- Never use an engineering noun without a nearby answer to “why should I care?”
- Prefer verbs: “See,” “Compare,” “Find,” “Fix,” “Connect,” “Investigate.”
- Use “observed” when evidence comes from the server boundary.
- Use “associated with” instead of “caused by” unless causality is genuinely supported.
- Use “not enough evidence yet” instead of a blank, zero, or red error state.
- Use “Example data” instead of “Sample mode” in first-level copy.
- Use “Your data” instead of “My data.”

### 10.3 Technical disclosure pattern

Every complex metric may expose a compact info affordance with:

1. What this means in plain language.
2. How it is calculated.
3. What it does not prove.
4. What to inspect next.

An eye icon is reserved for an actual show/hide or disclosure action. It must not be used as a generic details icon.

---

## 11. Interaction and button decisions

### 11.1 Primary action hierarchy

Each page has one visually dominant action. Examples:

- Overview: **See what needs attention**
- No-data Overview: **Connect your server**
- Adoption: **See capability usage**
- Journeys: **View a journey** or **Add explicit outcomes**
- Quality: **Inspect capability**
- Issues: **Open evidence**
- Evidence: **Return to issue** or **View related journey**
- Setup: **Copy setup** / **Check for activity**

### 11.2 Button placement

- Primary action: top-right of the page header or directly inside the primary issue panel.
- Secondary action: adjacent but visually quieter.
- Destructive or administrative actions: Configure only, with explicit confirmation.
- Refresh: icon plus accessible label in the global toolbar; never compete with the primary action.
- Date range and data source: controls, not buttons that look like actions.

### 11.3 No duplicated actions

Do not show the same Configure destination as both a top-right icon and a left-rail item. Do not show “View all” in every panel. If there is one canonical destination, link to it once with a descriptive label.

### 11.4 Drill-down behavior

Every drill-down must preserve:

- workspace;
- date range;
- data source;
- relevant capability/client/journey filter;
- origin page;
- back navigation.

Technical detail should open in a page or side panel depending on whether the user needs to compare it with the source issue. Do not force business users to lose their place.

---

## 12. Chart specification

### 12.1 Approved chart types

- Line: change over time.
- Bar: ranking and comparison.
- Stacked bar: composition when categories are few and mutually meaningful.
- Table: exact values, labels, and auditability.
- Journey step view: only for explicit, ordered, sufficiently complete workflow data.

### 12.2 Prohibited default charts

- 3D charts;
- decorative donuts or pies for many categories;
- gauges without a real target or threshold;
- charts that mix incompatible units on one axis;
- charts that imply a funnel when the underlying data is only a sequence of calls;
- visualizations whose meaning depends on color alone.

### 12.3 Axis and labeling rules

- Every axis has a human-readable label or an accessible title.
- Time axes use consistent periods across adjacent charts.
- Rates show numerator/denominator or have an adjacent definition.
- Large numbers use readable abbreviations with exact values available on hover or table view.
- Sort rankings by the decision-relevant measure.
- Never label a line “completion” if it is a session heuristic.

### 12.4 Chart narration

Every major chart has one sentence explaining the decision it supports. For example:

“Activity increased 18% this period, driven mostly by Claude connections.”

If the product cannot generate a truthful narrative, show the chart with a neutral caption rather than invented insight.

---

## 13. Page states

Every page must have distinct states:

1. Loading
2. Live data
3. Live data with no records
4. Not enough evidence
5. Bounded or truncated result
6. Stale data
7. API or authorization error
8. Example data

State language must be plain:

- “No activity yet” is different from “No issues detected.”
- “Not enough evidence yet” is different from “Healthy.”
- “Example data” is different from “Your data.”
- “Technical evidence is unavailable” is different from “Nothing happened.”

---

## 14. Business-first home journey

### 14.1 First visit with no data

The first screen should explain:

1. what TrackMCP answers;
2. what the user will see after connecting;
3. how to connect;
4. how to view an example.

Primary CTA: **Connect your server**

Secondary CTA: **Explore example data**

### 14.2 Returning user with live data

Open directly to Overview with:

- their data selected;
- no setup modal;
- a concise connection state;
- the period used by the metrics;
- the most important issue or a neutral no-issue statement.

### 14.3 Non-technical stakeholder handoff

Every issue and page should be shareable through a URL that preserves filters. A business user should be able to send an evidence link to an engineer and have the engineer see the same scope and context.

### 14.4 Engineer handoff

The engineer should be able to open technical evidence from a plain-language issue without learning the dashboard’s internal navigation model first.

---

## 15. Product and system requirements

### 15.1 Preserve the backend truth model

The redesign must not weaken:

- workspace authentication and isolation;
- privacy and redaction semantics;
- server/client observation separation;
- explicit workflow completion semantics;
- correlation quality and handle provenance;
- bounded scans and trace limits;
- live/example separation;
- insufficient-data behavior;
- fail-open SDK behavior.

### 15.2 Introduce a presentation view model

Frontend code should not spread technical vocabulary across every component. Create a typed presentation layer that maps API responses to business-readable cards while retaining technical detail fields.

Each presentation item should support:

- `headline`;
- `plainLanguageSummary`;
- `technicalDefinition`;
- `evidenceState`;
- `scope`;
- `primaryAction`;
- `secondaryAction`;
- `sourceLink`;
- `limitations`.

The presentation layer must not invent values or turn unavailable values into zeros.

### 15.3 P1-05 alert presentation

P1-05 backend and scheduler are now deployed, but the alert UI must be designed as part of this redesign rather than bolted onto the technical navigation.

The future Issues page must support:

- observed signal versus regression alert;
- baseline and comparison period;
- threshold and minimum volume;
- affected capability or journey;
- firing, resolved, suppressed, insufficient, and invalid states;
- delivery status;
- evidence link;
- no raw secret or unbounded payload.

Do not expose a technical alert configuration page to business users until the human language and safety model are clear.

---

## 16. Visual acceptance criteria

At 1280 x 800:

- the user can identify the page purpose in 2 seconds;
- the user can identify whether they are viewing Your data or Example data;
- the user can identify the selected period;
- the primary action is visible without scrolling;
- the first four KPIs are readable without squinting;
- the top issue or no-issue state is visible;
- no horizontal page overflow exists;
- no essential label is rendered as tiny uppercase text;
- the left rail does not visually compete with the main content.

At 1440 x 900:

- the Overview reads as one coherent story;
- the main issue and its action dominate secondary panels;
- charts have visible axes or equivalent accessible labels;
- secondary technical detail does not compete with business meaning;
- the page does not look like a grid of equally important boxes.

### 16.1 Visual test

Use a five-second test with a non-developer participant. After seeing the Overview, ask:

1. What does this product do?
2. Is your data connected?
3. What needs attention?
4. What would you click next?

The participant must answer without being taught MCP vocabulary.

### 16.2 Comprehension test

Test at least three non-developer or product-oriented participants and three engineers.

Success criteria:

- 5/6 participants identify the product’s purpose;
- 5/6 identify the live/example state;
- 5/6 find the primary issue;
- 5/6 choose the correct next action;
- no participant interprets “not enough evidence” as “healthy”;
- no participant interprets AI client count as human user count;
- engineers can reach technical evidence in two actions or fewer from an issue.

### 16.3 Copy review

Search the rendered dashboard for unexplained first-level occurrences of:

- trace;
- correlation;
- provenance;
- catalog;
- session;
- tool quality;
- workflow;
- payload;
- bounded;
- server-observed.

Each occurrence must either be renamed, explained nearby, or moved into a technical-detail layer.

---

## 17. Implementation sequence

Do not implement the whole redesign in one PR.

### Design phase — required before code

Produce:

- a page map;
- annotated desktop wireframes for Overview, Adoption, Journeys, Quality, Issues, Evidence, Capabilities, and Setup;
- a typography, color, surface, and spacing token proposal;
- a copy dictionary;
- a state matrix;
- a metric-to-business-question map;
- a click-through prototype or high-fidelity static mockup;
- a written review of the current public promise versus dashboard language.

The design phase must be reviewed before engineering implementation begins.

### Implementation 1 — foundation

- presentation view model;
- revised shell and primary navigation;
- global data-source and date-range controls;
- URL state compatibility;
- typography and surface primitives;
- page-state primitives.

### Implementation 2 — business Overview

- new Overview copy and KPI model;
- connection state;
- issue hierarchy;
- activity and client charts;
- example/live boundaries;
- plain-language empty and insufficient states.

### Implementation 3 — business pages

- Adoption;
- Journeys;
- Quality;
- Capabilities;
- Issues;
- setup journey.

### Implementation 4 — evidence and technical depth

- Evidence page/drawer;
- trace deep links;
- correlation and provenance detail;
- redaction and truncation detail;
- shareable investigation context.

### Implementation 5 — P1-05 presentation

- Issues/regression states;
- alert history and delivery status;
- evidence links;
- canary-safe configuration only after API contracts are reviewed.

### Implementation 6 — verification and polish

- browser flows;
- five-second comprehension tests;
- typography and contrast audit;
- visual regression at 1280 x 800 and 1440 x 900;
- analytics instrumentation;
- copy and jargon scan.

---

## 18. Testing requirements

### 18.1 Contract tests

Test:

- business labels map to correct API fields;
- unavailable values remain unavailable;
- explicit completion is not replaced with a session heuristic;
- AI client counts are not labeled as users;
- sample/example data cannot appear as live;
- technical detail preserves source fields;
- actions preserve filters and origin state.

### 18.2 Browser tests

Test with authenticated live-like data and empty data:

- first visit;
- returning live workspace;
- example-data selection;
- date-range change;
- Overview to issue to evidence;
- Overview to journey to evidence;
- back and forward navigation;
- refresh and shared URL;
- insufficient-data state;
- bounded/truncated state;
- API error and retry;
- setup handoff;
- 1280 x 800 and 1440 x 900 layouts.

### 18.3 Visual tests

Capture screenshots for:

- Overview with live activity;
- Overview with no data;
- Overview with an issue;
- Overview with Example data;
- Quality with insufficient data;
- Journeys with explicit outcomes;
- Evidence with redaction and truncation;
- Issues with a firing and resolved alert.

### 18.4 Content tests

Fail the build or review when:

- unexplained technical labels appear in primary navigation;
- “completed” is used without an explicit outcome source;
- “users” is used for client metadata;
- “healthy” is used for insufficient data;
- Example data lacks a visible example label;
- an action button says only “Learn more” or “View all” in an operational context.

---

## 19. Success metrics

Measure the redesign as a product experience, not only a visual change:

- time from dashboard load to first meaningful action;
- percentage of users who reach a useful issue or insight;
- percentage of users who successfully connect a server;
- percentage of users who can identify live/example state;
- percentage of users who can explain the primary issue;
- percentage of issue views that lead to evidence;
- percentage of users who use a technical evidence view only when needed;
- reduction in support or user-feedback comments that the dashboard is too technical;
- reduction in first-level jargon comprehension failures;
- no increase in false interpretations of completion, health, or user identity.

Do not optimize for clicks on every page. The goal is faster understanding and better decisions.

---

## 20. Non-goals

This PRD does not authorize:

- changing telemetry semantics;
- claiming private model reasoning;
- inventing user identity;
- replacing explicit outcomes with inferred outcomes;
- adding an AI-generated answer-quality score without evidence;
- creating a generic BI platform;
- redesigning the public marketing site as part of the first dashboard PR;
- adding mobile-first navigation;
- adding a new proxy or gateway;
- weakening privacy, workspace isolation, or boundedness;
- deleting current technical evidence;
- hiding limitations to make the product feel simpler.

---

## 21. Design-engineering guardrails

The UI Skills material reviewed for this project adds several useful execution constraints. These are adopted as process requirements for the dashboard design phase.

### 21A.1 State intent before selecting a visual pattern

Before proposing any screen, the designer must write:

- **Human:** who is opening this screen;
- **Task:** what they must accomplish;
- **Feeling:** how the experience should feel;
- **Focal point:** the one element that must win attention;
- **Hierarchy:** how that element wins through position, scale, weight, contrast, or space;
- **Density:** whether this screen is calm, operational, or investigative;
- **Palette:** why the colors belong to TrackMCP’s product world;
- **Depth:** why surfaces, borders, or elevation are used;
- **Spacing:** the base unit and the rhythm between groups.

“Clean,” “modern,” and “minimal” are not design decisions. Every visual choice must have a product reason.

### 21A.2 Explore the product domain before choosing a theme

The design package must identify:

- at least five concepts from the TrackMCP world;
- the natural color world of a product that explains invisible agent activity;
- one signature element that could belong specifically to TrackMCP;
- three generic dashboard defaults that the redesign explicitly rejects.

The signature must not be decorative. It should help users understand the relationship between activity, work completed, issues, and evidence. A possible direction is an “evidence path” motif that shows the movement from observed activity to a business issue to a technical explanation, but the designer must validate or reject this rather than adopting it automatically.

### 21A.3 Use one focal point per screen

The designer must name the focal point of each primary screen:

- Overview: the most important business issue or “no issues detected” state;
- Adoption: who is using the product;
- Journeys: where work stops or completes;
- Quality: the capability that needs attention;
- Issues: the next fix;
- Evidence: the event sequence behind the selected issue;
- Setup: the next step to connect data.

If every panel is equally prominent, the design fails the hierarchy test.

### 21A.4 Deliberate type scale and density

Use a defined type ratio rather than ad hoc sizes. The initial proposal should use a product scale close to:

- metadata: 12px;
- body: 14px;
- section: 18px;
- page title: 28px;
- primary metric: 32px.

Use size, weight, and color together. Do not try to create hierarchy through font size alone. Use tabular numerals for values and align numbers in tables and metric rows.

Define a base spacing unit of 4px or 8px and use a small set of multiples. Vary spacing intentionally: tight within a control group, comfortable within a panel, and generous between major stories.

### 21A.5 Avoid generic dashboard defaults

The design package must explicitly address and reject, where appropriate:

- a large left rail containing every backend concept;
- four identical KPI cards as the only hierarchy;
- a page made entirely from equal white bordered boxes;
- tiny uppercase labels everywhere;
- charts included because they look analytical rather than because they answer a question;
- a green “live” state that visually implies health;
- a generic “View all” action in every panel;
- a trace-first vocabulary on a business-first home page.

### 21A.6 Render before implementation

The design phase must include rendered artifacts, not only Markdown:

- current Overview and proposed Overview side by side;
- current navigation and proposed navigation side by side;
- live, Example data, empty, insufficient, issue, and error states;
- the proposed type scale in the actual chosen font;
- surface, border, and semantic color samples;
- at least one business-to-technical evidence drill-down.

The reviewer must be able to judge the hierarchy by looking at the artifact without reading the rationale first.

### 21A.7 Use existing primitives before creating new ones

Before creating a button, select, tab, tooltip, dialog, or card primitive, the implementation agent must inspect the existing codebase and reuse the existing accessible primitive where it fits. New primitives require a short explanation of why the existing system cannot express the design.

The redesign should introduce semantic tokens for:

- primary, secondary, tertiary, and muted text;
- canvas, content, elevated, and attention surfaces;
- brand, information, warning, success, and error colors;
- standard, soft, emphasis, and focus borders;
- the spacing scale;
- typography roles.

### 21A.8 Source

These guardrails are informed by [UI Skills](https://www.ui-skills.com/), particularly its guidance for [improving existing interfaces](https://www.ui-skills.com/skills/ibelick/improve-ui), [dashboard and SaaS interface design](https://www.ui-skills.com/skills/dammyjay93/interface-design), and [creating a design system from an existing product](https://www.ui-skills.com/skills/ibelick/create-design-md). The site’s guidance is treated as design-process input, not as authority over TrackMCP’s product semantics.

---

## 22. Final product decision

The old dashboard asked the user to understand TrackMCP’s internal data model.

The new dashboard must understand the user’s decision model:

1. **How is the product being used?**
2. **Is the work getting done?**
3. **What is going wrong?**
4. **What should we fix next?**
5. **Show me the evidence.**

The product should feel like a business analytics tool with an expert evidence layer—not an engineering console with business copy added afterward.

No implementation should begin until the design phase in Section 17 has been reviewed and accepted.
