import asyncio
import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from unittest import TestCase

from trackmcp import TrackMCP, TrackMCPOptions, trackmcp_report_missing
from trackmcp.client import TrackMCPEvent, _TrackMCPMiddleware
from trackmcp.privacy import sanitize_payload


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
    def test_recursive_redaction_resource_scrubbing_and_markers(self):
        result = sanitize_payload({
            "password": "secret",
            "customerId": "customer-secret",
            "nested": {"accessToken": "bearer-secret", "publicKey": "useful-metadata", "args": {"email": "person@example.com"}},
            "image": "data:image/png;base64," + "A" * 180,
            "blob": "A" * 180,
            "bytes": bytes([1, 2, 3]),
            "uri": "https://user:password@example.com/resource?access_token=secret",
            "deep": {"child": {"value": {"tooDeep": True}}},
            "many": [1, 2, 3, 4],
            "long": "x" * 30,
        }, mode="redacted", explicit_paths=["nested.args.email"], redact_keys=["customer_id"], max_payload_depth=3, max_payload_keys=10, max_string_length=20, max_payload_bytes=10000)
        self.assertEqual(result["password"], "[redacted]")
        self.assertEqual(result["customerId"], "[redacted]")
        self.assertEqual(result["nested"]["accessToken"], "[redacted]")
        self.assertEqual(result["nested"]["publicKey"], "useful-metadata")
        self.assertEqual(result["nested"]["args"]["email"], "[redacted]")
        self.assertEqual(result["image"], {"__trackmcp_truncated": True, "reason": "binary", "original_type": "string", "media_type": "image/png", "original_bytes": 135})
        self.assertEqual(result["blob"], {"__trackmcp_truncated": True, "reason": "binary", "original_type": "string", "original_bytes": 135})
        self.assertEqual(result["bytes"], {"__trackmcp_truncated": True, "reason": "binary", "original_type": "binary", "original_bytes": 3})
        self.assertEqual(result["uri"], {"__trackmcp_truncated": True, "reason": "credential", "original_type": "string"})
        self.assertEqual(result["deep"], {"child": {"value": {"__trackmcp_truncated": True, "reason": "max_payload_depth", "original_type": "object"}}})
        breadth = sanitize_payload({"many": [1, 2, 3, 4]}, mode="redacted", max_payload_keys=3)
        self.assertEqual(breadth["many"][-1], {"__trackmcp_truncated": True, "reason": "max_payload_keys", "original_type": "array"})
        self.assertEqual(result["long"], {"__trackmcp_truncated": True, "reason": "max_string_length", "original_type": "string"})

    def test_metadata_and_full_modes_are_explicit_and_bounded(self):
        client = TrackMCP(TrackMCPOptions(api_key="tmcp_test", payload_mode="metadata", disabled=False, flush_interval_ms=60000))
        client.capture({"event_type": "tool_call", "started_at": "2026-01-01T00:00:00Z", "payload": {"secret": "value"}})
        self.assertEqual(client._events[0]["observation_source"], "server")
        self.assertEqual(client._events[0]["payload_policy"], "metadata")
        self.assertNotIn("payload", client._events[0])
        client._timer.cancel()

        full = TrackMCP(TrackMCPOptions(api_key="tmcp_test", payload_mode="full", max_payload_bytes=100, disabled=False, flush_interval_ms=60000))
        full.capture({"event_type": "tool_call", "started_at": "2026-01-01T00:00:00Z", "payload": {"value": "x" * 1000}})
        self.assertEqual(full._events[0]["payload_policy"], "full")
        self.assertLessEqual(full._events[0]["payload_size_bytes"], 100)
        self.assertTrue(full._events[0]["payload"]["__trackmcp_truncated"])
        full._timer.cancel()

    def test_event_hooks_and_failed_requeues_are_fail_open_and_bounded(self):
        mutated = TrackMCP(TrackMCPOptions(api_key="tmcp_test", redact_event=lambda event: {**event, "payload": {**event["payload"], "hook": "added", "token": "secret"}}, disabled=False, flush_interval_ms=60000))
        mutated.capture({"event_type": "custom", "started_at": "2026-01-01T00:00:00Z", "payload": {}})
        self.assertEqual(mutated._events[0]["payload"]["hook"], "added")
        self.assertEqual(mutated._events[0]["payload"]["token"], "[redacted]")
        mutated._timer.cancel()

        dropped = TrackMCP(TrackMCPOptions(api_key="tmcp_test", redact_event=lambda _event: None, disabled=False, flush_interval_ms=60000))
        dropped.capture({"event_type": "custom", "started_at": "2026-01-01T00:00:00Z", "payload": {}})
        self.assertEqual(dropped.get_diagnostics()["dropped_events"], 1)
        dropped._timer.cancel()

        failed_hook = TrackMCP(TrackMCPOptions(api_key="tmcp_test", redact_event=lambda _event: 1 / 0, disabled=False, flush_interval_ms=60000))
        failed_hook.capture({"event_type": "custom", "started_at": "2026-01-01T00:00:00Z", "payload": {}})
        self.assertEqual(failed_hook.get_diagnostics()["hook_errors"], 1)
        failed_hook._timer.cancel()

        queue = TrackMCP(TrackMCPOptions(api_key="tmcp_test", endpoint="http://127.0.0.1:1", max_batch_size=100, max_queue_events=3, disabled=False, flush_interval_ms=60000))
        for index in range(6):
            queue.track(f"event-{index}", {"value": index})
        self.assertEqual(queue.get_diagnostics()["queued_events"], 3)
        queue.flush()
        self.assertEqual(queue.get_diagnostics()["queued_events"], 3)
        self.assertGreaterEqual(queue.get_diagnostics()["dropped_events"], 3)
        queue._timer.cancel()

        byte_bound = TrackMCP(TrackMCPOptions(api_key="tmcp_test", max_batch_size=100, max_queue_events=100, max_queue_bytes=700, disabled=False, flush_interval_ms=60000))
        for index in range(8):
            byte_bound.track(f"byte-event-{index}", {"value": "x" * 20})
        self.assertLessEqual(byte_bound.get_diagnostics()["queued_bytes"], 700)
        byte_bound._timer.cancel()

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
        self.assertEqual(event["session_id_source"], "missing")
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

        seen_call_params = []
        async def call_next(ctx):
            if ctx.method == "tools/call":
                seen_call_params.append(ctx.params)
            if ctx.method == "tools/list":
                return {"tools": [{"name": "lookup", "description": "Find a record", "inputSchema": {"type": "object", "properties": {"id": {"type": "string"}}}}]}
            return {"isError": False, "content": []}

        middleware = _TrackMCPMiddleware(client)

        async def exercise():
            await middleware(Context("initialize", {"clientInfo": {"name": "fixture-client", "version": "2.3.4"}}), call_next)
            await middleware(Context("tools/list", {}), call_next)
            await middleware(Context("tools/call", {"name": "lookup", "arguments": {"id": "1", "context": "Find the relevant documentation"}}), call_next)

        asyncio.run(exercise())
        client.flush()
        events = Handler.payload["events"]
        session = next(event for event in events if event["mcp_method"] == "initialize")
        call = next(event for event in events if event["event_type"] == "tool_call")
        catalog = next(event for event in events if event["event_type"] == "catalog")
        self.assertEqual(session["client_name"], "fixture-client")
        self.assertEqual(session["client_version"], "2.3.4")
        self.assertEqual(session["session_id_source"], "protocol")
        self.assertEqual(call["session_id_source"], "protocol")
        self.assertEqual(call["tool_description"], "Find a record")
        self.assertEqual(call["context"], "Find the relevant documentation")
        self.assertEqual(call["intent_source"], "context_parameter")
        self.assertEqual(seen_call_params[-1]["arguments"]["context"], "Find the relevant documentation")
        self.assertRegex(call["tool_description_hash"], r"^[0-9a-f]{64}$")
        self.assertRegex(call["schema_hash"], r"^[0-9a-f]{64}$")
        self.assertEqual(catalog["payload"]["tools"][0]["name"], "lookup")

        fallback_context = Context("tools/call", {"name": "lookup", "arguments": {}},)
        fallback_context.session_id = None
        asyncio.run(middleware(fallback_context, call_next))
        client.flush()
        self.assertEqual(Handler.payload["events"][-1]["session_id_source"], "transport_generated")
        self.assertTrue(Handler.payload["events"][-1]["session_id"])
        server.shutdown()
        server.server_close()

    def test_correlation_defaults_external_validation_and_python_issued_boundary(self):
        default = TrackMCP(TrackMCPOptions(api_key="tmcp_test", disabled=False, flush_interval_ms=60000))
        default.capture({"event_type": "custom", "started_at": "2026-01-01T00:00:00Z", "request_id": "request-not-a-handle"})
        self.assertEqual(default._events[0]["correlation_handle_source"], "missing")
        self.assertNotIn("correlation_handle", default._events[0])
        default._timer.cancel()

        contexts = []
        external = TrackMCP(TrackMCPOptions(
            api_key="tmcp_test",
            correlation_mode="external",
            correlation_resolver=lambda context: contexts.append(context) or "job_anon_1",
            disabled=False,
            flush_interval_ms=60000,
        ))
        external.capture({"event_type": "tool_call", "mcp_method": "tools/call", "tool_name": "lookup", "request_id": "request-1", "started_at": "2026-01-01T00:00:00Z"})
        self.assertEqual(external._events[0]["correlation_handle"], "job_anon_1")
        self.assertEqual(external._events[0]["correlation_handle_source"], "external")
        self.assertEqual(contexts[0]["request_id"], "request-1")
        external._timer.cancel()

        invalid = TrackMCP(TrackMCPOptions(api_key="tmcp_test", correlation_mode="external", correlation_resolver=lambda _context: "Bearer secret", disabled=False, flush_interval_ms=60000))
        invalid.capture({"event_type": "custom", "started_at": "2026-01-01T00:00:00Z"})
        self.assertEqual(invalid._events[0]["correlation_handle_source"], "missing")
        invalid._timer.cancel()

        issued = TrackMCP(TrackMCPOptions(api_key="tmcp_test", correlation_mode="issued", disabled=False, flush_interval_ms=60000))
        issued.capture({"event_type": "tool_call", "started_at": "2026-01-01T00:00:00Z"}, "tmcp_issued_1", "issued")
        self.assertEqual(issued._events[0]["correlation_handle_source"], "issued")
        issued._timer.cancel()

    def test_event_contract_includes_correlation_fields_for_sdk_parity(self):
        expected = {"schema_version", "event_id", "event_type", "service", "environment", "request_id", "session_id", "session_id_source", "correlation_handle", "correlation_handle_source", "observation_source", "context", "intent_source", "missing_capability", "tool_name", "started_at", "duration_ms", "payload_size_bytes", "payload_policy", "payload"}
        self.assertTrue(expected.issubset(set(TrackMCPEvent.__annotations__)))

    def test_intent_provenance_is_explicit_bounded_and_missing_reports_keep_correlation(self):
        contexts = []
        client = TrackMCP(TrackMCPOptions(
            api_key="tmcp_test",
            correlation_mode="external",
            correlation_resolver=lambda context: "job_anon_1",
            intent_fallback=lambda context: contexts.append(context) or "Complete the lookup",
            disabled=False,
            flush_interval_ms=60000,
        ))
        client.capture({"event_type": "tool_call", "started_at": "2026-01-01T00:00:00Z", "context": "Find the relevant documentation"})
        client.capture({"event_type": "tool_call", "started_at": "2026-01-01T00:00:00Z"})
        client.capture({"event_type": "custom", "started_at": "2026-01-01T00:00:00Z", "context": "Resolve the deployment issue", "intent_source": "external_callback"})
        client.capture({"event_type": "custom", "started_at": "2026-01-01T00:00:00Z", "context": "Bearer should not persist"})
        client.report_missing("bulk_export", "Export all matching records")
        self.assertEqual(client._events[0]["intent_source"], "context_parameter")
        self.assertEqual(client._events[1]["intent_source"], "fallback")
        self.assertEqual(client._events[2]["intent_source"], "external_callback")
        self.assertEqual(client._events[3]["intent_source"], "fallback")
        report = client._events[4]
        self.assertEqual(report["mcp_method"], "trackmcp_report_missing")
        self.assertEqual(report["missing_capability"], "bulk_export")
        self.assertEqual(report["correlation_handle_source"], "external")
        self.assertNotIn("Bearer", json.dumps(client._events))
        self.assertNotIn("args", contexts[0])
        client._timer.cancel()

        invalid = TrackMCP(TrackMCPOptions(api_key="tmcp_test", disabled=False, flush_interval_ms=60000))
        invalid.capture({"event_type": "custom", "started_at": "2026-01-01T00:00:00Z", "context": "x" * 2049})
        self.assertEqual(invalid._events[0]["intent_source"], "missing")
        invalid._timer.cancel()

    def test_module_missing_report_is_fail_open_when_no_client_exists(self):
        trackmcp_report_missing("bulk_export")

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
