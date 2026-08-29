/* Web3Forms email notifications. Sends a submission to Web3Forms, which emails
   it to the account owner. The access key is a public key (safe on the client);
   it can be overridden with NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY. Works on both the
   server and the client. Never throws — returns { ok } so callers can decide. */

const ACCESS_KEY =
  process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY ||
  "8557f33c-5644-4be1-a0c8-a9180092cf3a";

export async function sendWeb3Form(
  fields: Record<string, unknown> & { subject: string }
): Promise<{ ok: boolean }> {
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: ACCESS_KEY, ...fields }),
    });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean };
    return { ok: res.ok && data.success !== false };
  } catch {
    return { ok: false };
  }
}
