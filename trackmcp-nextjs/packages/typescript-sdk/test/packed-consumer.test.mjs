import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`);
  return result;
}

test("a clean consumer receives the packed 0.1.1 SDK with local default redaction", async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "trackmcp-sdk-consumer-"));
  const packDirectory = join(temporaryRoot, "pack");
  const consumerDirectory = join(temporaryRoot, "consumer");
  await Promise.all([mkdir(packDirectory), mkdir(consumerDirectory)]);

  try {
    const packResult = run(npm, ["pack", "--json", "--ignore-scripts", "--pack-destination", packDirectory], packageRoot);
    const packEntries = JSON.parse(packResult.stdout);
    const tarball = join(packDirectory, packEntries[0].filename);
    const packageJson = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
    assert.equal(packageJson.name, "@trackmcp/sdk");
    assert.equal(packageJson.version, "0.1.1");

    await writeFile(join(consumerDirectory, "package.json"), JSON.stringify({
      name: "trackmcp-sdk-consumer-fixture",
      private: true,
      type: "module",
      dependencies: { "@trackmcp/sdk": `file:${tarball}` },
    }, null, 2));

    await writeFile(join(consumerDirectory, "consumer.mjs"), `
      import assert from "node:assert/strict";
      import http from "node:http";
      import { withTrackMCP } from "@trackmcp/sdk";

      const markers = {
        password: "CONSUMER_PASSWORD_8c5e",
        bearer: "Bearer eyJhbGciOiJIUzI1NiJ9.consumer-secret.signature",
        email: "private.person@example.invalid",
        argument: "private-tool-argument@example.invalid",
        result: "private-tool-result@example.invalid",
        oversized: "oversized-payload-secret-31b7",
      };
      let receivedBody = "";
      const ingest = http.createServer((request, response) => {
        request.setEncoding("utf8");
        request.on("data", (chunk) => { receivedBody += chunk; });
        request.on("end", () => { response.writeHead(200); response.end(); });
      });
      await new Promise((resolve) => ingest.listen(0, "127.0.0.1", resolve));

      const wrapped = withTrackMCP({
        async request() {
          return {
            isError: false,
            content: [{ type: "text", text: markers.result }],
            resultDetails: markers.result,
          };
        },
      }, {
        apiKey: "consumer-test-key",
        endpoint: \`http://127.0.0.1:\${ingest.address().port}\`,
        flushIntervalMs: 60000,
      });

      await wrapped.request({
        method: "tools/call",
        params: {
          name: "private_lookup",
          arguments: {
            password: markers.password,
            authorization: markers.bearer,
            email: markers.email,
            query: markers.argument,
            oversized: markers.oversized + "x".repeat(100000),
          },
        },
      });
      await wrapped.trackmcp.flush();
      await new Promise((resolve) => setTimeout(resolve, 20));
      ingest.close();

      assert.notEqual(receivedBody, "");
      const body = JSON.parse(receivedBody);
      const serialized = JSON.stringify(body);
      for (const marker of Object.values(markers)) assert.equal(serialized.includes(marker), false, \`leaked marker: \${marker}\`);
      assert.equal(body.events[0].payload_policy, "redacted");
      assert.ok(body.events[0].payload_size_bytes <= 32 * 1024);
    `);

    run(npm, ["install", "--ignore-scripts", "--no-audit", "--no-fund"], consumerDirectory);
    run(process.execPath, ["consumer.mjs"], consumerDirectory);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
