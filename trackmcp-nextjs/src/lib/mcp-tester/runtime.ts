export function isMcpBrowserRuntime(): boolean {
  const globals = globalThis as typeof globalThis & {
    EdgeRuntime?: unknown;
    window?: unknown;
    document?: unknown;
    self?: unknown;
    location?: unknown;
  };
  if (globals.EdgeRuntime !== undefined) return false;
  const hasWindow = typeof globals.window === "object" && globals.window !== null && typeof globals.document === "object" && globals.document !== null;
  const hasBrowserWorker = typeof globals.self === "object" && globals.self !== null && typeof globals.location === "object" && globals.location !== null;
  return hasWindow || hasBrowserWorker;
}
