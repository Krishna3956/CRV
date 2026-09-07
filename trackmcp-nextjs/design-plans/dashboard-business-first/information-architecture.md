# Proposed information architecture

## Navigation model

The primary rail contains five business jobs. Technical destinations are contextual or secondary.

### Primary navigation

1. **Overview** — How is the MCP product doing?
2. **Adoption** — Who is using it and which capabilities matter?
3. **Journeys** — What are people trying to do and where does work stop?
4. **Quality** — Which capabilities are fast, failing, retried, or underused?
5. **Issues** — What should we investigate or fix next?

### Secondary navigation

- **AI clients** — current Clients view;
- **Capabilities** — current Tools and Catalog concepts combined;
- **Work completed** — current Outcomes view;
- **Evidence** — current Trace Explorer;
- **Changes** — current Releases view;
- **Setup** — current Configure view.

Secondary destinations are shown under a `More` group or as contextual links. They should not compete with the five primary jobs.

## Proposed page map

| Business destination | Page promise | Technical source/view |
| --- | --- | --- |
| Overview | “How is your MCP product doing?” | Current Overview |
| Adoption | “Who is using it, and which capabilities matter?” | Clients + top tools + usage trend |
| Journeys | “What are people trying to do, and where does work stop?” | Workflows + explicit outcomes |
| Quality | “Which capabilities are helping or hurting the experience?” | Tool Quality + Reliability |
| Issues | “What should we fix next?” | Supported signals + future P1-05 presentation |
| Evidence | “What exactly did the server observe?” | Trace Explorer |
| Capabilities | “What do we offer, and what gets used?” | Tools + Catalog |
| Work completed | “What work has an explicit result?” | Outcomes |
| AI clients | “Which client applications were observed?” | Clients |
| Changes | “What changed around the time behavior changed?” | Releases/catalog comparisons |
| Setup | “Connect your MCP server to see how it is being used.” | Configure/onboarding |

## Route compatibility

The visible labels can change without breaking existing routes. Preserve:

- `/dashboard` for Overview;
- `/dashboard/traces` for Evidence/Trace Explorer;
- existing `view=trace` URLs;
- existing `view`, `range`, `data`, `session_id`, `correlation_handle`, and `origin` query state;
- back/forward behavior and shareable filter state.

Proposed route aliases, if later implemented:

| Preferred route | Existing route compatibility |
| --- | --- |
| `/dashboard/adoption` | `view=clients` and relevant existing client links |
| `/dashboard/journeys` | `view=workflows` and `view=outcomes` |
| `/dashboard/quality` | `view=tool-quality` and `view=reliability` |
| `/dashboard/issues` | future aggregation over reliability, quality, gaps, and alerts |
| `/dashboard/evidence` | `/dashboard/traces`, `view=trace` |
| `/dashboard/capabilities` | `view=tools` and `view=catalog` |
| `/dashboard/setup` | `view=settings`, onboarding route |

Aliases should be additive. Do not remove or rewrite legacy URLs in the design phase.

## Shell hierarchy

**Top rail:** workspace name, environment if available, page title and purpose on the left; `Your data / Example data`, date range, refresh, and account on the right.

**Left rail:** five primary jobs, then `More`, then Setup/account at the bottom.

**Page body:** one focal answer, then supporting context, then technical disclosure.

## Drill-down model

Every action carries forward workspace, date range, data source, selected client/capability/journey, origin page, and back destination. A business issue opens its explanation first; `Open evidence` reveals the technical event layer. Evidence never becomes the default home screen.
