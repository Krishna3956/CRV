import { DashboardMock } from "./DashboardMock";
import { DotGrid } from "./DotGrid";

/* The hero product stage: the TrackMCP dashboard as the single central visual
   object, on a subtle dotted blueprint field. No floating cards — everything
   the product shows lives inside the dashboard frame itself. */

export function HeroDashboardScene() {
  return (
    <div className="relative">
      {/* dotted blueprint field, faded to edges */}
      <DotGrid className="scale-110" mask="radial" />
      {/* thin mat frame the demo dashboard sits inside */}
      <div className="relative rounded-[22px] border border-line bg-paper/70 p-2 ring-1 ring-black/[0.03] sm:p-2.5">
        <DashboardMock />
      </div>
    </div>
  );
}
