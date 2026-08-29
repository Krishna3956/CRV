"use client";

import { useState, type ReactNode } from "react";
import { Copy, Check } from "lucide-react";
import { headingId } from "@/lib/repository/toc";

/* Lightweight GitHub-README renderer for the MCP directory, restyled to the
   TrackMCP palette. Ported from the original directory app: supports headings,
   bold, links (with CTA detection), images (with branch fallbacks), code blocks
   with copy, tables, nested lists, and horizontal rules. */

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="my-4 overflow-hidden rounded-lg border border-line bg-ink">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="font-mono text-[11px] font-medium text-white/60">{language}</span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words p-4 font-mono text-[13px] leading-relaxed text-white/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInline(text: string): ReactNode[] {
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = linkRegex.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push(text.substring(lastIndex, m.index));
    const linkText = m[1];
    const linkUrl = m[2];
    if (linkText.trim()) {
      const isButton = /click|install|button|try/i.test(linkText);
      parts.push(
        <a
          key={`lnk-${m.index}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={
            isButton
              ? "inline-block rounded-md bg-ink px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-black"
              : "text-brand-strong underline decoration-brand/30 underline-offset-2 hover:decoration-brand"
          }
        >
          {linkText}
        </a>
      );
    }
    lastIndex = linkRegex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.substring(lastIndex));
  if (parts.length === 0) parts.push(text);

  // bold pass
  const final: ReactNode[] = [];
  parts.forEach((part, idx) => {
    if (typeof part !== "string") {
      final.push(part);
      return;
    }
    const boldRegex = /\*\*([^*]+?)\*\*/g;
    let last = 0;
    let b: RegExpExecArray | null;
    let any = false;
    while ((b = boldRegex.exec(part)) !== null) {
      any = true;
      if (b.index > last) final.push(part.substring(last, b.index));
      final.push(<strong key={`b-${idx}-${b.index}`}>{b[1]}</strong>);
      last = b.index + b[0].length;
    }
    if (!any) {
      if (part) final.push(part);
    } else if (last < part.length) {
      final.push(part.substring(last));
    }
  });
  return final;
}

export function MarkdownRenderer({ content, githubUrl }: { content: string; githubUrl?: string }) {
  let clean = content;
  clean = clean.replace(/<div[^>]*>[\s\S]*?<\/div>/gi, "");
  clean = clean.replace(/<section[^>]*>[\s\S]*?<\/section>/gi, "");
  clean = clean.replace(/<a[^>]*>[\s\S]*?<\/a>/gi, "");
  clean = clean.replace(/<[^>]+>/g, "");
  clean = clean.replace(/\n\n\n+/g, "\n\n");

  const lines = clean.split("\n");
  const els: ReactNode[] = [];
  let i = 0;

  const H: Record<number, string> = {
    1: "mt-8 mb-4 text-[26px] font-semibold text-ink",
    2: "mt-6 mb-3 text-[21px] font-semibold text-ink",
    3: "mt-5 mb-2 text-[18px] font-semibold text-ink",
    4: "mt-4 mb-2 text-[16px] font-semibold text-ink",
    5: "mt-3 mb-1 text-[14px] font-semibold text-ink",
    6: "mt-2 mb-1 text-[13px] font-semibold text-ink",
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      let closed = false;
      while (i < lines.length) {
        if (lines[i].trim().startsWith("```")) {
          closed = true;
          break;
        }
        codeLines.push(lines[i]);
        i++;
      }
      els.push(
        <CodeBlock key={`code-${els.length}`} code={codeLines.join("\n").trim() || "// Code block"} language={language || "code"} />
      );
      if (closed) i++;
      continue;
    }

    const hMatch = line.match(/^(#{1,6})\s(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const Tag = (`h${level}`) as keyof React.JSX.IntrinsicElements;
      // H2-H4 get anchor IDs so the table of contents can link to them.
      const anchor = level >= 2 && level <= 4 ? headingId(hMatch[2]) : undefined;
      els.push(
        <Tag key={`h-${i}`} id={anchor} className={`${H[level]} scroll-mt-24`}>
          {renderInline(hMatch[2])}
        </Tag>
      );
      i++;
      continue;
    }

    // images
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images: { alt: string; src: string }[] = [];
    let im: RegExpExecArray | null;
    while ((im = imageRegex.exec(line)) !== null) {
      let src = im[2];
      if (src && !src.startsWith("http") && githubUrl) {
        const repoPath = githubUrl.replace("https://github.com/", "").replace(/\/$/, "");
        src = `https://raw.githubusercontent.com/${repoPath}/main/${src}`;
      }
      images.push({ alt: im[1], src });
    }
    if (images.length > 0) {
      images.forEach((img, idx) => {
        els.push(
          <div key={`img-${els.length}-${idx}`} className="my-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt}
              className="h-auto max-w-full rounded-lg border border-line"
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                if (el.src.includes("/main/")) el.src = el.src.replace("/main/", "/master/");
                else if (el.src.includes("/master/")) el.src = el.src.replace("/master/", "/develop/");
              }}
            />
          </div>
        );
      });
      i++;
      continue;
    }

    if (line.trim().match(/^(-{3,}|\*{3,}|_{3,})$/)) {
      els.push(<hr key={`hr-${els.length}`} className="my-6 border-t border-line" />);
      i++;
      continue;
    }

    // tables
    if (line.includes("|")) {
      const rows: string[][] = [];
      let j = i;
      while (j < lines.length && lines[j].includes("|")) {
        const cells = lines[j].split("|").map((c) => c.trim()).filter(Boolean);
        if (cells.length > 0) rows.push(cells);
        j++;
        if (j < lines.length && lines[j].match(/^\|[\s\-|:]+\|$/)) j++;
      }
      if (rows.length > 1) {
        const headers = rows[0];
        const body = rows.slice(1);
        els.push(
          <div key={`tbl-${els.length}`} className="my-4 overflow-x-auto">
            <table className="w-full border-collapse border border-line text-[13px]">
              <thead>
                <tr className="bg-paper">
                  {headers.map((h, idx) => (
                    <th key={idx} className="border border-line px-3 py-2 text-left font-semibold text-ink">
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} className="hover:bg-paper/60">
                    {row.map((cell, ci) => (
                      <td key={ci} className="border border-line px-3 py-2 text-body">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        i = j;
        continue;
      }
    }

    // lists
    if (line.startsWith("- ") || line.startsWith("* ") || line.match(/^\s+[-*]\s/)) {
      const items: { text: string; level: number }[] = [];
      while (i < lines.length) {
        const mm = lines[i].match(/^(\s*)[-*]\s(.+)$/);
        if (!mm) break;
        items.push({ text: mm[2], level: mm[1].length / 2 });
        i++;
      }
      const renderList = (start: number, parentLevel: number): ReactNode[] => {
        const out: ReactNode[] = [];
        let j = start;
        while (j < items.length) {
          const item = items[j];
          if (item.level < parentLevel) break;
          if (item.level === parentLevel) {
            if (j + 1 < items.length && items[j + 1].level > parentLevel) {
              const children = renderList(j + 1, parentLevel + 1);
              out.push(
                <li key={j} className="text-body">
                  {renderInline(item.text)}
                  <ul className="ml-4 mt-1 list-disc space-y-1 pl-2">{children}</ul>
                </li>
              );
              while (j + 1 < items.length && items[j + 1].level > parentLevel) j++;
            } else {
              out.push(
                <li key={j} className="text-body">
                  {renderInline(item.text)}
                </li>
              );
            }
            j++;
          } else {
            j++;
          }
        }
        return out;
      };
      els.push(
        <ul key={`list-${els.length}`} className="my-4 ml-4 list-disc space-y-1 pl-2">
          {renderList(0, 0)}
        </ul>
      );
      continue;
    }

    if (line.trim()) {
      els.push(
        <p key={`p-${els.length}`} className="my-3 leading-relaxed text-body">
          {renderInline(line)}
        </p>
      );
    }
    i++;
  }

  return <div className="space-y-1">{els}</div>;
}
