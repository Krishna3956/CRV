import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { DocsShell, DocTitle, DocLead, DocSection, Para, Inline, DocsNextSteps } from "@/components/DocsShell";

export const metadata: Metadata = pageMeta({
  title: "Authentication and OAuth | TrackMCP Docs",
  description: "Understand TrackMCP dashboard authentication, ingestion keys, and the MCP OAuth boundary.",
  path: "/docs/authentication",
});

export default function AuthenticationDocsPage() {
  return <DocsShell active="/docs/authentication">
    <DocTitle eyebrow="Security">Authentication &amp; OAuth</DocTitle>
    <DocLead>TrackMCP has separate credential domains for dashboard access, telemetry ingestion, and customer MCP authorization. Keeping them separate prevents a telemetry key from becoming an OAuth token.</DocLead>
    <DocsNextSteps nativeHref="/docs/reference" />
    <DocSection title="What TrackMCP authenticates">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Dashboard session", "A signed-in workspace member can view analytics and manage keys."],
          ["Connection key", "A server-side secret authenticates bounded telemetry ingestion for one workspace."],
          ["MCP OAuth", "Your MCP server or authorization proxy owns user authorization, scopes, and bearer-token validation."],
        ].map(([title, body]) => <div key={title} className="rounded-xl border border-line bg-white p-4"><h3 className="text-sm font-semibold text-ink">{title}</h3><p className="mt-2 text-xs leading-relaxed text-muted">{body}</p></div>)}
      </div>
    </DocSection>
    <DocSection title="Sign in with Google or GitHub">
      <Para>TrackMCP supports email sign-in and is prepared for Google and GitHub sign-in on the dashboard. Social buttons appear only after the corresponding provider is enabled in the connected Supabase project. Choose an enabled provider on <a href="/signin" className="font-medium text-brand-strong underline">Sign in</a> or <a href="/signup" className="font-medium text-brand-strong underline">Create an account</a>; after the provider confirms you, TrackMCP returns you to the dashboard or to the page that started the sign-in flow.</Para>
      <Para>Social sign-in uses Supabase Auth&apos;s authorization-code (PKCE) flow. TrackMCP exchanges the short-lived callback code on the server and stores the resulting session in secure auth cookies. TrackMCP does not request, store, or use Google/GitHub provider tokens for analytics.</Para>
      <div className="mt-4 rounded-xl border border-line bg-white p-4 text-sm leading-relaxed text-body">
        <h3 className="font-semibold text-ink">One-time project configuration</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Enable Google and/or GitHub under Supabase Authentication → Sign In / Providers.</li>
          <li>Register each provider&apos;s Supabase callback URL: <Inline>https://&lt;project-ref&gt;.supabase.co/auth/v1/callback</Inline>.</li>
          <li>Add the public app callback to Supabase Authentication → URL Configuration: <Inline>https://&lt;your-public-app-origin&gt;/auth/callback</Inline> and <Inline>http://localhost:3000/auth/callback</Inline>. Use the exact origin configured for your deployment.</li>
          <li>Keep provider client secrets in Supabase, never in the repository or <Inline>NEXT_PUBLIC_*</Inline> variables.</li>
        </ul>
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
    <DocSection title="Rate-limit deployment boundary">
      <Para>CLI device and activation endpoints are rate-limited. The production pilot uses the bounded process-local fallback unless the deployment explicitly sets <Inline>TRACKMCP_RATE_LIMIT_MODE=supabase</Inline> and the reviewed Supabase rate-limit migration, service-role RPC grants, cleanup job, and postflight have all passed. The fallback is intentionally marked degraded and does not coordinate limits across multiple application instances.</Para>
      <Para>Do not treat the fallback as distributed protection. Before enabling horizontal scaling for activation traffic, run the reviewed rate-limit postflight and complete the guarded deployment workflow. If that external AWS/Supabase configuration is not present, the supported pilot boundary is a single-instance or otherwise explicitly scoped deployment.</Para>
    </DocSection>
  </DocsShell>;
}
