import { ArrowUpRight, TriangleAlert } from "lucide-react";
import { ClientDonut } from "./SignalGraphics";

const tools = [
  { name: "search_docs", pct: 41 },
  { name: "run_query", pct: 28 },
  { name: "create_issue", pct: 17 },
];

export function HeroShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-[420px] lg:mr-0 lg:max-w-[460px]">
      {/* primary metric card */}
      <div className="animate-bob rounded-2xl border border-line bg-white p-5 shadow-[0_40px_120px_-45px_rgba(10,10,10,0.35)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11.5px] font-medium uppercase tracking-wide text-faint">
              Tool calls &middot; last 7 days
            </p>
            <p className="mt-1.5 text-[30px] font-semibold leading-none text-ink">1.24M</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-mint px-2 py-1 text-[12px] font-medium text-mint-ink">
            <ArrowUpRight size={12} /> 32%
          </span>
        </div>

        <svg viewBox="0 0 320 92" preserveAspectRatio="none" className="mt-4 h-24 w-full" aria-hidden>
          <defs>
            <linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 72 C 40 68 58 40 96 44 C 136 48 156 20 196 26 C 238 32 268 12 320 9 L 320 92 L 0 92 Z"
            fill="url(#heroArea)"
          />
          <path
            d="M0 72 C 40 68 58 40 96 44 C 136 48 156 20 196 26 C 238 32 268 12 320 9"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

        <div className="mt-4 space-y-2.5 border-t border-line pt-4">
          {tools.map((t) => (
            <div key={t.name} className="flex items-center gap-3">
              <span className="w-24 shrink-0 truncate font-mono text-[12px] text-body">{t.name}</span>
              <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-mist">
                <span className="absolute inset-y-0 left-0 rounded-full bg-brand" style={{ width: `${t.pct}%` }} />
              </span>
              <span className="w-8 shrink-0 text-right font-mono text-[11.5px] text-muted">{t.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* floating alert chip */}
      <div className="absolute -right-3 -top-4 flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] font-medium text-amber-700 shadow-[0_16px_40px_-16px_rgba(180,120,0,0.5)]">
        <TriangleAlert size={13} /> send_email failing &middot; 94%
      </div>

      {/* floating client card */}
      <div className="absolute -bottom-7 -left-5 flex w-[188px] items-center gap-3 rounded-xl border border-line bg-white p-3.5 shadow-[0_24px_60px_-28px_rgba(10,10,10,0.45)]">
        <ClientDonut className="h-10 w-10 shrink-0" />
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-ink">Clients</p>
          <p className="truncate text-[11.5px] text-muted">Claude &middot; Cursor &middot; +2</p>
        </div>
      </div>
    </div>
  );
}
