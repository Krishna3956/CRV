import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { DocsShell, DocTitle, DocLead, DocSection, Para } from "@/components/DocsShell";

export const metadata: Metadata = pageMeta({
  title: "Authentication and OAuth | TrackMCP Docs",
  description: "Understand TrackMCP dashboard authentication, ingestion keys, and the MCP OAuth boundary.",
  path: "/docs/authentication",
});

export default function AuthenticationDocsPage() {
  return <DocsShell active="/docs/authentication">
    <DocTitle eyebrow="Security">Authentication &amp; OAuth</DocTitle>
    <DocLead>TrackMCP has separate credential domains for dashboard access, telemetry ingestion, and customer MCP authorization. Keeping them separate prevents a telemetry key from becoming an OAuth token.</DocLead>
    <DocSection title="What TrackMCP authenticates">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Dashboard session", "A signed-in workspace member can view analytics and manage keys."],
          ["Connection key", "A server-side secret authenticates bounded telemetry ingestion for one workspace."],
          ["MCP OAuth", "Your MCP server or authorization proxy owns user authorization, scopes, and bearer-token validation."],
        ].map(([title, body]) => <div key={title} className="rounded-xl border border-line bg-white p-4"><h3 className="text-sm font-semibold text-ink">{title}</h3><p className="mt-2 text-xs leading-relaxed text-muted">{body}</p></div>)}
      </div>
    </DocSection>
    <DocSection title="OAuth boundary">
      <Para>TrackMCP does not register OAuth clients, issue authorization codes, exchange tokens, or parse customer bearer tokens. For a protected remote MCP resource, follow the MCP authorization flow: protected-resource metadata, authorization-server discovery, authorization code with PKCE, issuer/audience validation, and least-privilege scopes. The resource validates the token; it does not mint it.</Para>
      <Para>When your application has already authenticated a tenant, configure the SDK account resolver with a bounded claim. Never use an OAuth token, email, raw subject, or API key as an analytics identifier.</Para>
    </DocSection>
    <DocSection title="What is tested">
      <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-body">
        <li>Dashboard sessions and workspace membership are authorization-scoped.</li>
        <li>Connection keys are workspace-scoped, shown once, revocable, and never returned by analytics.</li>
        <li>Ingestion rejects invalid/revoked keys and ignores caller-supplied workspace claims.</li>
        <li>OAuth tokens and raw authorization material are not collected by the SDK or OTEL receiver.</li>
      </ul>
    </DocSection>
    <DocSection title="What is not implemented">
      <Para>TrackMCP does not provide an OAuth test server or pretend that accepting a URL, elicitation, or tool response proves that an external OAuth flow completed. Emit an explicit application outcome after your own provider confirms completion. See the <a href="/docs/reference" className="font-medium text-brand-strong underline">configuration reference</a> for resolver and privacy boundaries.</Para>
    </DocSection>
  </DocsShell>;
}
