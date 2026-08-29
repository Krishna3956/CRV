import { Check, RotateCcw, Clock } from "lucide-react";
import { DotGrid } from "../DotGrid";
import { ClientMark } from "../ClientLogos";

/* Composed "agent journey" scene: a single session replayed top to bottom,
   with per-step timing, a stalled step with retries, and a pending result.
   Representative data only. */

type Step = {
  label: string;
  meta: string;
  state: "ok" | "stalled" | "pending";
};

const steps: Step[] = [
  { label: "Claude connects", meta: "session start", state: "ok" },
  { label: "search_docs", meta: "240ms", state: "ok" },
  { label: "run_query", meta: "1.2s", state: "ok" },
  { label: "create_issue", meta: "retried 3x", state: "stalled" },
  { label: "Result returned", meta: "never reached", state: "pending" },
];

export function SessionJourneyScene() {
  return (
    <div className="relative">
      <DotGrid className="scale-125" />

      <div className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_28px_80px_-40px_rgba(10,10,10,0.28)]">
        {/* header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-paper text-slate-600">
              <ClientMark name="Claude" size={15} />
            </span>
            <div>
              <p className="text-[13px] font-medium text-ink">Claude session</p>
              <p className="font-mono text-[11px] text-muted">sess_8f2c1a9</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 font-mono text-[11.5px] text-muted">
            <Clock size={12} /> 4m 12s
          </span>
        </div>

        {/* timeline */}
        <ol className="px-5 py-5">
          {steps.map((s, i) => {
            const last = i === steps.length - 1;
            return (
              <li key={s.label} className="relative flex gap-3.5 pb-5 last:pb-0">
                {/* connector */}
                {!last && (
                  <span
                    className={`absolute left-[13px] top-7 h-[calc(100%-12px)] w-px ${
                      s.state === "ok" ? "bg-brand/30" : "bg-line"
                    }`}
                  />
                )}
                {/* node */}
                <span
                  className={`relative z-10 mt-0.5 grid h-[27px] w-[27px] shrink-0 place-items-center rounded-full border ${
                    s.state === "ok"
                      ? "border-brand/40 bg-brand-soft text-brand-strong"
                      : s.state === "stalled"
                        ? "border-amber-300 bg-amber-50 text-amber-600"
                        : "border-line bg-paper text-faint"
                  }`}
                >
                  {s.state === "ok" ? (
                    <Check size={14} />
                  ) : s.state === "stalled" ? (
                    <RotateCcw size={13} />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </span>

                <div className="flex flex-1 items-center justify-between pt-0.5">
                  <span
                    className={`font-mono text-[13.5px] ${
                      s.state === "pending" ? "text-faint" : "text-ink"
                    }`}
                  >
                    {s.label}
                  </span>
                  <span
                    className={`font-mono text-[11.5px] ${
                      s.state === "stalled"
                        ? "text-amber-600"
                        : s.state === "pending"
                          ? "text-faint"
                          : "text-muted"
                    }`}
                  >
                    {s.meta}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* floating callout pointing at the stalled step */}
      <div className="absolute -right-3 bottom-16 hidden max-w-[190px] rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12.5px] leading-snug text-amber-800 shadow-[0_20px_50px_-24px_rgba(180,120,0,0.5)] lg:block">
          Find the step where the job stops.
      </div>
    </div>
  );
}
