import { NextResponse } from "next/server.js";

/**
 * Public, credential-free runtime identity for deployment verification.
 * A commit SHA is non-secret release metadata; no configuration or customer
 * data is returned here. Unknown is explicit so an image built outside the
 * release workflow cannot be mistaken for a verified candidate.
 */
export function GET() {
  const releaseSha = process.env.TRACKMCP_RELEASE_SHA;
  return NextResponse.json(
    {
      status: "ok",
      release_sha: typeof releaseSha === "string" && /^[0-9a-f]{40}$/.test(releaseSha) ? releaseSha : "unknown",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
