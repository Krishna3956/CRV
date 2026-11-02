# Founder OS business-user UAT script

Use this script with one fresh account and one account with Example data or
real telemetry. It is intentionally written for a product or operations user,
not an engineer.

## Journey A — first login

1. Sign in and describe what TrackMCP is for in one sentence.
2. Without reading documentation, identify the next step.
3. Explain who normally performs the setup step.
4. Find the three setup steps and say what happens after the first event.
5. Identify the difference between My data and Example data.
6. Find the place to retry the first-event check.
7. State whether identity setup is required to see activity.

Pass criteria:

- The user says that TrackMCP helps understand MCP adoption, work, outcomes,
  and issues.
- The user identifies “connect one server and send one real event” as the next
  step.
- The user does not mistake Example data for workspace telemetry.
- The user does not interpret “no event yet” as proof that the server is broken.
- The user knows that identity enrichment is optional.

## Journey B — activated workspace

1. Open Overview and explain the four top-level questions it answers.
2. Find which assistants/accounts are showing up.
3. Find the most-used feature and explain what its volume means.
4. Find whether an observed piece of work completed explicitly.
5. Open The journey and explain where work pauses or stops.
6. Open What’s broken and choose one signal worth investigating.
7. Explain the difference between a signal, a confirmed diagnosis, and
   insufficient evidence.
8. Open Evidence and describe what technical detail is available without
   exposing payloads or secrets.

Pass criteria:

- The user can explain every top-level tab in plain language.
- The user distinguishes activity from business completion.
- The user understands that self-reported assistant identity is directional.
- The user can move from an issue to evidence and a recommended next step.
- The user does not treat missing data, `N/A`, or unknown identity as zero or
  as a positive health claim.

## Observation sheet

Record for each participant:

| Check | Result | Notes |
| --- | --- | --- |
| Found next setup step in 30 seconds |  |  |
| Explained post-setup value |  |  |
| Distinguished My data from Example data |  |  |
| Explained Overview KPIs |  |  |
| Explained each top-level tab |  |  |
| Found an evidence-backed issue |  |  |
| Distinguished signal vs diagnosis |  |  |
| Knew what to do next |  |  |

Do not treat this script as a substitute for authenticated production QA. It
is a comprehension gate to run after the branch is deployed to a review
environment or production with a safe workspace.
