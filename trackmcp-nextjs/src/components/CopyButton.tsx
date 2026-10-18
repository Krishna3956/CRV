"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { trackActivationEvent } from "@/lib/marketing-analytics";

/* Working copy-to-clipboard button. Copies `text`, shows a check for ~1.5s. */

export function CopyButton({
  text,
  size = 15,
  className = "",
  label = "Copy",
  showLabel = false,
  eventName,
  eventProperties,
}: {
  text: string;
  size?: number;
  className?: string;
  label?: string;
  showLabel?: boolean;
  eventName?: "install_command_copied" | "setup_snippet_copied";
  eventProperties?: Record<string, string>;
}) {
  const [done, setDone] = useState(false);

  const onCopy = async () => {
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch {
      // Try the fallback below for older or insecure contexts.
    }
    if (!copied) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "true");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { copied = document.execCommand("copy"); } catch { copied = false; }
      ta.remove();
    }
    if (!copied) return;
    if (eventName) trackActivationEvent(eventName, eventProperties);
    setDone(true);
    window.setTimeout(() => setDone(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={done ? "Copied" : label}
      className={`inline-grid shrink-0 place-items-center rounded-md transition-colors ${className}`}
    >
      {done ? (
        <Check size={size} className="text-brand" />
      ) : (
        <Copy size={size} />
      )}
      {showLabel && <span>{done ? "Copied" : label}</span>}
    </button>
  );
}
