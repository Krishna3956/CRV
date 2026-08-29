import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/repository/supabase";

/* Validate a GitHub repo URL, fetch its metadata (server-side, optional token),
   and insert it into the mcp_tools table with status "pending". */

const BANNED = [
  "https://github.com/punkpeye/awesome-mcp-servers",
  "https://github.com/habitoai/awesome-mcp-servers",
];

const URL_RE = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let url = "";
  let email = "";
  let wantsFeatured = false;
  try {
    const body = await req.json();
    url = (body.url || "").trim();
    email = (body.email || "").trim();
    wantsFeatured = !!body.wantsFeatured;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!URL_RE.test(url)) {
    return NextResponse.json({ error: "Please enter a valid GitHub repository URL." }, { status: 400 });
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  const normalized = url.replace(/\/$/, "").toLowerCase();
  if (BANNED.some((b) => b.toLowerCase() === normalized)) {
    return NextResponse.json({ error: "This repository cannot be submitted." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "The submission service is not configured yet." }, { status: 503 });
  }

  const parts = url.replace(/\/$/, "").split("/");
  const owner = parts[parts.length - 2];
  const repo = parts[parts.length - 1];

  const headers: HeadersInit = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;

  let ghRes: Response;
  try {
    ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  } catch (error) {
    console.error("GitHub repository lookup failed", { owner, repo, error });
    return NextResponse.json({ error: "Could not reach GitHub. Please try again." }, { status: 502 });
  }
  if (!ghRes.ok) {
    console.error("GitHub repository lookup returned an error", { owner, repo, status: ghRes.status });
    return NextResponse.json(
      { error: ghRes.status === 404 ? "Repository not found on GitHub." : "GitHub could not verify this repository." },
      { status: ghRes.status === 404 ? 404 : 502 },
    );
  }
  const repoData = await ghRes.json();

  let error: { code?: string; message?: string; details?: string } | null = null;
  try {
    ({ error } = await supabase.from("mcp_tools").insert({
      github_url: url,
      repo_name: repoData.name,
      description: repoData.description,
      stars: repoData.stargazers_count,
      language: repoData.language,
      topics: repoData.topics,
      last_updated: repoData.updated_at,
      status: "pending",
      submitter_email: email || null,
      wants_featured: wantsFeatured,
    }));
  } catch (insertError) {
    console.error("MCP submission insert failed", { url, error: insertError });
    return NextResponse.json({ error: "Could not save the submission." }, { status: 500 });
  }

  if (error) {
    console.error("MCP submission insert returned an error", { url, ...error });
    if (error.code === "23505") {
      return NextResponse.json({ error: "This tool has already been submitted." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not save the submission." }, { status: 500 });
  }

  // Email notification is sent client-side (Web3Forms free plan is client-only).
  revalidatePath("/new");
  revalidatePath("/repository");
  return NextResponse.json({ ok: true, repo_name: repoData.name, stars: repoData.stargazers_count });
}
