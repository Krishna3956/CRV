import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { PageFrame } from "./PageFrame";
import { Reveal } from "./Reveal";

export type LegalSection = { h: string; p: string[] };

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro?: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <PageFrame>
          <section className="mx-auto max-w-3xl px-6 py-16">
            <Reveal>
              <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">
                Legal
              </span>
              <h1 className="mt-3 text-[36px] font-medium leading-[1.05] tracking-[-0.03em] text-ink sm:text-[44px]">
                {title}
              </h1>
              <p className="mt-3 text-[13px] text-faint">Last updated {updated}</p>
              {intro && (
                <p className="mt-6 text-[16px] leading-[1.6] text-body">{intro}</p>
              )}
            </Reveal>

            <div className="mt-10 flex flex-col gap-8">
              {sections.map((s) => (
                <Reveal key={s.h}>
                  <div>
                    <h2 className="text-[20px] font-medium tracking-[-0.01em] text-ink">
                      {s.h}
                    </h2>
                    {s.p.map((para, i) => (
                      <p key={i} className="mt-3 text-[15px] leading-[1.65] text-muted">
                        {para}
                      </p>
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>

            <p className="mt-12 border-t border-line pt-6 text-[14px] text-muted">
              Questions? Email{" "}
              <a href="mailto:privacy@trackmcp.com" className="font-medium text-brand-strong underline">
                privacy@trackmcp.com
              </a>
              .
            </p>
          </section>
        </PageFrame>
      </main>
      <Footer />
    </>
  );
}
