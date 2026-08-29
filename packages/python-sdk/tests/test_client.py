import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from unittest import TestCase

from trackmcp import TrackMCP, TrackMCPOptions


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


if __name__ == "__main__":
    import unittest
    unittest.main()
