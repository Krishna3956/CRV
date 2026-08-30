import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { DocsShell, DocTitle, DocLead, DocSection, Para } from "@/components/DocsShell";

export const metadata: Metadata = pageMeta({
  title: "Python SDK | TrackMCP Docs",
  description: "The TrackMCP Python SDK is coming soon.",
  path: "/docs/python",
});

export default function PythonDocsPage() {
  return <DocsShell active="/docs/python">
    <DocTitle eyebrow="SDKs">Python SDK</DocTitle>
    <DocLead>The Python SDK is coming soon. It is not published yet, so there is no install command to run today.</DocLead>
    <DocSection title="Availability">
      <Para>TrackMCP currently provides a production TypeScript SDK. We will publish the Python package here after it has been built, tested, and released.</Para>
      <p className="mt-5"><Link href="/docs/typescript" className="font-medium text-brand-strong underline">Use the TypeScript SDK now</Link></p>
    </DocSection>
  </DocsShell>;
}
