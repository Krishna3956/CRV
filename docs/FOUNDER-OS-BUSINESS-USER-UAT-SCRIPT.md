# Founder OS business-user UAT script

Use this script with one fresh account and one account with Example data or
real telemetry. It is intentionally written for a product or operations user,
not an engineer. Do not coach the participant before each answer; record the
words they use and whether they found the control without a hint.

## Test setup

- Use a desktop browser.
- For Journey A, use a fresh account with no connection key and no events.
- For Journey B, use Example data or a workspace with real activity. Make the
  selected source explicit before starting: `My data` is workspace activity;
  `Example data` is illustrative and not workspace telemetry.
- Ask the participant to think aloud. Stop the session if they are asked to
  paste a secret, change production configuration, or perform an irreversible
  action.
- Mark each check `Pass`, `Needs clarification`, or `Fail`; a correct answer
  after coaching is not an unaided pass.

## Journey A — first login

1. Sign in and describe what TrackMCP is for in one sentence.
2. Without reading documentation, identify the next step and click the primary
   action.
3. Explain who normally performs the setup step.
4. Find the three setup steps and say what happens after the first event.
5. Identify the difference between `My data` and `Example data` using the data
   source control.
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
2. Find which assistants and privacy-safe account groups are showing up.
3. Find the most-used feature and explain what its volume means.
4. Find whether an observed piece of work completed explicitly.
5. Open The journey and explain where work pauses or stops.
6. Open What’s broken and choose one signal worth investigating.
7. Explain the difference between a signal, a confirmed diagnosis, and
   insufficient evidence.
8. Open Evidence, then open one sample session and describe what technical
   detail is available without
   exposing payloads or secrets.

Pass criteria:

- The user can explain every top-level tab in plain language.
- The user distinguishes activity from business completion.
- The user understands that self-reported assistant identity is directional.
- The user can move from an issue to evidence and a recommended next step.
- The user does not treat missing data, `N/A`, or unknown identity as zero or
  as a positive health claim.
- The user understands that Evidence details are a drill-down, not the place
  to start reading the dashboard.

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

## Facilitator notes

Record the first phrase the participant uses for each tab and each KPI. Flag
any phrase that turns an observed activity count into a people/customer count,
or turns an explicit outcome into a general product-health claim. Capture the
exact UI label that caused confusion so copy can be changed without guessing.

### Minimum acceptance threshold

For a pilot candidate, the participant must complete every Journey A action
without coaching and complete at least six of the eight Journey B actions
without coaching. Any failure involving data-source confusion, fabricated
completion/health interpretation, or a secret-handling request is a release
blocker even if the numerical threshold is met.

Do not treat this script as a substitute for authenticated production QA. It
is a comprehension gate to run after the branch is deployed to a review
environment or production with a safe workspace.
