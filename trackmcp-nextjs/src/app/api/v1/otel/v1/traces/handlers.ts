import { NextResponse } from "next/server.js";
import { createIngestHandler } from "../../../ingest/handlers.ts";
import { mapOTelSpanToTrackMCPEvent } from "../../../../../../lib/telemetry/otel.ts";
import { OTEL_JSON_MAX_BYTES, parseOtelJsonBatch } from "../../../../../../lib/telemetry/otel-http.ts";
import { OTEL_PROTOBUF_MAX_BYTES, parseOtelProtobufBatch } from "../../../../../../lib/telemetry/otel-protobuf.ts";

/** Keep the OTLP adapter injectable for route-level contract tests. */
export function createOtelTracesHandler(ingest: ReturnType<typeof createIngestHandler> = createIngestHandler()) {
  return async function POST(request: Request) {
    const contentType = request.headers.get("content-type") || "";
    const isJson = contentType.toLowerCase().includes("application/json");
    const isProtobuf = contentType.toLowerCase().includes("application/x-protobuf") || contentType.toLowerCase().includes("application/protobuf") || contentType.toLowerCase().includes("application/octet-stream");
    if (!isJson && !isProtobuf) return NextResponse.json({ error: "Only OTLP/HTTP JSON or protobuf is supported on this endpoint." }, { status: 415 });
    const raw = await request.arrayBuffer();
    if (raw.byteLength > (isJson ? OTEL_JSON_MAX_BYTES : OTEL_PROTOBUF_MAX_BYTES)) return NextResponse.json({ error: `request exceeds ${isJson ? OTEL_JSON_MAX_BYTES : OTEL_PROTOBUF_MAX_BYTES} bytes` }, { status: 413 });
    let parsed;
    if (isProtobuf) parsed = parseOtelProtobufBatch(new Uint8Array(raw));
    else {
      let body: unknown;
      try { body = JSON.parse(new TextDecoder().decode(raw)); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
      parsed = parseOtelJsonBatch(body);
    }
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const events = [];
    for (const span of parsed.spans) {
      const result = mapOTelSpanToTrackMCPEvent(span, { service: parsed.service || "otel", environment: parsed.environment || "production" });
      if (result.ok) events.push(result.event);
    }
    if (!events.length) return NextResponse.json({ error: "No supported MCP spans were observed." }, { status: 422 });
    const forwarded = new Request(request.url, { method: "POST", headers: { authorization: request.headers.get("authorization") || "", "content-type": "application/json" }, body: JSON.stringify({ events }) });
    const response = await ingest(forwarded);
    const payload = await response.json().catch(() => ({ error: "Could not read ingest response." }));
    return NextResponse.json({
      ...payload,
      otel: {
        accepted_spans: events.length,
        rejected_spans: Math.max(0, parsed.spans.length - events.length),
        protocol: isProtobuf ? "otlp-http-protobuf" : "otlp-http-json",
        protobuf: "supported_metadata_only",
      },
    }, { status: response.status, headers: { "cache-control": "no-store", "x-trackmcp-otel-protocol": isProtobuf ? "otlp-http-protobuf" : "otlp-http-json" } });
  };
}
