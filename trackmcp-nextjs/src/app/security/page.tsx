import type { Metadata } from "next";
import { TrustPage } from "@/components/TrustPage";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Security at TrackMCP | MCP Telemetry",
  description: "How TrackMCP approaches telemetry minimization, local redaction, workspace isolation, API keys, retention, and fail-open operation.",
  path: "/security",
});

export default function SecurityPage() {
  return <TrustPage eyebrow="Trust and security" title="Security is part of the telemetry design." updated="September 2026" intro="TrackMCP is designed to help teams observe MCP servers without treating raw prompts, tool arguments, or end-user data as the default telemetry model." sections={[
    { title: "Data minimization", body: ["The SDK defaults to bounded redacted payloads. Common sensitive keys, bearer tokens, credentialed resource URLs, and binary/base64 values are scrubbed recursively before telemetry is transmitted. Metadata mode omits arguments and results; full mode is opt-in and remains bounded. Your server controls what it sends."] },
    { title: "Redact before data leaves the process", body: ["Use the SDK's explicit dotted paths, additional exact key names, and event hook to apply application-specific policy in the server process. Payloads are capped by bytes, depth, breadth, and string length, with structured markers for omitted content. If a debugging case requires richer capture, define the access, retention, and review policy first."] },
    { title: "Keys and workspace boundaries", body: ["Ingest keys are scoped to a workspace and should be stored in environment variables or a secret manager. Never commit them to source control or put them in tool arguments. Revoke a key when it is no longer needed."] },
    { title: "Failure behavior and retention", body: ["Telemetry should not become a dependency that stops your MCP server from serving users. The SDK is designed to fail open when the telemetry path is unavailable. Current retention, access, and deletion controls depend on the deployed service and applicable terms; confirm them with the TrackMCP team before relying on them."] },
    { title: "Security reviews", body: ["Enterprise teams can contact us before adoption to discuss the currently supported security, retention, and data-residency requirements. Planned export and alert integrations are not represented as shipped functionality. We will keep this page current as the product’s controls and supported deployment options evolve."] },
  ]} contactLabel="security@trackmcp.com" contactHref="mailto:security@trackmcp.com" />;
}
