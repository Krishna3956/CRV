import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { McpTool } from "@/lib/repository/types";
import { ToolCard } from "./ToolCard";
import { EarlyAccessButton } from "@/components/EarlyAccessButton";

/* Simple server-rendered listing (used by New, Top, and Category pages). */
export function RepoListing({
  eyebrow,
  title,
  subtitle,
  tools,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  tools: McpTool[];
}) {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <Link
            href="/repository"
            className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand transition-colors hover:text-brand-strong"
          >
            {eyebrow}
          </Link>
          <h1 className="mt-3 max-w-[22ch] text-[32px] font-medium leading-[1.08] tracking-[-0.03em] text-ink sm:text-[42px]">
            {title}
          </h1>
          <p className="mt-3 max-w-[60ch] text-[16px] leading-[1.5] text-muted">{subtitle}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        {tools.length === 0 ? (
          <p className="py-20 text-center text-[15px] text-muted">No tools to show yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((t) => (
              <ToolCard
                key={t.id}
                name={t.repo_name || "Unknown"}
                description={t.description || ""}
                stars={t.stars || 0}
                githubUrl={t.github_url}
                language={t.language || undefined}
                topics={t.topics || undefined}
              />
            ))}
          </div>
        )}
      </section>

      <RepoCTA />
    </>
  );
}

export function RepoCTA() {
  return (
    <section className="border-t border-line bg-paper">
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">
          Shipped an MCP server?
        </span>
        <h2 className="mx-auto mt-3 max-w-[22ch] text-[26px] font-medium leading-[1.12] tracking-[-0.02em] text-ink sm:text-[32px]">
          See who actually uses it, and what to fix
        </h2>
        <p className="mx-auto mt-3 max-w-[52ch] text-[15.5px] leading-[1.5] text-muted">
          TrackMCP is analytics for your MCP server. Wrap it in one line of code and see
          adoption, sessions, outcomes, and the silent failures hiding inside a 200 OK.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <EarlyAccessButton size="lg" />
          <Link
            href="/features"
            className="inline-flex items-center gap-1.5 text-[14.5px] font-medium text-body transition-colors hover:text-ink"
          >
            See the product <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
