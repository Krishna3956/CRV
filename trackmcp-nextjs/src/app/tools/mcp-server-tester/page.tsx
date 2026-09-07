import type { Metadata } from "next";
import { McpTesterPage } from "@/components/mcp-tester/McpTesterPage";
import { MCP_TESTER_FAQS, McpTesterEducation } from "@/components/mcp-tester/McpTesterEducation";
import { pageMeta, serializeJsonLd, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "MCP Server Tester: Test, Inspect, and Health Check MCP Servers",
  description: "Test, inspect, and health-check an MCP server from your browser with a bounded HTTPS Streamable HTTP probe.",
  path: "/tools/mcp-server-tester",
});

export default function McpServerTesterPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: MCP_TESTER_FAQS.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
    url: `${SITE_URL}/tools/mcp-server-tester`,
  };

  return <>
    <script type="application/ld+json">{serializeJsonLd(faqJsonLd)}</script>
    <McpTesterPage><McpTesterEducation /></McpTesterPage>
  </>;
}
