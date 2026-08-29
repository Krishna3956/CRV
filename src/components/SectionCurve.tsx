/* A shallow, asymmetric curved boundary between two full-width surfaces.
   Render it as the FIRST child of the lower section. The overlay is filled
   with the color of the surface ABOVE, so the lower surface appears to rise
   into it along a gentle arc. Responsive height, no horizontal overflow. */

export function SectionCurve({
  color = "#ffffff",
  className = "",
}: {
  color?: string;
  className?: string;
}) {
  return (
    <div aria-hidden className={`relative w-full leading-[0] ${className}`}>
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className="block h-[42px] w-full sm:h-[66px] md:h-[88px]"
      >
        {/* asymmetric arc: the lower surface rises higher on the left */}
        <path
          d="M0,0 H1440 V40 C1160,96 860,98 560,66 C400,49 200,40 0,48 Z"
          fill={color}
        />
      </svg>
    </div>
  );
}
