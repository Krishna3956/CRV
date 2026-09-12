import type { ArtKey } from "./art";
import type { Block } from "./posts";

/* Per-post editorial extras: cover art, a key-takeaways summary, and inline
   inserts (figures / callouts) spliced into the body at the given index. This
   keeps the prose in posts.ts clean while giving each article real structure. */

export type Enrichment = {
  art: ArtKey;
  takeaways: string[];
  inserts?: { after: number; block: Block }[];
};

const fig = (art: ArtKey, c: string, after: number) => ({
  after,
  block: { t: "figure", art, c } as Block,
});
const note = (title: string, c: string, after: number) => ({
  after,
  block: { t: "callout", title, c } as Block,
});

export const enrichment: Record<string, Enrichment> = {
  "mcp-pagination-nextcursor": {
    art: "protocol",
    takeaways: [
      "MCP pagination uses opaque cursors for tools, resources, resource templates, and prompts.",
      "Clients should detect repeated cursors, bound page walks, and report incomplete catalogs clearly.",
      "Changing catalogs and cache freshness can create gaps or duplicates across pages.",
      "Server-boundary telemetry can show what was requested, but not what a host displayed or considered.",
    ],
    inserts: [
      fig("protocol", "A paginated catalog is a sequence of bounded server responses connected by an opaque cursor.", 3),
      note("Keep the cursor opaque", "The server owns the cursor format. A client should pass it back unchanged and never treat it as a page number.", 11),
    ],
  },
  "mcp-tool-list-caching-ttlms-cachescope": {
    art: "foundation",
    takeaways: [
      "ttlMs describes freshness, while cacheScope describes whether a result may be shared.",
      "listChanged and subscriptions/listen can invalidate a cached catalog before its TTL expires.",
      "A private catalog must stay isolated by authorization context, even when the endpoint is shared.",
      "Cache hints do not replace authorization or guarantee a consistent multi-page snapshot.",
    ],
    inserts: [
      fig("foundation", "Freshness, visibility, and invalidation are separate decisions in an MCP catalog cache.", 3),
      note("Cache conservatively", "If a result may vary by user, tenant, role, or token, do not mark it public just because it came from an authenticated endpoint.", 10),
    ],
  },
  "mcp-progress-notifications": {
    art: "latency",
    takeaways: [
      "Progress notifications require a request-scoped progressToken from the client.",
      "Clients may omit progress support or choose not to render notifications.",
      "Rate-limit meaningful milestones and stop updates after completion or cancellation.",
      "Tasks provide durable state when progress notifications are not enough for long-running work.",
    ],
    inserts: [
      fig("latency", "A progress token correlates optional updates with one active request, not with a complete agent trace.", 3),
      note("Do not promise visibility", "A server can send a progress notification without knowing whether the host received, rendered, or acted on it.", 10),
    ],
  },
  "mcp-tasks-extension": {
    art: "funnel",
    takeaways: [
      "Tasks turn a long-running tool call into durable state that a client can poll.",
      "The current extension uses tasks/get, tasks/update, and tasks/cancel.",
      "Cancellation is cooperative and must be designed around races and external side effects.",
      "Task status is not the same as a completed business outcome unless the application emits that signal.",
    ],
    inserts: [
      fig("funnel", "A task moves from creation to polling, optional input, and a terminal result or error.", 3),
      note("Separate status from outcome", "A completed task proves that the protocol operation ended. It does not automatically prove that the customer's goal succeeded.", 11),
    ],
  },
  "mcp-elicitation-form-url-mode": {
    art: "schema",
    takeaways: [
      "Form mode is for structured, non-sensitive input visible to the MCP client.",
      "URL mode moves sensitive interaction out of band and needs a strong user-binding design.",
      "Accepting a URL elicitation is consent to open the flow, not proof that the external action completed.",
      "Modern multi-round requests and legacy server-to-client requests require separate compatibility tests.",
    ],
    inserts: [
      fig("schema", "Form mode keeps structured input in the MCP flow, while URL mode sends sensitive interaction through a separate boundary.", 3),
      note("Bind the user", "A copied or modified elicitation URL must not let one user complete another user's authorization flow.", 11),
    ],
  },
  "best-mcp-observability-tools-for-production-servers": {
    art: "clients",
    takeaways: [
      "MCP server observability starts at the server boundary and answers different questions from model or agent tracing.",
      "TrackMCP, Sentry, Datadog, Grafana/OpenTelemetry, Langfuse, and LangSmith fit different operational boundaries.",
      "A layered stack is often more honest and useful than choosing one platform as a universal replacement.",
      "Verify protocol, SDK, transport, privacy, and outcome semantics before adopting a production integration.",
    ],
    inserts: [
      fig("clients", "The same MCP server can be used by different clients and tools, so adoption and reliability need boundary-aware context.", 3),
      note("Compare the boundary", "Before comparing feature counts, identify whether each product sees the server, client, model, infrastructure, or only a downstream request.", 9),
    ],
  },
  "trackmcp-foundation-release": {
    art: "foundation",
    takeaways: [
      "Measure MCP behavior from a versioned, validated event contract with idempotent delivery.",
      "Keep telemetry bounded and redacted locally, with metadata-only capture available when payloads are out of scope.",
      "Use observed tool latency, authenticated traces, and explicit workflow outcomes to investigate production behavior honestly.",
      "Treat the server boundary as a useful limit: TrackMCP does not see private model reasoning or every client-side turn.",
    ],
    inserts: [
      fig("foundation", "A versioned event contract, local redaction, and bounded traces form the production foundation.", 4),
      note("Bounded by design", "Telemetry is sanitized before it leaves the server process, then constrained again at ingestion.", 13),
    ],
  },
  "mcp-incident-response-runbook": {
    art: "errors",
    takeaways: [
      "Classify the first broken layer before changing code.",
      "Use one affected session to find the first failing event and its consequence.",
      "Close every incident with a regression check and a review of sensitive telemetry.",
    ],
    inserts: [
      fig("errors", "The fastest incident path moves from symptom to first broken event to safe mitigation.", 3),
      note("Mitigate narrowly", "Rollback, gate one broken tool, or rate-limit a retry loop before applying a broad change.", 10),
    ],
  },
  "mcp-token-passthrough-security": {
    art: "protocol",
    takeaways: [
      "Client tokens must be validated for the MCP resource before a tool runs.",
      "Downstream APIs need a separate credential or explicit delegated exchange.",
      "Audit authorization decisions without logging bearer tokens or downstream secrets.",
    ],
    inserts: [
      fig("protocol", "Separate MCP and downstream trust boundaries prevent a server from becoming a confused deputy.", 4),
      note("Review the code path", "Search for middleware that copies the inbound Authorization header into an upstream request.", 10),
    ],
  },
  "remote-mcp-oauth-guide": {
    art: "protocol",
    takeaways: [
      "Remote MCP authentication is a resource-server problem, not a shared API-key shortcut.",
      "Bind tokens to the MCP resource and validate issuer, audience, scopes, and expiry.",
      "Use PKCE, exact redirect URIs, and separate credentials for downstream APIs.",
    ],
    inserts: [
      fig("protocol", "A remote MCP request crosses an authorization boundary before it reaches a tool.", 5),
      note("Validate every request", "A signed token is not automatically a token intended for this MCP server.", 12),
    ],
  },
  "mcp-authorization-errors": {
    art: "errors",
    takeaways: [
      "Find where the authorization flow stopped before changing server code.",
      "401 means authentication failed; 403 means policy denied an authenticated identity.",
      "Capture a sanitized timeline without tokens, authorization codes, or raw user data.",
    ],
    inserts: [
      fig("errors", "The fastest debugging path is to classify the failure before inspecting the tool.", 3),
      note("Compare clients", "A flow that works in one client may differ in discovery, PKCE, token cache, or resource parameters.", 9),
    ],
  },
  "mcp-tool-schemas": {
    art: "schema",
    takeaways: [
      "A valid schema can still be difficult for an agent to use.",
      "Safe, unambiguous tolerance can reduce retries; dangerous ambiguity should fail clearly.",
      "Measure schema changes using validation errors, retries, success, and workflow completion.",
    ],
    inserts: [
      fig("schema", "Tool schemas are an agent-facing interface: clear shapes and errors reduce recovery loops.", 4),
      note("Test the shape", "Include one value, many values, missing input, invalid enums, and malformed identifiers in a regression fixture.", 11),
    ],
  },
  "mcp-server-slos": {
    art: "funnel",
    takeaways: [
      "An MCP SLO should measure whether important work completes, not only whether an endpoint responds.",
      "Define every numerator, denominator, exclusion, time window, and owner.",
      "Use p95 latency and workflow completion to expose user-visible degradation.",
    ],
    inserts: [
      fig("funnel", "Availability is only the first stage; discovery, execution, and completion form the user path.", 4),
      note("Set a baseline first", "Targets should follow your user promise and measured behavior, not a copied universal number.", 9),
    ],
  },
  "opentelemetry-for-mcp-servers": {
    art: "latency",
    takeaways: [
      "Connect MCP tool spans to the downstream service that determines the result.",
      "Use low-cardinality MCP dimensions for filtering and metrics.",
      "Keep payloads minimized, redacted, sampled, and fail-open.",
    ],
    inserts: [
      fig("latency", "A correlated trace shows whether the slow step is MCP, the tool, or a downstream dependency.", 3),
      note("Trace the outcome", "A completed business result is stronger than assuming a successful tool span was useful.", 9),
    ],
  },
  "mcp-tool-selection-evaluation": {
    art: "bars",
    takeaways: [
      "Evaluate selection, argument validity, execution, recovery, completion, and safety separately.",
      "Record the client, model, catalog, schema, server, and test versions.",
      "Publish sample size and limitations so the benchmark remains credible.",
    ],
    inserts: [
      fig("bars", "A scorecard makes it possible to see whether a change improves selection or only increases activity.", 4),
      note("Keep the baseline", "Change one meaningful variable at a time and compare against a stable intent set.", 10),
    ],
  },
  "mcp-server-analytics-guide": {
    art: "protocol",
    takeaways: [
      "MCP analytics connects client, tool, session, reliability, and outcome signals.",
      "Workflow completion is more meaningful than raw call volume.",
      "Capture at the protocol boundary, redact locally, and keep telemetry fail-open.",
    ],
    inserts: [
      fig("protocol", "A single server-boundary wrapper can connect agent calls to tools, sessions, and outcomes.", 6),
      note("Start with decisions", "Every metric should tell you what to investigate or improve next.", 12),
    ],
  },
  "mcp-observability-guide": {
    art: "clients",
    takeaways: [
      "MCP observability joins protocol health to agent behavior and workflow outcomes.",
      "A green HTTP status does not prove that a tool call succeeded.",
      "Dimensions such as client, tool, session, and outcome turn telemetry into an investigation path.",
    ],
    inserts: [
      fig("clients", "The same MCP server can behave differently across clients, tools, and workflow paths.", 4),
      note("Investigate the path", "Start with the incomplete workflow, identify the first repeated or failed step, and then inspect that tool.", 10),
    ],
  },
  "how-to-monitor-an-mcp-server-in-production": {
    art: "latency",
    takeaways: [
      "Production monitoring must exercise discovery, authorization, execution, recovery, and outcomes.",
      "Separate page-worthy outages from investigation signals.",
      "Synthetic workflow checks should be isolated and clearly labeled.",
    ],
    inserts: [
      fig("latency", "The server is only as healthy as the slowest critical step in a representative workflow.", 8),
      note("Monitor the user path", "An endpoint ping proves reachability. A workflow check proves that an agent can get useful work done.", 13),
    ],
  },
  "mcp-production-readiness-checklist": {
    art: "schema",
    takeaways: [
      "Production readiness spans deployment, catalog quality, security, observability, and testing.",
      "Separate read, write, destructive, and administrative capabilities.",
      "Record partial or blocked checklist items with an owner instead of treating readiness as a vague feeling.",
    ],
    inserts: [
      fig("schema", "A reviewed tool catalog is part of the production surface, not just documentation.", 5),
      note("Make risk explicit", "A read-only server and a server that can mutate production data should not have the same launch bar.", 14),
    ],
  },
  "mcp-server-security-checklist": {
    art: "errors",
    takeaways: [
      "Treat every MCP tool as an action boundary with explicit permissions.",
      "Never use token passthrough; validate the token for the MCP resource.",
      "Auditability requires useful metadata, not unrestricted payload collection.",
    ],
    inserts: [
      fig("errors", "A secure MCP deployment distinguishes transport success from authorization and tool-level risk.", 7),
      note("Minimize what you collect", "Redact secrets and personal data before telemetry leaves the server, and define retention and access.", 15),
    ],
  },
  "mcp-2026-07-28-migration-guide": {
    art: "protocol",
    takeaways: [
      "The 2026-07-28 release makes the protocol core stateless and easier to route across instances.",
      "Tasks, cache hints, header-based routing, and authorization hardening affect production design.",
      "Measure deprecated transport and capability usage before removing compatibility.",
    ],
    inserts: [
      fig("protocol", "Stateless requests change the scaling boundary: application state must be explicit and durable.", 5),
      note("Version everything", "Verify the exact specification, SDK, and client versions you deploy before applying migration advice.", 13),
    ],
  },
  "measure-mcp-tool-adoption-workflow-completion": {
    art: "funnel",
    takeaways: [
      "Adoption includes breadth, depth, quality, and trend, not only call count.",
      "Read tool usage inside completed and incomplete workflow paths.",
      "Treat descriptions and schemas as agent-facing UX that can be measured.",
    ],
    inserts: [
      fig("funnel", "The useful question is where a tool path moves from discovery to a completed outcome.", 5),
      note("Before deleting", "A zero-call tool may be unnecessary, or simply undiscoverable because its description does not match user intent.", 12),
    ],
  },
  "why-your-mcp-server-needs-analytics": {
    art: "protocol",
    takeaways: [
      "Logs prove a request happened; they can't explain behavior or outcomes.",
      "MCP servers are where websites were before analytics existed.",
      "Capture at the protocol layer to see clients, tools, and completions from day one.",
    ],
    inserts: [
      fig("protocol", "Wrapping the server at the transport layer captures every tool call with no per-tool code.", 4),
      note("The core shift", "Stop asking 'did the request succeed?' and start asking 'did the user get what they came for?'", 8),
    ],
  },
  "the-errors-hiding-inside-a-200-ok": {
    art: "errors",
    takeaways: [
      "MCP puts tool errors in the response body, not the HTTP status.",
      "APM and log-based alerts stay green while agents silently retry and give up.",
      "Count isError responses per tool, separately from transport errors.",
    ],
    inserts: [
      fig("errors", "A healthy 200 OK can carry a failed tool call. Status codes never see it.", 3),
      note("What to watch", "A tool with high call volume and a climbing isError rate is a silent failure, and the highest-value thing to fix.", 8),
    ],
  },
  "the-metrics-that-matter-for-an-mcp-server": {
    art: "bars",
    takeaways: [
      "Lead with adoption and outcomes, not raw call volume.",
      "Reliability metrics support the story; they don't define it.",
      "A fast server nobody completes a task on is not healthy.",
    ],
    inserts: [
      fig("bars", "A few tools do almost all the work; the long tail barely moves.", 5),
      note("If you track one thing", "Watch workflow completion rate. Almost every other metric is a lever on it.", 11),
    ],
  },
  "instrumenting-the-mcp-protocol-layer": {
    art: "protocol",
    takeaways: [
      "Wrap the transport once instead of editing every tool.",
      "One seam captures name, arguments, result, timing, and client.",
      "Redact in-process, sample high volume, and always fail open.",
    ],
    inserts: [
      fig("protocol", "One wrapper at the request/response boundary sees every call.", 4),
      note("Fail open", "Analytics must never be able to break a tool call. If capture fails, the tool still runs.", 9),
    ],
  },
  "find-the-tools-no-agent-ever-calls": {
    art: "bars",
    takeaways: [
      "Dead tools enlarge the model's choice space and add maintenance cost.",
      "Sort by call volume over weeks of real traffic to spot them.",
      "A good tool with a bad description looks identical to a dead one.",
    ],
    inserts: [
      fig("bars", "Zero-call tools across weeks of traffic are candidates to fix or remove.", 3),
      note("Before you delete", "Check whether the tool is truly unused or just poorly described. The data looks the same.", 7),
    ],
  },
  "how-to-measure-mcp-tool-adoption": {
    art: "bars",
    takeaways: [
      "Count distinct clients per tool, not just calls.",
      "Track week-over-week trend to see where the product is heading.",
      "Read adoption inside workflows, not in isolation.",
    ],
    inserts: [
      fig("bars", "Breadth of adoption matters more than a single loud client.", 4),
      note("Context is everything", "A tool that only ever starts a workflow that never completes is a dead end, not an adopted tool.", 8),
    ],
  },
  "reading-mcp-sessions-like-funnels": {
    art: "funnel",
    takeaways: [
      "Group calls into sessions to turn noise into a funnel.",
      "The drop between stages tells you where to look.",
      "Overlay completed vs stopped paths to name the culprit tool.",
    ],
    inserts: [
      fig("funnel", "Connected → reached a tool → completed. The gaps are the story.", 5),
      note("Read the gaps", "Most connect but few reach a tool? Fix discovery. Reach a tool but rarely complete? Fix the tool.", 9),
    ],
  },
  "why-agents-fail-on-your-tool-schemas": {
    art: "schema",
    takeaways: [
      "The most common silent failure is a schema/agent shape mismatch.",
      "Models send what humans write, a string rather than an array.",
      "Forgiving schemas convert failed calls into completed ones.",
    ],
    inserts: [
      fig("schema", "Accept both shapes: coerce a string into a single-element array.", 5),
      note("Where to start", "Find tools with high volume and low success, then read the error text. It names the shape to accept.", 9),
    ],
  },
  "logs-vs-apm-vs-mcp-analytics": {
    art: "default",
    takeaways: [
      "Logs record events; APM watches performance; neither explains behavior.",
      "APM treats a 200 as success, so tool errors slip past it.",
      "MCP analytics reads the protocol: clients, tools, and completions.",
    ],
    inserts: [
      note("Three layers, three jobs", "You likely want all three, but only the analytics layer answers product questions about your server.", 7),
    ],
  },
  "understanding-your-mcp-client-mix": {
    art: "clients",
    takeaways: [
      "Clients differ in discovery, argument shape, and retry behavior.",
      "Break every core metric down by client.",
      "Growth concentrated in one client is a risk worth knowing.",
    ],
    inserts: [
      fig("clients", "Claude, Cursor, ChatGPT, and custom agents each behave differently.", 3),
      note("Make it actionable", "'Our server is fine' becomes 'fine for these clients, not those', the version you can act on.", 7),
    ],
  },
  "workflow-completion-rate-the-north-star": {
    art: "funnel",
    takeaways: [
      "Completion rate is the one metric that can't be gamed by busy failure.",
      "Tie 'complete' to a real outcome where you can.",
      "Move it by fixing the tool that ends the most sessions early.",
    ],
    inserts: [
      fig("funnel", "Of the sessions that start, how many reach a useful result?", 3),
      note("Why not call volume", "Call volume rewards agents that call tools constantly and never finish. Completion rate does not.", 6),
    ],
  },
  "how-to-cut-agent-retries": {
    art: "errors",
    takeaways: [
      "Every retry adds latency, cost, and a chance the agent gives up.",
      "Most retries come from a small set of measurable causes.",
      "Return errors that tell the agent exactly what to change.",
    ],
    inserts: [
      fig("errors", "Repeated calls with identical arguments are a give-up loop forming.", 5),
      note("Rank your fixes", "Sort tools by retries per successful call. The top of that list is your queue.", 8),
    ],
  },
  "latency-that-matters-for-agents": {
    art: "latency",
    takeaways: [
      "Agents chain calls, so a slow tail compounds across a session.",
      "Track p50 for the typical call and p95 for the tail.",
      "Fix latency at the tool level, not the server average.",
    ],
    inserts: [
      fig("latency", "The p95 tail, not the average, is what agents time out on.", 5),
      note("Sort by tail", "Rank tools by p95, not overall latency. The fix is usually one dependency behind one tool.", 8),
    ],
  },
  "retention-for-mcp-servers": {
    art: "clients",
    takeaways: [
      "Launch traffic is flattering and temporary; retention is durable.",
      "Clients that adopt several tools tend to stay.",
      "Retention follows reliability and completion.",
    ],
    inserts: [
      fig("clients", "Returning clients that expand their tool usage are the ones that stick.", 4),
      note("The fragile client", "A client that only ever calls one tool can be lost by a single change.", 7),
    ],
  },
  "instrument-your-mcp-server-in-one-line": {
    art: "protocol",
    takeaways: [
      "Instrumenting at the protocol layer costs one line and one deploy.",
      "You get clients, adoption, completions, and silent failures on day one.",
      "Add redaction and custom events later, only if you need them.",
    ],
    inserts: [
      fig("protocol", "The whole setup: wrap the server, pass your key, ship.", 3),
      note("First insight in minutes", "The point isn't a perfect pipeline. It is answering real questions the day you launch.", 7),
    ],
  },
  "writing-tool-descriptions-agents-use": {
    art: "bars",
    takeaways: [
      "Agents choose tools by reading names and descriptions.",
      "Write for the moment of choice: what it does, when to use it.",
      "Treat descriptions as something you measure and iterate on.",
    ],
    inserts: [
      fig("bars", "Rewrite a description, then watch that tool's adoption move.", 6),
      note("Descriptions are UX", "A great tool with a vague description is invisible to the model.", 4),
    ],
  },
  "what-is-mcp-analytics": {
    art: "default",
    takeaways: [
      "MCP analytics is product analytics for your MCP server.",
      "It answers who connects, what they call, and whether it worked.",
      "It installs at the protocol layer in one line.",
    ],
    inserts: [
      note("Logs vs analytics", "Logs answer 'did it run?' Analytics answers 'did it work, for whom, and what should I fix?'", 5),
    ],
  },
  "what-is-the-model-context-protocol": {
    art: "protocol",
    takeaways: [
      "MCP is an open standard connecting AI models to tools and data.",
      "A server exposes tools; any MCP client can discover and call them.",
      "One standard interface is what makes single-line analytics possible.",
    ],
    inserts: [
      fig("protocol", "A server exposes tools; clients discover and call them over one interface.", 3),
    ],
  },
  "how-to-monitor-an-mcp-server": {
    art: "protocol",
    takeaways: [
      "Agent traffic needs more than uptime and status codes.",
      "Wrap the protocol layer once to capture every call.",
      "Alert on tool error rate, p95 latency, and completion rate.",
    ],
    inserts: [
      fig("protocol", "One wrapper at the request/response boundary sees every call.", 3),
      note("Watch the tail", "Alert on p95 latency, not the average. The tail is what agents time out on.", 6),
    ],
  },
  "mcp-observability-explained": {
    art: "default",
    takeaways: [
      "Logs, metrics, and traces all apply to MCP servers.",
      "None of the three explain behavior or completion.",
      "Behavioral analytics is the missing fourth layer.",
    ],
    inserts: [
      note("The missing pillar", "Only the analytics layer answers 'which tools get adopted and which workflows complete?'", 8),
    ],
  },
  "how-to-debug-mcp-tool-errors": {
    art: "errors",
    takeaways: [
      "Many MCP failures return a 200 OK. Read the payload.",
      "Rank tools by volume and success to find the worst offender.",
      "Most tool errors are fixed by tolerance, not new features.",
    ],
    inserts: [
      fig("errors", "A healthy 200 OK can carry a failed tool call.", 1),
      note("The usual culprit", "A high-volume, low-success tool is breaking the most sessions. Start there.", 4),
    ],
  },
  "how-to-increase-mcp-tool-adoption": {
    art: "bars",
    takeaways: [
      "Low adoption is usually a discovery problem, not a capability gap.",
      "Fix the description and reduce overlap between tools.",
      "Ship a change, then watch adoption and success rate.",
    ],
    inserts: [
      fig("bars", "A few tools do most of the work; the long tail needs better discovery.", 1),
      note("Iterate, don't guess", "Adoption is improved on a loop: change, measure, keep what works.", 7),
    ],
  },
  "mcp-server-security-redacting-data": {
    art: "schema",
    takeaways: [
      "Redact sensitive fields in-process, before anything is sent.",
      "You rarely need actual values to learn from usage.",
      "Fail open: capture must never block a tool call.",
    ],
    inserts: [
      note("Shape over content", "Which tool, which client, and whether it succeeded is enough. No raw values are required.", 4),
    ],
  },
  "track-which-agents-use-your-mcp-server": {
    art: "clients",
    takeaways: [
      "Every MCP connection identifies its client automatically.",
      "Break every metric down by client.",
      "A tool can fail in one client and work in another.",
    ],
    inserts: [
      fig("clients", "Claude, Cursor, ChatGPT, and custom agents each behave differently.", 1),
    ],
  },
  "mcp-server-metrics-checklist": {
    art: "bars",
    takeaways: [
      "Lead with adoption and outcomes; keep reliability as support.",
      "Track completion rate and where sessions stop.",
      "Watch silent failures and p95 latency per tool.",
    ],
    inserts: [
      note("Review cadence", "Check adoption and outcomes weekly; watch reliability for regressions.", 7),
    ],
  },
  "how-to-measure-mcp-server-roi": {
    art: "funnel",
    takeaways: [
      "Connect the server to outcomes, not activity.",
      "Completion rate is the cleanest ROI proxy.",
      "Report the trend week over week.",
    ],
    inserts: [
      fig("funnel", "Of the sessions that start, how many reach a useful result?", 1),
      note("Value and cost", "Count value created (completed work, retention) and cost avoided (silent failures, retries).", 5),
    ],
  },
  "answer-engine-optimization-for-mcp-tools": {
    art: "default",
    takeaways: [
      "AEO for tools means making them easy for an agent to choose.",
      "The agent reads names, descriptions, and schemas to decide.",
      "Discoverability is measurable via adoption and success rate.",
    ],
    inserts: [
      note("The agent is the audience", "A vague description makes a tool invisible, no matter how good the code is.", 2),
    ],
  },
  "ab-test-mcp-tool-descriptions": {
    art: "bars",
    takeaways: [
      "Descriptions are UX for agents. Test them, don't guess.",
      "Change one description at a time to attribute the effect.",
      "Measure adoption, correctness, and retries.",
    ],
    inserts: [
      note("Keep what wins", "If adoption rises and success holds, the new wording was better.", 6),
    ],
  },
  "mcp-vs-rest-api-analytics": {
    art: "default",
    takeaways: [
      "MCP often returns errors inside a 200 OK, unlike REST.",
      "Agents choose tools at runtime, so discoverability matters.",
      "Sessions and completion rate replace per-request counts.",
    ],
    inserts: [
      note("The mindset shift", "From 'did the request return 200?' to 'did the agent accomplish the task?'", 7),
    ],
  },
  "what-is-an-mcp-server": {
    art: "protocol",
    takeaways: [
      "An MCP server exposes tools, resources, or prompts to a compatible host.",
      "It can run locally over stdio or remotely over Streamable HTTP.",
      "Production readiness includes schemas, authorization, timeouts, and bounded telemetry.",
    ],
    inserts: [
      fig("protocol", "An MCP server presents a focused capability surface between an AI client and existing systems.", 2),
      note("Own the boundary", "Validate the request and protect the data path even when a client supplied a schema.", 8),
    ],
  },
  "what-is-an-mcp-client": {
    art: "clients",
    takeaways: [
      "A host usually creates one client for each server connection.",
      "The client negotiates capabilities and routes JSON-RPC messages.",
      "Server telemetry is only the part of the agent path that crossed the boundary.",
    ],
    inserts: [
      fig("clients", "A host can manage multiple isolated MCP client connections with different servers.", 2),
      note("Identity is a signal", "Client metadata helps explain behavior, but it is not automatically verified user identity.", 7),
    ],
  },
  "mcp-host-client-server-architecture": {
    art: "foundation",
    takeaways: [
      "The host coordinates the AI experience and multiple connections.",
      "The client maintains one server session and negotiated capability set.",
      "The server owns its tools, resources, validation, and authorization.",
    ],
    inserts: [
      fig("foundation", "Separate host, client, and server roles make permissions and failure boundaries easier to reason about.", 2),
      note("Observe the right layer", "A server trace can be precise about server behavior without pretending to be the complete agent trace.", 7),
    ],
  },
  "mcp-tools-resources-prompts": {
    art: "schema",
    takeaways: [
      "Tools are callable actions, resources are addressable context, and prompts are reusable templates.",
      "Their control models differ across model, application, and user decisions.",
      "Measure discovery separately from use and completion.",
    ],
    inserts: [
      fig("schema", "Clear primitive contracts help a host present the right capability for each user task.", 2),
      note("Keep the primitive clear", "A tool that mutates data needs a different safety review from a resource that only provides context.", 7),
    ],
  },
  "how-mcp-works-step-by-step": {
    art: "funnel",
    takeaways: [
      "MCP sessions move from initialization to discovery, request, result, and shutdown.",
      "Errors can occur at protocol, authorization, validation, tool, or workflow layers.",
      "A successful transport is not the same as a successful task.",
    ],
    inserts: [
      fig("funnel", "Initialization, discovery, execution, and completion are distinct stages in an MCP request path.", 2),
      note("Find the first broken step", "Classify the failure before changing the server or host configuration.", 8),
    ],
  },
  "mcp-json-rpc-messages-explained": {
    art: "errors",
    takeaways: [
      "Requests use IDs, methods, and parameters; notifications do not expect responses.",
      "Protocol errors and tool-level errors have different meanings.",
      "Redaction matters when message exchanges are used for debugging.",
    ],
    inserts: [
      fig("errors", "A valid JSON-RPC response can still contain an application-level tool error.", 3),
      note("Inspect the result", "HTTP status alone cannot tell you whether the tool produced useful work.", 8),
    ],
  },
  "mcp-capability-negotiation": {
    art: "protocol",
    takeaways: [
      "Initialization establishes a protocol version and optional capabilities.",
      "Both sides must use only what they negotiated.",
      "Version and capability dimensions are useful compatibility signals when bounded.",
    ],
    inserts: [
      fig("protocol", "The initialization handshake aligns the client and server before normal MCP operations begin.", 2),
      note("Version the evidence", "Record the negotiated protocol version instead of inferring compatibility from a client label.", 7),
    ],
  },
  "mcp-transports-stdio-and-streamable-http": {
    art: "latency",
    takeaways: [
      "stdio fits local process communication; Streamable HTTP fits remote services.",
      "Transport choice changes deployment and authentication concerns.",
      "Health checks should follow MCP lifecycle stages, not only process or socket status.",
    ],
    inserts: [
      fig("latency", "Transport reachability is one signal inside a broader MCP health path.", 2),
      note("Keep transport-specific context", "Process exits, authentication results, and tool latency answer different operational questions.", 7),
    ],
  },
  "how-to-build-an-mcp-server": {
    art: "schema",
    takeaways: [
      "Start with one narrow capability and a contract you can test.",
      "Validate inputs and enforce authorization inside the server.",
      "Add bounded, redacted telemetry before expanding the surface.",
    ],
    inserts: [
      fig("schema", "A production-minded MCP server starts with a small, tested, agent-facing contract.", 2),
      note("Make side effects explicit", "Separate read, write, destructive, and administrative tools so permissions stay legible.", 8),
    ],
  },
  "how-to-connect-an-mcp-server-to-an-ai-client": {
    art: "clients",
    takeaways: [
      "Confirm transport, credentials, protocol version, and capabilities before connecting.",
      "Start with a safe discovery or read-only test.",
      "Classify the first failed layer instead of treating every error as a server bug.",
    ],
    inserts: [
      fig("clients", "Connecting an MCP server is a negotiated path from host configuration to a specific server session.", 2),
      note("Test safely", "Review the catalog and start with a known-safe input before enabling actions with side effects.", 8),
    ],
  },
};
