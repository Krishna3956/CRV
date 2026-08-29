import type { ReactNode } from "react";
import Link from "next/link";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { CopyButton } from "./CopyButton";

const groups = [
  {
    label: "Getting started",
    items: [
      { t: "Overview", href: "/docs" },
      { t: "Quickstart", href: "/docs#quickstart" },
      { t: "Workspace setup", href: "/dashboard" },
    ],
  },
  {
    label: "SDKs",
    items: [
      { t: "TypeScript", href: "/docs/typescript" },
      { t: "Python", href: "/docs/python" },
    ],
  },
  {
    label: "Reference",
    items: [
      { t: "REST API", href: "/docs/api" },
      { t: "Configuration", href: "/docs/reference" },
    ],
  },
];

export function DocsShell({
  active,
  children,
}: {
  active: string;
  children: ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-10 lg:grid-cols-[210px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <nav className="sticky top-24 flex flex-col gap-6">
                {groups.map((g) => (
                  <div key={g.label}>
                    <p className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
                      {g.label}
                    </p>
                    <ul className="flex flex-col gap-0.5">
                      {g.items.map((it) => (
                        <li key={it.href}>
                          <Link
                            href={it.href}
                            className={`block rounded-md px-2.5 py-1.5 text-[13.5px] transition-colors ${
                              active === it.href
                                ? "bg-brand-soft/50 font-medium text-brand-strong"
                                : "text-muted hover:bg-mist hover:text-body"
                            }`}
                          >
                            {it.t}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </aside>
            <div className="min-w-0 max-w-[720px]">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export function DocTitle({ eyebrow, children }: { eyebrow?: string; children: ReactNode }) {
  return (
    <>
      {eyebrow && (
        <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">
          {eyebrow}
        </span>
      )}
      <h1 className="mt-2 text-[32px] font-medium leading-[1.1] tracking-[-0.03em] text-ink sm:text-[38px]">
        {children}
      </h1>
    </>
  );
}

export function DocLead({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-[16.5px] leading-[1.6] text-muted">{children}</p>;
}

export function DocSection({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-12 scroll-mt-24">
      <h2 className="text-[22px] font-medium tracking-[-0.02em] text-ink">{title}</h2>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function Para({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-[1.65] text-body">{children}</p>;
}

export function Code({ children }: { children: ReactNode }) {
  const text = typeof children === "string" ? children : "";
  return (
    <div className="relative">
      {text && (
        <CopyButton
          text={text}
          size={14}
          className="absolute right-2.5 top-2.5 z-10 border border-code-line bg-code-panel p-1.5 text-code-dim hover:text-code-text"
        />
      )}
      <pre className="overflow-x-auto rounded-xl border border-code-line bg-code-bg p-4 pr-12 font-mono text-[12.5px] leading-relaxed text-code-text">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function Inline({ children }: { children: ReactNode }) {
  return (
    <code className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[13px] text-brand-strong">
      {children}
    </code>
  );
}
