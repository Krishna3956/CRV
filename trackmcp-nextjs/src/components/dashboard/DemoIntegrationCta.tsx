"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/auth/supabase-browser";
import { authCallbackUrl, safeAuthNext } from "@/lib/auth/redirect";
import { discoverAuthProviders } from "@/lib/auth/provider-discovery.mjs";

export function DemoIntegrationCta({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [googleAvailable, setGoogleAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void discoverAuthProviders().then((providers) => {
      if (active) setGoogleAvailable(providers.google);
    }).catch(() => {
      if (active) setGoogleAvailable(false);
    });
    return () => { active = false; };
  }, []);

  const startGoogleSignup = async () => {
    if (googleAvailable !== true) {
      router.push(`/signup?next=${encodeURIComponent("/dashboard")}`);
      return;
    }

    if (loading) return;
    setLoading(true);
    setError("");
    const next = safeAuthNext("/dashboard");
    try {
      const { error: oauthError } = await getSupabaseBrowser().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: authCallbackUrl(window.location.origin, next),
          queryParams: { prompt: "select_account" },
        },
      });
      if (!oauthError) return;
      setLoading(false);
      setError("Google sign-up is unavailable right now. Continue to sign up with email.");
    } catch {
      setLoading(false);
      setError("Google sign-up is unavailable right now. Continue to sign up with email.");
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void startGoogleSignup()}
        aria-label="Integrate your agent with Google"
        aria-busy={googleAvailable === null || loading}
        disabled={googleAvailable === null || loading}
        className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-brand-strong px-3.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-strong/90 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        {loading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : children}
        {!loading && <ArrowRight size={14} aria-hidden="true" />}
      </button>
      {error && (
        <p role="alert" className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-line bg-white p-3 text-[12px] leading-relaxed text-body shadow-lg">
          {error} <a href={`/signup?next=${encodeURIComponent("/dashboard")}`} className="font-semibold text-brand-strong underline underline-offset-2">Sign up</a>
        </p>
      )}
    </div>
  );
}
