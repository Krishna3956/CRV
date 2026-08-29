"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

/* Working copy-to-clipboard button. Copies `text`, shows a check for ~1.5s. */

export function CopyButton({
  text,
  size = 15,
  className = "",
  label = "Copy",
}: {
  text: string;
  size?: number;
  className?: string;
  label?: string;
}) {
  const [done, setDone] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older / insecure contexts
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* no-op */
      }
      ta.remove();
    }
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
    </button>
  );
}
