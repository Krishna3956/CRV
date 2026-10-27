export type CatalogCorrelationKind = "tools" | "resources" | "resource_templates" | "prompts";

export type CatalogCorrelationInput = {
  id: string | null;
  server_id: string | null;
  environment_id: string | null;
  catalog_kind: string | null;
  discovered_at: string | null;
};

export type CatalogNotificationInput = {
  server_id: string | null;
  environment: string | null;
  catalog_kind: CatalogCorrelationKind | null;
  started_at: string;
};

export type CatalogCorrelation = {
  kind: CatalogCorrelationKind;
  notifications: number;
  matched_notifications: number;
  ambiguous_notifications: number;
  unmatched_notifications: number;
  snapshots: number;
  match_window_ms: number;
  status: "available" | "no_notifications" | "no_snapshots";
};

const MATCH_WINDOW_MS = 10 * 60 * 1000;
const KINDS: CatalogCorrelationKind[] = ["tools", "resources", "resource_templates", "prompts"];

/**
 * Correlate only explicit list-change notifications with a bounded snapshot
 * observation in the same server, environment, and catalog family. This is
 * an evidence join, not a causal claim: multiple snapshots are reported as
 * ambiguous and an unmatched notification never gets a guessed version.
 */
export function correlateCatalogNotifications(
  notifications: CatalogNotificationInput[],
  snapshots: CatalogCorrelationInput[],
): CatalogCorrelation[] {
  return KINDS.map((kind) => {
    const kindNotifications = notifications.filter((row) => row.catalog_kind === kind && Number.isFinite(Date.parse(row.started_at)));
    const kindSnapshots = snapshots.filter((row) => row.catalog_kind === kind && Number.isFinite(Date.parse(row.discovered_at || "")));
    let matched = 0;
    let ambiguous = 0;
    for (const notification of kindNotifications) {
      const notificationTime = Date.parse(notification.started_at);
      const candidates = kindSnapshots.filter((snapshot) => {
        if (snapshot.server_id !== notification.server_id || snapshot.environment_id !== notification.environment) return false;
        return Math.abs(Date.parse(snapshot.discovered_at as string) - notificationTime) <= MATCH_WINDOW_MS;
      });
      if (candidates.length === 1) matched += 1;
      else if (candidates.length > 1) ambiguous += 1;
    }
    return {
      kind,
      notifications: kindNotifications.length,
      matched_notifications: matched,
      ambiguous_notifications: ambiguous,
      unmatched_notifications: Math.max(0, kindNotifications.length - matched - ambiguous),
      snapshots: kindSnapshots.length,
      match_window_ms: MATCH_WINDOW_MS,
      status: kindNotifications.length === 0 ? "no_notifications" : kindSnapshots.length === 0 ? "no_snapshots" : "available",
    };
  });
}
