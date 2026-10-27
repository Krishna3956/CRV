import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import test from "node:test";
import { parseProxyArgs, runProxy } from "../lib/proxy.mjs";

const key = "tmcp_proxy_test_key_12345678901234567890";

test("proxy requires an explicit command separator and HTTPS endpoint", () => {
  assert.throws(() => parseProxyArgs(["--service=test"]), /Usage: trackmcp proxy/);
  assert.throws(() => parseProxyArgs(["--endpoint=http://localhost", "--", "server"]), /HTTPS/);
  assert.deepEqual(parseProxyArgs(["--service=demo", "--", "mcp-server", "--stdio"]), {
    endpoint: "https://trackmcp.com/api/v1/ingest",
    service: "demo",
    environment: "production",
    command: "mcp-server",
    args: ["--stdio"],
  });
});

test("proxy forwards JSONL unchanged and emits bounded metadata without secrets", async () => {
  const input = new PassThrough();
  const output = new PassThrough();
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  const spawnCalls = [];
  let request;
  const forwardedToChild = [];
  const forwardedToParent = [];
  const fetchImpl = async (url, init) => { request = { url, init, body: JSON.parse(init.body) }; return new Response("{}", { status: 202 }); };
  child.stdin.on("data", (chunk) => forwardedToChild.push(Buffer.from(chunk)));
  output.on("data", (chunk) => forwardedToParent.push(Buffer.from(chunk)));
  await runProxy({ command: "mcp-server", args: ["--stdio"], key, endpoint: "https://collector.example.test/ingest", service: "demo", environment: "test", input, output, spawnImpl: (command, args, options) => { spawnCalls.push({ command, args, options }); return child; }, fetchImpl, now: () => "2026-10-27T00:00:00.000Z" });
  input.write('{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"private_tool","secret":"omit"}}\r\n');
  child.stdout.write('{"jsonrpc":"2.0","id":1,"result":{"private":"omit"}}\r\n');
  child.emit("close", 0, null);
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(spawnCalls[0].options, { stdio: ["pipe", "pipe", "inherit"], shell: false });
  assert.equal(spawnCalls[0].command, "mcp-server");
  assert.equal(request.url, "https://collector.example.test/ingest");
  assert.equal(request.init.headers.authorization, `Bearer ${key}`);
  assert.equal(request.body.events.length, 2);
  assert.equal(request.body.events[0].mcp_method, "tools/call");
  assert.equal(request.body.events[0].direction, "client_to_server");
  assert.equal(request.body.events[1].direction, "server_to_client");
  assert.equal(Buffer.concat(forwardedToChild).toString(), '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"private_tool","secret":"omit"}}\r\n');
  assert.equal(Buffer.concat(forwardedToParent).toString(), '{"jsonrpc":"2.0","id":1,"result":{"private":"omit"}}\r\n');
  assert.equal(JSON.stringify(request.body).includes("private_tool"), false);
  assert.equal(JSON.stringify(request.body).includes("omit"), false);
});

test("proxy is fail-closed for missing keys and fail-open for telemetry delivery", async () => {
  await assert.rejects(() => runProxy({ command: "server", key: "" }), /TRACKMCP_KEY/);
  const input = new PassThrough();
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  await runProxy({ command: "server", key, input, output: new PassThrough(), spawnImpl: () => child, fetchImpl: async () => { throw new Error("offline"); } });
  input.write('{"jsonrpc":"2.0","id":1,"method":"initialize"}\n');
  child.emit("close", 0, null);
  await new Promise((resolve) => setTimeout(resolve, 10));
});
