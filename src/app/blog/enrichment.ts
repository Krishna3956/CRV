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
      note("What to watch", "A tool with high call volume and a climbing isError rate is a silent failure — the highest-value thing to fix.", 8),
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
      note("Before you delete", "Check whether the tool is truly unused or just poorly described — the data looks the same.", 7),
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
      "Models send what humans write — a string, not an array.",
      "Forgiving schemas convert failed calls into completed ones.",
    ],
    inserts: [
      fig("schema", "Accept both shapes: coerce a string into a single-element array.", 5),
      note("Where to start", "Find tools with high volume and low success, then read the error text — it names the shape to accept.", 9),
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
      note("Three layers, three jobs", "You likely want all three — but only the analytics layer answers product questions about your server.", 7),
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
      note("Make it actionable", "'Our server is fine' becomes 'fine for these clients, not those' — the version you can act on.", 7),
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
      fig("latency", "The p95 tail — not the average — is what agents time out on.", 5),
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
      note("First insight in minutes", "The point isn't a perfect pipeline — it's answering real questions the day you launch.", 7),
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
      note("Watch the tail", "Alert on p95 latency, not the average — the tail is what agents time out on.", 6),
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
      "Many MCP failures return a 200 OK — read the payload.",
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
      note("Shape over content", "Which tool, which client, and whether it succeeded is enough — no raw values required.", 4),
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
      "Descriptions are UX for agents — test them, don't guess.",
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
};
