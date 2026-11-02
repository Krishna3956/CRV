import type { Block } from "./posts";

type ComparisonEntry = {
  name: string;
  paragraphs: string[];
  links?: { label: string; href: string }[];
};

export type Wave2Comparison = {
  heading: string;
  intro: string;
  entries: ComparisonEntry[];
  trackmcp: ComparisonEntry;
};

const entry = (name: string, paragraphs: string[], links?: { label: string; href: string }[]): ComparisonEntry => ({ name, paragraphs, links });

export const wave2Comparisons: Record<string, Wave2Comparison> = {
  "best-mcp-testing-debugging-tools": {
    heading: "How the main MCP testing options fit",
    intro: "MCP testing tools answer different questions. The useful comparison is not which product has the longest integration list. It is whether the tool can reproduce the failure you need to understand, turn that case into a repeatable check, and preserve enough evidence for a release decision.",
    trackmcp: entry("TrackMCP", [
      "TrackMCP is not a test runner. It is the production evidence layer for the MCP server boundary. After a fixture passes in a local harness, TrackMCP shows what real clients discovered and called, how long those calls took, whether a valid protocol response contained an application error, and where an observed workflow stopped.",
      "That makes TrackMCP useful after a test rather than instead of a test. Use a deterministic runner to create the case, then use TrackMCP to see whether the same server behavior appears in production and to turn a production regression into a stable fixture. The SDK records bounded, privacy-aware server signals and does not claim to see private model reasoning or every host-side event.",
    ], [
      { label: "TrackMCP MCP observability", href: "/mcp-observability" },
      { label: "TrackMCP testing tools", href: "/tools/mcp-server-tester" },
      { label: "Production observability comparison", href: "/blog/best-mcp-observability-tools-for-production-servers" },
    ]),
    entries: [
      entry("MCP Inspector", [
        "MCP Inspector is the fastest way to look directly at a server while developing or reproducing one failure. It lets an engineer inspect initialization, capabilities, tool discovery, schemas, arguments, and returned results without first building a large test harness.",
        "Inspector is strongest as an interactive diagnosis tool. A successful manual call is not a CI contract, a load test, or proof that the user's workflow completed. Preserve the request, server version, protocol revision, and result evidence when converting an Inspector finding into an automated case.",
      ], [{ label: "MCP Inspector repository", href: "https://github.com/modelcontextprotocol/inspector" }]),
      entry("MCP Conformance", [
        "The official MCP conformance work is for machine-checkable protocol requirements. It is the right option when a team needs a pinned requirement set for initialization, lifecycle messages, transports, schemas, or scenario behavior in CI.",
        "Conformance does not know whether business data is correct, whether authorization protected a write, whether a dependency was slow, or whether a user task completed. Keep its result separate from application contract, reliability, security, and outcome tests.",
      ], [{ label: "MCP conformance repository", href: "https://github.com/modelcontextprotocol/conformance" }]),
      entry("Postman MCP", [
        "Postman is useful when the team wants shareable request collections, environments, assertions, and reviewable fixtures. It gives developers, QA, and support teams a familiar place to reproduce initialization and tool-call requests.",
        "A collection validates the request and response that you put in the case. It does not automatically evaluate agent tool choice, side effects, concurrency, catalog drift, or long-window production behavior. Treat the collection as a reusable fixture, not a complete MCP quality program.",
      ], [{ label: "Postman MCP guide", href: "https://www.postman.com/explore/mcp" }]),
      entry("Promptfoo", [
        "Promptfoo is a better fit when the test question includes model or agent behavior. Its MCP provider and evaluation workflows can compare tool selection, argument formation, refusal behavior, prompt injection resistance, and expected assertions across scenarios.",
        "The quality of an evaluation depends on the dataset, grader, and expected outcome. Promptfoo does not replace protocol conformance, server authorization, load testing, or server runtime telemetry. A passing agent case can still fail when the deployed catalog or dependency changes.",
      ], [{ label: "Promptfoo MCP provider documentation", href: "https://www.promptfoo.dev/docs/providers/mcp/" }]),
      entry("MCPJam", [
        "MCPJam is useful for MCP-specific interactive and scenario testing where available tools, arguments, and agent behavior need to be inspected together. It is a practical bridge between a manual reproduction and a larger evaluation suite.",
        "The harness still needs pinned clients, servers, models, fixtures, and expected outcomes. It can show that a scenario failed, but it cannot explain an uninstrumented production server or establish that the same failure is affecting real users.",
      ]),
    ],
  },
  "best-mcp-security-scanners-tool-poisoning": {
    heading: "How the main MCP security options fit",
    intro: "MCP security is not one scanner category. Source analysis, dependency analysis, runtime policy, adversarial testing, and production evidence cover different parts of the attack surface. A useful shortlist makes those boundaries explicit.",
    trackmcp: entry("TrackMCP", [
      "TrackMCP is not a security scanner or authorization gateway. It gives the server owner evidence about what happened after a security control shipped: which client reached the server, which catalog and tool were exposed, how the call behaved, whether a result contained an error, and whether retries or an unknown side effect followed.",
      "That evidence is valuable for security operations because it turns a finding into a production question. If a scanner flags a risky tool description or a dependency changes, TrackMCP can show whether the affected tool is being called, by which clients, with what error and latency pattern. Sensitive arguments and results remain bounded and redacted according to the server's policy.",
    ], [
      { label: "TrackMCP security", href: "/security" },
      { label: "TrackMCP production observability comparison", href: "/blog/best-mcp-observability-tools-for-production-servers" },
    ]),
    entries: [
      entry("Semgrep", [
        "Semgrep is a source-analysis choice for teams that want project-specific rules over server code, configuration, and data flows. It can help find unsafe input handling, secret exposure, authorization gaps, and dangerous sinks before a server is deployed.",
        "Static analysis cannot see every runtime tool description, identity decision, downstream side effect, or catalog change. Treat a clean result as evidence about the scanned source and rules, not as a statement that the live MCP endpoint is safe for every client and user.",
      ], [{ label: "Semgrep documentation", href: "https://semgrep.dev/docs/" }]),
      entry("Snyk Open Source", [
        "Snyk Open Source is useful for dependency and package risk. It helps teams identify known vulnerabilities, license issues, and upgrade paths in the libraries that build and run an MCP server.",
        "Dependency status is only one input to MCP security. A server can have current packages and still expose an overbroad tool, leak a secret in a result, or trust a poisoned description. Pair package review with runtime policy and adversarial fixtures.",
      ], [{ label: "Snyk Open Source", href: "https://snyk.io/product/open-source-security-management/" }]),
      entry("Socket", [
        "Socket is aimed at package behavior and supply chain review that version-only vulnerability databases may miss. It is useful when install scripts, package permissions, or suspicious package activity deserve review before a server release.",
        "Package behavior analysis is not an MCP protocol verdict and it is not a tool-poisoning proof. Review the actual tool contract, credentials, egress policy, and runtime behavior of the server that depends on the package.",
      ], [{ label: "Socket security", href: "https://socket.dev/" }]),
      entry("Runtime policy gateway", [
        "A runtime gateway is the right control when the team needs request-time identity, per-tool authorization, quotas, egress restrictions, tenant isolation, and an audit decision before a call reaches a server.",
        "The gateway may prove that a request was allowed or denied without explaining a downstream handler failure or a valid result containing an application error. Test the policy decision and preserve the server-side evidence separately. The gateway owns enforcement; it does not automatically own business meaning.",
      ], [{ label: "OWASP MCP authorization research", href: "https://github.com/OWASP/AISVS/blob/main/1.0/research/chapters/C10-MCP-Security/C10-02-Authentication-Authorization.md" }]),
      entry("Red-team MCP harness", [
        "A red-team harness is for deliberately trying tool poisoning, hidden instructions, confused-deputy behavior, replay, SSRF, unsafe egress, and destructive side effects in a disposable environment. Its value is the reproducible fixture and the proof that a control or human approval stopped the action.",
        "A red-team run has a defined scope. Passing one set of fixtures does not establish safety for every client, user, catalog version, identity, or deployment topology. Record the exact fixture, expected control, observed evidence, and regression test after remediation.",
      ]),
    ],
  },
  "best-mcp-gateways-production-security-observability": {
    heading: "How the main MCP gateway options fit",
    intro: "The label gateway is used for MCP-aware proxies, broad AI gateways, API policy planes, registries with routing, and direct deployments with no intermediary. Compare the actual control surface rather than the product label.",
    trackmcp: entry("TrackMCP", [
      "TrackMCP is not a gateway. It does not route traffic, broker credentials, or make an authorization decision. It instruments the MCP server boundary so an operator can see what the downstream server actually exposed and executed after a gateway allowed a request or a client connected directly.",
      "This is useful when a gateway makes a call look healthy while hiding downstream time, result-level errors, retries, or catalog drift. TrackMCP separates connection, catalog, tool, result, and outcome evidence so the gateway team and server team can investigate the same request without assigning every failure to the proxy.",
    ], [
      { label: "TrackMCP production observability comparison", href: "/blog/best-mcp-observability-tools-for-production-servers" },
      { label: "OpenTelemetry MCP attributes", href: "https://opentelemetry.io/docs/specs/semconv/registry/attributes/mcp/" },
    ]),
    entries: [
      entry("Dedicated MCP policy gateway", [
        "A dedicated MCP policy gateway is the most direct option when the organization needs centralized routing, downstream server identity, per-tool authorization, credential brokering, quotas, and MCP-aware audit events across a fleet.",
        "The evaluation should test a discoverable but unauthorized tool, a slow downstream server, a changed catalog, a retry, and a tenant-isolation case. The gateway is only useful if it preserves enough downstream context to explain what happened after the policy decision.",
      ]),
      entry("Cloudflare AI Gateway", [
        "Cloudflare AI Gateway is relevant to teams that already use Cloudflare for edge routing, authentication, rate limiting, and broader AI traffic visibility. It can be a sensible control plane when the edge is already the place where traffic policy is operated.",
        "Its broader AI scope does not automatically prove MCP lifecycle, tool-level policy, or server-boundary observability. Validate MCP transport support and downstream error preservation for the exact deployment instead of assuming generic AI gateway behavior is equivalent to MCP gateway behavior.",
      ], [{ label: "Cloudflare AI Gateway", href: "https://developers.cloudflare.com/ai-gateway/" }]),
      entry("Kong AI Gateway", [
        "Kong AI Gateway is a fit for organizations that already operate Kong plugins, identity, quotas, routing, and centralized API policy. It can provide a familiar edge and policy plane around MCP traffic.",
        "Generic API success is not MCP task success. Confirm initialization, capability discovery, tool authorization, cancellation, result errors, and downstream server identity explicitly. The more policy is adapted from generic APIs, the more important the MCP-specific test fixture becomes.",
      ], [{ label: "Kong AI Gateway", href: "https://konghq.com/products/kong-ai-gateway" }]),
      entry("Gateway plus registry", [
        "A gateway plus registry combines discovery, ownership, environment, version, route, and access policy in one control plane. This is attractive for teams that want a catalog to drive deployment and policy rather than treating discovery as a separate directory step.",
        "The registry record remains a declared claim. It does not prove that the live endpoint still exposes the same tools, permissions, or version. Test the gap between the catalog and observed traffic after every material release.",
      ]),
      entry("Direct client to server", [
        "Direct connections can be the simplest choice for a small trusted deployment where a gateway would add another identity, routing, and failure boundary. The server can own authentication, authorization, execution, and local telemetry directly.",
        "The tradeoff is fleet-wide policy, credential brokering, tenant isolation, and shared audit work. Direct does not mean ungoverned, but the application and platform teams must own controls that a gateway would otherwise centralize.",
      ]),
    ],
  },
  "best-mcp-registries-marketplaces": {
    heading: "How the main MCP registry and marketplace options fit",
    intro: "A package registry, community directory, hosted marketplace, and internal operational catalog are not the same product. Compare the discovery job, provenance, verification, versioning, hosting, and the evidence available after a server is connected.",
    trackmcp: entry("TrackMCP", [
      "TrackMCP is not a public registry or marketplace. Its role begins after a server is selected and deployed. It records the observed catalog, connections, client context, tool calls, result state, latency, and usage patterns that tell an owner whether the live server still matches the claim made by a listing.",
      "That distinction matters because a directory record is static or publisher-controlled while a production endpoint changes. Use a registry to help users discover a candidate, then use TrackMCP to understand what real clients actually reach and where the server's behavior differs from its intended contract.",
    ], [
      { label: "TrackMCP governance and inventory", href: "/blog/mcp-server-governance-inventory-ownership-access" },
      { label: "TrackMCP production observability comparison", href: "/blog/best-mcp-observability-tools-for-production-servers" },
    ]),
    entries: [
      entry("Official MCP Registry", [
        "The official MCP Registry is the right reference point when the question is machine-readable package metadata and ecosystem publication. It is useful for resolving names, packages, versions, and publisher-controlled records in a standard location.",
        "A registry record describes a package or claim. It does not prove that a deployed endpoint is healthy, authorized for your tenant, or unchanged from the published version. Production adoption still needs source review, permissions review, and runtime evidence.",
      ], [{ label: "Official MCP Registry", href: "https://registry.modelcontextprotocol.io/" }]),
      entry("Glama", [
        "Glama is a discovery-oriented directory for browsing MCP servers, documentation, publisher context, and ecosystem links. It is useful for building an initial candidate set and understanding how a server is described to developers.",
        "Directory freshness and verification depth need independent review before production use. Follow the link to the source repository, inspect permissions and release activity, and verify the live catalog after installation.",
      ], [{ label: "Glama MCP directory", href: "https://glama.ai/mcp/servers" }]),
      entry("Smithery", [
        "Smithery is focused on MCP server discovery and distribution workflows. It can reduce the friction between finding a server and connecting a client to it, which is valuable during development and ecosystem exploration.",
        "The install or connection path is not a substitute for production ownership, least privilege, secret handling, or monitoring. Treat distribution metadata and live server behavior as separate evidence that must be checked.",
      ], [{ label: "Smithery MCP directory", href: "https://smithery.ai/" }]),
      entry("Metorial", [
        "Metorial is relevant to teams looking for a managed catalog and access path across many MCP integrations. A managed layer can reduce one-off integration work and provide a consistent connection experience.",
        "It also adds an identity, routing, and data-handling boundary. Verify tenancy, permissions, freshness, support ownership, and what evidence remains available to the server owner when a call passes through the managed service.",
      ], [{ label: "Metorial MCP platform", href: "https://metorial.com/" }]),
      entry("PopMCP", [
        "PopMCP is useful as a community discovery surface for finding examples and early ecosystem candidates. It can help a developer understand which server categories exist and where to look next.",
        "Community listings vary in provenance and verification. Use them as leads rather than production certification, then inspect the project source, license, authentication, tool side effects, and release history yourself.",
      ], [{ label: "PopMCP directory", href: "https://popmcp.com/" }]),
    ],
  },
  "best-mcp-load-reliability-testing-tools": {
    heading: "How the main MCP load and reliability testing options fit",
    intro: "MCP load testing is not just sending more HTTP requests. A meaningful test models initialization, discovery, tool calls, result-level errors, retries, cancellations, dependencies, and side-effect safety, then compares synthetic behavior with production.",
    trackmcp: entry("TrackMCP", [
      "TrackMCP does not generate load. Its value is measuring what the server and its users experienced while a load runner created pressure. It can separate connection and discovery behavior, tool duration, result-level errors, retries, timeouts, client context, and explicit outcomes by server and tool.",
      "Use a load runner to answer how the system behaves under a controlled workload, then use TrackMCP to answer whether the same reliability characteristics appear with real client mix and real dependencies. That prevents a green synthetic test from hiding a production regression or a tool that fails only for one client.",
    ], [
      { label: "TrackMCP production observability comparison", href: "/blog/best-mcp-observability-tools-for-production-servers" },
      { label: "MCP server SLOs", href: "/blog/mcp-server-slos" },
    ]),
    entries: [
      entry("Grafana k6", [
        "Grafana k6 is a strong choice for versioned scripts, arrival rates, concurrency, thresholds, and repeatable performance runs. It works well when performance cases need to live beside code and produce a machine-readable release result.",
        "The script must model the MCP lifecycle. A generic request check can miss discovery cost, a valid response containing an application error, cancellation, duplicate writes, or the difference between gateway time and server time.",
      ], [{ label: "Grafana k6 documentation", href: "https://grafana.com/docs/k6/latest/" }]),
      entry("Locust", [
        "Locust fits teams that prefer Python scenarios and user-shaped task flows with explicit state, waits, ramping, and distributed workers. It is useful for modeling sequences such as connect, discover, call, retry, and reconcile.",
        "The MCP lifecycle and result semantics remain the test author's responsibility. A request count is not a reliability model unless the scenario defines the expected result, side effect, and safe behavior after timeout or cancellation.",
      ], [{ label: "Locust documentation", href: "https://docs.locust.io/" }]),
      entry("Artillery", [
        "Artillery is useful for readable YAML or JavaScript scenarios, phased arrival rates, distributed execution, and checks across a broader performance stack. It works well when the test needs to be reviewed by both engineers and operators.",
        "Validate the MCP transport and lifecycle explicitly. A generic success assertion can report a green run while the server returns an application error inside a valid result or while an unknown side effect continues after the client timeout.",
      ], [{ label: "Artillery documentation", href: "https://www.artillery.io/docs" }]),
      entry("MCPTest", [
        "MCPTest is useful for fast remote checks of endpoint reachability, discovery, and basic behavior before a team invests in a full workload model. It can shorten the path from a remote URL to a reproducible first failure.",
        "A remote preflight is not a production reliability program. It does not replace your workload, tenant policy, side-effect fixture, saturation run, or long-window evidence from the clients that actually use the server.",
      ], [{ label: "MCPTest remote testing comparison", href: "https://mcptest.io/learn/best-remote-mcp-testing-tools" }]),
      entry("MCP Inspector", [
        "MCP Inspector belongs at the beginning of a reliability test because it helps the team understand the wire behavior and build a correct fixture. Use it to inspect the tool contract, result shape, and error cases before asking a load runner to scale the scenario.",
        "Inspector is not a concurrency or saturation tool. It can prove that one request is understandable; it cannot prove queue behavior, dependency exhaustion, retry amplification, or production client mix.",
      ], [{ label: "MCP Inspector repository", href: "https://github.com/modelcontextprotocol/inspector" }]),
    ],
  },
  "best-mcp-servers-monitoring-observability-data": {
    heading: "How the main MCP monitoring and observability data options fit",
    intro: "A monitoring MCP server can expose existing telemetry to an agent, while an observability product instruments the server that handles MCP calls. These are different jobs. Compare the data source, access path, permissions, freshness, and evidence boundary.",
    trackmcp: entry("TrackMCP", [
      "TrackMCP observes the MCP server boundary itself. It answers which clients connected, what catalog they saw, which tools were called, how long those calls took, whether a result carried an application error, and whether the application emitted a workflow outcome.",
      "It does not replace Grafana, Datadog, Sentry, New Relic, Langfuse, or Phoenix as a general telemetry store or agent-trace system. Its value is the missing join between those systems: the server-side MCP event that proves what the endpoint actually received and returned.",
    ], [
      { label: "TrackMCP production observability comparison", href: "/blog/best-mcp-observability-tools-for-production-servers" },
      { label: "TrackMCP server analytics", href: "/mcp-server-analytics" },
    ]),
    entries: [
      entry("Grafana MCP observability", [
        "Grafana is a good fit for teams that already operate metrics, logs, traces, dashboards, and incident workflows in Grafana. An MCP access path can let an agent query existing evidence, while Grafana dashboards and OpenTelemetry integrations give operators a broader view.",
        "The MCP interface does not create missing instrumentation. It also introduces query permissions and data exposure questions. Keep read access narrow, test freshness and result limits, and distinguish a successful query from a healthy MCP server.",
      ], [{ label: "Grafana MCP observability", href: "https://grafana.com/docs/grafana-cloud/observe-and-act/monitor-applications/ai-observability/mcp-observability/" }]),
      entry("Datadog MCP server", [
        "Datadog fits organizations that already use Datadog for infrastructure, APM, logs, traces, security, and incident operations. An agent-facing MCP path can make that existing operational evidence queryable through governed tools.",
        "The access path still needs least privilege, query bounds, freshness checks, and sensitive-result protection. Datadog data can explain a dependency or application error, but it does not automatically preserve every MCP catalog, client, result-state, or workflow dimension.",
      ], [{ label: "Datadog MCP server documentation", href: "https://docs.datadoghq.com/mcp_server/" }]),
      entry("Sentry MCP", [
        "Sentry is a strong choice when application exceptions, releases, traces, and issue workflows are the center of the investigation. A Sentry MCP path can help an agent inspect the error context that an operator already trusts.",
        "Error evidence alone may not show which MCP client called which tool, what catalog was exposed, or whether the workflow completed. Add deliberate MCP fields or correlate the error with a server-boundary source before treating the issue as fully explained.",
      ], [{ label: "Sentry MCP monitoring cookbook", href: "https://sentry.io/cookbook/monitor-mcp-server/" }]),
      entry("New Relic Ground Truth MCP", [
        "New Relic Ground Truth MCP is relevant to teams that use New Relic telemetry and incident workflows as their operational source of truth. It can make existing metrics, logs, traces, and service context available to an agent through governed MCP tools.",
        "A successful monitoring query does not prove that the MCP server was fast, authorized, fresh, or complete. Measure the MCP access path separately from the query result and define what data an agent is allowed to retrieve or mutate.",
      ], [{ label: "New Relic Ground Truth MCP", href: "https://docs.newrelic.com/docs/agentic-ai/mcp/overview/" }]),
      entry("Langfuse", [
        "Langfuse is useful when the investigation starts with generations, agent spans, prompts, evaluations, feedback, and cost, and then follows the path into tool use. Its trace model can explain why an agent took a path and how an evaluation changed.",
        "An agent trace is not automatically a complete MCP server trace. It may omit transport failures, catalog drift, server handler details, or result-level application errors. Treat the agent system and the MCP server as complementary evidence boundaries.",
      ], [{ label: "Langfuse agents documentation", href: "https://langfuse.com/agents" }]),
      entry("Arize Phoenix", [
        "Arize Phoenix is a useful option for open-source LLM and agent observability, evaluation, and OpenTelemetry-friendly traces. It helps teams inspect model and agent behavior alongside retrieval and tool spans.",
        "Phoenix does not automatically become the source of truth for server authorization, catalog freshness, or side-effect completion. Verify where the trace stops and join it to server-boundary evidence for MCP-specific diagnosis.",
      ], [{ label: "Arize Phoenix documentation", href: "https://arize.com/docs/phoenix/" }]),
    ],
  },
  "best-mcp-agent-evaluation-tool-selection-tools": {
    heading: "How the main MCP agent evaluation options fit",
    intro: "Agent evaluation is not the same as protocol testing. The evaluation unit can be a tool call, a tool-selection decision, a multi-step task, or a side-effecting workflow. Compare platforms by the unit they can score and the evidence they retain.",
    trackmcp: entry("TrackMCP", [
      "TrackMCP is the production counterpart to an offline agent evaluation. It does not grade a model or decide whether a final answer is good. It shows what the evaluated agent actually caused at the MCP server boundary: which client connected, which catalog was available, which tool was called, what result came back, and whether an explicit outcome was emitted.",
      "Use TrackMCP to investigate the gap between an offline pass and live behavior. A model can select the right tool in a fixture but encounter a changed catalog, slow dependency, authorization denial, or application error after deployment. Those server facts belong beside the evaluation score, not inside it.",
    ], [
      { label: "TrackMCP production observability comparison", href: "/blog/best-mcp-observability-tools-for-production-servers" },
      { label: "TrackMCP tool analytics", href: "/mcp-tool-analytics" },
    ]),
    entries: [
      entry("LangSmith", [
        "LangSmith fits teams that need datasets, traces, evaluators, feedback, and regression workflows around LangChain or broader agent applications. It is useful for comparing model, prompt, chain, and tool-use changes against a known set of cases.",
        "The evaluation still needs explicit MCP assertions. A trace can show that a tool was selected and return a score without proving protocol conformance, authorization, downstream state, or safe side-effect handling on the server.",
      ], [{ label: "LangSmith observability tutorial", href: "https://docs.langchain.com/langsmith/observability-llm-tutorial" }]),
      entry("Langfuse", [
        "Langfuse is a strong choice for trace-based datasets, scores, prompt and generation context, human review, and evaluation workflows that can be self-hosted or integrated with an existing AI application.",
        "Define the MCP-specific contract yourself: correct tool, valid arguments, interpretation of result errors, recovery, policy compliance, and workflow outcome. Trace presence alone is not task success, and a high average score should not hide a critical safety failure.",
      ], [{ label: "Langfuse agents documentation", href: "https://langfuse.com/agents" }]),
      entry("Arize Phoenix", [
        "Arize Phoenix is useful when an evaluation program wants open telemetry, traces, spans, and analysis around LLM or agent workflows. It can help inspect retrieval, model output, and tool-use behavior with an open-source posture.",
        "The team still has to decide where the MCP server boundary is and how a result-level error differs from a transport failure. Join Phoenix traces to server evidence rather than assuming the agent trace contains every downstream fact.",
      ], [{ label: "Arize Phoenix documentation", href: "https://arize.com/docs/phoenix/" }]),
      entry("Braintrust", [
        "Braintrust is relevant when product teams need experiments, datasets, graders, feedback, and release comparisons for agent behavior. It can make changes to prompts, models, and tool policies easier to review against a repeatable evaluation set.",
        "A grader is only as meaningful as the expected outcome and safety gate behind it. Keep server authorization, side effects, and reconciliation as explicit checks instead of averaging them into a single quality number.",
      ], [{ label: "Braintrust evaluation documentation", href: "https://www.braintrust.dev/docs" }]),
      entry("Promptfoo", [
        "Promptfoo is a practical choice for matrix tests, assertions, prompt injection cases, refusal behavior, and provider comparisons. Its MCP provider makes tool-use cases easier to include in a broader prompt and red-team suite.",
        "It remains an evaluation harness, not a production telemetry or authorization layer. Keep datasets versioned, pin server and client versions, and promote reproducible production failures into regression cases.",
      ], [{ label: "Promptfoo MCP provider documentation", href: "https://www.promptfoo.dev/docs/providers/mcp/" }]),
      entry("MCPJam", [
        "MCPJam is useful for MCP-specific interactive and scenario testing where tool availability, arguments, and agent behavior are all part of the case. It can help teams understand a failure before formalizing the fixture.",
        "The expected outcome, model, client, catalog, and server version still need to be recorded. Do not treat an interactive pass as proof of production behavior or complete task success.",
      ]),
    ],
  },
  "mcp-observability-benchmark-2026": {
    heading: "The tools and dimensions used in a reproducible MCP benchmark",
    intro: "This page is a benchmark methodology, not an invented vendor ranking. Each option below has a distinct job in producing a result that another team can reproduce, audit, and compare with production evidence.",
    trackmcp: entry("TrackMCP", [
      "TrackMCP is the production comparison layer for the benchmark. It can show whether controlled measurements of connection health, discovery, tool latency, result errors, retries, and outcomes resemble what real clients experience after the release.",
      "It should not be used to manufacture a vendor score. Publish the fixture, workload, protocol revision, client versions, privacy rules, and raw result schema first. Then use TrackMCP to state where the benchmark agrees with or diverges from live behavior and where the method stops proving something.",
    ], [
      { label: "TrackMCP production observability comparison", href: "/blog/best-mcp-observability-tools-for-production-servers" },
      { label: "OpenTelemetry MCP semantic conventions", href: "https://opentelemetry.io/docs/specs/semconv/registry/attributes/mcp/" },
    ]),
    entries: [
      entry("Grafana k6", [
        "Use k6 when the benchmark needs versioned workload scripts, controlled arrival rates, thresholds, latency distributions, and repeatable runs. Keep the benchmark code in the same review path as the service change so fixture drift is visible.",
        "k6 measures the workload you generate. It does not define MCP semantics for you. The script must classify connection, discovery, tool, result, timeout, retry, cancellation, and outcome events rather than reducing every response to HTTP success.",
      ], [{ label: "Grafana k6 documentation", href: "https://grafana.com/docs/k6/latest/" }]),
      entry("Locust", [
        "Use Locust when a benchmark needs Python-defined user state and task sequences. It is well suited to modeling a client that connects, discovers a catalog, calls a read tool, encounters a slow dependency, and performs a safe retry or reconciliation step.",
        "The result is only comparable when the scenarios, warm-up, concurrency, dependencies, and expected outcomes are held constant. Publish the code and environment instead of presenting a single run as a universal ranking.",
      ], [{ label: "Locust documentation", href: "https://docs.locust.io/" }]),
      entry("Artillery", [
        "Artillery is useful for phased scenarios, arrival rates, distributed execution, and readable checks that can be reviewed by performance and operations teams. It can be a good fit for a benchmark that needs multiple traffic phases and explicit service-level assertions.",
        "Generic checks are not enough for MCP. Record the protocol revision, transport, catalog, result state, retries, and side-effect fixture so a performance result can be interpreted without guessing which boundary failed.",
      ], [{ label: "Artillery documentation", href: "https://www.artillery.io/docs" }]),
      entry("OpenTelemetry", [
        "OpenTelemetry gives the benchmark a portable way to carry trace context, service identity, span timing, and MCP semantic attributes across a gateway, server, and dependency. It is useful when results must be examined in more than one backend.",
        "Instrumentation is not a benchmark result. Define each field before collection, document missing or unsupported fields, and make sure the mapping preserves the distinction between transport errors and valid results containing application errors.",
      ], [{ label: "OpenTelemetry MCP semantic conventions", href: "https://opentelemetry.io/docs/specs/semconv/registry/attributes/mcp/" }]),
      entry("MCPTest", [
        "MCPTest can be useful as a remote compatibility and reachability preflight before a full benchmark. It helps establish that an endpoint is reachable, discoverable, and suitable for deeper fixture work.",
        "A preflight cannot establish saturation behavior, tenant policy, workflow completion, or long-window reliability. Keep it as a baseline check and publish the more complete workload and limitations separately.",
      ], [{ label: "MCPTest remote testing comparison", href: "https://mcptest.io/learn/best-remote-mcp-testing-tools" }]),
    ],
  },
  "mcp-failure-taxonomy-diagnostic-matrix": {
    heading: "How the main diagnostic evidence options fit",
    intro: "A diagnostic matrix becomes useful when every failure category has a boundary, evidence source, owner, and safe next action. The tools below are complementary because no single system sees the whole MCP request path.",
    trackmcp: entry("TrackMCP", [
      "TrackMCP gives the matrix a server-boundary evidence source. It can identify the client and server context, observed catalog, tool call, duration, result-level error, retry, timeout, and explicit outcome signal that belong to the MCP request itself.",
      "That evidence helps an operator distinguish a transport failure from a handler failure, a client refusal from a server outage, and a returned result from a completed workflow. TrackMCP still does not own model reasoning, infrastructure logs, or every downstream dependency detail, so the matrix should name those missing sources rather than infer them.",
    ], [
      { label: "TrackMCP production observability comparison", href: "/blog/best-mcp-observability-tools-for-production-servers" },
      { label: "MCP tool error guide", href: "/blog/how-to-debug-mcp-tool-errors" },
    ]),
    entries: [
      entry("MCP Inspector", [
        "Use MCP Inspector when the first question is protocol or catalog evidence: did initialization complete, what capabilities were negotiated, which tools were exposed, and what did one request return? It is often the fastest way to turn a vague report into a concrete reproduction.",
        "Inspector cannot provide long-window frequency, tenant scope, or fleet behavior. Record its request and response as a fixture, then use the deployed evidence source to determine whether the failure is isolated or recurring.",
      ], [{ label: "MCP Inspector repository", href: "https://github.com/modelcontextprotocol/inspector" }]),
      entry("Sentry", [
        "Sentry is the right evidence source when the suspected boundary is an application exception, release regression, or dependency failure inside the handler. Stack traces, issue grouping, release context, and breadcrumbs can explain why a server returned a failure.",
        "An exception event may not contain the MCP catalog, client, policy decision, or result state. Add those fields deliberately or join the event to MCP-boundary telemetry before declaring the diagnosis complete.",
      ], [{ label: "Sentry MCP monitoring cookbook", href: "https://sentry.io/cookbook/monitor-mcp-server/" }]),
      entry("Datadog", [
        "Datadog is useful when the diagnostic question spans service health, logs, metrics, traces, dependencies, and infrastructure. It can show whether a deployment, host, network, or downstream dependency changed at the same time as the MCP failure.",
        "A healthy service metric can coexist with a failing tool or a valid result containing an application error. Keep MCP-specific dimensions visible so broad operational evidence does not flatten the failure into a generic red request count.",
      ], [{ label: "Datadog MCP server documentation", href: "https://docs.datadoghq.com/mcp_server/" }]),
      entry("OpenTelemetry", [
        "OpenTelemetry is useful when the matrix needs a portable trace context across gateway, MCP server, and dependencies. Stable trace and span relationships make it easier to follow a request without assuming one backend owns every signal.",
        "The convention does not diagnose the incident automatically. Define field meaning, propagation, redaction, and sampling, then connect the trace to a runbook that says whether to inspect, retry, reconcile, roll back, or escalate.",
      ], [{ label: "OpenTelemetry MCP attributes", href: "https://opentelemetry.io/docs/specs/semconv/registry/attributes/mcp/" }]),
      entry("Runbook and reconciliation check", [
        "A runbook is the operational option that decides what should happen after the evidence is classified. It should name the owner, alert threshold, idempotency or reconciliation rule, retry behavior, and user-facing explanation for each category.",
        "This is especially important after a write timeout. Treat the side effect as unknown until downstream state, an idempotency key, or a safe read establishes what happened. No dashboard can make an unsafe blind retry safe by itself.",
      ]),
    ],
  },
  "mcp-telemetry-field-map-opentelemetry": {
    heading: "How the main MCP telemetry field sources fit",
    intro: "A field map is useful only when it says who owns each field and what that field proves. The options below cover portable trace context, server-boundary semantics, application errors, service context, and agent behavior.",
    trackmcp: entry("TrackMCP", [
      "TrackMCP owns the MCP server-boundary fields: connection and negotiation context, observed catalog, client and server identity, tool call, duration, result state, error classification, retry or timeout context, and explicit workflow outcome where the application emits one.",
      "Those fields are not a replacement for every application span or model trace. They are the MCP-specific join that lets an operator answer what the server received and returned without claiming to see private reasoning, hidden provider behavior, or a final answer that the server never observed.",
    ], [
      { label: "TrackMCP MCP observability", href: "/mcp-observability" },
      { label: "TrackMCP production comparison", href: "/blog/best-mcp-observability-tools-for-production-servers" },
    ]),
    entries: [
      entry("OpenTelemetry", [
        "OpenTelemetry owns the portable context layer. It carries trace identity, span relationships, service identity, timing, and semantic attributes across gateways, MCP servers, and dependencies so a team can export the evidence to the backend it operates.",
        "It does not guarantee that the implementation captured the MCP lifecycle correctly or that a field has the same meaning across products. Define the fields first, instrument the boundary that owns them, and test the mapping with real fixtures.",
      ], [{ label: "OpenTelemetry MCP semantic conventions", href: "https://opentelemetry.io/docs/specs/semconv/registry/attributes/mcp/" }]),
      entry("Sentry", [
        "Sentry owns exception and release context: stack traces, issue grouping, breadcrumbs, release correlation, and application trace detail. These fields are valuable when a tool handler or dependency throws an error that needs a code-level owner.",
        "Sentry does not automatically own the MCP catalog, client decision, policy result, or explicit workflow outcome. Preserve those fields at the MCP boundary and correlate them instead of overloading an exception event with unsupported meaning.",
      ], [{ label: "Sentry MCP monitoring cookbook", href: "https://sentry.io/cookbook/monitor-mcp-server/" }]),
      entry("Datadog", [
        "Datadog owns broad operational context across services, logs, metrics, traces, infrastructure, and incidents. It is useful when a telemetry field map needs to answer whether a tool failure coincided with a host, deploy, database, queue, or network condition.",
        "Broad context can still miss catalog drift, result-level errors, and client-specific behavior unless the MCP fields are deliberately added. Keep the MCP event semantics stable when exporting them into a general backend.",
      ], [{ label: "Datadog MCP server documentation", href: "https://docs.datadoghq.com/mcp_server/" }]),
      entry("Langfuse", [
        "Langfuse owns agent and generation context such as traces, observations, prompts, evaluations, feedback, and cost. It is useful for connecting a model or agent decision to the tool call that followed it.",
        "The agent trace may stop before the server receives the request or omit the server result and downstream dependency. Treat model intent and MCP execution as separate fields joined by a stable, privacy-safe correlation ID.",
      ], [{ label: "Langfuse agents documentation", href: "https://langfuse.com/agents" }]),
      entry("Arize Phoenix", [
        "Arize Phoenix is useful for open-source LLM and agent traces, evaluations, and OpenTelemetry-compatible analysis. It can provide the model and application side of a field map when an agent workflow is the primary unit of investigation.",
        "Phoenix should not be treated as proof of server authorization, catalog freshness, or side-effect completion. Add the server-owned fields explicitly and record when a field is unavailable rather than substituting an inferred value.",
      ], [{ label: "Arize Phoenix documentation", href: "https://arize.com/docs/phoenix/" }]),
    ],
  },
  "mcp-server-reliability-scorecard": {
    heading: "How the main MCP reliability scorecard inputs fit",
    intro: "A scorecard should expose its raw measures and its hard gates. The options below support different dimensions of reliability and should not be collapsed into one unexplained vendor score.",
    trackmcp: entry("TrackMCP", [
      "TrackMCP supplies the production reliability evidence: connection health, catalog drift, tool duration, result-level errors, retries, timeouts, client breakdowns, and explicit outcomes over a real traffic window. Those measures show how the server behaves after the controlled test has ended.",
      "TrackMCP should remain a separately reported scorecard dimension. It cannot establish protocol conformance, generate load, or grade a model's final answer, and a critical safety or unknown-side-effect failure should never be averaged away by good latency numbers.",
    ], [
      { label: "TrackMCP production comparison", href: "/blog/best-mcp-observability-tools-for-production-servers" },
      { label: "MCP server SLOs", href: "/blog/mcp-server-slos" },
    ]),
    entries: [
      entry("MCP Conformance", [
        "Use MCP Conformance for the protocol coverage dimension. A pinned requirement set can tell you whether lifecycle, transport, schema, and scenario behavior meets the declared MCP revision in CI.",
        "Conformance is a gate for interoperability, not a complete reliability score. It does not measure production latency, business correctness, incident response, outcome completion, or side-effect safety.",
      ], [{ label: "MCP conformance repository", href: "https://github.com/modelcontextprotocol/conformance" }]),
      entry("Grafana k6", [
        "Use k6 for controlled latency, saturation, concurrency, and threshold measurements. It can produce repeatable p50, p95, p99, timeout, and error distributions under a declared workload.",
        "The scorecard should record the fixture, client, protocol revision, dependency behavior, and warm-up. Synthetic latency is not a production guarantee when the traffic mix or dependency state is different.",
      ], [{ label: "Grafana k6 documentation", href: "https://grafana.com/docs/k6/latest/" }]),
      entry("Locust", [
        "Use Locust when reliability depends on user-shaped stateful sequences rather than independent requests. It can model a realistic client mix and task flow in a way that makes concurrency and pacing visible in the test code.",
        "Keep the scenario's expected outcomes and side-effect rules explicit. A user-like sequence is still synthetic, and the scorecard must say which production behaviors were not represented.",
      ], [{ label: "Locust documentation", href: "https://docs.locust.io/" }]),
      entry("Sentry", [
        "Use Sentry for exception severity, recurrence, release correlation, and operational response. It can support the scorecard's incident dimension when application failures are the main reliability concern.",
        "Raw error volume does not distinguish MCP result errors, transport failures, client-specific refusals, catalog drift, or unknown side effects. Keep those categories separate in the scorecard definitions.",
      ], [{ label: "Sentry MCP monitoring cookbook", href: "https://sentry.io/cookbook/monitor-mcp-server/" }]),
      entry("OpenTelemetry", [
        "Use OpenTelemetry for evidence continuity across gateway, server, and dependencies. Trace propagation and stable attributes make a reliability score auditable across backends.",
        "Instrumentation coverage is not the same as reliability. A scorecard should penalize missing critical evidence or privacy violations separately instead of rewarding a large volume of incomplete spans.",
      ], [{ label: "OpenTelemetry MCP attributes", href: "https://opentelemetry.io/docs/specs/semconv/registry/attributes/mcp/" }]),
    ],
  },
  "mcp-tool-adoption-report": {
    heading: "How the main MCP adoption measurement options fit",
    intro: "Adoption is behavior over a defined population and window. A catalog count, a tool call, an agent trace, and a business outcome are different signals. The useful report keeps those stages separate.",
    trackmcp: entry("TrackMCP", [
      "TrackMCP measures the MCP adoption funnel at the server boundary: which clients connected, what catalog they discovered, which tools were called, where calls failed or retried, and which explicit outcomes were emitted. It can show that a capability was reachable and used without claiming that a user preferred it or that a model reasoned correctly.",
      "This is the product's strongest adoption role. Join TrackMCP events to product analytics with a documented identity and retention policy, then report exposed, discovered, called, successful, and completed as separate denominators. Do not call catalog size adoption.",
    ], [
      { label: "TrackMCP tool analytics", href: "/mcp-tool-analytics" },
      { label: "TrackMCP server analytics", href: "/mcp-server-analytics" },
    ]),
    entries: [
      entry("OpenTelemetry", [
        "OpenTelemetry is useful when adoption needs to be joined across an MCP server, application, gateway, and dependency. Trace identity and stable attributes make it possible to connect a tool call to the broader request without forcing every question into one analytics product.",
        "OpenTelemetry does not define the denominator or the business question. Decide whether the report is about connections, discovery, calls, successful results, explicit outcomes, active accounts, or retained users before selecting fields and windows.",
      ], [{ label: "OpenTelemetry MCP attributes", href: "https://opentelemetry.io/docs/specs/semconv/registry/attributes/mcp/" }]),
      entry("Langfuse", [
        "Langfuse can explain the agent side of adoption: which generations led to a tool attempt, what spans were produced, and how evaluations or feedback changed across versions. It is useful when tool usage is part of a model or agent product funnel.",
        "An agent trace is not a complete usage denominator. It may omit direct clients, denied calls, catalog exposure, or server-side result errors. Join it to the MCP boundary rather than treating model intent as actual adoption.",
      ], [{ label: "Langfuse agents documentation", href: "https://langfuse.com/agents" }]),
      entry("Grafana", [
        "Grafana is useful for operational context around adoption changes: traffic, service health, dependency saturation, dashboards, and release markers. It can show whether a rise or drop in calls coincided with an infrastructure or deploy event.",
        "Infrastructure traffic does not identify which tools were exposed, selected, denied, or completed. Keep the MCP dimensions in the event stream and use Grafana for the broader operating context.",
      ], [{ label: "Grafana MCP observability", href: "https://grafana.com/docs/grafana-cloud/observe-and-act/monitor-applications/ai-observability/mcp-observability/" }]),
      entry("Datadog", [
        "Datadog can support adoption analysis when service, tenant, release, and infrastructure context already live there. Its broad operational data helps explain whether a usage change reflects a client rollout, an error spike, a quota, or a dependency problem.",
        "Do not use a generic request metric as a tool adoption metric. Add the MCP catalog, client, tool, result, and outcome dimensions deliberately and keep privacy and tenant boundaries explicit.",
      ], [{ label: "Datadog MCP server documentation", href: "https://docs.datadoghq.com/mcp_server/" }]),
      entry("Product analytics or warehouse", [
        "Product analytics and a warehouse own the business denominator: accounts, cohorts, activation, retention, customer segment, and downstream product outcomes. They are the right place to answer whether MCP usage changed a product behavior over time.",
        "A business event can lose protocol, tool, result, retry, and privacy details that are necessary for diagnosis. Join it to the server-boundary event with a documented stable identifier and never infer a workflow outcome from a click or a tool call alone.",
      ]),
    ],
  },
  "mcp-observability-glossary-buyers-guide": {
    heading: "How the main MCP observability categories fit",
    intro: "Buy by evidence boundary, not by the word observability in a product name. The options below solve different problems and should be evaluated against the questions your team must answer during an incident and a product review.",
    trackmcp: entry("TrackMCP", [
      "TrackMCP is for teams that own and operate MCP servers and need a focused view of connections, catalogs, tool calls, result errors, latency, retries, sessions, and explicit outcomes. It is the server-boundary layer in a larger observability architecture.",
      "It is not a general APM, model evaluator, public registry, or gateway policy engine. That boundary is the product's advantage when the unanswered question is what the MCP server actually received and returned, and its limitation when the question belongs entirely to infrastructure or private model reasoning.",
    ], [
      { label: "TrackMCP production observability comparison", href: "/blog/best-mcp-observability-tools-for-production-servers" },
      { label: "TrackMCP observability", href: "/mcp-observability" },
    ]),
    entries: [
      entry("OpenTelemetry", [
        "OpenTelemetry is an instrumentation and data model choice. It is useful when a team wants portable trace context, semantic fields, collector control, and the freedom to route MCP evidence into its own backend or several backends.",
        "It does not automatically provide MCP semantics, a polished investigation workflow, or complete instrumentation. The team owns the field definitions, redaction, storage, dashboards, alerting, and maintenance that turn the standard into a useful product.",
      ], [{ label: "OpenTelemetry MCP semantic conventions", href: "https://opentelemetry.io/docs/specs/semconv/registry/attributes/mcp/" }]),
      entry("Datadog", [
        "Datadog is a broad operational platform for teams that want infrastructure, APM, logs, metrics, security, and agent observability in an established workflow. It is a strong choice when the organization already has dashboards, alerting, and incident ownership there.",
        "Breadth can also mean more configuration and more responsibility for preserving MCP-specific semantics. Verify catalog, client, tool, result, and outcome coverage rather than assuming a generic APM integration answers every MCP question.",
      ], [{ label: "Datadog MCP server documentation", href: "https://docs.datadoghq.com/mcp_server/" }]),
      entry("Grafana", [
        "Grafana is a composable option for teams that want control over metrics, logs, traces, dashboards, collectors, and data routing. It works especially well when Prometheus, Tempo, Loki, and OpenTelemetry already form part of the operating stack.",
        "The tradeoff is ownership. The team must define MCP semantics, build useful panels and alerts, maintain collectors, and preserve the evidence needed for diagnosis. A broad dashboard is not automatically a useful server-boundary product.",
      ], [{ label: "Grafana MCP observability", href: "https://grafana.com/docs/grafana-cloud/observe-and-act/monitor-applications/ai-observability/mcp-observability/" }]),
      entry("Sentry", [
        "Sentry is an error and performance workflow for teams that prioritize exception grouping, release correlation, stack context, and issue ownership. It can be a strong MCP companion when the main question is which code path or dependency failed.",
        "Error tracking is not the same as an MCP catalog, client, result, or workflow view. Ask the vendor to demonstrate those dimensions in your runtime instead of assuming they are present because the server emitted an exception.",
      ], [{ label: "Sentry MCP monitoring cookbook", href: "https://sentry.io/cookbook/monitor-mcp-server/" }]),
      entry("Langfuse", [
        "Langfuse is centered on LLM and agent traces, prompts, generations, evaluations, feedback, and cost. It is a good fit when the organization investigates the whole AI application and wants model and tool behavior in one trace-oriented workflow.",
        "It does not automatically prove server health, authorization, catalog freshness, or side-effect completion. Keep model intent and MCP execution as distinct evidence scopes and test the join under privacy constraints.",
      ], [{ label: "Langfuse agents documentation", href: "https://langfuse.com/agents" }]),
      entry("MCP gateway", [
        "An MCP gateway owns policy and traffic control: identity, authorization, routing, quotas, tenancy, credential brokering, and centralized audit decisions. It is the right category when those controls must be enforced consistently across a fleet.",
        "A gateway may not see server internals, downstream dependency details, or workflow outcomes. Ask whether it preserves the context needed to join its policy decision to the server evidence instead of treating the gateway as the entire observability stack.",
      ]),
    ],
  },
};

export function comparisonBlocks(comparison: Wave2Comparison): Block[] {
  const blocks: Block[] = [
    { t: "h2", c: comparison.heading },
    { t: "p", c: comparison.intro },
    { t: "h2", c: comparison.trackmcp.name },
    ...comparison.trackmcp.paragraphs.map((c) => ({ t: "p", c }) as Block),
  ];
  if (comparison.trackmcp.links?.length) blocks.push({ t: "links", items: comparison.trackmcp.links });
  for (const section of comparison.entries) {
    blocks.push({ t: "h2", c: section.name }, ...section.paragraphs.map((c) => ({ t: "p", c }) as Block));
    if (section.links?.length) blocks.push({ t: "links", items: section.links });
  }
  return blocks;
}
