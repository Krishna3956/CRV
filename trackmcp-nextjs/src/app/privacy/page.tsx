import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = pageMeta({
  title: "Privacy Policy | TrackMCP",
  description:
    "How TrackMCP collects, uses, and protects data from the MCP servers you connect.",
  path: "/privacy",
});

const sections: LegalSection[] = [
  {
    h: "What this covers",
    p: [
      "This policy explains what data TrackMCP collects when you use our website and product, how we use it, and the choices you have. It applies to trackmcp.com and the TrackMCP analytics service.",
    ],
  },
  {
    h: "Data we collect",
    p: [
      "Account data: your first name, last name, work email, company, and workspace details when you sign up.",
      "Usage telemetry from your MCP server: the tool called, timing, status, client type, and error details. SDK payload capture defaults to bounded redacted mode: common sensitive keys, bearer tokens, credentialed resource URLs, and binary/base64 content are scrubbed locally before transmission. Metadata mode omits arguments and results entirely; full mode is opt-in and remains bounded. You control what your server sends.",
      "Product analytics: how you use the TrackMCP dashboard, so we can improve it.",
    ],
  },
  {
    h: "How we use data",
    p: [
      "To provide the analytics you asked for: turning your server's calls into dashboards, sessions, and weekly summaries.",
      "To operate, secure, and improve the service, and to communicate with you about your account.",
      "We do not sell your data, and we do not use your telemetry to train models for other customers.",
    ],
  },
  {
    h: "Where data is stored",
    p: [
      "Telemetry is stored in your selected region on managed infrastructure. Enterprise customers can discuss additional deployment and data-residency requirements with us before signing.",
    ],
  },
  {
    h: "Retention",
    p: [
      "Telemetry is stored in the managed TrackMCP service for the applicable service terms. Confirm current retention and workspace deletion behavior with TrackMCP before relying on a specific period or deletion workflow.",
    ],
  },
  {
    h: "Your rights",
    p: [
      "For privacy questions or a deletion request, email privacy@trackmcp.com. We will explain the currently supported process and respond within 30 days.",
    ],
  },
  {
    h: "Subprocessors & security",
    p: [
      "We use a small set of infrastructure providers to run the service. Data is encrypted in transit and at rest. Enterprise agreements may include additional security, retention, and data-processing terms after review; export integrations are planned rather than a current P0 guarantee.",
    ],
  },
  {
    h: "Changes",
    p: [
      "We will post any material changes to this policy on this page and update the date above.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="February 2026"
      intro="We keep this short and readable. TrackMCP measures how your MCP server is used, not who your end users are."
      sections={sections}
    />
  );
}
