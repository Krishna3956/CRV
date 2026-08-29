/* Looping micro-graphics in the "Signal" language.
   Pure SVG + CSS so every card has a heartbeat, not a screenshot. */

/* Continuously breathing bar chart */
export function LoopBars({ className = "" }: { className?: string }) {
  const bars = [0.5, 0.72, 0.58, 0.86, 0.68, 1, 0.8, 0.62, 0.9, 0.74];
  return (
    <div className={`flex h-full items-end gap-1.5 ${className}`}>
      {bars.map((b, i) => (
        <div key={i} className="flex h-full flex-1 items-end">
          <div
            className="bar-pulse w-full rounded-t bg-brand"
            style={{ height: `${b * 100}%`, animationDelay: `${i * -0.22}s` }}
          />
        </div>
      ))}
    </div>
  );
}

/* Latency gauge with a sweeping needle */
export function LatencyGauge({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 72" className={`w-full ${className}`} aria-hidden>
      <path d="M12 62 A48 48 0 0 1 108 62" fill="none" stroke="#e5e5e5" strokeWidth="6" strokeLinecap="round" />
      <path d="M12 62 A48 48 0 0 1 88 23" fill="none" stroke="#16a34a" strokeWidth="6" strokeLinecap="round" />
      {[0, 45, 90, 135, 180].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const x1 = 60 - 44 * Math.cos(r);
        const y1 = 62 - 44 * Math.sin(r);
        const x2 = 60 - 38 * Math.cos(r);
        const y2 = 62 - 38 * Math.sin(r);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d4d4d4" strokeWidth="1.5" />;
      })}
      <g className="animate-sweep" style={{ transformBox: "view-box", transformOrigin: "60px 62px" }}>
        <line x1="60" y1="62" x2="60" y2="24" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <circle cx="60" cy="62" r="5" fill="#0a0a0a" />
      <circle cx="60" cy="62" r="2" fill="#fff" />
    </svg>
  );
}

/* Client-mix donut with a rotating highlight */
export function ClientDonut({ className = "" }: { className?: string }) {
  const C = 2 * Math.PI * 42;
  const segs = [
    { pct: 46, color: "#16a34a" },
    { pct: 31, color: "#4ade80" },
    { pct: 18, color: "#bbf7d0" },
    { pct: 5, color: "#e5e5e5" },
  ];
  let offset = 0;
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <g transform="rotate(-90 60 60)">
        {segs.map((s, i) => {
          const len = (s.pct / 100) * C;
          const dash = `${len} ${C - len}`;
          const el = (
            <circle
              key={i}
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke={s.color}
              strokeWidth="15"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </g>
      <circle cx="60" cy="60" r="20" fill="#fff" stroke="#e5e5e5" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="49" fill="none" stroke="#bbf7d0" strokeWidth="1.5" strokeDasharray="2 8" opacity="0.7">
        <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="18s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* EKG heartbeat — the "live" motif */
export function Heartbeat({ className = "" }: { className?: string }) {
  const d = "M0 30 H64 l7 -17 l9 32 l6 -15 H150 l7 -13 l9 26 l6 -13 H320";
  return (
    <svg viewBox="0 0 320 60" className={`w-full ${className}`} aria-hidden preserveAspectRatio="none">
      <path id="ekg" d={d} fill="none" stroke="#e5e5e5" strokeWidth="2" />
      <path d={d} fill="none" stroke="#16a34a" strokeWidth="2" strokeDasharray="60 260" className="wire-flow" strokeLinecap="round" />
      <circle r="3.5" fill="#16a34a">
        <animateMotion dur="3.4s" repeatCount="indefinite">
          <mpath href="#ekg" />
        </animateMotion>
      </circle>
    </svg>
  );
}
