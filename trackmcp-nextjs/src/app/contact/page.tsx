import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Mail, MessagesSquare, Building2, BookOpen } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = pageMeta({
  title: "Contact | TrackMCP",
  description:
    "Talk to the TrackMCP team about analytics for your MCP server, Enterprise plans, or support.",
  path: "/contact",
});

const channels = [
  {
    icon: Building2,
    title: "Sales & Enterprise",
    body: "Self-hosting, SSO, custom retention, or volume pricing.",
    action: "sales@trackmcp.com",
    href: "mailto:sales@trackmcp.com",
  },
  {
    icon: MessagesSquare,
    title: "Support",
    body: "Already using TrackMCP and need a hand.",
    action: "support@trackmcp.com",
    href: "mailto:support@trackmcp.com",
  },
  {
    icon: BookOpen,
    title: "Docs",
    body: "Install the SDK and read the reference.",
    action: "Read the docs",
    href: "/docs",
  },
  {
    icon: Mail,
    title: "General",
    body: "Anything else on your mind.",
    action: "hello@trackmcp.com",
    href: "mailto:hello@trackmcp.com",
  },
];

export default function ContactPage() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <PageFrame>
          <section className="relative overflow-hidden border-b border-line">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] bg-squares dots-mask-top opacity-70" />
            <div className="relative mx-auto max-w-3xl px-6 py-16 text-center">
              <Reveal>
                <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">
                  Contact
                </span>
                <h1 className="mt-3 text-[36px] font-medium leading-[1.05] tracking-[-0.03em] text-ink sm:text-[48px]">
                  Talk to the team
                </h1>
                <p className="mx-auto mt-4 max-w-[48ch] text-[16px] leading-[1.5] text-muted sm:text-[18px]">
                  Questions about measuring your MCP server, Enterprise, or getting
                  started. We usually reply within a day.
                </p>
              </Reveal>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <Reveal>
                <div className="flex flex-col gap-4">
                  {channels.map((c) => (
                    <a
                      key={c.title}
                      href={c.href}
                      className="lift flex items-start gap-4 rounded-2xl border border-line bg-white p-5 transition-colors hover:border-line-strong"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-paper">
                        <c.icon size={18} className="text-brand" />
                      </span>
                      <div>
                        <h3 className="text-[15.5px] font-medium text-ink">{c.title}</h3>
                        <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{c.body}</p>
                        <span className="mt-2 inline-block text-[13px] font-medium text-brand-strong">
                          {c.action}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={0.1} y={24}>
                <ContactForm />
              </Reveal>
            </div>
          </section>
        </PageFrame>
      </main>
      <Footer />
    </>
  );
}
