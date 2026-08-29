"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, Check, Loader2 } from "lucide-react";
import { TrackMCPAppIcon } from "./TrackMCPAppIcon";
import { sendWeb3Form } from "@/lib/web3forms";

/* Early-access email capture. Renders a button that opens a centered modal with
   an email form. Submitting sends an email via Web3Forms. Keyboard accessible. */

type Variant = "primary" | "brand" | "white" | "ghost";
type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-[18px] py-[11px] text-[15px]",
  lg: "px-6 py-3.5 text-base",
};

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-black",
  brand: "bg-brand text-white hover:bg-brand-strong",
  white: "bg-white text-ink hover:bg-mist",
  ghost: "bg-white text-ink border border-line-strong hover:bg-paper hover:border-muted",
};

export function EarlyAccessButton({
  label = "Get early access",
  variant = "primary",
  size = "md",
  className = "",
}: {
  label?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${sizes[size]} ${variants[variant]} ${className}`}
      >
        {label}
      </button>
      {open && <EarlyAccessModal onClose={() => setOpen(false)} />}
    </>
  );
}

function EarlyAccessModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    const { ok } = await sendWeb3Form({
      subject: "New early-access request — TrackMCP",
      from_name: "TrackMCP · Early Access",
      email,
      source: "Get early access",
    });
    setStatus(ok ? "done" : "error");
  };

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Get early access"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-[2px]"
      />
      <div className="relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_40px_120px_-30px_rgba(10,10,10,0.5)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(22,163,74,0.12),transparent_75%)]" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors hover:bg-mist hover:text-ink"
        >
          <X size={16} />
        </button>

        <div className="relative p-6 sm:p-8">
          {status === "done" ? (
            <div className="py-4 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand-strong">
                <Check size={22} />
              </span>
              <h2 className="mt-4 text-[20px] font-medium text-ink">You&apos;re on the list</h2>
              <p className="mx-auto mt-2 max-w-[34ch] text-[14.5px] leading-relaxed text-muted">
                Thanks. We&apos;ll email <span className="font-medium text-body">{email}</span> when
                your workspace is ready.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-ink px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-black"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <TrackMCPAppIcon size={40} />
              <h2 className="mt-4 text-[22px] font-medium tracking-[-0.02em] text-ink">
                Get early access
              </h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
                Add your email and we&apos;ll reach out when your TrackMCP workspace is
                ready. One line of code to start.
              </p>

              <form onSubmit={submit} className="mt-5">
                <label htmlFor="ea-email" className="sr-only">
                  Work email
                </label>
                <input
                  id="ea-email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-line-strong bg-white px-3.5 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-black disabled:opacity-70"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Adding you
                    </>
                  ) : (
                    <>
                      Request access <ArrowRight size={16} />
                    </>
                  )}
                </button>
                {status === "error" && (
                  <p className="mt-2 text-center text-[12.5px] text-red-600">
                    Something went wrong. Please try again.
                  </p>
                )}
              </form>
              <p className="mt-3 text-center text-[12px] text-faint">
                No spam. We&apos;ll only email you about early access.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Portal to <body> so the fixed overlay escapes any transformed ancestor
  // (e.g. framer-motion Reveal) and covers the real viewport.
  return typeof document === "undefined"
    ? null
    : createPortal(modal, document.body);
}
