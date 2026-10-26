"""Dependency-free runtime smoke for the Python SDK's serialized boundary.

This is intentionally a local fake-ingest fixture. It exercises the real HTTP
flush path and verifies that protocol, catalog, and transport observations stay
metadata-only before they leave the process.
"""

from __future__ import annotations

import json
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

from trackmcp import TrackMCP, TrackMCPOptions
from trackmcp.client import (
    _catalog_observation,
    _entity_protocol_event,
    _protocol_metadata_payload,
    _protocol_result_metadata,
    interaction_entity_observation,
)


class CaptureHandler(BaseHTTPRequestHandler):
    payload = None

    def do_POST(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        if self.headers.get("Authorization") != "Bearer tmcp_python_smoke":
            self.send_response(401)
            self.end_headers()
            return
        length = int(self.headers.get("Content-Length", "0"))
        CaptureHandler.payload = json.loads(self.rfile.read(length))
        self.send_response(202)
        self.end_headers()

    def log_message(self, *_args: object) -> None:
        pass


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    server = HTTPServer(("127.0.0.1", 0), CaptureHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    client = TrackMCP(
        TrackMCPOptions(
            api_key="tmcp_python_smoke",
            endpoint=f"http://127.0.0.1:{server.server_port}",
            flush_interval_ms=60_000,
            max_batch_size=16,
            transport="stdio",
        )
    )
    try:
        client.record_protocol_signal(
            "cancelled",
            "notifications/cancelled",
            session_id="python-smoke-session",
            direction="client_to_server",
        )
        catalog = {
            "resources": [
                {"name": "private-resource-name", "uri": "secret://private-resource"},
                {"uri": "secret://second-resource"},
            ],
            "nextCursor": "private-cursor",
                "ttlMs": 60000,
                "cacheScope": "private",
        }
        client.capture(
            {
                "event_type": "catalog",
                "mcp_method": "resources/list",
                "session_id": "python-smoke-session",
                "started_at": "2026-01-01T00:00:00Z",
                "success": True,
                "is_error": False,
                **_catalog_observation("resources", catalog),
                "payload": {"_trackmcp": {"next_cursor_present": True}},
            }
        )
        client.capture(_entity_protocol_event(
            "resources/read",
            interaction_entity_observation("resources/read", {"uri": "secret://private-read"}),
            session_id="python-smoke-session",
            success=True,
            result={"contents": [{"text": "private-resource-content"}]},
        ))
        client.capture(_entity_protocol_event(
            "prompts/get",
            interaction_entity_observation("prompts/get", {"name": "private-prompt"}),
            session_id="python-smoke-session",
            success=True,
            result={"messages": [{"content": "private-prompt-message"}], "resultType": "complete"},
        ))
        protocol_result = {
            "resultType": "input_required",
            "inputRequests": [{"prompt": "private-input-request"}] * 140,
            "inputResponses": [{"value": "private-input-response"}] * 120,
            "taskId": "private-task-handle",
        }
        client.capture({
            "event_type": "protocol",
            "mcp_method": "elicitation/create",
            "session_id": "python-smoke-session",
            "success": True,
            "is_error": False,
            **_protocol_result_metadata(protocol_result),
            "payload": _protocol_metadata_payload("elicitation/create", protocol_result),
        })
        client.record_transport_failure(
            "transport_error", session_id="python-smoke-session", duration_ms=12
        )
        client.record_session_reconnected(
            transport="stdio", session_id="python-smoke-session", duration_ms=7
        )
        client.flush()
    finally:
        client._timer.cancel()
        server.shutdown()
        server.server_close()

    body = json.dumps(CaptureHandler.payload, ensure_ascii=False)
    for marker in (
        "private-resource-name",
        "secret://private-resource",
        "secret://second-resource",
        "private-cursor",
        "secret://private-read",
        "private-resource-content",
        "private-prompt",
        "private-prompt-message",
        "private-input-request",
        "private-input-response",
        "private-task-handle",
    ):
        if marker in body:
            fail(f"private catalog value crossed the event boundary: {marker}")
    events = CaptureHandler.payload.get("events", []) if CaptureHandler.payload else []
    if len(events) != 7:
        fail("unexpected event envelope")
    if events[0].get("direction") != "client_to_server" or events[0].get("event_type") != "protocol":
        fail("protocol signal direction was not preserved")
    if events[1].get("catalog_kind") != "resources" or events[1].get("event_type") != "catalog":
        fail("catalog observation was not emitted")
        if events[1].get("cache_ttl_ms") != 60000 or events[1].get("cache_scope") != "private":
            fail("bounded cache hints were not emitted")
    if events[2].get("catalog_kind") != "resources" or events[2].get("mcp_method") != "resources/read" or events[2].get("catalog_item_count") != 1:
        fail("resource entity-read metadata was not emitted")
    if events[3].get("catalog_kind") != "prompts" or events[3].get("mcp_method") != "prompts/get" or events[3].get("result_type") != "complete":
        fail("prompt entity-read metadata was not emitted")
    if events[4].get("mcp_method") != "elicitation/create" or events[4].get("result_type") != "input_required" or events[4].get("input_request_count") != 100 or events[4].get("input_response_count") != 100:
        fail("bounded protocol-result metadata was not emitted")
    if events[4].get("payload", {}).get("_trackmcp", {}).get("observation_kind") != "protocol_response":
        fail("protocol-result observation marker was not emitted")
    if events[5].get("error_class") != "transport_error" or events[5].get("event_type") != "session":
        fail("transport failure metadata was not emitted")
    if events[6].get("event_type") != "session" or events[6].get("transport") != "stdio" or events[6].get("success") is not True:
        fail("transport reconnect metadata was not emitted")
    if events[6].get("payload", {}).get("_trackmcp", {}).get("observation_kind") != "session_reconnected":
        fail("transport reconnect observation marker was not emitted")
    print("Python TrackMCP runtime smoke passed")


if __name__ == "__main__":
    main()
