"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Rocket,
  Users,
  Zap,
  Trophy,
  GitBranch,
  Mail,
  Sparkles,
  Check,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { sendWeb3Form } from "@/lib/web3forms";

/* Full submit-a-tool page (ported from the live site): two-column layout with a
   value prop + community stats + "why submit" on the left, and the form with a
   $8/mo Featured upsell on the right, plus an FAQ. Restyled to ink + green.
   Posts to /api/repository/submit. */

const STATS = [
  { value: "14,739", label: "Tools listed" },
  { value: "50,000+", label: "Active developers" },
  { value: "120+", label: "Countries" },
];

const WHY = [
  { icon: Users, title: "Reach active developers", body: "Connect with thousands of MCP users browsing the largest directory." },
  { icon: Zap, title: "Instant visibility", body: "Listed within 24 hours of approval." },
  { icon: Trophy, title: "Stand out", body: "Get featured and boost discoverability." },
];

const FEATURED_BENEFITS = [
  { icon: Trophy, text: "Top search placement" },
  { icon: Sparkles, text: "Featured badge & highlight" },
  { icon: Zap, text: "3x more visibility" },
  { icon: Users, text: "Priority support" },
];

const FAQS = [
  {
    q: "Why should I submit my MCP tool?",
    a: "TrackMCP is the largest MCP directory. Submitting gets your tool discovered by thousands of developers worldwide, with its own page and docs pulled from your README.",
  },
  { q: "How long does approval take?", a: "Most submissions are reviewed and approved within 24 hours. We review every submission to keep quality high." },
  { q: "Is there a cost to submit?", a: "No — submitting your tool is completely free. The Featured option ($8/mo) is optional and gives you premium placement." },
  { q: "What if my tool is rejected?", a: "We'll explain why and give constructive feedback. Most tools get approved — feel free to resubmit after improvements." },
  { q: "Can I edit after submitting?", a: "Yes. You can edit your submission anytime before approval — just reply to our confirmation email with the changes." },
  { q: "What makes a good MCP tool?", a: "A well-documented GitHub repo with clear setup, examples, and an active maintenance history." },
];

const URL_RE = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;

export function SubmitClient() {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [wantsFeatured, setWantsFeatured] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const urlValid = URL_RE.test(url);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/repository/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, email, wantsFeatured }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to submit tool.");
        return;
      }
      void sendWeb3Form({
        subject: `New MCP submission — ${data.repo_name || url}`,
        from_name: "TrackMCP · MCP Submit",
        repository: url,
        email: email || "(not provided)",
        wants_featured: wantsFeatured ? "Yes" : "No",
        source: "Submit page",
      });
      setStatus("done");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  if (status === "done") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-28 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-brand-strong">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h2 className="mt-5 text-[24px] font-medium text-ink">Thank you!</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Your tool has been submitted. We&apos;ll review it within 24 hours and email you a
          confirmation{wantsFeatured ? ", plus details to start your Featured listing" : ""}.
        </p>
        <Link
          href="/repository"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-ink px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-black"
        >
          Back to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
        {/* left — value prop */}
        <div className="order-2 flex flex-col gap-8 lg:order-1">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[12px] font-medium text-brand">
              <Rocket size={12} /> Join the community
            </span>
            <h1 className="mt-4 text-[28px] font-medium leading-[1.1] tracking-[-0.02em] text-ink sm:text-[34px]">
              Get discovered by 50,000+ developers
            </h1>
            <p className="mt-3 text-[15.5px] leading-[1.5] text-muted">
              Share your MCP server or tool and connect with an active, growing community
              building the future of AI.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl border border-line bg-white px-3 py-4 text-center">
                <div className="text-[20px] font-semibold text-ink">{s.value}</div>
                <div className="mt-1 text-[11px] leading-tight text-muted">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {WHY.map((w) => (
              <div key={w.title} className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                  <w.icon size={15} />
                </span>
                <div>
                  <div className="text-[14px] font-medium text-ink">{w.title}</div>
                  <div className="text-[13px] leading-relaxed text-muted">{w.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* right — form */}
        <div className="order-1 lg:order-2">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_28px_80px_-44px_rgba(10,10,10,0.3)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[22px] font-medium tracking-[-0.02em] text-ink">Submit your MCP</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-[11px] font-semibold text-brand-strong">
                <CheckCircle2 size={13} /> Always free
              </span>
            </div>
            <p className="mt-1.5 text-[13.5px] text-muted">
              Just two fields. Takes two minutes. We handle the rest.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-5">
              <div>
                <label htmlFor="gh" className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-body">
                  <GitBranch size={14} className="text-brand-strong" /> GitHub repository{" "}
                  <span className="text-amber-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="gh"
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    className="w-full rounded-lg border border-line-strong bg-white px-3.5 py-3 pr-10 text-[14.5px] text-ink outline-none transition-colors placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                  {urlValid && (
                    <CheckCircle2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand" />
                  )}
                </div>
                <p className="mt-1.5 text-[12px] text-faint">We&apos;ll fetch your repo details automatically.</p>
              </div>

              <div>
                <label htmlFor="em" className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-body">
                  <Mail size={14} className="text-brand-strong" /> Email address{" "}
                  <span className="text-amber-600">*</span>
                </label>
                <input
                  id="em"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-line-strong bg-white px-3.5 py-3 text-[14.5px] text-ink outline-none transition-colors placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                <p className="mt-1.5 text-[12px] text-faint">We&apos;ll send you updates and confirmation.</p>
              </div>

              {/* Featured upsell */}
              <button
                type="button"
                onClick={() => setWantsFeatured((v) => !v)}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  wantsFeatured ? "border-brand bg-brand-soft/50" : "border-line bg-paper hover:border-line-strong"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${
                      wantsFeatured ? "border-brand bg-brand text-white" : "border-line-strong bg-white text-transparent"
                    }`}
                  >
                    <Check size={13} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink">
                        <Sparkles size={15} className="text-brand-strong" /> Get featured
                      </span>
                      <span className="rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-bold text-white">$8/mo</span>
                    </div>
                    <p className="mt-1 text-[12.5px] text-muted">
                      Get 3x more visibility and reach thousands of developers.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      {FEATURED_BENEFITS.map((b) => (
                        <span key={b.text} className="inline-flex items-center gap-1.5 text-[12px] text-body">
                          <b.icon size={13} className="shrink-0 text-brand-strong" /> {b.text}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>

              {status === "error" && <p className="text-[13px] text-amber-600">{message}</p>}

              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-70"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Submitting
                  </>
                ) : (
                  <>
                    <Rocket size={16} /> {wantsFeatured ? "Submit & start Featured ($8/mo)" : "Submit MCP"}
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[12px] text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                Secure submission · No spam · Instant confirmation
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-auto mt-14 max-w-3xl border-t border-line pt-12">
        <div className="text-center">
          <h2 className="text-[26px] font-medium tracking-[-0.02em] text-ink">Frequently asked questions</h2>
          <p className="mx-auto mt-2 max-w-xl text-[15px] text-muted">
            Everything you need to know about submitting your MCP to the directory.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-2.5">
          {FAQS.map((f) => (
            <details key={f.q} className="group rounded-xl border border-line bg-white transition-colors hover:border-line-strong">
              <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 text-[14.5px] font-medium text-ink">
                {f.q}
                <span className="text-faint transition-transform group-open:rotate-180">▾</span>
              </summary>
              <div className="border-t border-line px-4 py-3 text-[13.5px] leading-relaxed text-muted">{f.a}</div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
