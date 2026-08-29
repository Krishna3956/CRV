import { NextResponse } from "next/server";

/* Fetch a repo's README as raw markdown, server-side (keeps any GitHub token
   private and avoids browser CORS/rate-limit issues). Usage: /api/repository/readme?repo=owner/name */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get("repo");
  if (!repo || !/^[\w-]+\/[\w.-]+$/.test(repo)) {
    return NextResponse.json({ error: "Invalid repo." }, { status: 400 });
  }

  const headers: HeadersInit = { Accept: "application/vnd.github.v3.raw" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;

  const res = await fetch(`https://api.github.com/repos/${repo}/readme`, {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "README not found." }, { status: res.status });
  }

  const markdown = await res.text();
  return NextResponse.json({ markdown });
}
