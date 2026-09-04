import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";

export type TrustSection = { title: string; body: string[] };

export function TrustPage({ eyebrow, title, updated, intro, sections, contactLabel, contactHref }: { eyebrow: string; title: string; updated: string; intro: string; sections: TrustSection[]; contactLabel: string; contactHref: string }) {
  return <><Nav /><main className="flex-1"><PageFrame><section className="mx-auto max-w-3xl px-6 py-16 sm:py-20"><p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brand">{eyebrow}</p><h1 className="mt-4 text-[38px] font-medium leading-[1.05] tracking-[-0.035em] text-ink sm:text-[52px]">{title}</h1><p className="mt-3 text-[13px] text-faint">Last updated {updated}</p><p className="mt-7 text-[17px] leading-[1.7] text-body">{intro}</p><div className="mt-12 space-y-10">{sections.map((section) => <section key={section.title}><h2 className="text-[22px] font-medium tracking-[-0.02em] text-ink">{section.title}</h2>{section.body.map((paragraph) => <p key={paragraph} className="mt-3 text-[15px] leading-[1.7] text-muted">{paragraph}</p>)}</section>)}</div><p className="mt-12 border-t border-line pt-6 text-[14px] text-muted">Questions? <a href={contactHref} className="font-medium text-brand-strong hover:underline">{contactLabel}</a>.</p><div className="mt-7 flex flex-wrap gap-5 text-[13px] font-medium"><Link href="/mcp-server-analytics" className="inline-flex items-center gap-1 text-brand-strong hover:underline">MCP server analytics <ArrowRight size={14} /></Link><Link href="/docs" className="inline-flex items-center gap-1 text-brand-strong hover:underline">Read the docs <ArrowRight size={14} /></Link></div></section></PageFrame></main><Footer /></>;
}
