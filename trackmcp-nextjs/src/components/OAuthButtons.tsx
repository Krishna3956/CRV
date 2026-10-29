"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/auth/supabase-browser";
import { authCallbackUrl, safeAuthNext } from "@/lib/auth/redirect";

type OAuthProvider = "google" | "github";

function GoogleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4"><path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z" /><path fill="#34A853" d="M12 21.68c2.63 0 4.84-.87 6.45-2.37l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.68Z" /><path fill="#FBBC05" d="M6.54 13.75a5.86 5.86 0 0 1 0-3.5V7.72H3.3a9.75 9.75 0 0 0 0 8.56l3.24-2.53Z" /><path fill="#EA4335" d="M12 6.22c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.25 14.63 2.32 12 2.32a9.74 9.74 0 0 0-8.7 5.4l3.24 2.53c.77-2.31 2.92-4.03 5.46-4.03Z" /></svg>;
}

function GitHubIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.16c-3.22.7-3.9-1.55-3.9-1.55-.53-1.38-1.3-1.74-1.3-1.74-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.04 1.77 2.74 1.26 3.41.96.1-.75.4-1.26.74-1.55-2.57-.29-5.27-1.29-5.27-5.73 0-1.27.45-2.3 1.2-3.12-.12-.3-.52-1.47.11-3.07 0 0 .98-.31 3.19 1.19a11.08 11.08 0 0 1 5.81 0c2.2-1.5 3.18-1.19 3.18-1.19.64 1.6.24 2.77.12 3.07.75.82 1.2 1.85 1.2 3.12 0 4.45-2.71 5.43-5.29 5.72.41.36.78 1.08.78 2.18v3.22c0 .31.21.67.8.55A11.5 11.5 0 0 0 12 .5Z" /></svg>;
}

export function OAuthButtons({
  next,
  mode,
  canContinue = true,
  onError,
}: {
  next: string;
  mode: "signin" | "signup";
  canContinue?: boolean;
  onError?: (message: string) => void;
}) {
  const [loading, setLoading] = useState<OAuthProvider | null>(null);

  const start = async (provider: OAuthProvider) => {
    if (loading) return;
    if (!canContinue) {
      onError?.("Please accept the Terms of Service and Privacy Policy before continuing.");
      return;
    }
    setLoading(provider);
    onError?.("");
    const redirectTo = authCallbackUrl(window.location.origin, safeAuthNext(next));
    const { error } = await getSupabaseBrowser().auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) {
      setLoading(null);
      onError?.("This sign-in option is not available right now. Try email sign-in or try again shortly.");
    }
  };

  const buttonClass = "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line-strong bg-white px-3 text-[13px] font-medium text-body transition-colors hover:bg-mist disabled:cursor-not-allowed disabled:opacity-60";
  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3">
        <button type="button" disabled={Boolean(loading)} onClick={() => void start("google")} className={buttonClass}>
          {loading === "google" ? <Loader2 size={15} className="animate-spin" /> : <GoogleIcon />}
          {mode === "signup" ? "Sign up with Google" : "Google"}
        </button>
        <button type="button" disabled={Boolean(loading)} onClick={() => void start("github")} className={buttonClass}>
          {loading === "github" ? <Loader2 size={15} className="animate-spin" /> : <GitHubIcon />}
          {mode === "signup" ? "Sign up with GitHub" : "GitHub"}
        </button>
      </div>
      <div className="mt-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-faint"><span className="h-px flex-1 bg-line" /><span>or use email</span><span className="h-px flex-1 bg-line" /></div>
    </div>
  );
}
