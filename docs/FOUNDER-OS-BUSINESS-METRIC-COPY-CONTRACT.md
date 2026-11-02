# Founder OS business metric copy contract

This contract keeps the dashboard readable without changing the underlying
analytics formulas. Technical names remain available in Evidence or expanded
detail.

| Current concept | Business-facing label | What it means | Caveat |
| --- | --- | --- | --- |
| AI clients | Assistants using your MCP | Distinct client names reported by observed sessions | Directional/self-reported |
| Activity | Observed work | Bounded calls observed in the selected period | Not a count of business outcomes |
| Work completed | Work with an explicit success | Started workflows with an explicit completion event | Missing event is not failure |
| Needs attention | Signals to investigate | Returned insights with evidence and affected volume | A signal is not a diagnosis |
| Capabilities observed | Features people used | Server capabilities observed in the period | A capability may be advertised but unused |
| Error rate | Calls that returned an error | Observed error responses divided by observed calls | Does not explain root cause alone |
| Hashed entities | Distinct resources or prompts observed | Privacy-bounded entity count | No content or raw URI is shown |
| Identity unresolved | Usage visible, account grouping unavailable | Activity arrived without resolvable account identity | Identity is optional |
| Transport observed | Connection method observed | Bounded transport metadata | Technical detail, not a business outcome |
| Evidence | Supporting detail | Redacted trace/event context for a business signal | Keep payloads and secrets out |

When a metric has insufficient evidence, use `N/A` plus the reason. Never
replace it with zero or a positive health statement.
