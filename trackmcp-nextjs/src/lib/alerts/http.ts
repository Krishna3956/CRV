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
  try {
    const encoded = JSON.stringify(value);
    if (typeof encoded === "string" && new TextEncoder().encode(encoded).byteLength <= maxBytes) return value;
  } catch {
    return { truncated: true };
  }
  return { truncated: true };
}
