export type AlertSecretProvider = (secretRef: string) => Promise<string | null>;

/**
 * Resolves references from an operator-managed secret map. The raw values stay
 * in memory only and are never returned by an API or included in diagnostics.
 */
export function environmentSecretProvider(environment: NodeJS.ProcessEnv = process.env): AlertSecretProvider {
  return async (secretRef: string) => {
    const encoded = environment.TRACKMCP_ALERT_WEBHOOK_SECRETS_JSON;
    if (!encoded || encoded.length > 256 * 1024) return null;
    try {
      const values: unknown = JSON.parse(encoded);
      if (!values || typeof values !== "object" || Array.isArray(values)) return null;
      const value = (values as Record<string, unknown>)[secretRef];
      return typeof value === "string" && value.length > 0 && value.length <= 4096 ? value : null;
    } catch {
      return null;
    }
  };
}
