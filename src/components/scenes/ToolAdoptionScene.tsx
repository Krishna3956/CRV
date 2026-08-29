import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { DotGrid } from "../DotGrid";
import { ClientMix } from "../ClientLogos";

/* Composed "tool adoption" product scene: a Tools panel showing call volume,
   share of total, and week-over-week change, with a floating client-mix card
   and an "unused tools" callout, over a dotted blueprint field.
   Representative data only. */

type Row = {
  tool: string;
  calls: string;
  share: number;
  wow: number;
  state: "healthy" | "low" | "unused";
};

const rows: Row[] = [
  { tool: "search_docs", calls: "48.2k", share: 100, wow: 12, state: "healthy" },
  { tool: "create_issue", calls: "35.1k", share: 73, wow: 8, state: "healthy" },
  { tool: "run_query", calls: "24.6k", share: 51, wow: -4, state: "healthy" },
  { tool: "send_email", calls: "15.4k", share: 32, wow: -18, state: "low" },
  { tool: "get_customer", calls: "0", share: 0, wow: 0, state: "unused" },
];

export function ToolAdoptionScene() {
  return (
    <div className="relative">
      <DotGrid className="scale-125" />

      {/* main panel */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_28px_80px_-40px_rgba(10,10,10,0.28)]">
        {/* window chrome */}
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="ml-2 text-[12.5px] font-medium text-body">Tools</span>
          </div>
          <span className="rounded-full border border-line bg-paper px-2.5 py-0.5 font-mono text-[11px] text-muted">
            Last 7 days
          </span>
        </div>

        {/* table header */}
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 pb-2 pt-4 text-[11px] font-medium uppercase tracking-wide text-faint">
          <span>Tool</span>
          <span className="w-24 text-right sm:w-32">Share of calls</span>
          <span className="w-16 text-right">7d</span>
        </div>

        <ul className="px-5 pb-5">
          {rows.map((r) => (
            <li
              key={r.tool}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-t border-line py-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    r.state === "healthy"
                      ? "bg-brand"
                      : r.state === "low"
                        ? "bg-amber-500"
                        : "bg-line-strong"
                  }`}
                />
                <span className="truncate font-mono text-[13px] text-ink">
                  {r.tool}
                </span>
                <span className="hidden shrink-0 font-mono text-[11.5px] text-muted sm:inline">
                  {r.calls}
                </span>
              </div>

              <div className="flex w-24 items-center justify-end gap-2 sm:w-32">
                <span className="relative hidden h-1.5 w-16 overflow-hidden rounded-full bg-mist sm:block">
                  <span
                    className={`absolute inset-y-0 left-0 rounded-full ${
                      r.state === "unused" ? "bg-line-strong" : "bg-brand"
                    }`}
                    style={{ width: `${Math.max(r.share, 2)}%` }}
                  />
                </span>
                <span className="w-8 text-right font-mono text-[12px] text-body">
                  {r.share}%
                </span>
              </div>

              <span className="flex w-16 items-center justify-end gap-0.5 font-mono text-[12px]">
                {r.state === "unused" ? (
                  <span className="text-faint">--</span>
                ) : r.wow >= 0 ? (
                  <span className="flex items-center text-brand-strong">
                    <ArrowUpRight size={13} />
                    {r.wow}%
                  </span>
                ) : (
                  <span className="flex items-center text-amber-600">
                    <ArrowDownRight size={13} />
                    {Math.abs(r.wow)}%
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* floating client-mix card */}
      <div className="absolute -right-4 -top-6 hidden w-56 rounded-xl border border-line bg-white p-4 shadow-[0_24px_60px_-30px_rgba(10,10,10,0.4)] lg:block">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-faint">
          Client mix
        </p>
        <ClientMix />
      </div>

      {/* floating unused-tools callout */}
      <div className="absolute -bottom-5 -left-4 flex items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-[0_20px_50px_-24px_rgba(10,10,10,0.4)]">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-paper font-mono text-[13px] font-semibold text-ink">
          3
        </span>
        <span className="text-[12.5px] leading-tight text-body">
          tools received no
          <br />
          calls this week
        </span>
      </div>
    </div>
  );
}
