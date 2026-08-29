"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X, Loader2, Check, ArrowRight } from "lucide-react";
import { sendWeb3Form } from "@/lib/web3forms";

/* Submit an MCP tool: opens a modal, posts the GitHub URL to our server route
   which validates, fetches repo metadata, and inserts into Supabase. Same
   TrackMCP modal styling as the early-access dialog. */

type Status = "idle" | "loading" | "done" | "error";

export function SubmitToolDialog() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setStatus("idle");
    setMessage("");
    setUrl("");
    setEmail("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/repository/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, email }),
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
        source: "Browse dialog",
      });
      setStatus("done");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Submit your MCP">
      <button type="button" aria-label="Close" onClick={close} className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-[2px]" />
      <div className="relative w-full max-w-[460px] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_40px_120px_-30px_rgba(10,10,10,0.5)]">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors hover:bg-mist hover:text-ink"
        >
          <X size={16} />
        </button>
        <div className="p-6 sm:p-7">
          {status === "done" ? (
            <div className="py-4 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand-strong">
                <Check size={22} />
              </span>
              <h2 className="mt-4 text-[20px] font-medium text-ink">Submitted for review</h2>
              <p className="mx-auto mt-2 max-w-[34ch] text-[14.5px] leading-relaxed text-muted">
                Thanks for adding to the directory. We&apos;ll review it and publish it shortly.
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-ink px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-black"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-[20px] font-medium tracking-[-0.02em] text-ink">Submit your MCP</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                Share an MCP server or tool with the community. Paste its GitHub repository URL.
              </p>
              <form onSubmit={submit} className="mt-5">
                <label htmlFor="repo-url" className="sr-only">
                  GitHub repository URL
                </label>
                <input
                  id="repo-url"
                  type="url"
                  required
                  autoFocus
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/owner/repository"
                  className="w-full rounded-lg border border-line-strong bg-white px-3.5 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                <label htmlFor="submitter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="submitter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-3 w-full rounded-lg border border-line-strong bg-white px-3.5 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                {status === "error" && <p className="mt-2 text-[13px] text-amber-600">{message}</p>}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-black disabled:opacity-70"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Submitting
                    </>
                  ) : (
                    <>
                      Submit tool <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
              <p className="mt-3 text-center text-[12px] text-faint">
                We fetch the repo&apos;s stars, language, and topics automatically.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-brand-strong"
      >
        <Plus size={16} /> Submit your MCP
      </button>
      {open && typeof document !== "undefined" ? createPortal(modal, document.body) : null}
    </>
  );
}
