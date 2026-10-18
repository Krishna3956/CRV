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
  | { status: "approved" }
  | { status: "denied"; reason_category: "user_denied" | "unavailable" }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "already_approved" }
  | { status: "already_redeemed" };

export type DeviceAuthAdapter = {
  approve: (input: {
    userCode: string;
    workspaceId: string;
  }) => Promise<DeviceApprovalResult>;
};

const USER_CODE_PATTERN = /^[A-Z2-9]{4}-[A-Z2-9]{4}$/;

export function normalizeDeviceUserCode(value: string | null | undefined) {
  const normalized = (value || "").trim();
  return USER_CODE_PATTERN.test(normalized) ? normalized : null;
}

export function isAllowedVerificationUrl(value: string, options: { allowLocalDevelopment?: boolean } = {}) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return true;
    return Boolean(options.allowLocalDevelopment && url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname));
  } catch {
    return false;
  }
}

type DeviceApprovalResponse = { status?: unknown; reason_category?: unknown };

/** The browser approves a session; only the CLI redeems the key. */
export function createDeviceAuthAdapter(fetchImpl: typeof fetch = fetch): DeviceAuthAdapter {
  return {
    async approve({ userCode, workspaceId }) {
      try {
        const response = await fetchImpl("/api/v1/cli/device/sessions/approve", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ user_code: userCode, workspace_id: workspaceId }),
          cache: "no-store",
        });
        let body: DeviceApprovalResponse = {};
        try { body = await response.json() as DeviceApprovalResponse; } catch { /* status is authoritative */ }
        if (response.ok && body.status === "approved") return { status: "approved" };
        if (response.status === 400 || response.status === 404) return { status: "invalid" };
        if (response.status === 401 || response.status === 403) return { status: "denied", reason_category: "user_denied" };
        if (response.status === 410 || body.status === "expired") return { status: "expired" };
        if (response.status === 409) {
          if (body.status === "already_approved") return { status: "already_approved" };
          if (body.status === "already_redeemed") return { status: "already_redeemed" };
          if (body.status === "denied") return { status: "denied", reason_category: "user_denied" };
          return { status: "denied", reason_category: "unavailable" };
        }
        return { status: "denied", reason_category: "unavailable" };
      } catch {
        return { status: "denied", reason_category: "unavailable" };
      }
    },
  };
}

export function fixtureDeviceAuthAdapter(
  result: DeviceApprovalResult,
): DeviceAuthAdapter {
  return { async approve() { return result; } };
}
