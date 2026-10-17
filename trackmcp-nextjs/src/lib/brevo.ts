type BrevoRepositorySubmission = {
  email: string;
  githubUrl: string;
  mcpName: string;
  trackmcpUrl: string;
};

type BrevoSyncResult = {
  configured: boolean;
  ok: boolean;
};

/*
 * Relays an accepted repository submission to the Brevo-hosted form. The form
 * URL is deliberately server-only: the customer-facing submission UI remains
 * the TrackMCP form and all existing Supabase/Web3Forms behavior is preserved.
 *
 * Configure BREVO_SUBMIT_FORM_URL with the `action` URL from the Brevo form
 * embed. Brevo must have the GITHUB_REPO_URL, MCP_NAME, and TRACKMCP_URL
 * contact attributes and the desired post-submission automation configured.
 */
export async function syncBrevoRepositorySubmission({
  email,
  githubUrl,
  mcpName,
  trackmcpUrl,
}: BrevoRepositorySubmission): Promise<BrevoSyncResult> {
  const endpoint = process.env.BREVO_SUBMIT_FORM_URL;
  if (!endpoint) return { configured: false, ok: false };

  try {
    const form = new URLSearchParams({
      EMAIL: email,
      GITHUB_REPO_URL: githubUrl,
      MCP_NAME: mcpName,
      TRACKMCP_URL: trackmcpUrl,
      email_address_check: "",
      locale: "en",
      html_type: "simple",
    });
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      console.error("Brevo repository submission sync failed", { status: response.status });
    }
    return { configured: true, ok: response.ok };
  } catch (error) {
    console.error("Brevo repository submission sync failed", { error });
    return { configured: true, ok: false };
  }
}
