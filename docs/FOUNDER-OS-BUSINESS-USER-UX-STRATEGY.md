# Founder OS business-user UX strategy

## Product promise

TrackMCP is the outcome and product analytics layer for MCP servers. The
engineer installs it; the business or product team uses it to understand
adoption, work, outcomes, and priorities.

## Information architecture rule

Every top-level page must answer one question:

| Page | Business question | Technical detail belongs in |
| --- | --- | --- |
| Overview | What changed and what deserves attention? | Evidence and expandable trust detail |
| Who’s using it | Which accounts/assistants are showing up? | Identity source and client metadata |
| What they’re doing | Which capabilities and surfaces are used? | Tool names, protocol methods |
| Resources & prompts | What information or guided help do people need? | URI/method details and privacy boundary |
| The journey | Where does observed work start, continue, or stop? | Trace/session evidence |
| Did it work | What completed, errored, or remains unobserved? | Outcome event contract and quality detail |
| What’s broken | What should the team investigate next? | Thresholds, baselines, confidence, evidence |
| Setup | Is data flowing and what happens next? | Keys, SDK, transport, OTel |

## Page pattern

Every page should have these layers, in this order:

1. **Question:** one sentence in business language.
2. **Headline:** the most decision-relevant number or state.
3. **Meaning:** what the number measures and its evidence boundary.
4. **Action:** where to go next if the reader wants to investigate.
5. **Detail:** technical evidence, raw labels, and protocol context.

The default view should not require the reader to know terms such as JSON-RPC,
transport negotiation, session initialization, or tool result envelopes. This
is directly aligned with the Founder OS PDF.

## Metric writing contract

Every metric shown to a business user must have:

- A label written as a question or business concept.
- A one-line definition.
- A source/evidence caveat when identity is self-reported or outcomes are
  explicit-only.
- A truthful insufficient-data state.
- A link to the next useful view.

Examples:

- `AI clients` → `Assistants using your MCP`; definition: “Distinct client
  names reported by connected sessions; names are directional when the client
  does not report itself.”
- `Activity` → `Observed work`; definition: “Bounded server activity in the
  selected period.”
- `Error rate` → `Calls that returned an error`; definition: “Observed error
  responses divided by observed calls; it is not a diagnosis by itself.”
- `Identity unresolved` → `Usage is visible, but account grouping is
  unavailable`; definition: “The server sent activity without an account
  identity that TrackMCP can resolve.”

## Setup narrative

The setup experience should tell the user:

1. Your workspace is ready.
2. A technical teammate connects one server.
3. TrackMCP receives one real event.
4. The dashboard then shows who used it, what they tried, whether it worked,
   and what needs attention.

If the workspace or key is missing, say exactly which step is missing. If the
key exists but no event arrived, do not imply that the server is broken; say
that reachability is not yet verified and offer a retry/check action.

## Example-data strategy

Example mode is a guided tour, not a fake customer account. It should use one
coherent scenario, keep “illustrative only” visible, and demonstrate the same
four questions a customer will ask with real data. It must not hide missing
identity or outcome evidence.

## Measurement of comprehension

The UX work is successful when a first-time business user can, without an
engineer:

- identify the next setup step in under 30 seconds;
- explain what each top-level tab answers;
- distinguish “zero”, “not observed”, and “not enough evidence”;
- find the evidence behind an issue;
- describe one action they would take from the Overview page.
