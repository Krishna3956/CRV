import type { Metadata } from "next";
import { TrustPage } from "@/components/TrustPage";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "About TrackMCP | MCP Server Analytics",
  description: "Learn why TrackMCP exists and how we are building analytics and observability for teams shipping MCP servers.",
  path: "/about",
});

export default function AboutPage() {
  return <TrustPage eyebrow="About TrackMCP" title="The observability layer for MCP servers." updated="September 2026" intro="TrackMCP helps teams understand what happens after an AI client connects to an MCP server: which tools are discovered, what gets called, where the path breaks, and whether the work gets done." sections={[
    { title: "Why we are building this", body: ["MCP servers are becoming product surfaces, but most teams still see only fragments of their usage: process logs, HTTP status codes, or downstream application traces. Those signals do not answer which clients are using the server, which tools are being ignored, or where an agent workflow stopped.", "TrackMCP turns the MCP lifecycle into a usable view of adoption, reliability, and outcomes while keeping the server and its tools under the team’s control."] },
    { title: "What we focus on", body: ["Our focus is narrow: analytics and observability for Model Context Protocol servers. The product covers connections, clients, tool discovery, tool calls, sessions, errors, latency, retries, and workflow signals. We do not present TrackMCP as the MCP specification or as a replacement for every logging, APM, or security system."] },
    { title: "How we work", body: ["We prefer tested documentation, clear product boundaries, and useful defaults over inflated claims. Product behavior, SDK support, pricing, and security details should be verifiable from the public site or documentation. When a capability is not supported, we say so."] },
    { title: "Start here", body: ["If you maintain an MCP server, begin with the MCP analytics quickstart. If you are evaluating the category, read how MCP observability differs from logs, APM, and uptime checks. For privacy and data handling, see the Privacy Policy and Security page."] },
  ]} contactLabel="support@trackmcp.com" contactHref="mailto:support@trackmcp.com" />;
}
