import type { DeviceSessionState } from "./device-auth";

/**
 * Keep terminal device-flow copy in one tested, secret-free projection. The
 * browser must explain recovery without ever receiving a connection key or
 * raw device credential.
 */
export function deviceStateCopy(status: Exclude<DeviceSessionState, "ready" | "unauthenticated" | "unavailable">, error = "") {
  switch (status) {
    case "invalid":
      return { title: "That device code is not valid", detail: "Use the complete code printed by npx @trackmcp/cli init. It should look like F7KQ-2M9D." };
    case "expired":
      return { title: "This device session expired", detail: "Start npx @trackmcp/cli init again to get a new code." };
    case "denied":
      return { title: "Device access was not approved", detail: error || "No key was created. You can safely close this page and restart the CLI when ready." };
    case "already_redeemed":
      return { title: "This device session was already used", detail: "Start a new CLI session if you need to connect another project." };
    case "already_approved":
      return { title: "This device session is already approved", detail: "Return to your terminal so it can redeem the one-time result." };
    case "approved":
      return { title: "Device approved", detail: "Return to your terminal. The CLI can now finish the one-time setup." };
  }
}
