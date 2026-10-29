"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/auth/supabase-browser";
import { authCallbackUrl, safeAuthNext } from "@/lib/auth/redirect";

type OAuthProvider = "google" | "github";

// This is a browser-safe OAuth client identifier. Its authorized browser
// origins are managed in Google Cloud for the public marketing host, app host,
// and deployment origin; no client secret belongs in the browser. Using Google
// Identity Services directly keeps the consent UI branded as TrackMCP instead
// of exposing Supabase's project hostname.
const GOOGLE_CLIENT_ID = "59314638849-ifjalfkjhkdl00grbadeh61c2pimo57o.apps.googleusercontent.com";

type GoogleCredentialResponse = { credential?: string };
type GooglePromptNotification = {
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            nonce?: string;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            callback: (response: GoogleCredentialResponse) => void | Promise<void>;
          }) => void;
          prompt: (listener?: (notification: GooglePromptNotification) => void) => void;
          cancel?: () => void;
        };
      };
    };
  }
}

let googleIdentityScript: Promise<void> | null = null;

async function createGoogleNonce() {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(nonce));
  const hashedNonce = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return { nonce, hashedNonce };
}

function loadGoogleIdentityScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("Google sign-in is only available in a browser."));
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleIdentityScript) return googleIdentityScript;

  googleIdentityScript = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    const finish = () => window.google?.accounts?.id ? resolve() : reject(new Error("Google Identity Services did not load."));
    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Identity Services could not load.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = finish;
    script.onerror = () => reject(new Error("Google Identity Services could not load."));
    document.head.appendChild(script);
  });
  return googleIdentityScript;
}

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
  const [providers, setProviders] = useState<{ google: boolean; github: boolean } | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/auth/providers", { headers: { accept: "application/json" }, cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ google?: unknown; github?: unknown }> : null)
      .then((value) => {
        if (!active) return;
        setProviders({ google: value?.google === true, github: value?.github === true });
      })
      .catch(() => {
        if (active) setProviders({ google: false, github: false });
      });
    return () => { active = false; };
  }, []);

  const start = async (provider: OAuthProvider) => {
    if (loading) return;
    if (!canContinue) {
      onError?.("Please accept the Terms of Service and Privacy Policy before continuing.");
      return;
    }
    setLoading(provider);
    onError?.("");
    const nextPath = safeAuthNext(next);
    if (provider === "google") {
      try {
        await loadGoogleIdentityScript();
        const googleId = window.google?.accounts?.id;
        if (!googleId) throw new Error("Google Identity Services is unavailable.");
        // Supabase keeps nonce checks enabled in production. Google receives
        // the SHA-256 form while Supabase receives the original value, which
        // binds this credential to this sign-in attempt.
        const { nonce, hashedNonce } = await createGoogleNonce();
        await new Promise<void>((resolve, reject) => {
          let settled = false;
          let credentialStarted = false;
          const promptTimeout: { current?: ReturnType<typeof setTimeout> } = {};
          const finish = (error?: Error) => {
            if (settled) return;
            settled = true;
            if (promptTimeout.current) clearTimeout(promptTimeout.current);
            if (error) reject(error);
            else resolve();
          };
          googleId.initialize({
            client_id: GOOGLE_CLIENT_ID,
            nonce: hashedNonce,
            auto_select: false,
            cancel_on_tap_outside: true,
            callback: async (response) => {
              credentialStarted = true;
              if (!response.credential) {
                finish(new Error("Google did not return an identity token."));
                return;
              }
              const { data, error } = await getSupabaseBrowser().auth.signInWithIdToken({ provider: "google", token: response.credential, nonce });
              if (error || !data.session) {
                finish(error || new Error("Supabase could not create the Google session."));
                return;
              }
              window.location.assign(nextPath);
              finish();
            },
          });
          googleId.prompt((notification) => {
            // GIS may report a skipped moment while its account chooser is
            // handing the credential back. The bounded timer below handles a
            // genuinely missing prompt without turning that lifecycle event
            // into a false sign-in failure.
            void notification;
          });
          promptTimeout.current = setTimeout(() => {
            if (!credentialStarted) finish(new Error("Google sign-in was not displayed. Try again or use email sign-in."));
          }, 15_000);
        });
        return;
      } catch {
        setLoading(null);
        onError?.("Google sign-in could not open. Try again or use email sign-in.");
        return;
      }
    }
    const redirectTo = authCallbackUrl(window.location.origin, nextPath);
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
  if (!providers || (!providers.google && !providers.github)) return null;
  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3">
        {providers.google && <button type="button" disabled={Boolean(loading)} onClick={() => void start("google")} className={buttonClass}>
          {loading === "google" ? <Loader2 size={15} className="animate-spin" /> : <GoogleIcon />}
          {mode === "signup" ? "Sign up with Google" : "Google"}
        </button>}
        {providers.github && <button type="button" disabled={Boolean(loading)} onClick={() => void start("github")} className={buttonClass}>
          {loading === "github" ? <Loader2 size={15} className="animate-spin" /> : <GitHubIcon />}
          {mode === "signup" ? "Sign up with GitHub" : "GitHub"}
        </button>}
      </div>
      <div className="mt-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-faint"><span className="h-px flex-1 bg-line" /><span>or use email</span><span className="h-px flex-1 bg-line" /></div>
    </div>
  );
}
