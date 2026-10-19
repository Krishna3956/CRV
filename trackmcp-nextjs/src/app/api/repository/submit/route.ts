import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { syncBrevoRepositorySubmission } from "@/lib/brevo";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import { formatMcpName, toolSlug } from "@/lib/repository/types";
import { SITE_URL } from "@/lib/seo";
import { normalizeSubmissionAttribution } from "@/lib/submission-attribution";

/* Validate a GitHub repo URL, fetch its metadata (server-side, optional token),
   and insert it into the mcp_tools table with status "pending". */

const BANNED = [
  "https://github.com/punkpeye/awesome-mcp-servers",
  "https://github.com/habitoai/awesome-mcp-servers",
];

const URL_RE = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SUBMISSION_BODY_BYTES = 8192;

export async function POST(req: Request) {
  let url = "";
  let email = "";
  let wantsFeatured = false;
  let submissionAttribution: unknown = null;
  let requestedSubmissionEventId = "";
  try {
    const raw = await req.arrayBuffer();
    if (raw.byteLength > MAX_SUBMISSION_BODY_BYTES) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    const body: unknown = JSON.parse(new TextDecoder().decode(raw));
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const input = body as Record<string, unknown>;
    url = (typeof input.url === "string" ? input.url : "").trim();
    email = (typeof input.email === "string" ? input.email : "").trim();
    wantsFeatured = input.wantsFeatured === true;
    submissionAttribution = input.submission_attribution;
    requestedSubmissionEventId = typeof input.submission_event_id === "string" ? input.submission_event_id : "";
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
  const trackmcpUrl = `${SITE_URL}/tool/${encodeURIComponent(toolSlug(url, repoData.name))}`;
  const submittedAt = new Date().toISOString();
  const attribution = normalizeSubmissionAttribution(submissionAttribution as Record<string, unknown> | null, submittedAt, requestedSubmissionEventId);

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
      submission_attribution: attribution,
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

  // Existing Web3Forms notification is sent client-side (Web3Forms free plan is client-only).
  // Brevo is a best-effort CRM sync: an outage must never undo a saved listing.
  if (email) {
    await syncBrevoRepositorySubmission({
      email,
      githubUrl: url,
      mcpName: formatMcpName(repoData.name),
      trackmcpUrl,
    });
  }

  revalidatePath("/new", "page");
  revalidatePath("/repository", "page");
  // Keep the machine-readable directory index in sync with accepted
  // submissions instead of waiting for its hourly ISR window to expire.
  revalidatePath("/tool-sitemap.xml");
  revalidatePath("/tool-sitemap/[shard].xml", "page");
  return NextResponse.json({ ok: true, repo_name: repoData.name, stars: repoData.stargazers_count, submission_event_id: attribution.submission_event_id, submitted_at: submittedAt });
}
