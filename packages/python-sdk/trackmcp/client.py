from __future__ import annotations

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
from typing import Any, Callable, Dict, List, Literal, Optional, TypedDict

from .privacy import (
    DEFAULT_MAX_BATCH_SIZE,
    DEFAULT_MAX_PAYLOAD_BYTES,
    DEFAULT_MAX_PAYLOAD_DEPTH,
    DEFAULT_MAX_PAYLOAD_KEYS,
    DEFAULT_MAX_QUEUE_BYTES,
    DEFAULT_MAX_QUEUE_EVENTS,
    DEFAULT_MAX_STRING_LENGTH,
    payload_byte_length,
    sanitize_payload,
)


_active_client: Optional["TrackMCP"] = None
TRACKMCP_SCHEMA_VERSION = "1"
CORRELATION_HANDLE_PATTERN = r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$"
TrackMCPCorrelationMode = Literal["none", "external", "issued"]
TrackMCPCorrelationHandleSource = Literal["external", "issued", "missing"]
TrackMCPIntentSource = Literal["context_parameter", "external_callback", "fallback", "missing"]
TrackMCPAccountIdentitySource = Literal["resolver", "unresolved"]
TrackMCPTransport = Literal["stdio", "streamable_http", "sse", "custom"]


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
    observation_source: Literal["client", "server"]
    direction: str
    transport: str
    protocol_version: str
    mcp_method: str
    request_id: str
    session_id: str
    session_id_source: str
    correlation_handle: str
    correlation_handle_source: TrackMCPCorrelationHandleSource
    context: str
    intent_source: TrackMCPIntentSource
    missing_capability: str
    task_id: str
    workflow_id: str
    client_name: str
    client_version: str
    account_key: str
    account_identity_source: TrackMCPAccountIdentitySource
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
    result_type: Literal["complete", "input_required", "task"]
    input_request_count: int
    input_response_count: int
    schema_hash: str
    catalog_kind: Literal["tools", "resources", "resource_templates", "prompts"]
    catalog_item_count: int
    catalog_item_name_hashes: List[str]
    catalog_item_uri_hashes: List[str]
    cache_ttl_ms: int
    cache_scope: Literal["public", "private"]
    payload_size_bytes: int
    payload_policy: str
    payload: Dict[str, Any]


@dataclass
class TrackMCPOptions:
    api_key: str
    service: str = "mcp-server"
    environment: str = field(default_factory=lambda: os.getenv("NODE_ENV", "production"))
    endpoint: str = "https://trackmcp.com/api/v1/ingest"
    # The server wrapper cannot infer its host transport. Set this explicitly
    # when the application knows it; omitted transport remains unknown.
    transport: Optional[TrackMCPTransport] = None
    sample_rate: float = 1.0
    redact: List[str] = field(default_factory=list)
    redact_keys: List[str] = field(default_factory=list)
    payload_mode: Literal["metadata", "redacted", "full"] = "redacted"
    max_payload_bytes: int = DEFAULT_MAX_PAYLOAD_BYTES
    max_payload_depth: int = DEFAULT_MAX_PAYLOAD_DEPTH
    max_payload_keys: int = DEFAULT_MAX_PAYLOAD_KEYS
    max_string_length: int = DEFAULT_MAX_STRING_LENGTH
    redact_event: Optional[Callable[[Dict[str, Any]], Optional[Dict[str, Any]]]] = None
    disabled: bool = False
    server_version: Optional[str] = None
    sdk_version: Optional[str] = None
    deployment_id: Optional[str] = None
    server_id: Optional[str] = None
    flush_interval_ms: int = 5000
    max_batch_size: int = DEFAULT_MAX_BATCH_SIZE
    max_queue_events: int = DEFAULT_MAX_QUEUE_EVENTS
    max_queue_bytes: int = DEFAULT_MAX_QUEUE_BYTES
    correlation_mode: TrackMCPCorrelationMode = "none"
    correlation_resolver: Optional[Callable[[Dict[str, Any]], Optional[str]]] = None
    issued_handle_field: str = "__trackmcp_correlation_handle"
    intent_fallback: Optional[Callable[[Dict[str, Any]], Optional[str]]] = None
    # Resolve an already-validated tenant/account claim. Failures are fail-open.
    account_id_resolver: Optional[Callable[[Dict[str, Any]], Optional[str]]] = None


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


def _catalog_observation(kind: str, result: Any) -> Dict[str, Any]:
    """Return bounded one-way catalog metadata; never retain names, URIs, or arguments."""
    key = "resourceTemplates" if kind == "resource_templates" else kind
    items = result.get(key) if isinstance(result, dict) and isinstance(result.get(key), list) else []
    names: List[str] = []
    uris: List[str] = []
    for item in items[:128]:
        if not isinstance(item, dict):
            continue
        if isinstance(item.get("name"), str):
            names.append(hashlib.sha256(item["name"].encode("utf-8")).hexdigest())
        uri = item.get("uri", item.get("uriTemplate"))
        if isinstance(uri, str):
            uris.append(hashlib.sha256(uri.encode("utf-8")).hexdigest())
    metadata: Dict[str, Any] = {"catalog_kind": kind, "catalog_item_count": len(items), "catalog_item_name_hashes": names, "catalog_item_uri_hashes": uris}
    metadata.update(_cache_hints(result))
    return metadata


def _cache_hints(result: Any) -> Dict[str, Any]:
    """Project one-day cache hints without treating them as auth or invalidation."""
    if not isinstance(result, dict):
        return {}
    ttl = result.get("ttlMs", result.get("ttl_ms"))
    scope = result.get("cacheScope", result.get("cache_scope"))
    metadata: Dict[str, Any] = {}
    if isinstance(ttl, int) and not isinstance(ttl, bool) and 0 <= ttl <= 86_400_000:
        metadata["cache_ttl_ms"] = ttl
    if scope in ("public", "private"):
        metadata["cache_scope"] = scope
    return metadata


def interaction_entity_observation(method: Optional[str], params: Any) -> Optional[Dict[str, str]]:
    """Hash one resource/prompt identity without retaining its value or result."""
    if not isinstance(params, dict):
        return None
    if method == "resources/read":
        value = params.get("uri")
        kind = "resources"
    elif method == "prompts/get":
        value = params.get("name")
        kind = "prompts"
    else:
        return None
    if not isinstance(value, str) or not value:
        return None
    return {"kind": kind, "hash": hashlib.sha256(value.encode("utf-8")).hexdigest()}


def _protocol_result_metadata(result: Any) -> Dict[str, Any]:
    """Extract bounded MCP result discriminators without retaining result data."""
    if not isinstance(result, dict):
        return {}
    result_type = result.get("resultType", result.get("result_type"))
    metadata: Dict[str, Any] = {}
    metadata.update(_cache_hints(result))
    if result_type in ("complete", "input_required", "task"):
        metadata["result_type"] = result_type
    requests = result.get("inputRequests", result.get("input_requests"))
    responses = result.get("inputResponses", result.get("input_responses"))
    if isinstance(requests, list):
        metadata["input_request_count"] = min(100, len(requests))
    if isinstance(responses, list):
        metadata["input_response_count"] = min(100, len(responses))
    completion = result.get("completion")
    if isinstance(completion, dict):
        values = completion.get("values")
        if isinstance(values, list):
            metadata["completion_value_count"] = min(32, len(values))
        total = completion.get("total")
        if isinstance(total, int) and not isinstance(total, bool) and 0 <= total <= 1_000_000:
            metadata["completion_total"] = total
        has_more = completion.get("hasMore", completion.get("has_more"))
        if isinstance(has_more, bool):
            metadata["completion_has_more"] = has_more
    return metadata


def _protocol_metadata_payload(method: Optional[str], result: Any) -> Dict[str, Any]:
    """Return bounded protocol metadata without retaining completion values."""
    metadata = _protocol_result_metadata(result)
    trackmcp: Dict[str, Any] = {
        "observation_kind": "protocol_response",
        "observation_source": "middleware",
    }
    if method in ("resources/subscribe", "subscriptions/listen"):
        trackmcp["subscription_action"] = "subscription_started"
    elif method == "resources/unsubscribe":
        trackmcp["subscription_action"] = "subscription_stopped"
    if method == "completion/complete" and any(key.startswith("completion_") for key in metadata):
        trackmcp.update({"protocol_family": "completion", **{key: value for key, value in metadata.items() if key.startswith("completion_")}})
    return {"_trackmcp": trackmcp}


def _protocol_signal_for_method(method: Optional[str]) -> Optional[str]:
    """Map notification methods to the metadata-only signal vocabulary."""
    return {
        "notifications/progress": "progress",
        "notifications/cancelled": "cancelled",
        "notifications/tools/list_changed": "catalog_changed",
        "notifications/resources/list_changed": "catalog_changed",
        "notifications/prompts/list_changed": "catalog_changed",
    }.get(method)


def _entity_protocol_event(method: Optional[str], entity: Optional[Dict[str, str]], *, request_id: Optional[str] = None,
                           session_id: Optional[str] = None, session_id_source: Optional[str] = None,
                           client_name: Optional[str] = None, client_version: Optional[str] = None,
                           started: Optional[float] = None, success: bool = True, result: Any = None,
                           error_class: Optional[str] = None) -> Optional[Dict[str, Any]]:
    if not entity:
        return None
    kind = entity["kind"]
    observation: Dict[str, Any] = {
        "event_type": "protocol",
        "mcp_method": method,
        "request_id": request_id,
        "session_id": session_id,
        "session_id_source": session_id_source,
        "client_name": client_name,
        "client_version": client_version,
        "started_at": _iso_from_epoch(started) if started is not None else _iso_now(),
        "success": success,
        "is_error": not success,
        "catalog_kind": kind,
        "catalog_item_count": 1,
        "catalog_item_name_hashes": [entity["hash"]] if kind == "prompts" else [],
        "catalog_item_uri_hashes": [entity["hash"]] if kind == "resources" else [],
        "payload": {"name": f"{kind}_read_observed"},
    }
    observation.update(_protocol_result_metadata(result))
    if error_class:
        observation["error_class"] = error_class
    return observation


class TrackMCP:
    def __init__(self, options: TrackMCPOptions):
        if not options.api_key:
            raise ValueError("TrackMCP api_key is required")
        if options.transport not in (None, "stdio", "streamable_http", "sse", "custom"):
            raise ValueError("TrackMCP transport must be stdio, streamable_http, sse, custom, or omitted")
        self.options = options
        self._events: List[TrackMCPEvent] = []
        self._queue_bytes = 0
        self._diagnostics = {"dropped_events": 0, "hook_errors": 0, "privacy_errors": 0}
        self._tool_catalog: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
        self._timer = None
        if not options.disabled:
            self._timer = threading.Timer(options.flush_interval_ms / 1000, self._scheduled_flush)
            self._timer.daemon = True
            self._timer.start()

    def capture(self, event: Dict[str, Any], correlation_handle: Optional[str] = None, correlation_source: Optional[TrackMCPCorrelationHandleSource] = None) -> None:
        if self.options.disabled or random.random() > max(0, min(1, self.options.sample_rate)):
            return
        try:
            intent = self._intent_for(event)
            account_identity = self._account_for(event)
            prepared = self._prepare_event({
                **event,
                "schema_version": TRACKMCP_SCHEMA_VERSION,
                "event_id": str(uuid.uuid4()),
                "service": self.options.service,
                "environment": self.options.environment,
                "server_version": self.options.server_version,
                "sdk_version": self.options.sdk_version,
                "deployment_id": self.options.deployment_id,
                "server_id": self.options.server_id,
                **({"transport": self.options.transport} if self.options.transport else {}),
                "observation_source": "server",
                **self._correlation_for(event, correlation_handle, correlation_source),
                "context": intent.get("context"),
                "intent_source": intent["intent_source"],
                **account_identity,
            })
            if self.options.redact_event:
                try:
                    hooked = self.options.redact_event(prepared)
                    if hooked is None:
                        self._diagnostics["dropped_events"] += 1
                        return
                    # Identity is derived by the SDK resolver, not customer event
                    # hooks. Re-apply the bounded result after the hook.
                    prepared = self._prepare_event({**hooked, **account_identity})
                except Exception:
                    self._diagnostics["hook_errors"] += 1
                    self._diagnostics["dropped_events"] += 1
                    return
            self._enqueue(prepared)
        except Exception:
            self._diagnostics["privacy_errors"] += 1
            self._diagnostics["dropped_events"] += 1
            return
        with self._lock:
            should_flush = len(self._events) >= max(1, int(self.options.max_batch_size))
        if should_flush:
            self.flush()

    def record_transport_failure(
        self,
        kind: Literal["transport_error", "transport_closed"] = "transport_error",
        *,
        session_id: Optional[str] = None,
        session_id_source: str = "transport_generated",
        duration_ms: int = 0,
    ) -> None:
        """Record a transport-level disconnect or crash without capturing details.

        This hook is for failures that happen outside an MCP request boundary
        (for example, a stdio process exiting or an HTTP stream closing). It
        deliberately accepts only a bounded kind and emits metadata-only
        session evidence; exception text, URLs, headers, and payloads never
        enter the event.
        """
        if kind not in ("transport_error", "transport_closed"):
            raise ValueError("transport failure kind must be transport_error or transport_closed")
        self.capture({
            "event_type": "session",
            "mcp_method": "transport",
            "session_id": session_id or "transport-session",
            "session_id_source": session_id_source if session_id_source in ("protocol", "transport_generated", "external") else "transport_generated",
            "started_at": _iso_now(),
            "duration_ms": max(0, min(86_400_000, int(duration_ms))),
            "success": False,
            "is_error": True,
            "error_class": kind,
            "payload": {"_trackmcp": {"observation_kind": kind, "observation_source": "transport"}},
        })

    def record_session_reconnected(
        self,
        *,
        transport: Optional[TrackMCPTransport] = None,
        session_id: Optional[str] = None,
        session_id_source: str = "transport_generated",
        duration_ms: int = 0,
    ) -> None:
        """Record caller-observed reconnect metadata without claiming replay.

        The host invokes this only after it has successfully re-established a
        transport. It records no exception text, URLs, headers, credentials,
        or message payloads; reconnect ownership and delivery remain with the
        host application.
        """
        if transport is not None and transport not in ("stdio", "streamable_http", "sse", "custom"):
            return
        self.capture({
            "event_type": "session",
            "mcp_method": "transport",
            "session_id": session_id or "transport-session",
            "session_id_source": session_id_source if session_id_source in ("protocol", "transport_generated", "external") else "transport_generated",
            "started_at": _iso_now(),
            "duration_ms": max(0, min(86_400_000, int(duration_ms))),
            "success": True,
            "is_error": False,
            "payload": {"_trackmcp": {"observation_kind": "session_reconnected", "observation_source": "transport"}},
            **({"transport": transport} if transport else {}),
        })

    def record_protocol_signal(
        self,
        signal: str,
        method: str,
        *,
        session_id: Optional[str] = None,
        direction: str = "server_to_client",
    ) -> None:
        """Record an allowlisted protocol notification without payload values."""
        allowed = {"progress", "cancelled", "catalog_changed", "resource_changed", "prompt_changed", "subscription_started", "subscription_stopped"}
        if signal not in allowed or direction not in ("server_to_client", "client_to_server") or not isinstance(method, str) or not method or len(method) > 128 or any(ord(char) < 32 or ord(char) == 127 for char in method):
            return
        self.capture({
            "event_type": "protocol",
            "mcp_method": method,
            "direction": direction,
            "session_id": session_id or "transport-session",
            "started_at": _iso_now(),
            "success": True,
            "is_error": False,
            "payload": {"_trackmcp": {"observation_kind": "protocol_notification", "protocol_signal": signal}},
        })

    def _correlation_for(self, event: Dict[str, Any], supplied_handle: Optional[str], supplied_source: Optional[TrackMCPCorrelationHandleSource]) -> Dict[str, Any]:
        if self.options.correlation_mode == "issued" and supplied_source == "issued" and _safe_correlation_handle(supplied_handle):
            return {"correlation_handle": supplied_handle, "correlation_handle_source": "issued"}
        if self.options.correlation_mode == "external" and self.options.correlation_resolver:
            try:
                handle = self.options.correlation_resolver({
                    "event_type": event.get("event_type", "custom"), "mcp_method": event.get("mcp_method"),
                    "tool_name": event.get("tool_name"), "request_id": event.get("request_id"),
                    "session_id": event.get("session_id"), "transport": event.get("transport"),
                })
                if _safe_correlation_handle(handle): return {"correlation_handle": handle, "correlation_handle_source": "external"}
            except Exception:
                pass
        return {"correlation_handle_source": "missing"}

    def _account_for(self, event: Dict[str, Any]) -> Dict[str, Any]:
        resolver = self.options.account_id_resolver
        if not resolver:
            return {"account_identity_source": "unresolved"}
        try:
            value = resolver({
                "event_type": event.get("event_type", "custom"),
                "mcp_method": event.get("mcp_method"),
                "tool_name": event.get("tool_name"),
                "request_id": event.get("request_id"),
                "session_id": event.get("session_id"),
                "transport": event.get("transport"),
            })
            if _safe_account_id(value):
                return {"account_key": hashlib.sha256(value.strip().encode("utf-8")).hexdigest(), "account_identity_source": "resolver"}
        except Exception:
            pass
        return {"account_identity_source": "unresolved"}

    def _intent_for(self, event: Dict[str, Any]) -> Dict[str, Any]:
        context = event.get("context")
        source = event.get("intent_source")
        if _safe_intent_text(context, self.options.max_string_length):
            return {"context": context.strip(), "intent_source": source if source in ("external_callback", "fallback") else "context_parameter"}
        if self.options.intent_fallback:
            try:
                fallback = self.options.intent_fallback({
                    "event_type": event.get("event_type", "custom"), "mcp_method": event.get("mcp_method"),
                    "tool_name": event.get("tool_name"), "request_id": event.get("request_id"),
                    "session_id": event.get("session_id"), "transport": event.get("transport"),
                })
                if _safe_intent_text(fallback, self.options.max_string_length):
                    return {"context": fallback.strip(), "intent_source": "fallback"}
            except Exception:
                pass
        return {"intent_source": "missing"}

    def _prepare_event(self, event: Dict[str, Any]) -> TrackMCPEvent:
        prepared = dict(event)
        prepared["observation_source"] = "server"
        prepared["session_id_source"] = prepared.get("session_id_source") or ("external" if prepared.get("session_id") else "missing")
        if not _safe_correlation_handle(prepared.get("correlation_handle")) or prepared.get("correlation_handle_source") not in ("external", "issued"):
            prepared.pop("correlation_handle", None)
            prepared["correlation_handle_source"] = "missing"
        if _safe_intent_text(prepared.get("context"), self.options.max_string_length):
            prepared["context"] = prepared["context"].strip()
            if prepared.get("intent_source") not in ("external_callback", "fallback"):
                prepared["intent_source"] = "context_parameter"
        else:
            prepared.pop("context", None)
            prepared["intent_source"] = "missing"
        if not _safe_intent_text(prepared.get("missing_capability"), self.options.max_string_length):
            prepared.pop("missing_capability", None)
        mode = self.options.payload_mode if self.options.payload_mode in ("metadata", "redacted", "full") else "redacted"
        prepared["payload_policy"] = mode
        if mode == "metadata":
            prepared.pop("payload", None)
            prepared["payload_size_bytes"] = 0
        elif "payload" in prepared:
            prepared["payload"] = sanitize_payload(
                prepared["payload"],
                mode=mode,
                explicit_paths=self.options.redact,
                redact_keys=self.options.redact_keys,
                max_payload_bytes=self.options.max_payload_bytes,
                max_payload_depth=self.options.max_payload_depth,
                max_payload_keys=self.options.max_payload_keys,
                max_string_length=self.options.max_string_length,
            )
            prepared["payload_size_bytes"] = payload_byte_length(prepared["payload"])
        else:
            prepared["payload_size_bytes"] = 0
        return prepared

    def _enqueue(self, event: TrackMCPEvent) -> None:
        event_bytes = payload_byte_length(event)
        max_queue_bytes = max(1, int(self.options.max_queue_bytes))
        if not event_bytes or event_bytes > max_queue_bytes:
            self._diagnostics["dropped_events"] += 1
            return
        with self._lock:
            self._events.append(event)
            self._queue_bytes += event_bytes
            while len(self._events) > max(1, int(self.options.max_queue_events)) or self._queue_bytes > max_queue_bytes:
                dropped = self._events.pop(0)
                self._queue_bytes = max(0, self._queue_bytes - payload_byte_length(dropped))
                self._diagnostics["dropped_events"] += 1

    def get_diagnostics(self) -> Dict[str, int]:
        with self._lock:
            return {**self._diagnostics, "queued_events": len(self._events), "queued_bytes": self._queue_bytes}

    def track(self, name: str, payload: Optional[Dict[str, Any]] = None) -> None:
        self.capture({"event_type": "custom", "started_at": _iso_now(), "payload": {"name": name, **(payload or {})}})

    def workflow(self, name: str, status: str, payload: Optional[Dict[str, Any]] = None) -> None:
        if status not in ("started", "completed", "failed"):
            raise ValueError("workflow status must be started, completed, or failed")
        self.capture({"event_type": "workflow", "started_at": _iso_now(), "payload": {"name": "workflow", "workflow_name": name, "status": status, **(payload or {})}})

    def report_missing(self, capability: str, context: Optional[str] = None) -> None:
        if not _safe_intent_text(capability, self.options.max_string_length):
            self._diagnostics["dropped_events"] += 1
            return
        self.capture({"event_type": "custom", "mcp_method": "trackmcp_report_missing", "missing_capability": capability.strip(), "context": context, "started_at": _iso_now(), "payload": {"name": "trackmcp_report_missing"}})

    def record_catalog(self, result: Any) -> List[Dict[str, Any]]:
        tools = _catalog_tools(result)
        for tool in tools:
            self._tool_catalog[tool["name"]] = tool
        return tools

    def tool_metadata(self, name: Optional[str]) -> Optional[Dict[str, Any]]:
        return self._tool_catalog.get(name) if name else None

    def flush(self) -> None:
        with self._lock:
            events = self._events[: max(1, int(self.options.max_batch_size))]
            del self._events[: len(events)]
            self._queue_bytes = max(0, self._queue_bytes - sum(payload_byte_length(event) for event in events))
        if not events or self.options.disabled:
            return
        try:
            body = json.dumps({"events": events}).encode("utf-8")
            request = urllib.request.Request(
                self.options.endpoint,
                data=body,
                # Keep the request identifiable as a normal SDK client. Some
                # managed edge/WAF configurations reject urllib's default
                # `Python-urllib/...` user agent before the request reaches
                # the ingestion handler.
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.options.api_key}",
                    "User-Agent": "Mozilla/5.0",
                },
                method="POST",
            )
            with urllib.request.urlopen(request, timeout=3) as response:
                if response.status >= 300:
                    raise RuntimeError(f"TrackMCP ingest returned {response.status}")
        except Exception:
            for event in events:
                self._enqueue(event)

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
        self.lifecycle_started = False
        self.lifecycle_ended = False

    def _emit_session_boundary(self, kind: str, session_id: str, session_id_source: str, success: bool, duration_ms: int = 0) -> None:
        self.client.capture({
            "event_type": "session",
            "mcp_method": "initialize" if kind == "session_started" else "shutdown",
            "session_id": session_id,
            "session_id_source": session_id_source,
            "client_name": self.client_name,
            "client_version": self.client_version,
            "started_at": _iso_now(),
            "duration_ms": max(0, min(86_400_000, int(duration_ms))),
            "success": success,
            "is_error": not success,
            "payload": {"_trackmcp": {"observation_kind": kind, "observation_source": "middleware"}},
        })

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
            if method == "initialize" and not self.lifecycle_started:
                self._emit_session_boundary("session_started", session_id, session_id_source, not is_error, round((time.time() - started) * 1000))
                self.lifecycle_started = True
            if method == "shutdown" and self.lifecycle_started and not self.lifecycle_ended:
                self._emit_session_boundary("session_ended", session_id, session_id_source, not is_error, round((time.time() - started) * 1000))
                self.lifecycle_ended = True
            if method == "tools/call":
                metadata = self.client.tool_metadata(tool_name)
                self.client.capture(_event(tool_name, {"args": arguments}, started, result_data, None, self.client_name, session_id, request_id, self.client_version, metadata, session_id_source))
            elif method in ("tools/list", "resources/list", "resources/templates/list", "prompts/list"):
                catalog_type = method.replace("/list", "")
                self.client.record_catalog(result_data)
                observation = _catalog_observation(catalog_type, result_data)
                payload = {"name": f"{catalog_type}_discovered"}
                self.client.capture({"event_type": "catalog", "mcp_method": method, "request_id": request_id, "session_id": session_id, "session_id_source": session_id_source, "client_name": self.client_name, "client_version": self.client_version, "started_at": _iso_from_epoch(started), "duration_ms": round((time.time() - started) * 1000), "success": not is_error, "is_error": is_error, **observation, "payload": payload})
            elif (entity := interaction_entity_observation(method, params)):
                self.client.capture(_entity_protocol_event(method, entity, request_id=request_id, session_id=session_id, session_id_source=session_id_source, client_name=self.client_name, client_version=self.client_version, started=started, success=not is_error, result=result_data))
            elif (signal := _protocol_signal_for_method(method)):
                self.client.record_protocol_signal(signal, method, session_id=session_id, direction="client_to_server")
            else:
                payload = _protocol_metadata_payload(method, result_data) if method == "completion/complete" else {"params": params, "result": result_data}
                self.client.capture({"event_type": "protocol", "mcp_method": method, "request_id": request_id, "session_id": session_id, "session_id_source": session_id_source, "client_name": self.client_name, "client_version": self.client_version, "started_at": _iso_from_epoch(started), "duration_ms": round((time.time() - started) * 1000), "success": not is_error, "is_error": is_error, **_protocol_result_metadata(result_data), "payload": payload})
            return result
        except Exception as error:
            if method == "shutdown" and self.lifecycle_started and not self.lifecycle_ended:
                self._emit_session_boundary("session_ended", session_id, session_id_source, False, round((time.time() - started) * 1000))
                self.lifecycle_ended = True
            if method == "tools/call":
                self.client.capture(_event(tool_name, {"args": arguments}, started, None, error, self.client_name, session_id, request_id, self.client_version, self.client.tool_metadata(tool_name), session_id_source))
            elif (entity := interaction_entity_observation(method, params)):
                self.client.capture(_entity_protocol_event(method, entity, request_id=request_id, session_id=session_id, session_id_source=session_id_source, client_name=self.client_name, client_version=self.client_version, started=started, success=False, error_class="protocol_error"))
            elif (signal := _protocol_signal_for_method(method)):
                self.client.record_protocol_signal(signal, method, session_id=session_id, direction="client_to_server")
            else:
                self.client.capture({"event_type": "protocol", "mcp_method": method, "request_id": request_id, "session_id": session_id, "session_id_source": session_id_source, "client_name": self.client_name, "client_version": self.client_version, "started_at": _iso_from_epoch(started), "duration_ms": round((time.time() - started) * 1000), "success": False, "is_error": True, "error_class": "protocol_error", "payload": {"params": params, "error": str(error)}})
            raise

def _iso_now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _iso_from_epoch(value: float) -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(value))


def _safe_correlation_handle(value: Any) -> bool:
    import re
    return isinstance(value, str) and re.match(CORRELATION_HANDLE_PATTERN, value) is not None and len(value.encode("utf-8")) <= 128 and not re.search(r"(?:bearer(?:\s|[_:-])|eyJ[A-Za-z0-9_-]+\.|@|https?://|://|^sk[-_])", value, re.IGNORECASE)


def _safe_account_id(value: Any) -> bool:
    import re
    return isinstance(value, str) and re.match(r"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$", value.strip()) is not None and not re.search(r"(?:bearer(?:\s|[_:-])|eyJ[A-Za-z0-9_-]+\.|@|https?://|://|^sk[-_]|^tmcp_)", value, re.IGNORECASE)


def _safe_intent_text(value: Any, max_length: int) -> bool:
    import re
    return isinstance(value, str) and bool(value.strip()) and len(value.strip().encode("utf-8")) <= max_length and not re.search(r"(?:bearer\s+|authorization\s*[:=]|api[_-]?key\s*[:=]|access[_-]?token\s*[:=]|refresh[_-]?token\s*[:=]|password\s*[:=]|secret\s*[:=]|eyJ[A-Za-z0-9_-]+\.|https?://|\b[^\s@]+@[^\s@]+\.[^\s@]+\b)", value, re.IGNORECASE)


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
        self.lifecycle_started = False
        self.lifecycle_ended = False

    def _emit_session_boundary(self, kind: str, success: bool, duration_ms: int = 0) -> None:
        self.trackmcp.capture({
            "event_type": "session",
            "mcp_method": "initialize" if kind == "session_started" else "shutdown",
            "session_id": self.transport_session_id,
            "session_id_source": "transport_generated",
            "client_name": self.client_name,
            "client_version": self.client_version,
            "started_at": _iso_now(),
            "duration_ms": max(0, min(86_400_000, int(duration_ms))),
            "success": success,
            "is_error": not success,
            "payload": {"_trackmcp": {"observation_kind": kind, "observation_source": "wrapper"}},
        })

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
                            if method == "initialize" and not self.lifecycle_started:
                                self._emit_session_boundary("session_started", True, round((time.time() - started) * 1000))
                                self.lifecycle_started = True
                            if method == "shutdown" and self.lifecycle_started and not self.lifecycle_ended:
                                self._emit_session_boundary("session_ended", True, round((time.time() - started) * 1000))
                                self.lifecycle_ended = True
                            if method in ("tools/list", "resources/list", "resources/templates/list", "prompts/list"):
                                catalog_type = method.replace("/list", "")
                                client.record_catalog(value)
                                observation = _catalog_observation(catalog_type, value)
                                payload = {"name": f"{catalog_type}_discovered"}
                                client.capture({"event_type": "catalog", "mcp_method": method, "session_id": self.transport_session_id, "session_id_source": "transport_generated", "client_name": self.client_name, "client_version": self.client_version, "started_at": _iso_from_epoch(started), "duration_ms": round((time.time() - started) * 1000), "success": True, "is_error": False, **observation, "payload": payload})
                            elif (signal := _protocol_signal_for_method(method)):
                                client.record_protocol_signal(signal, method, session_id=self.transport_session_id, direction="client_to_server")
                            elif (entity := interaction_entity_observation(method, params)):
                                client.capture(_entity_protocol_event(method, entity, session_id=self.transport_session_id, session_id_source="transport_generated", client_name=self.client_name, client_version=self.client_version, started=started, result=value))
                            else:
                                client.capture(_event(tool_name, payload, started, value, None, self.client_name, self.transport_session_id, None, self.client_version, client.tool_metadata(tool_name), "transport_generated"))
                            return value
                        except Exception as error:
                            if method == "shutdown" and self.lifecycle_started and not self.lifecycle_ended:
                                self._emit_session_boundary("session_ended", False, round((time.time() - started) * 1000))
                                self.lifecycle_ended = True
                            signal = _protocol_signal_for_method(method)
                            entity = interaction_entity_observation(method, params)
                            if signal:
                                client.record_protocol_signal(signal, method, session_id=self.transport_session_id, direction="client_to_server")
                            elif entity:
                                client.capture(_entity_protocol_event(method, entity, session_id=self.transport_session_id, session_id_source="transport_generated", client_name=self.client_name, client_version=self.client_version, started=started, success=False, error_class="protocol_error"))
                            else:
                                client.capture(_event(tool_name, payload, started, None, error, self.client_name, self.transport_session_id, None, self.client_version, client.tool_metadata(tool_name), "transport_generated"))
                            raise
                    return awaited()
                if method in ("tools/list", "resources/list", "resources/templates/list", "prompts/list"):
                    if method == "initialize" and not self.lifecycle_started:
                        self._emit_session_boundary("session_started", True, round((time.time() - started) * 1000))
                        self.lifecycle_started = True
                    if method == "shutdown" and self.lifecycle_started and not self.lifecycle_ended:
                        self._emit_session_boundary("session_ended", True, round((time.time() - started) * 1000))
                        self.lifecycle_ended = True
                    catalog_type = method.replace("/list", "")
                    client.record_catalog(result)
                    observation = _catalog_observation(catalog_type, result)
                    payload = {"name": f"{catalog_type}_discovered"}
                    client.capture({"event_type": "catalog", "mcp_method": method, "session_id": self.transport_session_id, "session_id_source": "transport_generated", "client_name": self.client_name, "client_version": self.client_version, "started_at": _iso_from_epoch(started), "duration_ms": round((time.time() - started) * 1000), "success": True, "is_error": False, **observation, "payload": payload})
                elif (signal := _protocol_signal_for_method(method)):
                    client.record_protocol_signal(signal, method, session_id=self.transport_session_id, direction="client_to_server")
                elif (entity := interaction_entity_observation(method, params)):
                    client.capture(_entity_protocol_event(method, entity, session_id=self.transport_session_id, session_id_source="transport_generated", client_name=self.client_name, client_version=self.client_version, started=started, result=result))
                else:
                    if method == "initialize" and not self.lifecycle_started:
                        self._emit_session_boundary("session_started", True, round((time.time() - started) * 1000))
                        self.lifecycle_started = True
                    if method == "shutdown" and self.lifecycle_started and not self.lifecycle_ended:
                        self._emit_session_boundary("session_ended", True, round((time.time() - started) * 1000))
                        self.lifecycle_ended = True
                    client.capture(_event(tool_name, payload, started, result, None, self.client_name, self.transport_session_id, None, self.client_version, client.tool_metadata(tool_name), "transport_generated"))
                return result
            except Exception as error:
                if method == "shutdown" and self.lifecycle_started and not self.lifecycle_ended:
                    self._emit_session_boundary("session_ended", False, round((time.time() - started) * 1000))
                    self.lifecycle_ended = True
                signal = _protocol_signal_for_method(method)
                entity = interaction_entity_observation(method, params)
                if signal:
                    client.record_protocol_signal(signal, method, session_id=self.transport_session_id, direction="client_to_server")
                elif entity:
                    client.capture(_entity_protocol_event(method, entity, session_id=self.transport_session_id, session_id_source="transport_generated", client_name=self.client_name, client_version=self.client_version, started=started, success=False, error_class="protocol_error"))
                else:
                    client.capture(_event(tool_name, payload, started, None, error, self.client_name, self.transport_session_id, None, self.client_version, client.tool_metadata(tool_name), "transport_generated"))
                raise
        return wrapped


def _event(tool_name: Optional[str], payload: Dict[str, Any], started: float, result: Any, error: Optional[Exception], client_name: Optional[str] = None, session_id: Optional[str] = None, request_id: Optional[str] = None, client_version: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None, session_id_source: Optional[str] = None, context: Optional[str] = None) -> Dict[str, Any]:
    is_error = error is not None or bool(isinstance(result, dict) and result.get("isError"))
    event_payload = dict(payload)
    args = event_payload.get("args")
    if context is None and isinstance(args, dict) and "context" in args:
        context = args.get("context")
        event_payload["args"] = {key: value for key, value in args.items() if key != "context"}
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
        "context": context,
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(started)),
        "duration_ms": round((time.time() - started) * 1000),
        "success": not is_error,
        "is_error": is_error,
        **_protocol_result_metadata(result),
        "payload": {**event_payload, "result": result, "error": str(error) if error else None},
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


def trackmcp_report_missing(capability: str, context: Optional[str] = None) -> None:
    if _active_client:
        _active_client.report_missing(capability, context)
