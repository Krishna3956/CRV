import type { ArtKey } from "./art";

export type Block =
  | { t: "p"; c: string }
  | { t: "h2"; c: string }
  | { t: "ul"; c: string[] }
  | { t: "code"; c: string }
  | { t: "quote"; c: string }
  | { t: "callout"; title: string; c: string }
  | { t: "figure"; art: ArtKey; c: string };

export type Post = {
  slug: string;
  title: string;
  tag: string;
  excerpt: string;
  date: string;
  read: string;
  body: Block[];
};

const p = (c: string): Block => ({ t: "p", c });
const h = (c: string): Block => ({ t: "h2", c });
const ul = (c: string[]): Block => ({ t: "ul", c });
const code = (c: string): Block => ({ t: "code", c });
const quote = (c: string): Block => ({ t: "quote", c });

export const posts: Post[] = [
  {
    slug: "why-your-mcp-server-needs-analytics",
    title: "Why your MCP server needs analytics",
    tag: "Guide",
    excerpt:
      "Server logs tell you a request happened. They don't tell you who called what, why it failed, or whether the user got what they came for.",
    date: "Feb 12, 2026",
    read: "6 min read",
    body: [
      p("You shipped an MCP server. Agents can connect, tools resolve, requests return 200. By every signal your infrastructure gives you, it works. And yet you cannot answer the questions that actually decide whether it is worth maintaining."),
      p("Who is using it? Which tools do they rely on? Where do sessions stall? Which calls fail in a way your logs never surfaced? These are product questions, and logs were never built to answer them."),
      h("Logs record events, not behavior"),
      p("A log line proves a request occurred. It does not tell you that Claude called search_docs, got a result, then tried run_query three times and gave up. Behavior lives in the sequence and the outcome, not in any single line."),
      h("The gap is the same one websites had"),
      p("Every click sat in raw web server logs long before Google Analytics existed. The logs were complete and useless for understanding people. Analytics turned that stream into sessions, sources, and funnels. MCP servers are at exactly that moment now."),
      h("What to measure instead"),
      ul([
        "Who connects: which clients and how usage grows",
        "What they use: tool adoption and the tools nobody touches",
        "Whether work completes: sessions that reach a useful result",
        "Where it breaks: failures hidden inside successful responses",
      ]),
      p("You do not need to instrument each tool by hand. Because MCP is a protocol, you can capture all of this at the transport layer with a single wrapper, and start answering the questions that matter the day you launch."),
    ],
  },
  {
    slug: "the-errors-hiding-inside-a-200-ok",
    title: "The errors hiding inside a 200 OK",
    tag: "Engineering",
    excerpt:
      "MCP returns tool errors inside a successful response. Your HTTP logs and APM stay green while agents retry and give up.",
    date: "Feb 6, 2026",
    read: "7 min read",
    body: [
      p("The most expensive failures on an MCP server are the ones nothing alerts on. The transport returns 200. Your APM shows healthy latency. But the tool inside that response failed, and the agent quietly moved on."),
      h("Why this happens"),
      p("MCP encodes tool-level errors in the response body, often with an isError flag, rather than as an HTTP status. That is a reasonable protocol decision: a tool failing is not the same as the server failing. But it means every layer built around status codes is blind to it."),
      code(`{
  "content": [{ "type": "text", "text": "to: expected array" }],
  "isError": true
}`),
      h("What the agent does next"),
      p("It rarely surfaces the error to the user. It retries, sometimes with the same malformed arguments, then abandons the task. From the user's side the assistant just 'didn't do it.' From your side, everything looks fine."),
      h("How to catch it"),
      ul([
        "Read the payload, not just the status code",
        "Count isError responses per tool, separately from transport errors",
        "Track retries within a session to spot give-up loops",
        "Alert on error-rate spikes at the tool level",
      ]),
      p("Once you separate transport health from tool health, send_email failing 94 percent of the time stops being invisible and becomes the first thing you fix."),
    ],
  },
  {
    slug: "the-metrics-that-matter-for-an-mcp-server",
    title: "The metrics that matter for an MCP server",
    tag: "Guide",
    excerpt:
      "Not call volume for its own sake. The handful of numbers that tell you whether your server is adopted, reliable, and useful.",
    date: "Jan 29, 2026",
    read: "6 min read",
    body: [
      p("It is easy to drown an MCP dashboard in engineering metrics. Latency, throughput, error codes. They matter, but they are not the story. Here are the numbers that tell you whether the server is doing its job."),
      h("Adoption"),
      ul([
        "Active clients: how many distinct clients connect",
        "New vs returning connections: is usage growing and sticking",
        "Client mix: Claude, Cursor, ChatGPT, custom agents",
      ]),
      h("Behavior"),
      ul([
        "Tool adoption: which tools get called, which are ignored",
        "Most common workflow: the path agents actually take",
        "Where sessions stop: the step before people give up",
      ]),
      h("Outcomes"),
      ul([
        "Completion rate: sessions that reach a useful result",
        "Returning usage: clients that come back within a week",
      ]),
      h("Reliability (supporting)"),
      ul([
        "Silent failures: errors inside a 200 OK",
        "p95 latency per tool: the tail that ruins sessions",
      ]),
      p("Lead with adoption and outcomes. Keep reliability close, but do not let it define the product. A fast server nobody completes a task on is not a healthy server."),
    ],
  },
  {
    slug: "instrumenting-the-mcp-protocol-layer",
    title: "Instrumenting the MCP protocol layer",
    tag: "Engineering",
    excerpt:
      "How to capture every call without touching a single tool: wrap the transport, not the handlers.",
    date: "Jan 22, 2026",
    read: "8 min read",
    body: [
      p("The naive way to add analytics to an MCP server is to edit every tool. It does not scale, it drifts, and new tools ship uninstrumented. There is a better seam: the protocol itself."),
      h("One seam, total coverage"),
      p("Every tool call flows through the same request/response path. If you wrap the server once at that boundary, you see every call, its arguments, its result, timing, and the client, with no per-tool code."),
      code(`import { withTrackMCP } from "@trackmcp/sdk";
import { server } from "./mcp";

export default withTrackMCP(server, {
  apiKey: process.env.TRACKMCP_KEY,
  service: "acme-mcp-server",
});`),
      h("What the wrapper sees"),
      ul([
        "The tool name and arguments (after local redaction)",
        "The result and whether it carried isError",
        "Client type, duration, and transport status",
        "A session id, so calls can be replayed in order",
      ]),
      h("Keep it safe and cheap"),
      p("Redact sensitive fields in-process before anything leaves. Sample if volume is high. Fail open: analytics should never be able to break a tool call. Done right, instrumentation costs a line of code and a sub-millisecond hop."),
    ],
  },
  {
    slug: "find-the-tools-no-agent-ever-calls",
    title: "Find the tools no agent ever calls",
    tag: "Product",
    excerpt:
      "Half the tools most teams ship are never called. Dead tools are schema clutter, maintenance cost, and confusion for the model.",
    date: "Jan 15, 2026",
    read: "5 min read",
    body: [
      p("When you look at a real MCP server's usage, a pattern shows up fast: a few tools do almost all the work, and a long tail does nothing. Those dead tools are not free."),
      h("Why dead tools cost you"),
      ul([
        "They enlarge the tool list the model has to reason over",
        "They add schema and code you still maintain and secure",
        "They make the useful tools harder to choose correctly",
      ]),
      h("How to spot them"),
      p("Sort tools by call volume over a meaningful window. Anything at zero across weeks of real traffic is a candidate. Before deleting, check whether it is genuinely unused or just badly described, because a good tool with a bad description looks identical in the data."),
      h("Fix or remove"),
      p("If a tool should be used but isn't, rewrite its description and name so the model knows when to reach for it. If it truly has no job, remove it. Either way you shrink the surface and make the server easier for agents to use well."),
    ],
  },
  {
    slug: "how-to-measure-mcp-tool-adoption",
    title: "How to measure MCP tool adoption",
    tag: "Guide",
    excerpt:
      "Adoption is more than call count. It's how many clients use a tool, whether that's growing, and how it fits into workflows.",
    date: "Jan 9, 2026",
    read: "6 min read",
    body: [
      p("Call count alone can mislead. A tool called constantly by one flaky client is not the same as a tool adopted across your whole client base. To understand adoption, look at breadth, trend, and context."),
      h("Breadth"),
      p("Count distinct clients using each tool, not just calls. A tool used by every client is core; a tool used by one is niche, however loud its volume."),
      h("Trend"),
      p("Track week-over-week change. Tools gaining adoption tell you where the product is heading. Tools losing it early warn you before the drop shows up in totals."),
      h("Context"),
      p("Adoption lives inside workflows. A tool that is only ever the first step in a path that never completes is not really adopted; it is a dead end. Read tool usage alongside completion, not on its own."),
      p("Put together, these turn a flat list of counts into a map of what your server is actually for."),
    ],
  },
  {
    slug: "reading-mcp-sessions-like-funnels",
    title: "Reading MCP sessions like funnels",
    tag: "Guide",
    excerpt:
      "A session is a path from first request to result. Treat it like a funnel and the drop-off points become obvious.",
    date: "Dec 18, 2025",
    read: "6 min read",
    body: [
      p("Individual calls are noise until you group them into sessions. A session is one client's run from connect to outcome, and it behaves exactly like a funnel you would recognize from product analytics."),
      h("The stages"),
      ul([
        "Connected: the client established a session",
        "Reached a tool: it actually called something",
        "Completed a workflow: it got to a useful result",
      ]),
      h("Where people fall out"),
      p("The interesting number is the drop between stages. If most sessions connect but few reach a tool, your tool descriptions or discovery are the problem. If they reach a tool but rarely complete, the failure is downstream, often a single tool breaking a common path."),
      h("From funnel to fix"),
      p("Overlay completed versus stopped paths and the culprit usually names itself: the same tool, at the same step, ending sessions. That is where a fix pays off most."),
    ],
  },
  {
    slug: "why-agents-fail-on-your-tool-schemas",
    title: "Why agents fail on your tool schemas",
    tag: "Engineering",
    excerpt:
      "The single most common silent failure: a schema that expects one shape while agents reliably send another.",
    date: "Dec 10, 2025",
    read: "5 min read",
    body: [
      p("When a tool fails for almost every agent, the cause is rarely infrastructure. It is usually a mismatch between what the schema demands and what language models naturally produce."),
      h("A common example"),
      p("Your send_email tool expects to as an array of addresses. Models, trained on how humans write, send a single string. The call fails validation, the agent retries with the same string, and gives up."),
      code(`// schema wants:   { "to": ["a@x.com"] }
// agents send:     { "to": "a@x.com" }`),
      h("The fix is usually forgiveness"),
      p("Accept both shapes. Coerce a string into a single-element array. Accept common synonyms for enum values. Every bit of tolerance you add converts failed calls into completed ones without changing what the tool does."),
      h("How to find these"),
      p("Look for tools with high call volume and low success, then read the error text on the failing calls. The pattern is almost always a shape or type the model keeps getting wrong, and it is almost always cheap to accommodate."),
    ],
  },
  {
    slug: "logs-vs-apm-vs-mcp-analytics",
    title: "Logs vs APM vs MCP analytics",
    tag: "Guide",
    excerpt:
      "Three layers, three jobs. Why logs and APM leave a gap that agent traffic makes impossible to ignore.",
    date: "Dec 3, 2025",
    read: "6 min read",
    body: [
      p("Teams often assume their existing observability already covers the MCP server. It covers part of it. Understanding where each layer stops makes the gap obvious."),
      h("Server logs"),
      p("Logs record what happened: a request arrived, a response left. They are complete and low-level, and they say nothing about behavior, outcomes, or which agent did what."),
      h("APM and tracing"),
      p("APM watches performance: latency, throughput, traces across services. It was built for human and service traffic. It treats a 200 as success, so tool errors inside a 200 slip past it."),
      h("MCP analytics"),
      p("This layer reads the protocol: who connected, which tools they used, whether workflows completed, and what to fix. It is the analytics layer agents need, the same way websites needed one on top of raw logs."),
      quote("Logs recorded it. APM watched it. Neither explained it."),
      p("You likely want all three. But only the analytics layer answers the questions a product owner actually asks about an MCP server."),
    ],
  },
  {
    slug: "understanding-your-mcp-client-mix",
    title: "Understanding your MCP client mix",
    tag: "Guide",
    excerpt:
      "Claude, Cursor, ChatGPT, custom agents. Knowing who drives your usage changes what you build next.",
    date: "Nov 24, 2025",
    read: "5 min read",
    body: [
      p("Not all MCP clients behave the same. They differ in how they discover tools, how they format arguments, and how persistent they are on retries. Your client mix is a design input, not a vanity metric."),
      h("Why the mix matters"),
      ul([
        "A tool that works in one client may fail in another over argument shape",
        "Growth concentrated in one client is a risk worth knowing",
        "Custom agents often reveal power-user workflows worth supporting",
      ]),
      h("What to do with it"),
      p("Break every core metric down by client. If completion rate is high in Claude and low in Cursor, the problem is client-specific and so is the fix. If one client drives most growth, test changes against it first."),
      p("Client mix turns 'our server is doing fine' into 'our server is doing fine for these clients and not those,' which is the version you can act on."),
    ],
  },
  {
    slug: "workflow-completion-rate-the-north-star",
    title: "Workflow completion rate: the north-star for MCP",
    tag: "Product",
    excerpt:
      "One number captures whether your server actually helps: the share of sessions that reach a useful result.",
    date: "Nov 17, 2025",
    read: "6 min read",
    body: [
      p("If you could keep only one metric for your MCP server, make it workflow completion rate: of the sessions that start, how many reach a useful result. Almost everything else is a lever on this number."),
      h("Why it beats call volume"),
      p("Call volume rewards busy failure. A server where agents call tools constantly and never finish looks active and is broken. Completion rate cannot be gamed that way."),
      h("How to define 'complete'"),
      p("Where you can, tie completion to a real outcome: an issue created, a query answered, a message sent successfully. Where you cannot measure business value directly, use an honest proxy like a session that ends on a successful terminal tool rather than a retry loop."),
      h("Moving it"),
      ul([
        "Fix the tool that ends the most sessions early",
        "Make schemas forgiving so valid intents don't fail",
        "Improve descriptions so agents pick the right tool sooner",
      ]),
      p("Watch completion rate weekly, and let it decide what you fix first."),
    ],
  },
  {
    slug: "how-to-cut-agent-retries",
    title: "How to cut agent retries on your MCP server",
    tag: "Engineering",
    excerpt:
      "Retries are a tax on every session. Most come from a small set of avoidable, measurable causes.",
    date: "Nov 6, 2025",
    read: "5 min read",
    body: [
      p("Retries feel harmless because they sometimes succeed. But each one adds latency, cost, and a chance the agent gives up. Cutting them is one of the highest-leverage things you can do."),
      h("Where retries come from"),
      ul([
        "Schema mismatches that fail validation the same way twice",
        "Ambiguous errors the agent cannot recover from",
        "Slow tools that time out and get called again",
        "Tools that return partial results the agent re-requests",
      ]),
      h("How to find your worst offenders"),
      p("Group calls by session and look for repeated calls to the same tool with the same arguments. Rank tools by retries per successful call. The top of that list is your fix queue."),
      h("Fixes that stick"),
      p("Return errors that tell the agent exactly what to change. Accept the shapes models actually send. Cache or speed up the slow dependency behind a timeout-prone tool. Each one turns a loop into a single successful call."),
    ],
  },
  {
    slug: "latency-that-matters-for-agents",
    title: "Latency that matters for agents (p50 and p95)",
    tag: "Engineering",
    excerpt:
      "Averages hide the calls that ruin sessions. Track p50 for the typical call and p95 for the tail.",
    date: "Oct 28, 2025",
    read: "5 min read",
    body: [
      p("Latency matters for agents differently than for humans. An agent chains calls, so a slow tail on one tool compounds across a session and pushes it toward timeouts and retries."),
      h("Why averages lie"),
      p("A mean latency looks reassuring while a tenth of calls take ten times as long. Those tail calls are the ones agents time out on. Track percentiles, not averages."),
      h("The two numbers to watch"),
      ul([
        "p50: the experience of a typical call",
        "p95: the tail that quietly breaks sessions",
      ]),
      h("Act at the tool level"),
      p("Sort tools by p95, not overall latency. The fix is usually one dependency behind one tool. Speeding up that tail often lifts completion rate more than any broad performance work."),
    ],
  },
  {
    slug: "retention-for-mcp-servers",
    title: "Retention for MCP servers",
    tag: "Product",
    excerpt:
      "One-time usage is easy. The signal that your server is genuinely useful is clients that come back.",
    date: "Oct 20, 2025",
    read: "5 min read",
    body: [
      p("Launch traffic is flattering and temporary. The durable signal that your MCP server earned a place in an agent's toolkit is retention: clients that connect again next week without prompting."),
      h("What to measure"),
      ul([
        "Returning connections within 7 and 30 days",
        "Repeat usage of the same core workflow",
        "Breadth: returning clients using more than one tool",
      ]),
      h("Why breadth matters"),
      p("A client that only ever calls one tool is fragile; a small change can drop it. Clients that adopt several tools have woven your server into their work and tend to stay. Watch whether returning clients expand their usage over time."),
      h("Improving it"),
      p("Retention follows reliability and completion. Fix the failures that end sessions, make the common workflow smooth, and the clients that tried you once have a reason to come back."),
    ],
  },
  {
    slug: "instrument-your-mcp-server-in-one-line",
    title: "Instrument your MCP server in one line",
    tag: "Guide",
    excerpt:
      "You don't need an observability project to start. Wrap your server, deploy, and read the data the same day.",
    date: "Oct 10, 2025",
    read: "4 min read",
    body: [
      p("The reason most MCP servers ship without analytics is not disagreement about value; it is the assumed cost. But instrumenting at the protocol layer means the cost is one line and one deploy."),
      h("The whole setup"),
      code(`import { withTrackMCP } from "@trackmcp/sdk";
import { server } from "./mcp";

export default withTrackMCP(server, {
  apiKey: process.env.TRACKMCP_KEY,
  service: "acme-mcp-server",
});`),
      p("Python is the same shape with with_trackmcp. Your tools do not change. There are no per-tool decorators and no custom events required to get the core picture."),
      h("What you get on day one"),
      ul([
        "Active clients and client mix",
        "Tool adoption and the tools nobody calls",
        "Completed workflows and where sessions stop",
        "Silent failures hiding inside successful responses",
      ]),
      p("Start there. Add redaction and custom events later if you need them. The point is that the first insight is minutes away, not a quarter away."),
    ],
  },
  {
    slug: "writing-tool-descriptions-agents-use",
    title: "Writing tool descriptions agents actually use",
    tag: "Guide",
    excerpt:
      "A great tool with a vague description is invisible to the model. Descriptions are UX for agents.",
    date: "Oct 1, 2025",
    read: "6 min read",
    body: [
      p("An agent chooses tools by reading their names and descriptions. If a tool is never called, the problem is often not the tool but how it introduces itself. Descriptions are the interface agents actually see."),
      h("Write for the moment of choice"),
      p("The model is deciding, right now, which tool fits the user's intent. Say plainly what the tool does, when to use it, and when not to. Lead with the verb and the object: 'Create an issue in the project tracker.'"),
      h("Be specific about inputs"),
      ul([
        "Name arguments the way a model would guess them",
        "State accepted shapes and give a short example",
        "Avoid overlapping tools that compete for the same intent",
      ]),
      h("Close the loop with data"),
      p("Ship a description change, then watch adoption for that tool. If calls rise and success holds, the wording was the blocker. Treating descriptions as something you measure and iterate on is how underused tools come back to life."),
    ],
  },
  {
    slug: "what-is-mcp-analytics",
    title: "What is MCP analytics?",
    tag: "Guide",
    excerpt:
      "A plain-English definition: MCP analytics is product analytics for your MCP server — who connects, what they call, and whether it works.",
    date: "Sep 24, 2025",
    read: "5 min read",
    body: [
      p("MCP analytics is the practice of measuring how AI clients actually use your MCP server: which clients connect, which tools they call, whether the work completes, and where it fails. It is product analytics for the Model Context Protocol, the same way Google Analytics is product analytics for a website."),
      h("The one-line definition"),
      quote("MCP analytics turns raw tool-call traffic into who, what, and whether it worked."),
      h("What it measures"),
      ul([
        "Clients: which agents connect and how usage grows",
        "Tools: call volume, adoption, and the tools nobody uses",
        "Workflows: the paths agents take and where they stop",
        "Outcomes: completion rate and returning usage",
        "Reliability: errors, including failures hidden inside a 200 OK",
      ]),
      h("How it differs from logging"),
      p("Logs record that a request happened. Analytics reconstructs behavior: it groups calls into sessions, attributes them to clients, and measures whether a task actually finished. Logs answer 'did it run?' Analytics answers 'did it work, for whom, and what should I fix?'"),
      h("Do you need it"),
      p("If you have shipped an MCP server and cannot answer which tool is most used or which one silently fails, you need MCP analytics. It installs at the protocol layer in one line and starts answering those questions from the first call."),
    ],
  },
  {
    slug: "what-is-the-model-context-protocol",
    title: "What is the Model Context Protocol (MCP)?",
    tag: "Guide",
    excerpt:
      "MCP is an open standard that lets AI models call your tools and data through a consistent interface. Here's the mental model.",
    date: "Sep 16, 2025",
    read: "6 min read",
    body: [
      p("The Model Context Protocol (MCP) is an open standard for connecting AI models to external tools and data. Instead of every model integrating with every service in its own way, MCP defines one consistent interface: a server exposes tools, and any MCP-compatible client can discover and call them."),
      h("The mental model"),
      p("Think of MCP as a universal port for AI. Your MCP server advertises a set of tools with names, descriptions, and input schemas. A client like Claude, Cursor, or ChatGPT reads that list, decides which tool fits the user's intent, and calls it with structured arguments."),
      h("The core pieces"),
      ul([
        "Server: exposes tools, resources, and prompts",
        "Client: an AI app that connects and calls them",
        "Transport: how messages pass between them",
        "Tools: named functions with input schemas and results",
      ]),
      h("Why it matters"),
      p("MCP turns a model from a text generator into something that can act: query a database, create an issue, send a message. That power is also why measurement matters. Once agents are calling real tools, you need to know which calls happen, whether they succeed, and what to improve."),
      h("Where analytics fits"),
      p("MCP standardizes the interface, which means you can capture every call at one seam. That is what makes MCP analytics possible in a single line, without touching each tool."),
    ],
  },
  {
    slug: "how-to-monitor-an-mcp-server",
    title: "How to monitor an MCP server",
    tag: "Engineering",
    excerpt:
      "Uptime and status codes aren't enough for agent traffic. Here's what to monitor on an MCP server and how to set it up.",
    date: "Sep 8, 2025",
    read: "7 min read",
    body: [
      p("Monitoring an MCP server is different from monitoring a typical web service. The traffic comes from AI agents, the errors hide inside successful responses, and the thing you care about is whether a task completed, not just whether the process is up."),
      h("Start with the protocol layer"),
      p("Wrap your server once at the request/response boundary. Because every tool call flows through the same path, one wrapper captures the name, arguments, result, timing, and client for every call, with no per-tool code."),
      code(`import { withTrackMCP } from "@trackmcp/sdk";
import { server } from "./mcp";

export default withTrackMCP(server, {
  apiKey: process.env.TRACKMCP_KEY,
});`),
      h("What to monitor"),
      ul([
        "Tool-level error rate, separate from transport errors",
        "Silent failures: isError responses inside a 200 OK",
        "p95 latency per tool, not just the average",
        "Completion rate: sessions that reach a useful result",
        "Client mix and retries per session",
      ]),
      h("Alert on the right things"),
      p("Alert when a tool's error rate spikes, when p95 latency climbs, or when completion rate drops. These are the signals that a real user experience is degrading, and none of them show up in a plain uptime check."),
    ],
  },
  {
    slug: "mcp-observability-explained",
    title: "MCP observability: logs, metrics, and traces",
    tag: "Engineering",
    excerpt:
      "The three pillars of observability, mapped to MCP servers — and the fourth thing agent traffic needs that they don't cover.",
    date: "Aug 28, 2025",
    read: "6 min read",
    body: [
      p("Observability is usually described as three pillars: logs, metrics, and traces. All three apply to an MCP server, but agent traffic adds a requirement the classic pillars miss: behavioral analytics."),
      h("Logs"),
      p("Logs are the raw event record: a call arrived, a result left. Essential for debugging a specific incident, but they say nothing about behavior across many calls or whether a user's task completed."),
      h("Metrics"),
      p("Metrics aggregate: request rate, latency percentiles, error counts. They tell you the system's health over time, but by default they treat a 200 as success and miss tool-level failures."),
      h("Traces"),
      p("Traces follow one request across services. Useful when a tool call fans out to several backends and you need to find the slow hop."),
      h("The missing pillar: behavior"),
      p("None of the three answers 'which tools do agents adopt, which workflows complete, and where do sessions stop?' That is the analytics layer, and it is what turns observability into product decisions for an MCP server."),
    ],
  },
  {
    slug: "how-to-debug-mcp-tool-errors",
    title: "How to debug MCP tool errors",
    tag: "Engineering",
    excerpt:
      "A practical workflow for finding and fixing the tool calls that fail — including the ones your monitoring calls a success.",
    date: "Aug 19, 2025",
    read: "6 min read",
    body: [
      p("Debugging MCP tool errors starts with a hard truth: many failures return a 200 OK. MCP puts tool errors in the response body, so your first job is to look at the payload, not the status code."),
      h("Step 1: separate transport from tool errors"),
      p("Count HTTP/transport failures separately from tool-level failures flagged with isError. A server that looks healthy at the transport layer can still be failing most of its tool calls."),
      h("Step 2: rank tools by failure"),
      p("Sort tools by call volume and success rate. A high-volume, low-success tool is your top priority, because it is breaking the most sessions."),
      h("Step 3: read the error text"),
      p("Open the failing calls and read the actual error. The pattern is usually a shape or type the model keeps getting wrong."),
      code(`// schema wants:  { "to": ["a@x.com"] }
// agents send:    { "to": "a@x.com" }  → validation error`),
      h("Step 4: make the tool forgiving"),
      p("Coerce common shapes, accept synonyms for enum values, and return errors that tell the agent exactly what to change. Most tool errors are fixed by tolerance, not by new features."),
    ],
  },
  {
    slug: "how-to-increase-mcp-tool-adoption",
    title: "How to increase adoption of your MCP tools",
    tag: "Product",
    excerpt:
      "If agents ignore a tool, the problem is usually discovery, not capability. A practical playbook to get your tools used.",
    date: "Aug 11, 2025",
    read: "6 min read",
    body: [
      p("A tool that never gets called is not necessarily a bad tool. More often it is a discovery problem: the model does not know when to reach for it. Increasing adoption is mostly about making tools easy for an agent to choose correctly."),
      h("Fix the description first"),
      p("Agents pick tools by reading names and descriptions. Lead with the verb and object, say when to use it and when not to, and name arguments the way a model would guess them."),
      h("Reduce competition between tools"),
      p("If two tools overlap, the model splits calls or picks wrong. Merge them or sharpen the boundary so each has a clear job."),
      h("Make the happy path forgiving"),
      ul([
        "Accept the argument shapes models actually send",
        "Provide sensible defaults for optional fields",
        "Return results the agent can use without a second call",
      ]),
      h("Measure and iterate"),
      p("Ship a change, then watch that tool's adoption and success rate. If calls rise and success holds, the wording was the blocker. Adoption is something you improve on a loop, not guess once."),
    ],
  },
  {
    slug: "mcp-server-security-redacting-data",
    title: "MCP server security: redacting sensitive data",
    tag: "Engineering",
    excerpt:
      "How to get analytics on your MCP server without letting sensitive arguments or results leave your process.",
    date: "Aug 1, 2025",
    read: "5 min read",
    body: [
      p("Tool calls often carry sensitive data: emails, tokens, query contents. You can still measure usage without shipping any of it, as long as redaction happens locally, before anything leaves your process."),
      h("Redact in-process"),
      p("Good MCP analytics strips sensitive fields on your server, not on a remote pipeline. You name the paths to remove, and the raw values never travel."),
      code(`withTrackMCP(server, {
  apiKey: process.env.TRACKMCP_KEY,
  redact: ["args.email", "args.api_key", "result.raw_response"],
});`),
      h("Prefer shape over content"),
      p("You rarely need the actual values to learn from usage. Knowing that a call happened, which tool, which client, and whether it succeeded is enough for adoption, workflows, and reliability."),
      h("Other safeguards"),
      ul([
        "Sample high-volume calls to reduce data footprint",
        "Fail open: capture must never block a tool call",
        "Scope API keys to a workspace and keep them server-side",
      ]),
      p("Done right, you get the full analytics picture while sensitive data stays inside your infrastructure."),
    ],
  },
  {
    slug: "track-which-agents-use-your-mcp-server",
    title: "How to track which AI agents use your MCP server",
    tag: "Guide",
    excerpt:
      "Claude, Cursor, ChatGPT, or a custom agent? Here's how to see your client mix and why it changes what you build.",
    date: "Jul 22, 2025",
    read: "5 min read",
    body: [
      p("Knowing which AI agents call your MCP server is one of the most useful things you can measure. Clients differ in how they discover tools, format arguments, and retry, so your client mix is a design input, not a vanity number."),
      h("How it's captured"),
      p("Each MCP connection identifies its client. Analytics at the protocol layer records that automatically, so you can break every metric down by client without extra work."),
      h("What to look for"),
      ul([
        "Distribution: which clients drive most usage",
        "Growth: which client is growing fastest",
        "Per-client success: a tool may fail in one client and not another",
      ]),
      h("Why it changes decisions"),
      p("If completion is high in one client and low in another, the fix is client-specific. If growth concentrates in a single client, test changes against it first. Client-level data turns a vague 'it works' into something you can act on."),
    ],
  },
  {
    slug: "mcp-server-metrics-checklist",
    title: "MCP server metrics: a monitoring checklist",
    tag: "Guide",
    excerpt:
      "A copy-and-keep checklist of the metrics worth tracking on an MCP server, grouped by adoption, outcomes, and reliability.",
    date: "Jul 14, 2025",
    read: "5 min read",
    body: [
      p("Here is a practical checklist of MCP server metrics worth tracking. Lead with adoption and outcomes; keep reliability close as support."),
      h("Adoption"),
      ul([
        "Active clients and client mix",
        "New vs returning connections",
        "Tool call volume and per-tool adoption",
        "Tools with zero calls (candidates to fix or cut)",
      ]),
      h("Outcomes"),
      ul([
        "Workflow completion rate",
        "Most common workflow and where sessions stop",
        "Returning usage within 7 and 30 days",
      ]),
      h("Reliability"),
      ul([
        "Tool-level error rate",
        "Silent failures (isError inside a 200 OK)",
        "p50 and p95 latency per tool",
        "Retries per successful call",
      ]),
      h("How to use it"),
      p("Review adoption and outcomes weekly to steer the product, and watch reliability for regressions. If a number moves the wrong way, it points you straight at what to fix."),
    ],
  },
  {
    slug: "how-to-measure-mcp-server-roi",
    title: "How to measure the ROI of your MCP server",
    tag: "Product",
    excerpt:
      "Tie your MCP server to outcomes leadership cares about: completed tasks, retained clients, and reduced failure cost.",
    date: "Jul 3, 2025",
    read: "6 min read",
    body: [
      p("To justify investment in an MCP server, connect it to outcomes, not activity. Call volume is easy to grow and easy to dismiss. Completed work, retained clients, and avoided failures are what make the case."),
      h("Value created"),
      ul([
        "Completed workflows tied to a real result (issue created, query answered)",
        "Returning clients that keep using the server",
        "Breadth: clients adopting more than one tool over time",
      ]),
      h("Cost avoided"),
      ul([
        "Silent failures caught before users churn",
        "Retries reduced, cutting latency and token cost",
        "Dead tools removed, cutting maintenance",
      ]),
      h("Frame it as a rate"),
      p("Completion rate is the cleanest ROI proxy: of the sessions that start, how many reach a useful result. Improving it moves every downstream number, and it cannot be gamed by busy failure."),
      h("Report the trend"),
      p("Leadership responds to direction. Show completion rate, returning usage, and error rate week over week, and the value of the server becomes self-evident."),
    ],
  },
  {
    slug: "answer-engine-optimization-for-mcp-tools",
    title: "Answer engine optimization for MCP tools",
    tag: "Guide",
    excerpt:
      "AEO isn't just for content. Making your tools easy for an AI to choose and call correctly is optimization for the answer engine.",
    date: "Jun 20, 2025",
    read: "6 min read",
    body: [
      p("Answer engine optimization (AEO) usually means making content easy for AI to cite. For an MCP server, there is a parallel discipline: making your tools easy for an AI to discover, choose, and call correctly. The 'answer engine' here is the agent, and your tools are what it reaches for."),
      h("The agent is your audience"),
      p("A model reads your tool names, descriptions, and schemas at the moment it decides what to do. If that text is vague, the tool is effectively invisible, no matter how good the implementation is."),
      h("Optimize for the moment of choice"),
      ul([
        "Clear names: verb + object, matching how a user phrases intent",
        "Descriptions that state when to use and when not to",
        "Schemas that accept the shapes models naturally produce",
        "No overlapping tools competing for the same intent",
      ]),
      h("Measure discoverability"),
      p("AEO for tools is measurable. Track adoption per tool and success rate after a description change. If the right tool starts getting called for the right intent, your optimization worked."),
      quote("For an MCP server, the best-optimized tool is the one the agent picks correctly without a retry."),
    ],
  },
  {
    slug: "ab-test-mcp-tool-descriptions",
    title: "How to A/B test your MCP tool descriptions",
    tag: "Product",
    excerpt:
      "Tool descriptions are UX for agents. Here's how to test wording changes and prove which version gets tools used correctly.",
    date: "Jun 9, 2025",
    read: "5 min read",
    body: [
      p("Because agents choose tools by reading descriptions, wording is one of your highest-leverage levers. And like any UX copy, it should be tested rather than guessed."),
      h("What to test"),
      ul([
        "The verb and object in the tool name",
        "When-to-use guidance in the description",
        "Argument names and the example shapes you show",
      ]),
      h("How to run it"),
      p("Change one description at a time so you can attribute the effect. Note the change and the date, then let real traffic run against it for a meaningful window."),
      h("What to measure"),
      ul([
        "Adoption: does call volume for the tool rise?",
        "Correctness: does success rate hold or improve?",
        "Retries: do give-up loops go down?",
      ]),
      h("Keep what wins"),
      p("If adoption rises and success holds, the new wording was better. Treat descriptions as a living surface you iterate on, and underused tools often come back to life."),
    ],
  },
  {
    slug: "mcp-vs-rest-api-analytics",
    title: "MCP vs REST API: how analytics differs",
    tag: "Guide",
    excerpt:
      "If you've measured a REST API, MCP will feel familiar but different. Here's what changes when your callers are AI agents.",
    date: "May 28, 2025",
    read: "6 min read",
    body: [
      p("If you have instrumented a REST API, MCP analytics will feel familiar: calls, latency, errors. But three things change when the callers are AI agents rather than human-written clients."),
      h("1. Errors live in the body"),
      p("A REST API signals failure with a status code. MCP often returns tool errors inside a successful response, so status-based monitoring misses them. You have to read the payload."),
      h("2. The caller reasons about your interface"),
      p("A REST client is coded once against your spec. An agent decides at runtime which tool to call based on your names and descriptions. That makes discoverability a first-class metric, not just correctness."),
      h("3. Sessions are the unit"),
      p("A REST endpoint is often measured per request. Agent value shows up across a session: a chain of calls toward a task. Completion rate, not request count, is the metric that matters."),
      h("What carries over"),
      p("Latency percentiles, error rates, and client breakdowns all still apply. The mindset shift is from 'did the request return 200?' to 'did the agent accomplish the task?'"),
    ],
  },
];

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}
