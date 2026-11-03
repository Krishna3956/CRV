import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Fragment } from "react";
import { Check, Minus } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { EarlyAccessButton } from "@/components/EarlyAccessButton";
import { PageFrame } from "@/components/PageFrame";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = pageMeta({
  title: "Pricing | TrackMCP",
  description:
    "Simple, usage-based TrackMCP pricing for MCP teams. Start free, understand your usage, and scale when your servers do.",
  path: "/pricing",
});

const tiers = [
  {
    name: "Free",
    price: "$0",
    note: "forever",
    desc: "For trying TrackMCP on a side project or a first server.",
    cta: "Start free",
    variant: "ghost" as const,
    featured: false,
    feats: [
      "100,000 captured events / month",
      "30-day data retention",
      "1 workspace · 1 MCP server",
      "3 teammates",
      "SDK + OpenTelemetry ingestion",
      "Core business dashboards",
      "Community support",
    ],
  },
  {
    name: "Hobby",
    price: "$129",
    note: "per month",
    desc: "For a small production team that wants more headroom and history.",
    cta: "Get started",
    variant: "primary" as const,
    featured: true,
    feats: [
      "1,000,000 captured events / month",
      "90-day data retention",
      "Up to 5 MCP servers",
      "10 teammates",
      "Up to 3 environments",
      "API access and export-ready data",
      "Email support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    note: "tailored",
    desc: "For higher volume, governance, procurement, and deployment needs.",
    cta: "Contact us",
    variant: "ghost" as const,
    featured: false,
    feats: [
      "Custom event volume and retention",
      "Multiple workspaces and environments",
      "SSO, RBAC, and audit requirements",
      "Security and procurement review",
      "Custom data residency or deployment",
      "Priority onboarding and support",
      "Contracted support terms",
    ],
  },
];

const compareCols = [
  { name: "Free", price: "$0", sub: "Forever" },
  { name: "Hobby", price: "$129/mo", sub: "Small production teams", featured: true },
  { name: "Enterprise", price: "Custom", sub: "Scale and governance" },
];

type Cell = boolean | string;

const compareGroups: { group: string; rows: { label: string; vals: [Cell, Cell, Cell] }[] }[] = [
  {
    group: "Usage & access",
    rows: [
      { label: "Captured events / month", vals: ["100,000", "1,000,000", "Custom"] },
      { label: "Data retention", vals: ["30 days", "90 days", "Custom"] },
      { label: "MCP servers", vals: ["1", "5", "Custom"] },
      { label: "Environments", vals: ["1", "3", "Custom"] },
      { label: "Teammates", vals: ["3", "10", "Custom"] },
      { label: "Unlimited querying", vals: [true, true, true] },
    ],
  },
  {
    group: "MCP observability",
    rows: [
      { label: "TypeScript and Python SDKs", vals: [true, true, true] },
      { label: "OpenTelemetry ingestion", vals: [true, true, true] },
      { label: "Usage, outcomes, and issue views", vals: [true, true, true] },
      { label: "Tool adoption and client breakdown", vals: [true, true, true] },
      { label: "Latency, errors, and result states", vals: [true, true, true] },
      { label: "Privacy-aware telemetry controls", vals: [true, true, true] },
      { label: "Example data and provenance labels", vals: [true, true, true] },
      { label: "Authenticated API access", vals: [true, true, true] },
    ],
  },
  {
    group: "Team workflows",
    rows: [
      { label: "Saved views and scheduled exports", vals: ["Planned", "Planned", "Planned"] },
      { label: "Email, webhook, and Slack alerts", vals: ["Planned", "Planned", "Planned"] },
      { label: "Custom dashboards", vals: ["Planned", "Planned", "Planned"] },
      { label: "SSO / SCIM / advanced RBAC", vals: [false, false, "By agreement"] },
      { label: "Security review and custom terms", vals: [false, false, true] },
    ],
  },
  {
    group: "Support",
    rows: [
      { label: "Community support", vals: [true, true, true] },
      { label: "Email support", vals: [false, true, true] },
      { label: "Priority onboarding", vals: [false, false, true] },
      { label: "Contracted support terms", vals: [false, false, true] },
    ],
  },
];

function CompareValue({ v }: { v: Cell }) {
  if (typeof v === "string") return <span className="text-[13.5px] text-body">{v}</span>;
  return v ? (
    <Check size={16} className="mx-auto text-brand-strong" />
  ) : (
    <Minus size={15} className="mx-auto text-line-strong" />
  );
}

const faqs = [
  {
    q: "What counts as an event?",
    a: "An event is a bounded telemetry record accepted from your MCP server, such as a tool call, result, error, protocol signal, or explicit outcome. Rejected requests are not counted as accepted events.",
  },
  {
    q: "Do I pay per seat?",
    a: "No. The proposed model is usage-led rather than seat-led. Small teams can collaborate on the free tier, and paid tiers add event volume, retention, environments, and support instead of charging for every viewer.",
  },
  {
    q: "Can I use both the SDK and OpenTelemetry?",
    a: "Yes. Both are supported connection paths. You can use the SDK for the simplest server integration and OpenTelemetry when you already operate an OTel pipeline.",
  },
  {
    q: "What happens if I reach the free allowance?",
    a: "During early access, we will contact you before enabling paid billing. Once billing is launched, the product will show usage and a clear limit before any charge; there will be no silent overage billing.",
  },
  {
    q: "Can I discuss a larger or self-hosted deployment?",
    a: "Yes. Enterprise conversations can cover volume, retention, SSO and access controls, security review, data residency, support terms, and deployment requirements.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main className="flex-1">
       <PageFrame>
        <section className="relative overflow-hidden border-b border-line">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-squares dots-mask-top opacity-70" />
          <div className="relative mx-auto max-w-6xl px-6 py-20 text-center">
            <Reveal>
              <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">Pricing</span>
            </Reveal>
            <Reveal delay={0.04}>
              <h1 className="mx-auto mt-4 max-w-[18ch] text-balance text-[36px] font-medium leading-[1.05] tracking-[-0.03em] text-ink sm:text-[48px]">
                  Start free. Scale when your MCP does.
              </h1>
            </Reveal>
            <Reveal delay={0.08}>
                <p className="mx-auto mt-5 max-w-[54ch] text-[16px] leading-[1.5] text-muted sm:text-[18px]">
                  TrackMCP pricing is built around the telemetry you actually send—not seats, surprise overages, or a sales call before you can learn anything.
                </p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-5 lg:grid-cols-3">
            {tiers.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.07} y={24}>
                <div
                  className={`lift relative flex h-full flex-col rounded-2xl border p-7 ${
                    t.featured
                      ? "border-brand bg-white shadow-[0_30px_80px_-40px_rgba(22,163,74,0.35)]"
                      : "border-line bg-white"
                  }`}
                >
                  {t.featured && (
                    <span className="absolute -top-3 left-7 rounded-full bg-brand px-3 py-1 text-[12px] font-medium text-white">
                      Best for a small team
                    </span>
                  )}
                  <h3 className="text-[15px] font-medium text-ink">{t.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-[40px] font-semibold tracking-tight text-ink">
                      {t.price}
                    </span>
                    <span className="text-[14px] text-faint">{t.note}</span>
                  </div>
                  <p className="mt-2 text-[14px] text-muted">{t.desc}</p>
                  <ul className="mt-6 flex flex-1 flex-col gap-3">
                    {t.feats.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2.5 text-[14.5px] text-body"
                      >
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-mint">
                          <Check size={12} className="text-mint-ink" />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {t.name === "Enterprise" ? (
                    <Button href="/contact" variant={t.variant} size="md" className="mt-7 w-full">
                      {t.cta}
                    </Button>
                  ) : (
                    <EarlyAccessButton label={t.cta} variant={t.variant} size="md" className="mt-7 w-full" />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-16">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
              Compare the plans
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-muted">
              The analytics core stays available on every plan. Paid tiers add room to grow, not a different product.
            </p>
          </Reveal>

          <Reveal y={20}>
            <div className="mt-10 overflow-x-auto rounded-2xl border border-line">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead>
                  <tr>
                    <th className="w-[40%] px-4 py-4 align-bottom text-[13px] font-semibold text-muted">
                      Features
                    </th>
                    {compareCols.map((c) => (
                      <th
                        key={c.name}
                        className={`px-4 py-4 text-center align-bottom ${
                          c.featured ? "bg-brand-soft/40" : ""
                        }`}
                      >
                        <span className="block text-[14px] font-semibold text-ink">{c.name}</span>
                        <span className="mt-0.5 block text-[12.5px] font-normal text-faint">
                          {c.price}
                        </span>
                        <span className="mt-1 block text-[11px] font-normal text-faint">
                          {c.sub}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compareGroups.map((g) => (
                    <Fragment key={g.group}>
                      <tr>
                        <td
                          colSpan={4}
                          className="border-t border-line bg-paper px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-faint"
                        >
                          {g.group}
                        </td>
                      </tr>
                      {g.rows.map((row) => (
                        <tr key={row.label} className="border-t border-line">
                          <td className="px-4 py-3 text-[13.5px] text-body">{row.label}</td>
                          {row.vals.map((v, i) => (
                            <td
                              key={i}
                              className={`px-4 py-3 text-center align-middle ${
                                compareCols[i].featured ? "bg-brand-soft/25" : ""
                              }`}
                            >
                              <CompareValue v={v} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <EarlyAccessButton size="md" />
              <Button href="/contact" variant="ghost" size="md">
                Talk to us about Enterprise
              </Button>
            </div>
          </Reveal>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-16">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Usage-led", "We measure accepted telemetry events, not the number of people reading your dashboard."],
              ["No seat tax", "Invite the business, product, and engineering people who need to understand MCP usage."],
              ["Usage controls", "Usage and limits are visible before any charge."],
            ].map(([title, body], i) => (
              <Reveal key={title} delay={i * 0.05}>
                <div className="rounded-xl border border-line bg-paper px-5 py-5">
                  <h3 className="text-[15px] font-medium text-ink">{title}</h3>
                  <p className="mt-2 text-[13.5px] leading-6 text-muted">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-5 text-center text-[12px] leading-5 text-faint">
            The pricing above is proposed launch packaging. Features marked Planned are not available as paid entitlements yet.
          </p>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-16">
          <Reveal>
            <h2 className="text-center text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
              Frequently asked
            </h2>
          </Reveal>
          <div className="mt-10 divide-y divide-line border-y border-line">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 0.05}>
                <div className="py-6">
                  <h3 className="text-[16px] font-medium text-ink">{f.q}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">
                    {f.a}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-20 text-center">
          <Reveal>
            <h2 className="text-[28px] font-medium leading-tight tracking-[-0.02em] text-ink">
              Ready to see what your MCP is doing?
            </h2>
            <p className="mx-auto mt-3 max-w-[48ch] text-[15px] leading-6 text-muted">
              Start free, connect one server, and give your team a useful answer before you decide how much to scale.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <EarlyAccessButton size="md" />
              <Button href="/contact" variant="ghost" size="md">
                Talk to us about Enterprise
              </Button>
            </div>
          </Reveal>
        </section>
       </PageFrame>
      </main>
      <Footer />
    </>
  );
}
