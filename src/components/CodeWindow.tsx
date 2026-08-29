import type { ReactNode } from "react";
import { CopyButton } from "./CopyButton";

export function CodeWindow({
  file,
  children,
  className = "",
  copyText,
}: {
  file: string;
  children: ReactNode;
  className?: string;
  copyText?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-code-line bg-code-bg shadow-[0_24px_60px_-30px_rgba(10,10,10,0.5)] ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-code-line px-4 py-3">
        <span className="h-[11px] w-[11px] rounded-full bg-[#2a2e34]" />
        <span className="h-[11px] w-[11px] rounded-full bg-[#2a2e34]" />
        <span className="h-[11px] w-[11px] rounded-full bg-[#2a2e34]" />
        <span className="ml-2.5 font-mono text-xs text-code-dim">{file}</span>
        {copyText && (
          <CopyButton
            text={copyText}
            size={14}
            className="ml-auto text-code-dim hover:text-code-text"
          />
        )}
      </div>
      <pre className="overflow-x-auto p-5 text-[13.5px] leading-[1.75]">
        <code className="font-mono text-code-text">{children}</code>
      </pre>
    </div>
  );
}

/* syntax tokens */
export const K = ({ children }: { children: ReactNode }) => (
  <span className="text-[#7dd3fc]">{children}</span>
);
export const Fn = ({ children }: { children: ReactNode }) => (
  <span className="text-[#c4b5fd]">{children}</span>
);
export const Str = ({ children }: { children: ReactNode }) => (
  <span className="text-violet">{children}</span>
);
export const Cm = ({ children }: { children: ReactNode }) => (
  <span className="text-code-dim">{children}</span>
);
export const Pn = ({ children }: { children: ReactNode }) => (
  <span className="text-[#8b9099]">{children}</span>
);
