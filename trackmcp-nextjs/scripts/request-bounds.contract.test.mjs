import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  submission: new URL("../src/app/api/repository/submit/route.ts", import.meta.url),
  checkEmail: new URL("../src/app/api/auth/check-email/route.ts", import.meta.url),
  deviceStart: new URL("../src/app/api/v1/cli/device/sessions/handlers.ts", import.meta.url),
};

test("public write routes bound JSON input before external or database work", async () => {
  const [submission, checkEmail, deviceStart] = await Promise.all(Object.values(files).map((url) => readFile(url, "utf8")));
  assert.match(submission, /MAX_SUBMISSION_BODY_BYTES = 8192/);
  assert.match(submission, /Request body is too large/);
  assert.match(checkEmail, /raw\.byteLength > 1024/);
  assert.match(checkEmail, /A valid email is required/);
  assert.match(deviceStart, /readBoundedJsonObject\(request\)/);
});
