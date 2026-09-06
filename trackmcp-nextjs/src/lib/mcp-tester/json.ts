import type { JsonValue, McpTesterLimits } from "./types.ts";

export type BoundedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; code: "invalid_json" | "json_too_deep" | "json_too_many_nodes" };

export function parseBoundedJson(text: string, limits: McpTesterLimits): BoundedJsonResult {
  try {
    const value: unknown = JSON.parse(text);
    const validation = validateJsonTree(value, limits.maxJsonDepth, limits.maxJsonNodes);
    return validation.ok ? { ok: true, value } : validation;
  } catch {
    return { ok: false, code: "invalid_json" };
  }
}

function validateJsonTree(value: unknown, maxDepth: number, maxNodes: number): { ok: true } | { ok: false; code: "json_too_deep" | "json_too_many_nodes" } {
  let nodes = 0;
  const visit = (current: unknown, depth: number): { ok: true } | { ok: false; code: "json_too_deep" | "json_too_many_nodes" } => {
    nodes += 1;
    if (nodes > maxNodes) return { ok: false, code: "json_too_many_nodes" };
    if (depth > maxDepth) return { ok: false, code: "json_too_deep" };
    if (Array.isArray(current)) {
      for (const item of current) {
        const result = visit(item, depth + 1);
        if (!result.ok) return result;
      }
    } else if (current !== null && typeof current === "object") {
      for (const [key, child] of Object.entries(current as Record<string, unknown>)) {
        if (key.length > 512) return { ok: false, code: "json_too_many_nodes" };
        const result = visit(child, depth + 1);
        if (!result.ok) return result;
      }
    }
    return { ok: true };
  };
  return visit(value, 0);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function asJsonValue(value: unknown): JsonValue | undefined {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    const items = value.map(asJsonValue);
    return items.every((item) => item !== undefined) ? items as JsonValue[] : undefined;
  }
  if (isRecord(value)) {
    const result: { [key: string]: JsonValue } = {};
    for (const [key, child] of Object.entries(value)) {
      const jsonChild = asJsonValue(child);
      if (jsonChild === undefined) return undefined;
      result[key] = jsonChild;
    }
    return result;
  }
  return undefined;
}
