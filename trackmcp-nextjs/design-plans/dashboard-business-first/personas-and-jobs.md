# Business users and primary jobs

## Product positioning

TrackMCP is an analytics layer for teams shipping MCP-powered products. The experience should help a mixed team answer:

1. How is the product being used?
2. Is the work getting done?
3. What is going wrong?
4. What should we fix next?
5. What evidence supports that answer?

The first four are business/product questions. Evidence is the expert layer.

## Personas

### Product owner or business stakeholder

**Context:** owns product value, adoption, and prioritization; may not know MCP terms.

**Primary jobs:**

- understand whether the MCP capability is being used;
- identify the most important user-facing issue;
- decide what to ask engineering or product to fix;
- communicate a concise answer to a team or customer.

**Needs from the UI:** plain-language headings, one clear issue, explicit data scope, no fake certainty, and a next action that names its destination.

**Failure mode to avoid:** interpreting client count as human users, a session as a completed task, or insufficient data as healthy.

### Platform or product operations owner

**Context:** monitors production behavior and coordinates fixes across product and engineering.

**Primary jobs:**

- compare adoption and capability usage over a selected period;
- see errors, latency, retries, and silent failures;
- distinguish an observed signal from an alert or regression;
- hand technical evidence to an engineer without losing filters.

**Needs from the UI:** sortable tables, denominators, time range, issue priority, evidence links, and durable URL state.

### Engineer or investigator

**Context:** diagnoses a concrete issue after a business or operations signal.

**Primary jobs:**

- inspect event order and timing;
- separate server/client observations;
- assess correlation quality and source;
- see redaction, truncation, bounds, and completion provenance;
- reproduce the relevant scope without asking the business user to restate it.

**Needs from the UI:** technical detail reachable within two actions, stable query state, raw IDs where appropriate, and explicit limitations.

### First-time evaluator

**Context:** has not connected a server yet and needs to understand the product promise quickly.

**Primary jobs:**

- understand what TrackMCP will explain;
- explore believable example data;
- connect a server;
- know what success looks like after the first event.

**Needs from the UI:** a compact promise, two clear choices (`Connect your server`, `Explore example data`), and a short setup path.

## Job-to-surface map

| Job | First surface | Supporting surface | Evidence handoff |
| --- | --- | --- | --- |
| Understand usage | Overview | Adoption | AI clients or capability detail |
| Orient to scope | Global source/date controls | Every page state | Source and limitation disclosure |
| Prioritize | Overview attention panel | Issues | Evidence or journey link |
| Explain behavior | Journeys | Quality | Journey step evidence |
| Act | Issues | Quality / Capabilities | Open evidence |
| Prove | Evidence | Trace timeline | Shareable scoped URL |

## Product language rules

- Say `AI clients observed`, not `users`, unless a supported identity model exists.
- Say `Activity` or `Capability requests`, not `Tool calls`, at the first layer.
- Say `Work completed`, only when explicit workflow outcome events exist.
- Say `Not enough evidence yet`, not `Healthy`, when minimum-volume rules are not met.
- Say `Example data`, not `Sample mode`, in primary copy.
- Say `Evidence`, not `Trace Explorer`, at first level; retain Trace Explorer in the technical page title or route compatibility layer.
