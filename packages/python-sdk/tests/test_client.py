import asyncio
import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from unittest import TestCase

from trackmcp import TrackMCP, TrackMCPOptions
from trackmcp.client import _TrackMCPMiddleware


class Handler(BaseHTTPRequestHandler):
    payload = None

    def do_POST(self):
        length = int(self.headers["content-length"])
        Handler.payload = json.loads(self.rfile.read(length))
        self.send_response(200)
        self.end_headers()

    def log_message(self, *_args):
        pass


class TrackMCPClientTest(TestCase):
    def test_flushes_redacted_event(self):
        server = HTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        client = TrackMCP(TrackMCPOptions(
            api_key="tmcp_test",
            endpoint=f"http://127.0.0.1:{server.server_port}",
            redact=["args.password"],
        ))
        client.capture({
            "event_type": "tool_call",
            "tool_name": "lookup",
            "started_at": "2026-01-01T00:00:00Z",
            "payload": {"args": {"password": "secret"}},
        })
        client.flush()
        server.shutdown()
        server.server_close()
        self.assertEqual(Handler.payload["events"][0]["payload"]["args"]["password"], "[redacted]")

    def test_emits_versioned_event_and_utf8_payload_size(self):
        server = HTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        client = TrackMCP(TrackMCPOptions(api_key="tmcp_test", endpoint=f"http://127.0.0.1:{server.server_port}"))
        client.capture({
            "event_type": "tool_call",
            "event_id": "caller-id-is-replaced",
            "tool_name": "lookup",
            "started_at": "2026-01-01T00:00:00Z",
            "payload": {"message": "café"},
        })
        client.flush()
        server.shutdown()
        server.server_close()
        event = Handler.payload["events"][0]
        self.assertEqual(event["schema_version"], "1")
        self.assertEqual(event["payload_size_bytes"], len(json.dumps({"message": "café"}, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")))
        self.assertEqual(event["event_id"].count("-"), 4)

    def test_catalog_metadata_and_client_identity_are_captured(self):
        server = HTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        client = TrackMCP(TrackMCPOptions(api_key="tmcp_test", endpoint=f"http://127.0.0.1:{server.server_port}"))

        class Context:
            def __init__(self, method, params):
                self.method = method
                self.params = params
                self.session_id = "session-1"
                self.request_id = "request-1"

        async def call_next(ctx):
            if ctx.method == "tools/list":
                return {"tools": [{"name": "lookup", "description": "Find a record", "inputSchema": {"type": "object", "properties": {"id": {"type": "string"}}}}]}
            return {"isError": False, "content": []}

        middleware = _TrackMCPMiddleware(client)

        async def exercise():
            await middleware(Context("initialize", {"clientInfo": {"name": "fixture-client", "version": "2.3.4"}}), call_next)
            await middleware(Context("tools/list", {}), call_next)
            await middleware(Context("tools/call", {"name": "lookup", "arguments": {"id": "1"}}), call_next)

        asyncio.run(exercise())
        client.flush()
        server.shutdown()
        server.server_close()
        events = Handler.payload["events"]
        session = next(event for event in events if event["mcp_method"] == "initialize")
        call = next(event for event in events if event["event_type"] == "tool_call")
        catalog = next(event for event in events if event["event_type"] == "catalog")
        self.assertEqual(session["client_name"], "fixture-client")
        self.assertEqual(session["client_version"], "2.3.4")
        self.assertEqual(call["tool_description"], "Find a record")
        self.assertRegex(call["tool_description_hash"], r"^[0-9a-f]{64}$")
        self.assertRegex(call["schema_hash"], r"^[0-9a-f]{64}$")
        self.assertEqual(catalog["payload"]["tools"][0]["name"], "lookup")

    def test_existing_wrapper_behavior_is_preserved(self):
        class Server:
            def request(self, request):
                return {"isError": False, "result": request["params"]["name"]}

        client = TrackMCP(TrackMCPOptions(api_key="tmcp_test", disabled=False, flush_interval_ms=60000))
        # Exercise the public wrapper without making a network request.
        from trackmcp.client import _Wrapped
        wrapped_server = _Wrapped(Server(), client)
        result = wrapped_server.request({"method": "tools/call", "params": {"name": "lookup", "arguments": {}}})
        self.assertEqual(result["result"], "lookup")
        self.assertEqual(len(client._events), 1)
        self.assertEqual(client._events[0]["event_type"], "tool_call")
        client._timer.cancel()


if __name__ == "__main__":
    import unittest
    unittest.main()
