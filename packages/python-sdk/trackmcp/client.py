from __future__ import annotations

import copy
import hashlib
import inspect
import json
import os
import random
import threading
import time
import urllib.request
import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, List, Optional, TypedDict


_active_client: Optional["TrackMCP"] = None
TRACKMCP_SCHEMA_VERSION = "1"


class TrackMCPEvent(TypedDict, total=False):
    schema_version: str
    event_id: str
    event_type: str
    service: str
    environment: str
    server_id: str
    deployment_id: str
    server_version: str
    sdk_version: str
    direction: str
    transport: str
    protocol_version: str
    mcp_method: str
    request_id: str
    session_id: str
    session_id_source: str
    task_id: str
    workflow_id: str
    client_name: str
    client_version: str
    tool_name: str
    tool_description: str
    tool_description_hash: str
    started_at: str
    duration_ms: int
    success: bool
    is_error: bool
    error_class: str
    error_code: int
    retry_number: int
    schema_hash: str
    payload_size_bytes: int
    payload_policy: str
    payload: Dict[str, Any]


@dataclass
class TrackMCPOptions:
    api_key: str
    service: str = "mcp-server"
    environment: str = field(default_factory=lambda: os.getenv("NODE_ENV", "production"))
    endpoint: str = "https://trackmcp.com/api/v1/ingest"
    sample_rate: float = 1.0
    redact: List[str] = field(default_factory=list)
    disabled: bool = False
    server_version: Optional[str] = None
    sdk_version: Optional[str] = None
    deployment_id: Optional[str] = None
    server_id: Optional[str] = None
    flush_interval_ms: int = 5000
    max_batch_size: int = 50


def _redact(value: Any, paths: Iterable[str]) -> Any:
    result = copy.deepcopy(value)
    if not isinstance(result, dict):
        return result
    for path in paths:
        cursor: Any = result
        parts = path.split(".")
        for part in parts[:-1]:
            if not isinstance(cursor, dict) or part not in cursor:
                cursor = None
                break
            cursor = cursor[part]
        if isinstance(cursor, dict) and parts[-1] in cursor:
            cursor[parts[-1]] = "[redacted]"
    return result


def _canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _sha256(value: Any) -> str:
    return hashlib.sha256(_canonical_json(value).encode("utf-8")).hexdigest()


def _catalog_tools(result: Any) -> List[Dict[str, Any]]:
    if not isinstance(result, dict) or not isinstance(result.get("tools"), list):
        return []
    tools = []
    for tool in result["tools"]:
        if not isinstance(tool, dict) or not isinstance(tool.get("name"), str):
            continue
        description = tool.get("description") if isinstance(tool.get("description"), str) else None
        input_schema = tool.get("inputSchema", tool.get("input_schema", {}))
        tools.append({
            "name": tool["name"],
            "description": description,
            "tool_description_hash": _sha256(description or ""),
            "schema_hash": _sha256(input_schema),
        })
    return tools


class TrackMCP:
    def __init__(self, options: TrackMCPOptions):
        if not options.api_key:
            raise ValueError("TrackMCP api_key is required")
        self.options = options
        self._events: List[TrackMCPEvent] = []
        self._tool_catalog: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
        self._timer = None
        if not options.disabled:
            self._timer = threading.Timer(options.flush_interval_ms / 1000, self._scheduled_flush)
            self._timer.daemon = True
            self._timer.start()

    def capture(self, event: Dict[str, Any]) -> None:
        if self.options.disabled or random.random() > max(0, min(1, self.options.sample_rate)):
            return
        event = dict(event)
        event.update({
            "schema_version": TRACKMCP_SCHEMA_VERSION,
            "event_id": str(uuid.uuid4()),
            "service": self.options.service,
            "environment": self.options.environment,
            "server_version": self.options.server_version,
            "sdk_version": self.options.sdk_version,
            "deployment_id": self.options.deployment_id,
            "server_id": self.options.server_id,
        })
        event["session_id_source"] = event.get("session_id_source") or ("external" if event.get("session_id") else "missing")
        if "payload" in event:
            event["payload"] = _redact(event["payload"], self.options.redact)
            event["payload_size_bytes"] = len(_canonical_json(event["payload"]).encode("utf-8"))
        with self._lock:
            self._events.append(event)
            should_flush = len(self._events) >= self.options.max_batch_size
        if should_flush:
            self.flush()

    def track(self, name: str, payload: Optional[Dict[str, Any]] = None) -> None:
        self.capture({"event_type": "custom", "started_at": _iso_now(), "payload": {"name": name, **(payload or {})}})

    def workflow(self, name: str, status: str, payload: Optional[Dict[str, Any]] = None) -> None:
        if status not in ("started", "completed", "failed"):
            raise ValueError("workflow status must be started, completed, or failed")
        self.capture({"event_type": "workflow", "started_at": _iso_now(), "payload": {"name": "workflow", "workflow_name": name, "status": status, **(payload or {})}})

    def record_catalog(self, result: Any) -> List[Dict[str, Any]]:
        tools = _catalog_tools(result)
        for tool in tools:
            self._tool_catalog[tool["name"]] = tool
        return tools

    def tool_metadata(self, name: Optional[str]) -> Optional[Dict[str, Any]]:
        return self._tool_catalog.get(name) if name else None

    def flush(self) -> None:
        with self._lock:
            events = self._events[: self.options.max_batch_size]
            del self._events[: len(events)]
        if not events or self.options.disabled:
            return
        try:
            body = json.dumps({"events": events}).encode("utf-8")
            request = urllib.request.Request(
                self.options.endpoint,
                data=body,
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {self.options.api_key}"},
                method="POST",
            )
            with urllib.request.urlopen(request, timeout=3) as response:
                if response.status >= 300:
                    raise RuntimeError(f"TrackMCP ingest returned {response.status}")
        except Exception:
            with self._lock:
                self._events[0:0] = events

    def _scheduled_flush(self) -> None:
        self.flush()
        if not self.options.disabled:
            self._timer = threading.Timer(self.options.flush_interval_ms / 1000, self._scheduled_flush)
            self._timer.daemon = True
            self._timer.start()


class _TrackMCPMiddleware:
    """Official MCP Python SDK middleware seam (mcp 2.x)."""

    def __init__(self, client: TrackMCP):
        self.client = client
        self.client_name: Optional[str] = None
        self.client_version: Optional[str] = None
        self.transport_session_id = str(uuid.uuid4())

    async def __call__(self, ctx: Any, call_next: Any) -> Any:
        method = getattr(ctx, "method", "")
        params = getattr(ctx, "params", None) or {}
        if method == "initialize" and isinstance(params, dict):
            client_info = params.get("clientInfo")
            if isinstance(client_info, dict):
                self.client_name = client_info.get("name")
                self.client_version = client_info.get("version")
        session_id = getattr(ctx, "session_id", None) or self.transport_session_id
        session_id_source = "protocol" if getattr(ctx, "session_id", None) else "transport_generated"
        request_id = getattr(ctx, "request_id", None)
        tool_name = params.get("name") if isinstance(params, dict) else None
        arguments = params.get("arguments", {}) if isinstance(params, dict) else {}
        started = time.time()
        try:
            result = await call_next(ctx)
            result_data = result.model_dump(mode="json") if hasattr(result, "model_dump") else result
            is_error = bool(isinstance(result_data, dict) and result_data.get("isError"))
            if method == "tools/call":
                metadata = self.client.tool_metadata(tool_name)
                self.client.capture(_event(tool_name, {"args": arguments}, started, result_data, None, self.client_name, session_id, request_id, self.client_version, metadata, session_id_source))
            elif method in ("tools/list", "resources/list", "resources/templates/list", "prompts/list"):
                catalog_type = method.replace("/list", "")
                tools = self.client.record_catalog(result_data)
                self.client.capture({"event_type": "catalog", "mcp_method": method, "request_id": request_id, "session_id": session_id, "session_id_source": session_id_source, "client_name": self.client_name, "client_version": self.client_version, "started_at": _iso_from_epoch(started), "duration_ms": round((time.time() - started) * 1000), "success": not is_error, "is_error": is_error, "payload": {"name": f"{catalog_type}_discovered", "tools": tools, "result": result_data}})
            else:
                self.client.capture({"event_type": "protocol", "mcp_method": method, "request_id": request_id, "session_id": session_id, "session_id_source": session_id_source, "client_name": self.client_name, "client_version": self.client_version, "started_at": _iso_from_epoch(started), "duration_ms": round((time.time() - started) * 1000), "success": not is_error, "is_error": is_error, "payload": {"params": params, "result": result_data}})
            return result
        except Exception as error:
            if method == "tools/call":
                self.client.capture(_event(tool_name, {"args": arguments}, started, None, error, self.client_name, session_id, request_id, self.client_version, self.client.tool_metadata(tool_name), session_id_source))
            else:
                self.client.capture({"event_type": "protocol", "mcp_method": method, "request_id": request_id, "session_id": session_id, "session_id_source": session_id_source, "client_name": self.client_name, "client_version": self.client_version, "started_at": _iso_from_epoch(started), "duration_ms": round((time.time() - started) * 1000), "success": False, "is_error": True, "error_class": "protocol_error", "payload": {"params": params, "error": str(error)}})
            raise

def _iso_now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _iso_from_epoch(value: float) -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(value))


def _details(args: tuple[Any, ...]) -> tuple[Optional[str], Dict[str, Any]]:
    first = args[0] if args else {}
    if not isinstance(first, dict):
        return None, {"args": list(args)}
    params = first.get("params", first)
    if not isinstance(params, dict):
        params = first
    return params.get("name"), {"args": params.get("arguments", params.get("args", {}))}


def _request_details(args: tuple[Any, ...]) -> tuple[Optional[str], Optional[str], Dict[str, Any]]:
    first = args[0] if args else {}
    if not isinstance(first, dict):
        return None, None, {"args": list(args)}
    params = first.get("params", first)
    if not isinstance(params, dict):
        params = first
    return first.get("method") if isinstance(first.get("method"), str) else None, params.get("name"), params


class _Wrapped:
    def __init__(self, server: Any, client: TrackMCP):
        self._server = server
        self.trackmcp = client
        self.client_name: Optional[str] = None
        self.client_version: Optional[str] = None
        self.transport_session_id = str(uuid.uuid4())

    def __getattr__(self, name: str) -> Any:
        original = getattr(self._server, name)
        if name not in ("request", "call_tool", "callTool") or not callable(original):
            return original

        def wrapped(*args: Any, **kwargs: Any) -> Any:
            method, tool_name, params = _request_details(args)
            _, payload = _details(args)
            if method == "initialize" and isinstance(params.get("clientInfo"), dict):
                self.client_name = params["clientInfo"].get("name")
                self.client_version = params["clientInfo"].get("version")
            started = time.time()
            client = self.trackmcp
            try:
                result = original(*args, **kwargs)
                if inspect.isawaitable(result):
                    async def awaited() -> Any:
                        try:
                            value = await result
                            if method in ("tools/list", "resources/list", "resources/templates/list", "prompts/list"):
                                catalog_type = method.replace("/list", "")
                                tools = client.record_catalog(value)
                                client.capture({"event_type": "catalog", "mcp_method": method, "session_id": self.transport_session_id, "session_id_source": "transport_generated", "client_name": self.client_name, "client_version": self.client_version, "started_at": _iso_from_epoch(started), "duration_ms": round((time.time() - started) * 1000), "success": True, "is_error": False, "payload": {"name": f"{catalog_type}_discovered", "tools": tools, "result": value}})
                            else:
                                client.capture(_event(tool_name, payload, started, value, None, self.client_name, self.transport_session_id, None, self.client_version, client.tool_metadata(tool_name), "transport_generated"))
                            return value
                        except Exception as error:
                            client.capture(_event(tool_name, payload, started, None, error, self.client_name, self.transport_session_id, None, self.client_version, client.tool_metadata(tool_name), "transport_generated"))
                            raise
                    return awaited()
                if method in ("tools/list", "resources/list", "resources/templates/list", "prompts/list"):
                    catalog_type = method.replace("/list", "")
                    tools = client.record_catalog(result)
                    client.capture({"event_type": "catalog", "mcp_method": method, "session_id": self.transport_session_id, "session_id_source": "transport_generated", "client_name": self.client_name, "client_version": self.client_version, "started_at": _iso_from_epoch(started), "duration_ms": round((time.time() - started) * 1000), "success": True, "is_error": False, "payload": {"name": f"{catalog_type}_discovered", "tools": tools, "result": result}})
                else:
                    client.capture(_event(tool_name, payload, started, result, None, self.client_name, self.transport_session_id, None, self.client_version, client.tool_metadata(tool_name), "transport_generated"))
                return result
            except Exception as error:
                client.capture(_event(tool_name, payload, started, None, error, self.client_name, self.transport_session_id, None, self.client_version, client.tool_metadata(tool_name), "transport_generated"))
                raise
        return wrapped


def _event(tool_name: Optional[str], payload: Dict[str, Any], started: float, result: Any, error: Optional[Exception], client_name: Optional[str] = None, session_id: Optional[str] = None, request_id: Optional[str] = None, client_version: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None, session_id_source: Optional[str] = None) -> Dict[str, Any]:
    is_error = error is not None or bool(isinstance(result, dict) and result.get("isError"))
    return {
        "event_type": "tool_call",
        "tool_name": tool_name,
        "mcp_method": "tools/call",
        "request_id": request_id,
        "client_name": client_name,
        "client_version": client_version,
        "tool_description": metadata.get("description") if metadata else None,
        "tool_description_hash": metadata.get("tool_description_hash") if metadata else None,
        "schema_hash": metadata.get("schema_hash") if metadata else None,
        "session_id": session_id,
        "session_id_source": session_id_source,
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(started)),
        "duration_ms": round((time.time() - started) * 1000),
        "success": not is_error,
        "is_error": is_error,
        "payload": {**payload, "result": result, "error": str(error) if error else None},
    }


def with_trackmcp(server: Any, api_key: Optional[str] = None, **kwargs: Any) -> Any:
    global _active_client
    options = TrackMCPOptions(api_key=api_key or os.environ["TRACKMCP_KEY"], **kwargs)
    _active_client = TrackMCP(options)
    official_server = getattr(server, "_lowlevel_server", None)
    if official_server is not None and hasattr(official_server, "middleware"):
        official_server.middleware.append(_TrackMCPMiddleware(_active_client))
        setattr(server, "trackmcp", _active_client)
        return server
    return _Wrapped(server, _active_client)


def track(name: str, payload: Optional[Dict[str, Any]] = None) -> None:
    if _active_client:
        _active_client.track(name, payload)
