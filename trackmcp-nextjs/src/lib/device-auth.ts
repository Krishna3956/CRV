export type DeviceSessionState =
  | "ready"
  | "invalid"
  | "expired"
  | "denied"
  | "already_approved"
  | "already_redeemed"
  | "approved"
  | "unavailable";

export type DeviceApprovalResult =
  | { status: "approved"; workspace: { id: string; name: string; slug: string } }
  | { status: "denied"; reason_category: "user_denied" | "unavailable" }
  | { status: "expired" }
  | { status: "already_redeemed" };

export type DeviceAuthAdapter = {
  approve: (input: {
    userCode: string;
    workspaceId: string | null;
    createInitialKey: boolean;
  }) => Promise<DeviceApprovalResult>;
};

const USER_CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function normalizeDeviceUserCode(value: string | null | undefined) {
  const normalized = (value || "").trim().toUpperCase();
  return USER_CODE_PATTERN.test(normalized) ? normalized : null;
}

/**
 * The browser approval endpoint is owned by the device-session backend (SDE3).
 * Keep the web flow testable without inventing a second protocol until that
 * endpoint is available.
 */
export const unavailableDeviceAuthAdapter: DeviceAuthAdapter = {
  async approve() {
    return { status: "denied", reason_category: "unavailable" };
  },
};

export function fixtureDeviceAuthAdapter(
  result: DeviceApprovalResult,
): DeviceAuthAdapter {
  return { async approve() { return result; } };
}
