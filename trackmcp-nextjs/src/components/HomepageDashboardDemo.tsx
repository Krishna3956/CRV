"use client";

import { Blocks, Route, Users } from "lucide-react";
import { useState } from "react";
import { Reveal } from "@/components/Reveal";
import { DashboardApp, type View } from "@/components/dashboard/DashboardApp";

const demoChoices: { view: View; icon: typeof Users; label: string }[] = [
  { view: "clients", icon: Users, label: "See who is using it" },
  { view: "capabilities", icon: Blocks, label: "See what they use" },
  { view: "journeys", icon: Route, label: "See what needs attention" },
];

/**
 * The homepage uses the production dashboard itself in a bounded, read-only
 * example mode. This keeps the proof surface honest: the navigation, cards,
 * charts, empty states, and sample calculations cannot drift from /dashboard.
 */
export function HomepageDashboardDemo() {
  const [view, setView] = useState<View>("overview");

  return (
    <section className="relative hidden bg-mist pb-14 md:block md:pb-20" aria-label="Interactive TrackMCP dashboard preview">
      <div className="relative mx-auto hidden w-full max-w-[1120px] px-6 md:block">
        <div
          aria-hidden
          className="absolute inset-x-8 top-0 h-20 bg-white"
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

      <div
        className="relative z-10 mx-auto mt-0 hidden max-w-[1120px] overflow-hidden rounded-[18px] border border-line-strong bg-white shadow-[0_28px_70px_-38px_rgba(15,23,42,0.35)] md:block md:mt-8"
        data-homepage-dashboard-preview
      >
        <div className="h-[720px]">
          <DashboardApp
            displayName="Example workspace"
            workspace={{ id: "example-workspace", name: "Example workspace", slug: "example-workspace" }}
            workspaces={[{ id: "example-workspace", name: "Example workspace", slug: "example-workspace" }]}
            keys={[{ id: "example-key", name: "Example connection", key_prefix: "tmcp_example", revoked_at: null, created_at: "2026-01-01T00:00:00.000Z" }]}
            analytics={null}
            toolQuality={null}
            newKey=""
            working={false}
            error=""
            sampleOnly
            preview
            controlledView={view}
            onViewChange={setView}
            onGenerateKey={() => undefined}
            onRevokeKey={() => undefined}
            onRotateKey={() => undefined}
            onDismissKey={() => undefined}
            onRefresh={() => undefined}
            onCreateWorkspace={() => undefined}
            onSelectWorkspace={() => undefined}
            onSignOut={() => undefined}
          />
        </div>
      </div>
    </section>
  );
}
