export const MAX_ALERT_REQUEST_BYTES = 64 * 1024;
export type BoundedJsonError = { error: string; code: "too_large" | "invalid_json" };

export async function readBoundedJson(request: Request, maxBytes = MAX_ALERT_REQUEST_BYTES): Promise<unknown | BoundedJsonError> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number.isSafeInteger(Number(contentLength)) && Number(contentLength) > maxBytes) return { error: "Request body exceeds the alert API limit.", code: "too_large" };
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > maxBytes) return { error: "Request body exceeds the alert API limit.", code: "too_large" };
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    return { error: "Invalid JSON.", code: "invalid_json" };
  }
}

export function boundedJsonValue(value: unknown, maxBytes: number): unknown {
  const encoder = new TextEncoder();
  const marker = { truncated: true };
  const maxDepth = 5;
  const maxEntries = 32;
  const maxStringBytes = 4096;
  const seen = new Set<object>();
  const fits = (candidate: unknown): boolean => {
    try {
      const encoded = JSON.stringify(candidate);
      return typeof encoded === "string" && encoder.encode(encoded).byteLength <= maxBytes;
    } catch {
      return false;
    }
  };
  const truncateString = (input: string): string => {
    if (encoder.encode(input).byteLength <= maxStringBytes) return input;
    let end = Math.min(input.length, maxStringBytes);
    while (end > 0 && encoder.encode(input.slice(0, end) + "…[truncated]").byteLength > maxStringBytes) end -= 1;
    return input.slice(0, end) + "…[truncated]";
  };
  const visit = (input: unknown, depth: number): unknown => {
    if (input === null || typeof input === "boolean" || typeof input === "number") return Number.isFinite(input as number) ? input : String(input);
    if (typeof input === "string") return truncateString(input);
    if (typeof input !== "object") return marker;
    if (depth >= maxDepth || seen.has(input)) return marker;
    seen.add(input);
    if (Array.isArray(input)) {
      const output: unknown[] = [];
      for (const item of input.slice(0, maxEntries)) {
        const bounded = visit(item, depth + 1);
        const candidate = [...output, bounded];
        if (!fits(candidate)) break;
        output.push(bounded);
      }
      if (input.length > output.length) output.push(marker);
      return output;
    }
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(input).slice(0, maxEntries)) {
      const bounded = visit((input as Record<string, unknown>)[key], depth + 1);
      const boundedKey = key.slice(0, 256);
      const candidate = { ...output, [boundedKey]: bounded };
      if (!fits(candidate)) break;
      output[boundedKey] = bounded;
    }
    if (Object.keys(input).length > Object.keys(output).length) output.__trackmcp_truncated = true;
    return output;
  };
  const bounded = visit(value, 0);
  return fits(bounded) ? bounded : marker;
}
