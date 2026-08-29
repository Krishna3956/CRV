"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { sendWeb3Form } from "@/lib/web3forms";

/* Contact form. Submitting sends an email via Web3Forms. */

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "loading") return;
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("loading");
    const { ok } = await sendWeb3Form({
      subject: "New contact message — TrackMCP",
      from_name: "TrackMCP · Contact",
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      company: String(data.get("company") || ""),
      message: String(data.get("message") || ""),
    });
    setStatus(ok ? "done" : "error");
  };

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-[0_28px_80px_-50px_rgba(10,10,10,0.35)]">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand-strong">
          <Check size={22} />
        </span>
        <h2 className="mt-4 text-[20px] font-medium text-ink">Message sent</h2>
        <p className="mx-auto mt-2 max-w-[36ch] text-[14.5px] leading-relaxed text-muted">
          Thanks for reaching out. We&apos;ll get back to you within one business day.
        </p>
      </div>
    );
  }

  const field =
    "w-full rounded-lg border border-line-strong bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-line bg-white p-6 shadow-[0_28px_80px_-50px_rgba(10,10,10,0.35)] sm:p-7"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-body">Name</label>
          <input required name="name" placeholder="Jane Doe" className={field} />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-body">Work email</label>
          <input required name="email" type="email" placeholder="you@company.com" className={field} />
        </div>
      </div>
      <div className="mt-4">
        <label className="mb-1.5 block text-[13px] font-medium text-body">Company</label>
        <input name="company" placeholder="Acme Inc." className={field} />
      </div>
      <div className="mt-4">
        <label className="mb-1.5 block text-[13px] font-medium text-body">How can we help?</label>
        <textarea
          required
          name="message"
          rows={4}
          placeholder="Tell us about your MCP server and what you want to measure."
          className={`${field} resize-none`}
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-black disabled:opacity-70"
      >
        {status === "loading" ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Sending
          </>
        ) : (
          <>
            Send message <ArrowRight size={16} />
          </>
        )}
      </button>
      {status === "error" && (
        <p className="mt-3 text-center text-[12.5px] text-red-600">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
