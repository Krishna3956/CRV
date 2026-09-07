# Dashboard Reference Research: Pendo, Resend, HubSpot

Date: 2026-09-07

Purpose: use mature SaaS products as reference points for the TrackMCP product redesign. This document studies product structure, not brand imitation.

## Executive conclusion

TrackMCP should not be designed as a collection of observability screens. It should become a business product for answering five questions:

1. Is our MCP product being used?
2. Which customers, teams, or AI clients are using it?
3. What work are they trying to complete?
4. Where does that work succeed or get stuck?
5. What should our team do next?

Pendo, Resend, and HubSpot all support this direction in different ways:

- Pendo organizes around product work: understand users, analyze journeys, identify friction, and act on findings.
- Resend organizes around a simple operational object: an email. The overview explains performance, while list and detail pages let users investigate and act.
- HubSpot organizes around business objects and functions: contacts, companies, deals, service, marketing, reporting, and automation. Technical features are grouped under the work people are trying to do.

The common lesson is not to copy their colors or exact navigation. The lesson is to make the product's objects, jobs, and next actions obvious.

## Evidence and limitations

This review used public product documentation, public product pages, public screenshots, public brand material, and publicly inspectable login or documentation shells. Authenticated application details that require a customer account were not treated as verified facts.

Sources reviewed:

- [Pendo navigation and product tour](https://support.pendo.io/hc/en-us/articles/20826000368411-Take-a-tour-of-Pendo)
- [Pendo product areas](https://support.pendo.io/hc/en-us/articles/360035612871-Product-areas)
- [Pendo paths](https://support.pendo.io/hc/en-us/articles/360049997812-Paths)
- [Pendo guide effectiveness](https://support.pendo.io/hc/en-us/articles/50384284250523-Guide-effectiveness)
- [Pendo dashboard strategy](https://support.pendo.io/hc/en-us/articles/14087958093595-Get-strategic-with-pendo-dashboards)
- [Pendo typography guide](https://www.pendo.io/brand-guide/typography/)
- [Resend email management](https://resend.com/docs/dashboard/emails/introduction)
- [Resend metrics dashboard](https://resend.com/changelog/enhanced-metrics-dashboard)
- [Resend brand kit](https://resend.com/brand)
- [HubSpot navigation guide](https://knowledge.hubspot.com/help-and-resources/a-guide-to-hubspots-navigation)
- [HubSpot navigation usability study](https://product.hubspot.com/blog/bid/86560/the-new-hubspot-nav-bar-design-a-web-app-usability-study)
- [HubSpot product redesign study](https://product.hubspot.com/blog/overhauling-the-index-page)

## Cross-product comparison

| Product | Primary user question | Main organizing model | Overview to detail path | Strongest lesson for TrackMCP |
| --- | --- | --- | --- | --- |
| Pendo | How are people using our product and what should we improve? | Learn, then Act | Dashboard -> segment or product area -> path, funnel, workflow, guide, feedback, or action | Insights must lead to a decision or action |
| Resend | Did our messages send and deliver correctly? | Sending, receiving, audiences, domains, logs, settings | Overview -> metric or event -> email or log detail -> corrective action | A simple operational object can anchor a whole product |
| HubSpot | What business process am I managing? | CRM, Marketing, Sales, Service, Reporting, Automation | Function -> object index -> saved view or record -> action | Navigation should follow how teams work, not how engineering stores features |
| TrackMCP today | What happened inside my MCP server? | Technical telemetry categories | Overview -> technical analytics pages | Too close to implementation terminology for business users |

## Pendo: what to learn

### Product model

Pendo explicitly separates learning from acting. Its navigation groups analytics and understanding under Learn, then engagement and intervention under Act. It also has a shortcut layer for creation, search, recent items, and favorites.

This matters because analytics without a next step feels like a report. TrackMCP should not stop at “your error rate is high.” It should help the user understand which capability or workflow is affected, inspect the evidence, configure a regression rule, or share the finding.

### Navigation

Pendo uses:

- A left-side navigation menu.
- A visible active state so the user knows where they are.
- A Create New shortcut for dashboards, segments, reports, guides, journeys, surveys, feedback, and tags.
- A global page search shortcut using Cmd+K or Ctrl+K.
- Quick access for recently viewed and favorite items.
- Top-right account and product controls.
- A contextual assistant that opens in a right-side panel.
- A Resource Center for support, onboarding, tutorials, and community links.

The key principle is layered navigation. Frequent work is one click away, but the full product does not need to expose every capability as a permanent top-level item.

### Information architecture

Pendo organizes around concepts that a product team understands:

- Product: pages, features, track events, objects, product areas.
- People: visitors, accounts, segments.
- Analytics: paths, funnels, workflows, journeys, retention, reports.
- Guides: messages and onboarding.
- Feedback and sentiment.
- Orchestration: journeys that combine messages and goals.

TrackMCP should adopt the same conceptual move without copying the names:

- Product health: how the MCP product is doing.
- Customers and clients: who is using it.
- Journeys: what work is being attempted and completed.
- Capabilities: which tools are helping or failing.
- Actions: alerts, ownership, configuration, and sharing.

### Filters and date controls

Pendo's analytics views commonly use a shared filter bar with date range, application, product area, segment, status, category, page, activation, and goal filters. This establishes a strong rule for TrackMCP:

- Put the most important scope controls in a consistent global position.
- Keep date range and data source controls visible.
- Move advanced segmentation into a secondary filter drawer or “More filters” control.
- Do not scatter unrelated filters inside every card.

### Typography

Pendo's official brand guide specifies Sora for display and Inter for interface and data. Sora supplies personality in major communication, while Inter carries dense operational information.

TrackMCP should learn from the role separation, not automatically copy the fonts. The dashboard needs a highly legible UI font for numbers, tables, filters, and statuses. A distinctive display face could be reserved for product-level moments, but it should not reduce readability in the application shell.

### What TrackMCP should copy

- Learn versus Act thinking.
- Global search and recent/favorite access once the product has enough depth.
- Product areas as a way to group capabilities by business purpose.
- Shared filters and consistent date controls.
- Contextual help that explains a metric without forcing users to read documentation.
- A right-side evidence or assistant panel only when it directly supports the current task.

### What TrackMCP should not copy

- A large enterprise navigation tree before TrackMCP has enough product depth.
- In-app guides and orchestration before core analytics are understandable.
- Pendo's vocabulary such as Features, Track Events, and Product Areas without translating it for MCP teams.

## Resend: what to learn

### Product model

Resend is an especially useful reference because it is technical infrastructure presented through a straightforward operational story. The user sends email, then needs to know what happened. The product makes that object inspectable.

Its core surfaces include sending, receiving, audiences, domains, templates, webhooks, logs, API keys, and settings. The interface is more than a dashboard because each area supports a real task after the user clicks it.

### Navigation and page structure

Resend's public documentation and screenshots show a restrained developer-product pattern:

- A compact application shell.
- A focused left navigation organized by operational areas.
- A clear page title and short explanation.
- A primary action near the page title, such as creating a key, domain, webhook, or template.
- Lists for recurring objects.
- Detail views for one object.
- Logs and events connected to the object that produced them.
- Settings and API keys kept away from the main analytical path.

The important relationship is:

```text
overview -> list -> detail -> logs/events -> corrective action
```

TrackMCP needs the same path:

```text
overview -> journey/capability/issue list -> detail -> evidence -> recommended action
```

### Metrics and charts

Resend's metrics redesign added:

- Multiple event types in a single line chart.
- Hover detail by time period.
- Event-type filtering.
- Custom date ranges.
- Domain filtering with search for many domains.
- Dedicated risk charts for bounces and complaints.
- Help icons beside unfamiliar metrics.

The lesson is that charts are useful when they support a decision. A chart should answer “what changed, when, and what should I inspect?” It should not exist merely to fill a dashboard grid.

For TrackMCP:

- Use one primary trend chart on Overview.
- Let users switch between business measures such as attempts, successful work, failures, and latency only when the definitions remain clear.
- Use hover detail for exact values instead of putting every number permanently on screen.
- Let users filter by MCP server, capability group, environment, or AI client when those dimensions exist.
- Put a short explanation beside unfamiliar metrics.

### Typography

The public Resend docs and login shell use Inter as the primary interface font. This is a strong choice for technical information density, but it is also common. TrackMCP should not select Inter simply because Resend uses it. If the existing TrackMCP visual system already uses a readable sans-serif, the better question is hierarchy, weight, line-height, and spacing.

### What TrackMCP should copy

- Operational objects with clear list and detail pages.
- A primary action in the page header.
- Detail pages that combine summary, event history, logs, and corrective actions.
- Narrow, purposeful charts.
- Help text beside metrics rather than a separate glossary page.
- Settings and credentials kept out of the business analytics flow.

### What TrackMCP should not copy

- A developer-first API/key mental model as the default product entry point.
- Too much raw event data before the user understands the business outcome.
- A dashboard that assumes every user wants to inspect logs first.

## HubSpot: what to learn

### Product model

HubSpot is the strongest reference for business-oriented navigation at scale. Its navigation is organized around team functions and business objects, not technical subsystems. Current public documentation describes CRM, Marketing, Content, Sales, Revenue, Service, Data Management, Automations, Reporting, Breeze, Development, and Partners.

The important design decision is that the user chooses a work context first. Within that context, they work with records, views, dashboards, reports, and actions.

### Top navigation

HubSpot's top bar provides account-level and global controls:

- Home.
- Global search across tools, assets, learning resources, and settings.
- Quick Create for common records and tasks.
- Marketplace.
- Help.
- Settings.
- Notifications.
- Assistant.
- Account and billing menu.

This is a useful separation for TrackMCP:

- The left side should answer “where do I work?”
- The top bar should answer “what global action or context do I need?”

TrackMCP should consider top-bar controls for search, workspace/server switching, help, notifications or issues, and user settings. It should not duplicate Configure as both a navigation item and a gear icon.

### Left navigation

HubSpot's sidebar can be collapsed. It is grouped by user function and can expose secondary tools only after the user selects a category. The current sidebar is not required to show every destination at once.

This directly supports a TrackMCP redesign:

- Keep a small set of primary jobs visible.
- Put advanced technical pages under an expandable “Evidence” or “More” section.
- Allow collapse for users who need more content width.
- Preserve a strong active state and page title.
- Keep global search available even when navigation is collapsed.

### Navigation research

HubSpot's own usability study is especially relevant. It used internal stakeholder interviews, open card sorting, customer card sorting, low-fidelity mocks, and usability testing with customers and non-customers. The study found that an object-based approach was more intuitive than organizing the product around the company's internal methodology.

That is evidence against TrackMCP's current technical vocabulary. “Trace Explorer,” “Intent & Gaps,” and “Tool Quality” are internal or engineering-shaped concepts. Business users are more likely to understand “Evidence,” “Needs attention,” and “Capability quality.”

### Page structure and controls

HubSpot's object index patterns use familiar structures:

- Page title and purpose.
- Saved views or tabs.
- Filters and search.
- Table or board views depending on the user goal.
- Row-level actions.
- Detail pages for one record.

TrackMCP should use this pattern for:

- Journeys: table of attempted work, outcome, duration, and friction.
- Capabilities: table of tools with usage, success, latency, and quality flags.
- Issues: table of regressions and recommended next action.
- AI clients: table of client usage and health.

### Typography

HubSpot's public application login shell exposes Inter in its UI, while its public documentation and brand surfaces use additional HubSpot type families. The lesson is that product UI type should optimize legibility and consistency first. Brand display typography belongs in marketing and high-level moments, not every table and filter.

### What TrackMCP should copy

- Function-based grouping.
- Global search.
- Quick actions for the most common task.
- Object index pages with views, filters, tables, and detail pages.
- Collapsible navigation.
- Customer-driven navigation validation using card sorting and task tests.
- Different views for different tasks, such as table versus board when appropriate.

### What TrackMCP should not copy

- HubSpot's breadth of modules at the current TrackMCP stage.
- A deeply nested menu before primary jobs are validated.
- CRM terminology that does not map to MCP work.

## Visual comparison

### Typography

| Product | Verified or observable type direction | Implication |
| --- | --- | --- |
| Pendo | Sora for display, Inter for UI and data | Personality can live in high-level moments while data remains highly legible |
| Resend | Inter on public docs and login shell | Neutral, technical, compact, readable |
| HubSpot | Inter visible in the app login shell; broader brand and docs use additional type families | Product UI and marketing type can serve different jobs |
| TrackMCP recommendation | One highly legible UI family plus an optional restrained display role | Fix hierarchy before changing fonts; avoid decorative type in dense analytics |

### Spacing and density

The three products all use generous whitespace around page-level sections, then tighter spacing inside tables, filters, and event rows. None of the successful patterns treat every component as a floating card.

TrackMCP should use three density zones:

- Shell: compact but breathable, with clear navigation groups.
- Work surface: medium density, with page title, purpose, primary action, and global filters.
- Evidence: dense, but progressively disclosed and bounded.

### Buttons

Mature SaaS products distinguish:

- One primary page action.
- Secondary actions such as export, save view, or compare.
- Tertiary text links for documentation or related context.
- Destructive actions in menus or confirmation flows.

TrackMCP should not place Refresh, Configure, Sample data, Export, and Setup as equal-weight buttons. The page should have one obvious next action. Data mode and date range are context controls, not primary marketing CTAs.

### Cards and borders

The reference products use cards when the content is a meaningful module or object, not as a default wrapper for every metric. TrackMCP should prefer:

- one focal summary area;
- quiet section boundaries;
- a small number of high-value metric blocks;
- tables and lists for many items;
- detail panels for one selected item.

Avoid a wall of equal cards where every number claims equal importance.

## Recommended TrackMCP product structure

### Primary navigation

Use business jobs as the top-level model:

1. Overview
2. Journeys
3. Capabilities
4. Issues

### Secondary navigation

Put supporting and technical work under a quieter secondary group:

- AI clients
- Evidence
- Work completed
- Changes
- Setup

Use plain-language labels in the visible navigation. Technical terms can appear inside helper text, detail views, and documentation.

### Top bar

Recommended top-bar order:

1. Workspace or MCP product switcher.
2. Global search.
3. Date range and data-source context in the page-level toolbar, not the global account bar.
4. Help.
5. Issues or notifications, when available.
6. User menu.

Do not duplicate a Settings or Configure action in both the top bar and the left navigation.

### The page pattern

Every substantial page should follow this sequence:

1. Plain-language page title.
2. One-sentence explanation of why the page matters.
3. One primary action.
4. Scope controls: date range, server, environment, or client.
5. Summary signal.
6. Main object list or chart.
7. Detail drilldown.
8. Recommended next action.

## Proposed TrackMCP object model

| Object | Plain-language meaning | Detail page should answer |
| --- | --- | --- |
| Journey | A piece of work someone tried to complete | Did it finish, where did it stop, and what evidence explains that? |
| Capability | A tool or MCP function the product offers | Who uses it, how often, how reliably, and where is quality weak? |
| Issue | A change or condition requiring attention | What changed, how serious is it, and what should the team inspect? |
| AI client | The application or agent using the MCP product | Which clients use the system and how do their patterns differ? |
| Evidence | The bounded technical proof behind a conclusion | What happened at the server boundary and what is still unknown? |
| Change | A deployment or catalog change | Did behavior change after this release or definition change? |
| Setup | Configuration and integration work | How do I connect, define outcomes, and control access? |

## Required user journeys

### Business user: “Are customers getting value?”

Overview -> select “Work completed” -> inspect Journeys -> open a failed journey -> read plain-language explanation -> open Evidence only if needed.

### Product manager: “What should we improve?”

Overview -> Issues -> filter by capability or client -> open issue -> compare trend -> create or assign follow-up.

### Engineering lead: “What exactly happened?”

Overview -> Capability or Issue -> Evidence -> bounded trace/event detail -> deployment or catalog context.

### New user: “What is this product?”

Overview -> short explanation -> guided empty state -> connect or select data -> first useful signal -> suggested next question.

## Decisions for TrackMCP

### Copy

Prefer:

- “Work completed” over “Outcomes.”
- “Journeys” over “Workflows” when the audience is business users.
- “Capabilities” over “Tools” in the primary navigation.
- “Needs attention” over “Intent & Gaps.”
- “Evidence” over “Trace Explorer.”
- “AI clients” over “Clients” when the distinction matters.
- “Stability” over “Reliability” only if the metric definitions remain clear.

Do not hide technical vocabulary completely. Explain it in helper text and expose it in evidence views for technical users.

### Charts

Use:

- line charts for trends over time;
- horizontal bars for ranked capabilities or clients;
- tables for exact records and action queues;
- funnels only for explicitly defined journey stages;
- sparklines only when a comparison or trend is clear;
- no pie or donut charts for primary decisions.

Every chart must state its measure, date range, unit, denominator, and data mode. Axes should use human-readable labels. Hover details can expose exact technical values.

### Filters

Keep visible:

- date range;
- live/sample mode;
- MCP product or workspace;
- environment when relevant.

Move into an advanced filter control:

- observation source;
- correlation status;
- payload policy;
- scan bounds;
- internal event types;
- technical provenance.

### First release scope

Do not attempt to copy the full breadth of HubSpot or Pendo. The first redesign should implement:

1. A business-first Overview.
2. A Journeys object page and detail view.
3. A Capabilities object page and detail view.
4. An Issues page connected to P1-05 alerts and regressions.
5. An Evidence drawer or detail page for technical proof.
6. A clearer Setup flow for connecting data and defining explicit outcomes.

## Validation plan

Before implementation, run task-based tests with at least:

- one non-technical business user;
- one product manager;
- one engineering lead;
- one person who has not seen the current dashboard.

Ask each person to find:

1. whether usage is growing or shrinking;
2. whether important work is completing;
3. which capability needs attention;
4. what changed after a release;
5. where to inspect technical evidence.

Success means users can predict where to click, explain the metric in their own words, and identify the next action without being taught TrackMCP vocabulary first.

## Final recommendation

Use Pendo for the learn-to-act relationship, Resend for the object-to-detail operational flow, and HubSpot for business-function navigation and validation through card sorting.

Do not imitate any one product's visual skin. Build TrackMCP around a distinctive signature: a clear “what happened to the work?” story that connects business outcome, capability quality, issue, and bounded evidence in one path.

The dashboard redesign should therefore be treated as a product information-architecture project, not a CSS refresh.

## Customer-in-the-seat analysis: QBO

### The situation

Assume QBO has built an MCP. Engineering tells the business team that it is live and asks them to use TrackMCP to understand whether it is useful. The first TrackMCP user is likely a product leader, operations leader, or business stakeholder, not the engineer who installed the SDK.

That person arrives with a business question, not a telemetry question:

> “Is anyone using this, what are they trying to do, and is it helping them?”

They may not know what a trace, tool call, correlation handle, session, catalog, or observation source means. This is not a training failure. It is a product-language failure if the dashboard makes those terms prerequisites for understanding value.

### What the first screen should do

#### In the first ten seconds

The first viewport should establish:

- whose MCP product is being viewed;
- whether the view is live or Example data;
- what TrackMCP helps answer;
- the strongest supported current signal;
- the next action.

The opening message should be closer to:

> “See how QBO’s MCP product is being used, whether important work gets completed, and where the experience needs attention.”

It should not open with “Analytics,” “Trace Explorer,” “Tool Quality,” or “Observation source.” Those can appear after the user has a reason to inspect them.

#### In the first minute

The user should be able to answer one of:

- Is anyone using the MCP?
- What work are they attempting?
- Is that work completing?
- What should our team look at next?

If there is no data, the product should not render a grid of zeroes. It should show a connection state, explain what data will unlock, and provide two choices:

- Connect your server.
- Explore Example data.

If there is activity but not enough evidence for outcomes, the product should say that directly. “Not enough evidence yet” is useful. “Healthy” or “0% completion” would be misleading.

#### In the first five minutes

The user should be able to move through this path:

```text
Overview -> business signal -> Journey, Capability, or Issue -> plain-language explanation -> Evidence when needed
```

The product should make the technical layer available without making it the entry point. This is progressive disclosure: a business user can stop after the explanation, while an engineer can continue into bounded event and provenance details.

### The first value moment

The first value moment should not be defined as seeing a chart. It should be defined as the user being able to say:

> “I understand whether the MCP is being used, whether important work is completing, and what my team should investigate next.”

That value moment must be evidence-based. If the server only exposes activity and not explicit workflow outcomes, the product must say that completion cannot yet be determined and give the next setup action.

### What happens after each primary tab

The first-level navigation should be a set of questions and work areas, not a list of backend response families:

| Tab | First question | What the page must allow |
| --- | --- | --- |
| Overview | What is happening overall? | Understand current state and choose the next question |
| Journeys | Is the work getting done? | Compare attempted work, completion, friction, and evidence |
| Capabilities | Which capabilities are helping or struggling? | Rank, filter, inspect, and identify quality work |
| Issues | What needs attention? | Prioritize, understand impact, inspect evidence, and follow up |
| AI clients | Who or what is using the MCP? | Compare clients and identify different usage patterns |
| Evidence | What exactly happened? | Inspect bounded proof connected to a business question |
| Changes | Did something change after a release or catalog update? | Compare behavior around changes |
| Setup | How do we make this data useful? | Connect, define outcomes, manage access, and understand limits |

Every page needs a primary action, useful empty state, detail view, return path, and context-preserving URL. A page that only displays a report is incomplete.

### Onboarding lessons from product analytics

Mixpanel describes time to value as the time from entering the product to recognizing why it is useful. It also describes generating a starter board once data is available and guiding non-technical users toward the insights they want before asking an engineer to connect data. [Mixpanel onboarding](https://mixpanel.com/blog/simpler-faster-to-get-started-with-mixpanel-onboarding/)

TrackMCP should use the same principle with stronger truth constraints:

1. Ask what the team wants to understand, not only how to install the SDK.
2. Let a business user choose a goal such as usage, completed work, or quality.
3. Give engineering a precise setup handoff.
4. Generate a starter Overview only once usable live data exists.
5. If data is missing, teach the user what will become possible rather than filling the page with sample values silently.

### Recommended first-run states

| State | User message | Primary action | Secondary action |
| --- | --- | --- | --- |
| Not connected | “Connect your MCP product to see how it is used.” | Connect your server | Explore Example data |
| Connected, waiting | “Your connection is ready. We are waiting for the first usable events.” | View setup instructions | Learn what will appear |
| Connected, low volume | “We can see activity, but not enough evidence for every conclusion yet.” | View what is missing | View current activity |
| Usable live data | “Here is how your MCP product is being used.” | Open the strongest signal | Explore all activity |
| Example data | “This is an illustrative walkthrough, not your telemetry.” | Try a Journey or Issue | Connect your server |

### Role-based continuation

The same Overview should support different roles:

- A business leader needs adoption, completed work, risk, and a plain-language recommendation.
- A product manager needs journeys, capability quality, changes, and prioritization.
- An engineering lead needs evidence, traces, provenance, redaction, limits, and setup details.

The interface should not force the business leader through the engineering lead’s vocabulary in order to reach the first useful answer.

### Measurement for the redesign itself

TrackMCP should measure whether its redesign helps users, not only whether pages load. The first product metrics should include:

- time from dashboard load to first meaningful insight;
- percentage of new users who can identify whether data is live or Example data;
- percentage who can find the answer to “is anyone using this?”;
- percentage who can find a journey, capability, or issue;
- percentage who can identify the next action;
- percentage who reach Evidence from a business page without using technical navigation;
- setup completion rate;
- return visit rate after first insight.

The design should be evaluated with at least one non-technical QBO-style stakeholder, one product manager, one engineer, and one person unfamiliar with TrackMCP. Ask them to complete the same five tasks without teaching internal vocabulary first.

### Decision

The business-first redesign is not merely a visual refresh. It is a change in the first user promise:

```text
Old: inspect MCP telemetry.
New: understand whether MCP-powered work is creating value, then inspect the evidence when needed.
```

That distinction should govern navigation, copy, onboarding, charts, empty states, detail pages, and the implementation sequence.
