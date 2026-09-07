import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { PageFrame } from "@/components/PageFrame";
import { McpTesterApp } from "./McpTesterApp";
import { breadcrumbJsonLd, serializeJsonLd } from "@/lib/seo";

export type TesterMode = "tester" | "health" | "inspector";

export function McpTesterPage({ mode = "tester", intro, children }: { mode?: TesterMode; intro?: ReactNode; children?: ReactNode }) {
  const jsonLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "MCP Server Tester", path: "/tools/mcp-server-tester" },
  ]);
  return <>
    <script type="application/ld+json">{serializeJsonLd(jsonLd)}</script>
    <Nav />
    <main className="flex-1"><PageFrame>
      {intro}
      <section className="relative overflow-hidden border-b border-line bg-[radial-gradient(50%_38%_at_50%_0%,rgba(22,163,74,0.08),transparent_74%)]">
        <div aria-hidden className="bg-squares dots-mask-top pointer-events-none absolute inset-x-0 top-0 h-[360px] opacity-60" />
        <div className="relative"><McpTesterApp initialMode={mode} /></div>
      </section>
      {children}
    </PageFrame></main>
    <Footer />
  </>;
}
