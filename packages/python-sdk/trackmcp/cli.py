"""Explicit terminal setup for the TrackMCP Python SDK.

Package installation stays side-effect free. Authentication is started only
when the user explicitly runs ``trackmcp init`` (or ``python -m trackmcp init``).
"""

from __future__ import annotations

import argparse
import json
import os
import secrets
import sys
import time
import urllib.error
import urllib.request
import webbrowser
from importlib.metadata import PackageNotFoundError, version as package_version
from pathlib import Path
from typing import Any, Dict, Optional

DEFAULT_API_BASE = "https://app.trackmcp.com"
KEY_PREFIX = "TRACKMCP_KEY="
try:
    CLIENT_VERSION = package_version("trackmcp")
except PackageNotFoundError:
    # Source checkouts can run the CLI before a wheel is installed. Keep the
    # request metadata truthful without making activation depend on packaging.
    CLIENT_VERSION = "source-checkout"


def _request(base: str, path: str, payload: Optional[Dict[str, Any]] = None, authorization: Optional[str] = None) -> Dict[str, Any]:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{base.rstrip('/')}{path}",
        data=body,
        method="POST" if body is not None else "GET",
        headers={"Accept": "application/json", **({"Content-Type": "application/json"} if body is not None else {}), **({"Authorization": f"Bearer {authorization}"} if authorization else {})},
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            raw = response.read(65536)
            return json.loads(raw.decode("utf-8")) if raw else {}
    except urllib.error.HTTPError as error:
        try:
            body = json.loads(error.read(65536).decode("utf-8"))
        except (OSError, ValueError):
            body = {}
        body.setdefault("status_code", error.code)
        return body
    except urllib.error.URLError:
        return {"status_code": 0, "network_error": True}


def _read_key(path: Path) -> Optional[str]:
    if not path.exists():
        return os.environ.get("TRACKMCP_KEY") or None
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith(KEY_PREFIX) and line[len(KEY_PREFIX):].strip():
            return line[len(KEY_PREFIX):].strip().strip('"\'')
    return os.environ.get("TRACKMCP_KEY") or None


def _write_key(path: Path, key: str) -> None:
    existing = path.read_text(encoding="utf-8") if path.exists() else ""
    line = f"{KEY_PREFIX}{key}"
    lines = existing.splitlines()
    replaced = False
    output = []
    for item in lines:
        if item.startswith(KEY_PREFIX):
            if not replaced:
                output.append(line)
                replaced = True
        else:
            output.append(item)
    if not replaced:
        output.append(line)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(output).rstrip() + "\n", encoding="utf-8")
    try:
        path.chmod(0o600)
    except OSError:
        pass


def _key_is_reusable(base: str, key: str) -> Optional[bool]:
    if not key.startswith("tmcp_") or len(key) < 20:
        return False
    try:
        result = _request(base, "/api/v1/cli/key-status", authorization=key)
    except (OSError, ValueError):
        return None
    status_code = int(result.get("status_code", 200))
    if status_code == 200:
        return result.get("workspace_available", True) is not False and result.get("service_available", True) is not False
    if result.get("status") in {"invalid", "revoked"} or status_code in {401, 403}:
        return False
    return None


def _init(args: argparse.Namespace) -> int:
    env_path = Path(args.env_file).expanduser().resolve()
    existing_key = _read_key(env_path)
    base = os.environ.get("TRACKMCP_API_URL", DEFAULT_API_BASE)
    reusable = _key_is_reusable(base, existing_key) if existing_key else False
    if reusable is True:
        print(f"TrackMCP is already connected ({env_path}). No browser authorization was needed.")
        return 0
    if reusable is None:
        print("Could not validate the existing TrackMCP key. No key was changed; check your network and try again.", file=sys.stderr)
        return 1

    session = _request(base, "/api/v1/cli/device/sessions", {
        "client_version": CLIENT_VERSION,
        "platform": f"python-{sys.version_info.major}.{sys.version_info.minor}",
        "package_manager": "pip",
        "sdk_package": "trackmcp",
    })
    if not session.get("device_code") or not session.get("user_code") or not session.get("verification_uri"):
        print("Could not start TrackMCP authorization. Check your network and try again.", file=sys.stderr)
        return 1

    print(f"\nOpen this URL to authorize TrackMCP:\n{session['verification_uri']}\n")
    print(f"Your verification code: {session['user_code']}\n")
    if not args.no_browser:
        webbrowser.open(session["verification_uri"])
    print("Waiting for browser approval (press Ctrl-C to cancel)…")

    deadline = time.time() + min(600, max(60, int(session.get("expires_in", 600))))
    interval = max(1, min(30, int(session.get("interval", 5))))
    while time.time() < deadline:
        time.sleep(interval)
        result = _request(base, "/api/v1/cli/device/sessions/poll", {"device_code": session["device_code"]})
        status = result.get("status")
        if status in {"authorization_pending", "slow_down"}:
            interval = max(interval, int(result.get("interval", 5)))
            continue
        if status != "approved":
            print(f"TrackMCP authorization was not completed ({status or 'unavailable'}).", file=sys.stderr)
            return 1
        break
    else:
        print("TrackMCP authorization timed out. Run trackmcp init to try again.", file=sys.stderr)
        return 1

    redeemed = _request(base, "/api/v1/cli/device/sessions/redeem", {
        "device_code": session["device_code"],
        "redemption_id": secrets.token_hex(16),
    })
    key = redeemed.get("api_key")
    if not isinstance(key, str) or not key.startswith("tmcp_"):
        print("TrackMCP could not finish the connection. Run trackmcp init again to retry.", file=sys.stderr)
        return 1
    _write_key(env_path, key)
    print(f"Saved TRACKMCP_KEY to {env_path} with restrictive permissions.")
    print("\nTrackMCP is connected. Next steps:")
    print("1. Add the with_trackmcp wrapper to your Python MCP server.")
    print("2. Restart the server so it loads TRACKMCP_KEY.")
    print("3. Make one real tool call, then open https://app.trackmcp.com/dashboard.")
    return 0


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(prog="trackmcp", description="Set up TrackMCP for a Python MCP server")
    subparsers = parser.add_subparsers(dest="command")
    init = subparsers.add_parser("init", help="authorize a workspace and save TRACKMCP_KEY")
    init.add_argument("--no-browser", action="store_true", help="print the approval URL without opening a browser")
    init.add_argument("--env-file", default=".env", help="environment file to update (default: .env)")
    subparsers.add_parser("doctor", help="show local Python setup status")
    args = parser.parse_args(argv)
    if args.command == "init":
        try:
            return _init(args)
        except KeyboardInterrupt:
            print("\nTrackMCP authorization cancelled. No credential was written.", file=sys.stderr)
            return 1
    if args.command == "doctor":
        print(f"Python: {sys.version.split()[0]}")
        print(f"TRACKMCP_KEY: {'present' if os.environ.get('TRACKMCP_KEY') else 'missing'}")
        return 0
    parser.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
