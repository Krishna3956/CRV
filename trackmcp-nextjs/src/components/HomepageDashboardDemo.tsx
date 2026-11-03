"use client";

import { TrendingUp, Users, Wrench } from "lucide-react";
import { useState } from "react";
import { Reveal } from "@/components/Reveal";
import { HeroDashboardScene } from "@/components/HeroDashboardScene";
import type { View } from "@/components/DashboardMock";

const demoChoices: { view: View; icon: typeof Users; label: string }[] = [
  { view: "clients", icon: Users, label: "See who is using it" },
  { view: "capabilities", icon: Wrench, label: "See what they use" },
  { view: "issues", icon: TrendingUp, label: "Know what to improve" },
];

/**
 * The homepage product proof is wired to the same business-facing view names
 * as the dashboard. Visitors can choose the question they care about and see
 * the corresponding dashboard surface without leaving the page.
 */
export function HomepageDashboardDemo() {
  const [view, setView] = useState<View>("overview");

  return (
    <section className="relative hidden bg-mist pb-14 md:block md:pb-20" aria-label="Interactive TrackMCP dashboard preview">
      <div className="relative mx-auto hidden w-full max-w-[680px] px-6 md:block">
        <div
          aria-hidden
          className="absolute inset-0 bg-white"
          style={{
            clipPath: "polygon(0 0, 100% 0, calc(100% - 60px) 100%, 60px 100%)",
            filter: "drop-shadow(0 20px 32px rgba(10,10,10,0.05))",
          }}
        />
        <div className="relative flex flex-wrap items-center justify-center gap-2.5 px-8 pb-6 pt-5">
          {demoChoices.map(({ view: choiceView, icon: Icon, label }, i) => {
            const active = view === choiceView;
            return (
              <Reveal key={label} delay={0.3 + i * 0.08}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setView(choiceView)}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-[13px] font-medium shadow-[0_2px_8px_-4px_rgba(10,10,10,0.15)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                    active
                      ? "border-brand/40 bg-brand-soft text-brand-strong"
                      : "border-line bg-white text-body hover:border-brand/30 hover:bg-brand-soft/50"
                  }`}
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-soft text-brand-strong">
                    <Icon size={13} />
                  </span>
                  {label}
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-0 hidden max-w-[1000px] px-6 md:mt-8 md:block">
        <HeroDashboardScene controlledView={view} onViewChange={setView} />
      </div>
    </section>
  );
}

