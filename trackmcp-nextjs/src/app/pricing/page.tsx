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
  title: "Pricing — TrackMCP",
  description:
    "Usage-based pricing for MCP analytics: start with 1,000 monthly tool calls free, then upgrade to 50,000 calls on Pro.",
  path: "/pricing",
});

const tiers = [
  {
    name: "Hobby",
    price: "$0",
    note: "forever",
    desc: "For side projects and kicking the tires.",
    cta: "Start free",
    variant: "ghost" as const,
    featured: false,
    feats: [
      "1,000 captured tool calls / month",
      "7-day data retention",
      "Core analytics dashboard",
      "1 MCP server",
      "1 team member",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$49",
    note: "per month",
    desc: "For teams shipping MCP servers to real users.",
    cta: "Get started",
    variant: "primary" as const,
    featured: true,
    feats: [
      "50,000 captured tool calls / month",
      "90-day data retention",
      "Actionable usage insights",
      "Up to 5 MCP servers",
      "Slack & webhook alerts",
      "Up to 5 team members",
      "Email support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    note: "let's talk",
    desc: "For scale, compliance, and self-hosting.",
    cta: "Contact us",
    variant: "ghost" as const,
    featured: false,
    feats: [
      "Custom call volume and pricing",
      "Custom retention",
      "Multiple teams and environments",
      "Security review and custom terms",
      "Priority onboarding and support",
    ],
  },
];

const compareCols = [
  { name: "Hobby", price: "$0" },
  { name: "Pro", price: "$49/mo", featured: true },
  { name: "Enterprise", price: "Custom" },
];

type Cell = boolean | string;

const compareGroups: { group: string; rows: { label: string; vals: [Cell, Cell, Cell] }[] }[] = [
  {
    group: "Usage & retention",
    rows: [
      { label: "Captured tool calls / month", vals: ["1,000", "50,000", "Custom"] },
      { label: "Data retention", vals: ["7 days", "90 days", "Custom"] },
      { label: "MCP servers", vals: ["1", "5", "Custom"] },
      { label: "Environments (production, staging)", vals: [false, true, true] },
      { label: "Team members", vals: ["1", "5", "Custom"] },
    ],
  },
  {
    group: "Analytics",
    rows: [
      { label: "Tool analytics: calls, ranking, trends", vals: [true, true, true] },
      { label: "Latency & error rates (p50 / p95)", vals: [true, true, true] },
      { label: "Errors hidden inside a 200 OK", vals: [true, true, true] },
      { label: "Client breakdown (Claude, Cursor, custom)", vals: [true, true, true] },
      { label: "Call inspector: arguments, result, timing", vals: [true, true, true] },
      { label: "Sessions & funnels", vals: [false, true, true] },
      { label: "Saved views & custom dashboards", vals: [false, true, true] },
    ],
  },
  {
    group: "Actionable insights",
    rows: [
      { label: "Weekly plain-English insight digest", vals: [false, true, true] },
      { label: "Root-cause diagnosis & suggested fix", vals: [false, true, true] },
      { label: "Impact projection (calls recovered)", vals: [false, true, true] },
      { label: "Dead-tool detection", vals: [false, true, true] },
    ],
  },
  {
    group: "Alerts & integrations",
    rows: [
      { label: "Email alerts", vals: [false, true, true] },
      { label: "Slack & webhook alerts", vals: [false, true, true] },
      { label: "Failure-spike & anomaly alerts", vals: [false, true, true] },
      { label: "REST API access", vals: [false, true, true] },
      { label: "Data export (CSV, warehouse)", vals: [false, true, true] },
      { label: "Custom security / SIEM integrations", vals: [false, false, true] },
    ],
  },
  {
    group: "Security & compliance",
    rows: [
      { label: "Security review", vals: [false, false, true] },
      { label: "Custom data-processing terms", vals: [false, false, true] },
      { label: "Custom deployment requirements", vals: [false, false, true] },
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
    q: "What counts as a tool call?",
    a: "Every time an AI agent calls one of your tools, that's one call, whether it succeeds or fails. You never pay for calls we couldn't capture.",
  },
  {
    q: "Do I need to change my tools?",
    a: "No. You wrap your existing MCP server once with the SDK. Your individual tools stay exactly as they are.",
  },
  {
    q: "Where is my data stored?",
    a: "TrackMCP currently stores telemetry in managed Postgres infrastructure. Enterprise customers can discuss retention, export, and deployment requirements with us before signing.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Plans are month-to-month with no lock-in. Downgrade or cancel whenever you like.",
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
                Simple, usage-based pricing
              </h1>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mx-auto mt-5 max-w-[52ch] text-[16px] leading-[1.5] text-muted sm:text-[18px]">
                Start free. Only pay when your MCP server has real traffic worth
                measuring.
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
                      Most popular
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
              Compare every plan
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-muted">
              Every feature, side by side. The whole analytics core is on every plan, including
              the free one.
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
       </PageFrame>
      </main>
      <Footer />
    </>
  );
}
