export type RedemptionAction = "new" | "recover" | "already_redeemed";

/**
 * Decide whether a redemption request may start, recover, or must be rejected.
 * A matching retry identity is the only way to recover an in-flight or
 * completed redemption. A different identity must never receive key material.
 */
export function redemptionAction(status: string, redemptionIdMatches: boolean): RedemptionAction {
  if (status === "redeeming" || status === "redeemed") {
    return redemptionIdMatches ? "recover" : "already_redeemed";
  }
  return "new";
}
