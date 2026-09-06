"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/auth/supabase-browser";

const enabled = Boolean(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN);

export function PostHogIdentity() {
  useEffect(() => {
    if (!enabled) return;

    let mounted = true;
    const identifySession = (session: Session | null) => {
      const user = session?.user;
      if (!user) {
        posthog.reset();
        return;
      }

      const metadata = user.user_metadata || {};
      posthog.identify(user.id, {
        email: user.email,
        first_name: metadata.first_name,
        last_name: metadata.last_name,
        company_name: metadata.company_name,
      });
    };

    const supabase = getSupabaseBrowser();
    void supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (mounted) identifySession(session);
    });

    const { data } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === "SIGNED_OUT") {
        posthog.reset();
        return;
      }
      identifySession(session);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return null;
}
