# First-time user journey

## Desired first visit

The first visit should answer “what will I get?” before asking for implementation work.

```text
Landing on Overview
  ↓
Understand promise: usage, work completed, next fix
  ↓
Choose: Connect your server | Explore example data
  ↓
If Example data: see a believable issue and open its explanation
  ↓
If Connect: create key → install SDK → make one real call
  ↓
Check for activity
  ↓
Return to Your data Overview
  ↓
Open the first supported signal → evidence when needed
```

## No-data Overview

Header:

**Understand how your MCP product is being used**

“Connect your server to see AI clients, activity, work completed, and where to focus next.”

Primary action: **Connect your server**

Secondary action: **Explore example data**

Show four placeholder KPI rows as `Not available yet`, not zero. The page should explain what each value will answer after data arrives.

## Setup handoff

1. Create or choose a workspace key.
2. Install the TypeScript or Python SDK.
3. Wrap the server boundary.
4. Make one real tool call.
5. Return and choose **Check for activity**.

The business reason remains visible in the setup header. Package names and environment variables are secondary technical detail.

## Returning user with live data

Open on Overview with:

- Your data selected;
- the selected period visible;
- source/last-observed metadata only when the API supplies it;
- no setup checklist if activity exists;
- one attention state and action;
- a direct path into quality, journeys, or evidence.

## Business-to-engineer handoff

From an issue, the product owner clicks **Open evidence**. The evidence page preserves workspace, date range, data source, capability/journey filter, issue origin, and back destination. The engineer sees the same issue title above the technical timeline.

## Example-data guardrails

- Example data has a visible Example data badge in the top bar and page body.
- Example sessions/capabilities are never presented as current workspace activity.
- Selecting Example data clears live trace/session/correlation state.
- The return action says **Connect your server** or **Return to your data**, not “Switch back” without context.
