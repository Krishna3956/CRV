# Comprehension checks

## Five-second test

Show the Overview for five seconds at 1280×800, then hide it. Ask:

1. What does TrackMCP help you understand?
2. Are you looking at Your data or Example data?
3. What needs attention?
4. What would you click next?

Pass when the participant can answer without being taught MCP vocabulary.

## Participants

Run at least six sessions before implementation sign-off:

- three product/business or operations participants who do not work with MCP protocol details;
- three engineers familiar with MCP or telemetry.

This package is a study and does not claim these interviews have already happened. The first implementation slice must include recruiting and running them.

## Success criteria

- 5/6 identify the product purpose;
- 5/6 identify Your data versus Example data;
- 5/6 find the primary issue or correctly say there is not enough evidence;
- 5/6 choose the correct next action;
- 0/6 interpret insufficient evidence as healthy;
- 0/6 interpret AI client count as human user count;
- 6/6 can explain that Work completed requires explicit outcomes;
- 6/6 can reach technical evidence from an issue in two actions or fewer.

## Screen-specific prompts

| Screen | Ask |
| --- | --- |
| Overview | “What should your team look at next?” |
| Adoption | “Who or what is represented by these rows?” |
| Journeys | “What does completed mean here?” |
| Quality | “Which capability would you inspect, and why?” |
| Issues | “Is this a confirmed failure, an observed signal, or not enough evidence?” |
| Evidence | “What does this timeline prove, and what does it not prove?” |

## Failure signals to record

- participant calls a client an end user;
- participant calls a session a journey completion;
- participant treats Example data as workspace data;
- participant reads an empty state as healthy;
- participant cannot find the source/date controls;
- participant reaches technical evidence but cannot explain the business issue that led there.

## Content lint checklist

Search the rendered first layer and fail review if unexplained terms appear without nearby disclosure:

`trace`, `correlation`, `provenance`, `catalog`, `session`, `tool quality`, `workflow`, `payload`, `bounded`, `server-observed`.
