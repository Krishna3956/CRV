/* Dotted blueprint texture placed behind product scenes.
   Purely decorative: sits in an absolutely-positioned layer, aria-hidden,
   and fades toward its edges so it never competes with text. */

type DotGridProps = {
  className?: string;
  /** desaturated green dots instead of neutral gray */
  green?: boolean;
  /** edge fade shape */
  mask?: "radial" | "top" | "none";
};

export function DotGrid({
  className = "",
  green = false,
  mask = "radial",
}: DotGridProps) {
  const maskClass =
    mask === "radial"
      ? "dots-mask-radial"
      : mask === "top"
        ? "dots-mask-top"
        : "";
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${
        green ? "bg-dots-green" : "bg-dots"
      } ${maskClass} ${className}`}
    />
  );
}
