import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = pageMeta({
  title: "Terms of Service | TrackMCP",
  description:
    "The terms that govern your use of TrackMCP, the analytics service for MCP servers.",
  path: "/terms",
});

const sections: LegalSection[] = [
  {
    h: "Agreement",
    p: [
      "By using TrackMCP you agree to these terms. If you use TrackMCP on behalf of a company, you agree on its behalf. If you do not agree, do not use the service.",
    ],
  },
  {
    h: "The service",
    p: [
      "TrackMCP is analytics for MCP servers. You wrap your server with our SDK, and we turn the resulting calls into dashboards, sessions, and summaries. Features and usage limits vary by plan; we may add, change, or remove features over time.",
    ],
  },
  {
    h: "Your account",
    p: [
      "You are responsible for keeping your credentials secure and for activity under your account. You must use the service in line with applicable laws and not attempt to disrupt or reverse-engineer it.",
    ],
  },
  {
    h: "Your data",
    p: [
      "You own the telemetry you send. You grant us the limited rights needed to store and process it to provide the service. You are responsible for not sending data you are not permitted to send. See our Privacy Policy for details.",
    ],
  },
  {
    h: "Plans & billing",
    p: [
      "Paid plans are billed in advance and are month-to-month unless agreed otherwise. Usage above your plan's limits may require an upgrade. Pricing and limits may change with notice.",
    ],
  },
  {
    h: "Availability",
    p: [
      "We work hard to keep TrackMCP available, but the service is provided as-is, without an uptime SLA unless your Enterprise agreement states one.",
    ],
  },
  {
    h: "Liability",
    p: [
      "To the extent permitted by law, TrackMCP is not liable for indirect or consequential damages, and our total liability is limited to the amount you paid us in the prior three months.",
    ],
  },
  {
    h: "Termination",
    p: [
      "You can stop using TrackMCP and delete your workspace at any time. We may suspend accounts that violate these terms. On termination, we delete your telemetry per the retention policy.",
    ],
  },
  {
    h: "Contact",
    p: ["Questions about these terms? Email legal@trackmcp.com."],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="February 2026"
      intro="Plain-language terms for using TrackMCP."
      sections={sections}
    />
  );
}
