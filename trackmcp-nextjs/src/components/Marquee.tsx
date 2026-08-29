export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="mask-fade-x overflow-hidden">
      <div className="flex w-max gap-3 animate-marquee hover:[animation-play-state:paused]">
        {row.map((c, i) => (
          <span
            key={i}
            className="rounded-full border border-line bg-white px-[18px] py-2.5 font-mono text-[13px] text-muted"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
