"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Loader2, Check } from "lucide-react";
import { TrackMCPLogo } from "@/components/TrackMCPLogo";
import { TrackMCPMark } from "@/components/TrackMCPMark";

export default function SignInPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "note">("idle");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setTimeout(() => setStatus("note"), 800);
  };

  const field =
    "w-full rounded-lg border border-line-strong bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* form side */}
      <div className="flex flex-col px-6 py-8">
        <TrackMCPLogo mark />
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[380px] py-10">
            <h1 className="text-[28px] font-medium tracking-[-0.02em] text-ink">Sign in to TrackMCP</h1>
            <p className="mt-2 text-[14.5px] text-muted">
              Welcome back. Sign in to your workspace.
            </p>

            <div className="mt-7 flex flex-col gap-2.5">
              <button className="flex items-center justify-center gap-2.5 rounded-lg border border-line-strong bg-white px-4 py-2.5 text-[14.5px] font-medium text-ink transition-colors hover:bg-paper">
                <GoogleGlyph /> Continue with Google
              </button>
              <button className="flex items-center justify-center gap-2.5 rounded-lg border border-line-strong bg-white px-4 py-2.5 text-[14.5px] font-medium text-ink transition-colors hover:bg-paper">
                <GitHubGlyph /> Continue with GitHub
              </button>
            </div>

            <div className="my-6 flex items-center gap-3 text-[12px] text-faint">
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={submit} className="flex flex-col gap-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-body">Work email</label>
                <input required type="email" placeholder="you@company.com" className={field} />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[13px] font-medium text-body">Password</label>
                  <Link href="#" className="text-[12.5px] font-medium text-brand-strong">
                    Forgot?
                  </Link>
                </div>
                <input required type="password" placeholder="••••••••" className={field} />
              </div>
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
                    Sign in <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {status === "note" && (
              <p className="mt-4 flex items-start gap-2 rounded-lg border border-brand/30 bg-brand-soft/40 px-3.5 py-2.5 text-[13px] leading-snug text-brand-strong">
                <Check size={15} className="mt-0.5 shrink-0" />
                TrackMCP is in early access. Request an invite and we&apos;ll set up your
                workspace.
              </p>
            )}

            <p className="mt-6 text-center text-[13.5px] text-muted">
              New to TrackMCP?{" "}
              <Link href="/pricing" className="font-medium text-brand-strong">
                Get early access
              </Link>
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
          <div className="mt-10 w-fit rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="font-mono text-[12px] text-white/60">completed workflows</div>
            <div className="mt-1 font-mono text-[24px] font-semibold text-white">968</div>
            <div className="mt-1 text-[12px] text-brand">+24% this week</div>
          </div>
        </div>
      </div>
    </main>
  );
}

function GitHubGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.9 10.9c.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 1.7 2.6 1.2 3.3.9.1-.7.4-1.2.7-1.5-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z" />
    </svg>
  );
}

function GoogleGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.1-4 1.1-3 0-5.6-2-6.5-4.8H1.5v3.1A12 12 0 0 0 12 24z"
      />
      <path fill="#FBBC05" d="M5.5 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.5a12 12 0 0 0 0 10.8l4-3.1z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.5 6.7l4 3.1C6.4 6.9 9 4.8 12 4.8z"
      />
    </svg>
  );
}
