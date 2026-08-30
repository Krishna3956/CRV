"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/auth/supabase-browser";
import { ArrowRight, Loader2, Check } from "lucide-react";
import { TrackMCPLogo } from "@/components/TrackMCPLogo";
import { TrackMCPMark } from "@/components/TrackMCPMark";
import { sendWeb3Form } from "@/lib/web3forms";

export default function SignInPage({ initialMode = "signin" }: { initialMode?: "signin" | "signup" }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">(() => {
    if (typeof window === "undefined") return "signin";
    return new URLSearchParams(window.location.search).get("mode") === "signup" ? "signup" : initialMode;
  });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const companyName = "";
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState(() => {
    if (typeof window === "undefined") return "";
    const authError = new URLSearchParams(window.location.search).get("auth_error");
    if (!authError) return "";
    return authError === "missing_link_code"
      ? "This sign-in link is incomplete. Request a new link."
      : `This sign-in link could not be used: ${authError}. Request a new link and open the newest email.`;
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    if (mode === "signup" && !acceptedTerms) {
      setError("Please accept the Terms of Service and Privacy Policy to create an account.");
      return;
    }
    setStatus("loading");
    setError("");
    const redirectOrigin = "https://app.trackmcp.com";
    const { error: authError } = await getSupabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${redirectOrigin}/auth/callback`, data: mode === "signup" ? { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}`.trim(), company_name: companyName, terms_accepted: true } : undefined },
    });
    if (authError) {
      setError(authError.message);
      setStatus("error");
    } else {
      void sendWeb3Form({ subject: `TrackMCP ${mode} request`, from_name: "TrackMCP · Auth", name: `${firstName} ${lastName}`.trim(), email, company: companyName, intent: mode });
      setStatus("sent");
    }
  };

  const field =
    "w-full rounded-lg border border-line-strong bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* form side */}
      <div className="flex flex-col px-6 py-8">
        <TrackMCPLogo mark href="https://trackmcp.com" />
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[380px] py-10">
            <h1 className="text-[28px] font-medium tracking-[-0.02em] text-ink">{mode === "signup" ? "Create your TrackMCP account" : "Sign in to TrackMCP"}</h1>
            <p className="mt-2 text-[14.5px] text-muted">
              {mode === "signup" ? "Start observing your MCP server in minutes." : "Welcome back. Continue to your MCP analytics."}
            </p>

            <form onSubmit={submit} className="mt-7 flex flex-col gap-3">
              {mode === "signup" && <>
                <div className="grid gap-3 sm:grid-cols-2"><div><label className="mb-1.5 block text-[13px] font-medium text-body">First name</label><input required value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Alex" className={field} /></div><div><label className="mb-1.5 block text-[13px] font-medium text-body">Last name</label><input required value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Morgan" className={field} /></div></div>
              </>}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-body">Work email</label>
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className={field} />
              </div>
              <p className="text-[13px] leading-relaxed text-muted">We&apos;ll email you a secure sign-in link. No password to remember.</p>
              {mode === "signup" && <label className="flex items-start gap-2 text-[12.5px] leading-relaxed text-muted"><input required type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5 h-4 w-4 accent-brand" /> <span>I agree to the <Link href="/terms" className="font-medium text-brand-strong hover:underline">Terms of Service</Link> and <Link href="/privacy" className="font-medium text-brand-strong hover:underline">Privacy Policy</Link>.</span></label>}
              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-black disabled:opacity-70"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Signing in
                  </>
                ) : (
                  <>
                    {mode === "signup" ? "Create account" : "Send sign-in link"} <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {status === "sent" && (
              <p className="mt-4 flex items-start gap-2 rounded-lg border border-brand/30 bg-brand-soft/40 px-3.5 py-2.5 text-[13px] leading-snug text-brand-strong">
                <Check size={15} className="mt-0.5 shrink-0" />
                Check your email for a secure sign-in link. We&apos;ll finish setting up your account when you arrive.
              </p>
            )}
            {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">{error}</p>}

            <p className="mt-6 text-center text-[13.5px] text-muted">
              {mode === "signin" ? <>New to TrackMCP? <button type="button" onClick={() => { setMode("signup"); setStatus("idle"); router.replace("/signup"); }} className="font-medium text-brand-strong">Create an account</button></> : <>Already have an account? <button type="button" onClick={() => { setMode("signin"); setStatus("idle"); router.replace("/signin"); }} className="font-medium text-brand-strong">Sign in</button></>}
            </p>
          </div>
        </div>
        <p className="text-[12px] text-faint">
          <Link href="/" className="hover:text-body">
            ← Back to trackmcp.com
          </Link>
        </p>
      </div>

      {/* brand side */}
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(22,163,74,0.28),transparent_70%)]" />
        <div className="relative flex h-full flex-col justify-center px-14">
          <TrackMCPMark size={40} className="text-white" />
          <h2 className="mt-6 max-w-[16ch] text-[34px] font-medium leading-[1.1] tracking-[-0.02em] text-white">
            See how your MCP server is being used
          </h2>
          <ul className="mt-8 flex flex-col gap-3.5">
            {[
              "Who is connecting, and which clients drive usage",
              "What people are trying to do, end to end",
              "Where sessions stop, and what to fix next",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-[15px] text-white/80">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand">
                  <Check size={12} className="text-white" />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-10 max-w-[430px] rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">Example session trace</div><div className="mt-1 text-[13px] text-white/80">issue_resolution · Claude</div></div>
              <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-medium text-emerald-300">completed</span>
            </div>
            <div className="mt-4 space-y-2 font-mono text-[11px]">
              {["initialize · 18ms", "tools/list · 4 tools discovered", "search_docs · 142ms", "create_issue · 208ms"].map((step, index) => <div key={step} className="flex items-center gap-2 text-white/65"><span className={`h-1.5 w-1.5 rounded-full ${index === 3 ? "bg-emerald-300" : "bg-white/35"}`} />{step}</div>)}
            </div>
            <div className="mt-4 border-t border-white/10 pt-3 text-[11px] text-white/45">A sample of what TrackMCP helps your team understand.</div>
          </div>
        </div>
      </div>
    </main>
  );
}
