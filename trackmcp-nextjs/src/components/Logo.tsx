/* Backwards-compatible alias — the canonical wordmark now lives in
   TrackMCPLogo. Kept so older imports of `Logo` keep working. */
import { TrackMCPLogo } from "./TrackMCPLogo";

export function Logo({ light = false }: { light?: boolean }) {
  return <TrackMCPLogo size="nav" variant={light ? "light" : "green"} />;
}
