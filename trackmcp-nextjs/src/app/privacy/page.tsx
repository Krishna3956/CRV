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
      "Usage telemetry from your MCP server: the tool called, timing, status, client type, and error details. You control what your server sends. We recommend not sending end-user personal data or secrets in tool arguments; you can redact fields before they reach us.",
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
      "Retention follows your plan (for example, 7 days on Hobby, 90 days on Pro, or custom on Enterprise). You can delete a workspace at any time, which removes its telemetry.",
    ],
  },
  {
    h: "Your rights",
    p: [
      "You can access, export, correct, or delete your data. Email privacy@trackmcp.com and we will respond within 30 days.",
    ],
  },
  {
    h: "Subprocessors & security",
    p: [
      "We use a small set of infrastructure providers to run the service. Data is encrypted in transit and at rest. Enterprise agreements may include additional security, retention, export, and data-processing terms after review.",
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
      intro="We keep this short and readable. TrackMCP measures how your MCP server is used — not who your end users are."
      sections={sections}
    />
  );
}
