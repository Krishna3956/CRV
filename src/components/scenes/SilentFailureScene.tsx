import { Check, TriangleAlert, RotateCcw, X } from "lucide-react";
import { DotGrid } from "../DotGrid";

/* Composed "silent failure" scene: the response looks like 200 OK, but the
   payload carries isError:true, so the agent retries and gives up. Paired
   with a compact error summary. Representative data only. */

const retries = [
  { label: "Agent retries", icon: RotateCcw },
  { label: "Agent retries again", icon: RotateCcw },
  { label: "Agent gives up", icon: X },
];

export function SilentFailureScene() {
  return (
    <div className="relative">
      <DotGrid green className="scale-125" />

      <div className="relative grid gap-4 sm:grid-cols-[1.15fr_1fr] sm:items-start">
        {/* call inspector */}
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_28px_80px_-44px_rgba(10,10,10,0.26)]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-mono text-[12.5px] text-ink">send_email</span>
            <span className="rounded-full border border-line bg-paper px-2 py-0.5 font-mono text-[11px] text-muted">
              call_4471
            </span>
          </div>

          <div className="space-y-3 p-4">
            {/* visible response */}
            <div className="rounded-xl border border-line bg-paper p-3">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-faint">
                Visible response
              </p>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-mint px-2 py-0.5 font-mono text-[12px] text-mint-ink">
                  <Check size={12} /> 200 OK
                </span>
                <span className="text-[13px] text-body">Request completed</span>
              </div>
            </div>

            {/* actual hidden state */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-amber-700/80">
                Actual state
              </p>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-white px-2 py-0.5 font-mono text-[12px] text-amber-700">
                  <TriangleAlert size={12} /> isError: true
                </span>
                <span className="text-[13px] text-body">Schema mismatch</span>
              </div>
            </div>

            {/* downstream behavior */}
            <div className="space-y-1.5 pt-0.5">
              {retries.map((r, i) => (
                <div
                  key={r.label}
                  className="flex items-center gap-2.5 text-[12.5px]"
                  style={{ opacity: 1 - i * 0.18 }}
                >
                  <span className="grid h-5 w-5 place-items-center rounded-md bg-amber-50 text-amber-600">
                    <r.icon size={12} />
                  </span>
                  <span className={i === 2 ? "font-medium text-ink" : "text-muted"}>
                    {r.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* error summary */}
        <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_28px_80px_-44px_rgba(10,10,10,0.26)]">
          <p className="text-[11px] font-medium uppercase tracking-wide text-faint">
            Error summary
          </p>
          <dl className="mt-3 space-y-3">
            {[
              { k: "Tool", v: "send_email", mono: true },
              { k: "Error rate", v: "94%", accent: true },
              { k: "Avg retries", v: "3.0", mono: true },
              { k: "Primary issue", v: "Schema mismatch" },
            ].map((row) => (
              <div
                key={row.k}
                className="flex items-center justify-between border-b border-line pb-3 last:border-0 last:pb-0"
              >
                <dt className="text-[12.5px] text-muted">{row.k}</dt>
                <dd
                  className={`text-[13px] ${row.mono ? "font-mono" : ""} ${
                    row.accent ? "font-semibold text-amber-600" : "text-ink"
                  }`}
                >
                  {row.v}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 rounded-xl border border-brand/30 bg-brand-soft/50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-brand-strong">
              Suggested fix
            </p>
            <p className="mt-1 text-[13px] leading-snug text-body">
              Accept a <span className="font-mono text-brand-strong">string</span>{" "}
              as well as an array.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
