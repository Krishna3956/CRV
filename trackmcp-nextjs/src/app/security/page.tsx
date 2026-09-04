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
    { title: "Data minimization", body: ["The SDK and server integration are built around structured metadata such as the tool, client, timing, status, method, and error details. Your server controls what it sends. Do not send secrets, credentials, raw prompts, or unnecessary end-user data."] },
    { title: "Redact before data leaves the process", body: ["Apply redaction in the server process before telemetry is transmitted. Use the SDK configuration and your own application policy to remove sensitive fields. If a debugging case requires richer payload capture, define the access, retention, and review policy first."] },
    { title: "Keys and workspace boundaries", body: ["Ingest keys are scoped to a workspace and should be stored in environment variables or a secret manager. Never commit them to source control or put them in tool arguments. Revoke a key when it is no longer needed."] },
    { title: "Failure behavior and retention", body: ["Telemetry should not become a dependency that stops your MCP server from serving users. The SDK is designed to fail open when the telemetry path is unavailable. Retention follows the selected plan; workspace owners can request access, export, correction, or deletion through the privacy contact."] },
    { title: "Security reviews", body: ["Enterprise teams can contact us before adoption to discuss security requirements, retention, export, and data-residency questions. We will keep this page current as the product’s controls and supported deployment options evolve."] },
  ]} contactLabel="security@trackmcp.com" contactHref="mailto:security@trackmcp.com" />;
}
