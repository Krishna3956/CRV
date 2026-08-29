import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { SubmitClient } from "@/components/repository/SubmitClient";

export const metadata: Metadata = pageMeta({
  title: "Submit your MCP server — get discovered by 50,000+ developers | TrackMCP",
  description:
    "Add your Model Context Protocol server to the TrackMCP directory. Free to submit — we fetch stars, language, and topics automatically. Optional Featured placement ($8/mo).",
  path: "/submit-mcp",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      name: "Featured MCP Tool Listing",
      description:
        "Get your MCP tool featured in front of developers. Premium placement with increased visibility.",
      provider: { "@type": "Organization", name: "TrackMCP", url: "https://trackmcp.com" },
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: "8",
        availability: "https://schema.org/InStock",
        description: "Monthly featured placement for your MCP tool",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Is there a cost to submit?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No — submitting your tool is completely free. The Featured option ($8/mo) is optional and gives you premium placement.",
          },
        },
        {
          "@type": "Question",
          name: "How long does approval take?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Most submissions are reviewed and approved within 24 hours.",
          },
        },
      ],
    },
  ],
};

export default function SubmitMcpPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />
      <main className="flex-1">
        <PageFrame>
          <SubmitClient />
        </PageFrame>
      </main>
      <Footer />
    </>
  );
}
