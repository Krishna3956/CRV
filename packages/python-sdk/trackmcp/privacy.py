from __future__ import annotations

import base64
import binascii
import json
import re
from typing import Any, Dict, Iterable, Optional, Set
from urllib.parse import parse_qsl, urlparse


DEFAULT_MAX_PAYLOAD_BYTES = 32 * 1024
DEFAULT_MAX_PAYLOAD_DEPTH = 6
DEFAULT_MAX_PAYLOAD_KEYS = 50
DEFAULT_MAX_STRING_LENGTH = 2048
DEFAULT_MAX_QUEUE_EVENTS = 500
DEFAULT_MAX_QUEUE_BYTES = 2 * 1024 * 1024
DEFAULT_MAX_BATCH_SIZE = 20

REDACTION_MARKER = "[redacted]"
TRUNCATION_MARKER_KEY = "__trackmcp_truncated"
BASE64_SCRUB_THRESHOLD = 128

_DEFAULT_SENSITIVE_KEYS = {
    "password", "passwd", "secret", "token", "api_key", "apikey", "authorization",
    "cookie", "set_cookie", "access_token", "refresh_token", "private_key", "client_secret",
    "ssn", "credit_card", "card_number",
}
_BASE64_RE = re.compile(r"^[A-Za-z0-9+/_-]+={0,2}$")
_BEARER_RE = re.compile(r"\bbearer\s+[A-Za-z0-9._~+/-]+=*", re.IGNORECASE)
_CREDENTIAL_TEXT_RE = re.compile(r"(?:authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\s*[:=]\s*\S+", re.IGNORECASE)


def normalize_key(key: str) -> str:
    key = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", key)
    return re.sub(r"[\s-]+", "_", key).lower()


def _marker(reason: str, original_type: str, **extra: Any) -> Dict[str, Any]:
    return {TRUNCATION_MARKER_KEY: True, "reason": reason, "original_type": original_type, **extra}


def _original_type(value: Any) -> str:
    if isinstance(value, list):
        return "array"
    if value is None:
        return "null"
    if isinstance(value, (bytes, bytearray, memoryview)):
        return "binary"
    if isinstance(value, dict):
        return "object"
    if isinstance(value, str):
        return "string"
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, (int, float)):
        return "number"
    return type(value).__name__


def _canonical_json(value: Any) -> Optional[str]:
    try:
        return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
    except (TypeError, ValueError, OverflowError):
        return None


def payload_byte_length(value: Any) -> int:
    serialized = _canonical_json(value)
    return len(serialized.encode("utf-8")) if serialized is not None else 0


def _resource_marker(value: str) -> Optional[Dict[str, Any]]:
    match = re.match(r"^data:([^;,]+)?(?:;base64)?,", value, re.IGNORECASE)
    if match:
        return _marker(
            "binary",
            "string",
            media_type=match.group(1) or "application/octet-stream",
            original_bytes=max(0, int((len(value) - match.end()) * 0.75)),
        )
    if _CREDENTIAL_TEXT_RE.search(value):
        return _marker("credential", "string")
    if _BEARER_RE.search(value):
        return _marker("resource_uri", "string")
    try:
        parsed = urlparse(value)
        query_keys = {normalize_key(key) for key, _ in parse_qsl(parsed.query, keep_blank_values=True)}
        if parsed.username or parsed.password or query_keys & _DEFAULT_SENSITIVE_KEYS:
            return _marker("resource_uri", "string")
    except ValueError:
        pass
    if len(value) >= BASE64_SCRUB_THRESHOLD and _BASE64_RE.fullmatch(value):
        try:
            base64.b64decode(value + "=" * (-len(value) % 4), validate=True)
            return _marker("binary", "string", original_bytes=int(len(value) * 0.75))
        except (ValueError, binascii.Error):
            pass
    return None


def _sanitize_value(
    value: Any,
    depth: int,
    path: str,
    max_depth: int,
    max_keys: int,
    max_string_length: int,
    explicit_paths: Set[str],
    redact_keys: Set[str],
    seen: Set[int],
) -> Any:
    if path and path in explicit_paths:
        return REDACTION_MARKER
    if isinstance(value, str):
        resource = _resource_marker(value)
        if resource is not None:
            return resource
        return _marker("max_string_length", "string") if len(value) > max_string_length else value
    if value is None or isinstance(value, (int, float, bool)):
        return value
    if isinstance(value, (bytes, bytearray, memoryview)):
        return _marker("binary", "binary", original_bytes=len(value))
    if not isinstance(value, (dict, list)):
        return _marker("binary", type(value).__name__)
    identity = id(value)
    if identity in seen:
        return _marker("circular", _original_type(value))
    if depth >= max_depth:
        return _marker("max_payload_depth", _original_type(value))

    seen.add(identity)
    try:
        if isinstance(value, list):
            result = [
                _sanitize_value(item, depth + 1, f"{path}.{index}" if path else str(index), max_depth, max_keys, max_string_length, explicit_paths, redact_keys, seen)
                for index, item in enumerate(value[:max_keys])
            ]
            if len(value) > max_keys:
                result.append(_marker("max_payload_keys", "array"))
            return result
        result: Dict[str, Any] = {}
        keys = list(value.keys())
        for key in keys[:max_keys]:
            if not isinstance(key, str):
                continue
            child_path = f"{path}.{key}" if path else key
            if normalize_key(key) in _DEFAULT_SENSITIVE_KEYS or normalize_key(key) in redact_keys:
                result[key] = REDACTION_MARKER
            else:
                try:
                    result[key] = _sanitize_value(value[key], depth + 1, child_path, max_depth, max_keys, max_string_length, explicit_paths, redact_keys, seen)
                except Exception:
                    result[key] = _marker("binary", "unknown")
        if len(keys) > max_keys:
            result[TRUNCATION_MARKER_KEY] = _marker("max_payload_keys", "object")
        return result
    finally:
        seen.discard(identity)


def sanitize_payload(value: Any, *, mode: str, explicit_paths: Iterable[str] = (), redact_keys: Iterable[str] = (), max_payload_bytes: int = DEFAULT_MAX_PAYLOAD_BYTES, max_payload_depth: int = DEFAULT_MAX_PAYLOAD_DEPTH, max_payload_keys: int = DEFAULT_MAX_PAYLOAD_KEYS, max_string_length: int = DEFAULT_MAX_STRING_LENGTH) -> Any:
    if mode == "metadata" or value is None:
        return None if mode == "metadata" else value
    sanitized = _sanitize_value(
        value,
        0,
        "",
        max(0, int(max_payload_depth)),
        max(1, int(max_payload_keys)),
        max(1, int(max_string_length)),
        {".".join(part for part in path.split(".") if part) for path in explicit_paths if path},
        {normalize_key(key) for key in redact_keys},
        set(),
    )
    if payload_byte_length(sanitized) <= max(1, int(max_payload_bytes)):
        return sanitized
    budget_marker = _marker("max_payload_bytes", _original_type(value))
    return budget_marker if payload_byte_length(budget_marker) <= max(1, int(max_payload_bytes)) else {}
