import { Package, Star, Activity } from "lucide-react";

export function StatsSection({
  totalTools,
  totalStars,
}: {
  totalTools: number;
  totalStars: number;
}) {
  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : `${n}`;

  const stats = [
    { icon: Package, label: "MCP tools & servers", value: `${totalTools.toLocaleString()}`, tile: "bg-violet-100 text-violet-600" },
    { icon: Star, label: "Combined GitHub stars", value: `${fmt(totalStars)}+`, tile: "bg-amber-100 text-amber-600" },
    { icon: Activity, label: "Active projects", value: `${totalTools.toLocaleString()}`, tile: "bg-brand-soft text-brand-strong" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${s.tile}`}>
            <s.icon size={18} />
          </span>
          <div>
            <div className="font-mono text-[22px] font-semibold leading-none text-ink">{s.value}</div>
            <div className="mt-1 text-[12.5px] text-muted">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
