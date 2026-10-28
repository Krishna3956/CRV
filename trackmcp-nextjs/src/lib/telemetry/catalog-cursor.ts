import { createHash } from "node:crypto";

const CURSOR_VERSION = "v1";
const BINDING_LENGTH = 16;

function workspaceBinding(workspaceId: string): string {
  return createHash("sha256").update(workspaceId, "utf8").digest("hex").slice(0, BINDING_LENGTH);
}

/**
 * Encode the bounded catalog-history continuation without exposing the raw
 * observation timestamp or workspace identifier to the client.
 */
export function encodeCatalogCursor(workspaceId: string, discoveredAt: string): string | null {
  if (!workspaceId.trim()) return null;
  const timestamp = new Date(discoveredAt);
  if (!Number.isFinite(timestamp.getTime())) return null;
  const payload = `${CURSOR_VERSION}:${workspaceBinding(workspaceId)}:${timestamp.toISOString()}`;
  return Buffer.from(payload, "utf8").toString("base64url");
}

/**
 * Decode only cursors issued for the authenticated workspace. Invalid,
 * cross-workspace, and malformed values become an unbounded first page rather
 * than an arbitrary database predicate.
 */
export function decodeCatalogCursor(value: string | null, workspaceId: string): string | null {
  if (!value || !workspaceId.trim()) return null;
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const match = new RegExp(`^${CURSOR_VERSION}:([a-f0-9]{${BINDING_LENGTH}}):(.+)$`, "i").exec(decoded);
    if (!match || match[1].toLowerCase() !== workspaceBinding(workspaceId)) return null;
    const timestamp = new Date(match[2]);
    return Number.isFinite(timestamp.getTime()) ? timestamp.toISOString() : null;
  } catch {
    return null;
  }
}

