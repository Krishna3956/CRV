"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, KeyRound, Loader2, Mail, RotateCcw } from "lucide-react";
import { TrackMCPLogo } from "@/components/TrackMCPLogo";
import { TrackMCPMark } from "@/components/TrackMCPMark";
import { sendWeb3Form } from "@/lib/web3forms";
import { getSupabaseBrowser } from "@/lib/auth/supabase-browser";
import { saveContentAttribution, trackMarketingEvent } from "@/lib/marketing-analytics";

type AuthStatus = "idle" | "requesting" | "verifying" | "updating" | "error";
type AuthScreen = "credentials" | "signup-code" | "reset-email" | "reset-code" | "reset-password";

export default function SignInPage({ initialMode = "signin" }: { initialMode?: "signin" | "signup" }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">(() => {
    if (typeof window === "undefined") return initialMode;
    return new URLSearchParams(window.location.search).get("mode") === "signup" ? "signup" : initialMode;
  });
  const [screen, setScreen] = useState<AuthScreen | string>("credentials");
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [requestedEmail, setRequestedEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const contentPath = params.get("content_path");
    if (!contentPath) return;
    saveContentAttribution({ content_path: contentPath, content_cta: params.get("content_cta") || undefined, content_surface: params.get("content_surface") || undefined });
  }, []);

  useEffect(() => {
    if (!resendIn) return;
    const timer = window.setInterval(() => setResendIn((remaining) => Math.max(remaining - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  useEffect(() => {
    if (screen === "signup-code" || screen === "reset-code") codeInputRef.current?.focus();
  }, [screen]);

  const finishAuth = (eventName: "signup_completed" | "signin_completed") => {
    trackMarketingEvent(eventName, { auth_mode: mode });
    router.replace("/dashboard/onboarding");
  };

  const submitCredentials = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "requesting") return;
    const normalizedEmail = email.trim().toLowerCase();
    if (screen === "reset-email") {
      if (!normalizedEmail) return;
      setStatus("requesting");
      setError("");
      const { error: authError } = await getSupabaseBrowser().auth.resetPasswordForEmail(normalizedEmail);
      if (authError) {
        setError(authError.message);
        setStatus("error");
        return;
      }
      setRequestedEmail(normalizedEmail);
      setCode("");
      setResendIn(60);
      setStatus("idle");
      setScreen("reset-code");
      return;
    }

    if (mode === "signup") {
      if (!acceptedTerms) {
        setError("Please accept the Terms of Service and Privacy Policy to create an account.");
        return;
      }
      if (password.length < 8) {
        setError("Your password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("The passwords do not match.");
        return;
      }
      trackMarketingEvent("auth_request_started", { auth_mode: mode });
      setStatus("requesting");
      setError("");
      const { data, error: authError } = await getSupabaseBrowser().auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}`.trim(), terms_accepted: true } },
      });
      if (authError) {
        setError(authError.message);
        setStatus("error");
        return;
      }
      if (data.session) {
        finishAuth("signup_completed");
        return;
      }
      setEmail(normalizedEmail);
      setRequestedEmail(normalizedEmail);
      setCode("");
      setResendIn(60);
      setStatus("idle");
      setScreen("signup-code");
      trackMarketingEvent("signup_request_sent", { auth_mode: mode });
      void sendWeb3Form({ subject: "TrackMCP signup request", from_name: "TrackMCP · Auth", name: `${firstName} ${lastName}`.trim(), email: normalizedEmail, company: "", intent: "signup" });
      return;
    }

    if (!normalizedEmail || !password) return;
    trackMarketingEvent("auth_request_started", { auth_mode: mode });
    setStatus("requesting");
    setError("");
    const { error: authError } = await getSupabaseBrowser().auth.signInWithPassword({ email: normalizedEmail, password });
    if (authError) {
      setError(authError.code === "email_not_confirmed" ? "Please verify your email address before signing in." : "Incorrect email or password. If this is an older passwordless account, use the password reset option below.");
      setStatus("error");
      return;
    }
    finishAuth("signin_completed");
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "verifying" || code.length !== 6) return;
    setStatus("verifying");
    setError("");
    const verificationType = screen === "reset-code" ? "recovery" : "email";
    const { error: authError } = await getSupabaseBrowser().auth.verifyOtp({ email: requestedEmail, token: code, type: verificationType });
    if (authError) {
      setError(authError.message || "That code is invalid or has expired. Request a new code and try again.");
      setStatus("error");
      return;
    }
    if (screen === "reset-code") {
      setNewPassword("");
      setConfirmNewPassword("");
      setStatus("idle");
      setScreen("reset-password");
      return;
    }
    finishAuth("signup_completed");
  };

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("The passwords do not match.");
      return;
    }
    setStatus("updating");
    setError("");
    const { error: authError } = await getSupabaseBrowser().auth.updateUser({ password: newPassword });
    if (authError) {
      setError(authError.message);
      setStatus("error");
      return;
    }
    trackMarketingEvent("password_set", { auth_mode: "signin" });
    finishAuth("signin_completed");
  };

  const resendCode = async () => {
    if (resendIn > 0 || status === "verifying" || status === "requesting") return;
    setStatus("requesting");
    setError("");
    const result = screen === "signup-code"
      ? await getSupabaseBrowser().auth.resend({ type: "signup", email: requestedEmail })
      : await getSupabaseBrowser().auth.resetPasswordForEmail(requestedEmail);
    if (result.error) {
      setError(result.error.message);
      setStatus("error");
      return;
    }
    setCode("");
    setResendIn(60);
    setStatus("idle");
  };

  const resetTo = (nextScreen: "credentials" | "reset-email") => {
    setScreen(nextScreen);
    setStatus("idle");
    setRequestedEmail("");
    setCode("");
    setError("");
    setNotice("");
    setResendIn(0);
    window.setTimeout(() => emailInputRef.current?.focus(), 0);
  };

  const switchMode = (nextMode: "signin" | "signup") => {
    setMode(nextMode);
    setScreen("credentials");
    setStatus("idle");
    setError("");
    setNotice("");
    setPassword("");
    setConfirmPassword("");
    router.replace(nextMode === "signup" ? "/signup" : "/signin");
  };

  const codeStep = screen === "signup-code";
  const resetFlow = screen === "reset-email" || screen === "reset-code" || screen === "reset-password";
  const heading = codeStep ? "Verify your email" : mode === "signup" ? "Create your TrackMCP account" : "Sign in to TrackMCP";
  const description = codeStep ? <>We sent a code to <strong className="font-medium text-body">{requestedEmail}</strong>.</> : mode === "signup" ? "Start observing your MCP server in minutes." : "Welcome back. Continue to your MCP analytics.";
  const resetHeading = screen === "reset-code" ? "Enter your reset code" : screen === "reset-password" ? "Set a new password" : "Reset your password";
  const resetDescription = screen === "reset-password" ? "Choose a new password for your TrackMCP account." : "We’ll email you a code so you can set a password.";
  const field = "w-full rounded-lg border border-line-strong bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8">
        <TrackMCPLogo mark href="https://trackmcp.com" />
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[380px] py-10">
            <h1 className="text-[28px] font-medium tracking-[-0.02em] text-ink">{heading}</h1>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{description}</p>

        {screen === "credentials" || resetFlow ? <form onSubmit={submitCredentials} className="mt-7 flex flex-col gap-3">
          {screen === "credentials" && mode === "signup" && <div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-1.5 block text-[12px] font-medium text-body">First name</span><input required value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Alex" className={field} /></label><label><span className="mb-1.5 block text-[12px] font-medium text-body">Last name</span><input required value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Morgan" className={field} /></label></div>}
          <label><span className="mb-1.5 block text-[12px] font-medium text-body">Email address</span><input ref={emailInputRef} required type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="you@example.com" autoComplete="email" className={field} /></label>
          {(screen === "credentials" || resetFlow) && <><label><span className="mb-1.5 block text-[12px] font-medium text-body">Password</span><input required type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} className={field} /></label>{mode === "signup" && <><label><span className="mb-1.5 block text-[12px] font-medium text-body">Confirm password</span><input required type="password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError(""); }} placeholder="Repeat your password" autoComplete="new-password" className={field} /></label><p className="text-[12px] leading-relaxed text-muted">Use at least 8 characters. You&apos;ll verify your email before entering the dashboard.</p><label className="flex items-start gap-2 text-[12px] leading-relaxed text-muted"><input required type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5 h-4 w-4 accent-brand" /><span>I agree to the <Link href="/terms" className="font-medium text-brand-strong hover:underline">Terms of Service</Link> and <Link href="/privacy" className="font-medium text-brand-strong hover:underline">Privacy Policy</Link>.</span></label></>}</>}
          <button type="submit" disabled={status === "requesting"} className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-[14px] font-medium text-white transition-colors hover:bg-black disabled:opacity-60">{status === "requesting" ? <><Loader2 size={15} className="animate-spin" />Sending</> : <>{mode === "signup" ? "Create account" : "Sign in"}<ArrowRight size={15} /></>}</button>
          {mode === "signin" && <button type="button" onClick={() => resetTo("reset-email")} className="inline-flex items-center justify-center gap-2 text-[12px] font-medium text-muted hover:text-body"><KeyRound size={13} />Forgot or need to set a password?</button>}
        </form> : screen === "reset-password" ? <form onSubmit={updatePassword} className="mt-7 flex flex-col gap-3"><label><span className="mb-1.5 block text-[13px] font-medium text-body">New password</span><input required type="password" value={newPassword} onChange={(event) => { setNewPassword(event.target.value); setError(""); }} placeholder="At least 8 characters" autoComplete="new-password" className={field} /></label><label><span className="mb-1.5 block text-[13px] font-medium text-body">Confirm new password</span><input required type="password" value={confirmNewPassword} onChange={(event) => { setConfirmNewPassword(event.target.value); setError(""); }} placeholder="Repeat your password" autoComplete="new-password" className={field} /></label><p className="text-[13px] leading-relaxed text-muted">After this, you can sign in with your email and password.</p><button type="submit" disabled={status === "updating"} className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-black disabled:opacity-70">{status === "updating" ? <><Loader2 size={16} className="animate-spin" />Saving</> : <>Set password<ArrowRight size={16} /></>}</button></form> : <form onSubmit={verifyCode} className="mt-7 flex flex-col gap-3"><div className="flex items-start gap-3 rounded-lg border border-brand/30 bg-brand-soft/40 px-3.5 py-2.5 text-[13px] leading-snug text-brand-strong"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/70"><Mail size={15} /></span><p>Check your inbox and enter the newest code below. You can open the email on your phone and type the code here.</p></div><label><span className="mb-1.5 block text-[13px] font-medium text-body">Verification code</span><input ref={codeInputRef} required inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} placeholder="000000" className={`${field} text-center font-mono text-[24px] tracking-[0.28em]`} /></label><p className="text-center text-[12px] leading-relaxed text-faint">The code can only be used once.</p><button type="submit" disabled={status === "verifying" || code.length !== 6} className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-black disabled:opacity-70">{status === "verifying" ? <><Loader2 size={16} className="animate-spin" />Verifying</> : <>Verify and continue<ArrowRight size={16} /></>}</button><div className="flex items-center justify-between border-t border-line pt-4 text-[12px]"><button type="button" onClick={() => resetTo(screen === "signup-code" ? "credentials" : "reset-email")} className="font-medium text-muted hover:text-body">Use a different email</button><button type="button" disabled={resendIn > 0 || status === "verifying" || status === "requesting"} onClick={() => void resendCode()} className="inline-flex items-center gap-1.5 font-medium text-brand-strong disabled:text-faint"><RotateCcw size={12} />{resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}</button></div></form>}

        {screen === "signup-code" && !error && <p className="mt-4 flex items-start gap-2 rounded-lg border border-brand/30 bg-brand-soft/40 px-3.5 py-2.5 text-[13px] leading-snug text-brand-strong"><Check size={15} className="mt-0.5 shrink-0" />Check spam or promotions if the code does not arrive.</p>}
        {notice && <p className="mt-4 rounded-lg border border-brand/25 bg-brand-soft/35 px-3.5 py-2.5 text-[12px] leading-relaxed text-brand-strong">{notice}</p>}
        {!resetFlow && error && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-amber-900"><p>{error}</p><button type="button" onClick={() => resetTo("credentials")} className="mt-2 font-medium text-amber-950 underline underline-offset-2">Start again</button></div>}
            {!resetFlow && <p className="mt-6 text-center text-[13px] text-muted">{mode === "signin" ? <>New to TrackMCP? <button type="button" onClick={() => switchMode("signup")} className="font-medium text-brand-strong">Create an account</button></> : <>Already have an account? <button type="button" onClick={() => switchMode("signin")} className="font-medium text-brand-strong">Sign in</button></>}</p>}
          </div>
        </div>
        <p className="text-[12px] text-faint"><Link href="/" className="hover:text-body">← Back to trackmcp.com</Link></p>
      </div>
      {resetFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="reset-password-title" className="w-full max-w-[440px] rounded-2xl border border-line bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-strong">Password recovery</p>
                <h2 id="reset-password-title" className="mt-3 text-[24px] font-medium tracking-[-0.02em] text-ink">{resetHeading}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{resetDescription}</p>
              </div>
              <button type="button" onClick={() => resetTo("credentials")} aria-label="Close password recovery" className="-mr-2 -mt-2 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[24px] leading-none text-muted transition-colors hover:bg-paper hover:text-ink">×</button>
            </div>

            {screen === "reset-email" && <form onSubmit={submitCredentials} className="mt-7 flex flex-col gap-3">
              <label><span className="mb-1.5 block text-[13px] font-medium text-body">Email address</span><input ref={emailInputRef} required type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="you@example.com" autoComplete="email" className={field} /></label>
              <p className="text-[13px] leading-relaxed text-muted">We&apos;ll send a one-time code to this email. This also works for older passwordless accounts.</p>
              <button type="submit" disabled={status === "requesting"} className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-black disabled:opacity-70">{status === "requesting" ? <><Loader2 size={16} className="animate-spin" />Sending</> : <>Send reset code<ArrowRight size={16} /></>}</button>
            </form>}

            {screen === "reset-code" && <form onSubmit={verifyCode} className="mt-7 flex flex-col gap-3">
              <div className="flex items-start gap-3 rounded-lg border border-brand/30 bg-brand-soft/40 px-3.5 py-2.5 text-[13px] leading-snug text-brand-strong"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/70"><Mail size={15} /></span><p>Enter the newest code from your email. You can open the email on your phone and type the code here.</p></div>
              <label><span className="mb-1.5 block text-[13px] font-medium text-body">Reset code</span><input ref={codeInputRef} required inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} placeholder="000000" className={`${field} text-center font-mono text-[24px] tracking-[0.28em]`} /></label>
              <p className="text-center text-[12px] leading-relaxed text-faint">The code can only be used once.</p>
              <button type="submit" disabled={status === "verifying" || code.length !== 6} className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-black disabled:opacity-70">{status === "verifying" ? <><Loader2 size={16} className="animate-spin" />Verifying</> : <>Continue<ArrowRight size={16} /></>}</button>
              <div className="flex items-center justify-between border-t border-line pt-4 text-[12px]"><button type="button" onClick={() => resetTo("reset-email")} className="font-medium text-muted hover:text-body">Use a different email</button><button type="button" disabled={resendIn > 0 || status === "verifying" || status === "requesting"} onClick={() => void resendCode()} className="inline-flex items-center gap-1.5 font-medium text-brand-strong disabled:text-faint"><RotateCcw size={12} />{resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}</button></div>
            </form>}

            {screen === "reset-password" && <form onSubmit={updatePassword} className="mt-7 flex flex-col gap-3">
              <label><span className="mb-1.5 block text-[13px] font-medium text-body">New password</span><input required type="password" value={newPassword} onChange={(event) => { setNewPassword(event.target.value); setError(""); }} placeholder="At least 8 characters" autoComplete="new-password" className={field} /></label>
              <label><span className="mb-1.5 block text-[13px] font-medium text-body">Confirm new password</span><input required type="password" value={confirmNewPassword} onChange={(event) => { setConfirmNewPassword(event.target.value); setError(""); }} placeholder="Repeat your password" autoComplete="new-password" className={field} /></label>
              <p className="text-[13px] leading-relaxed text-muted">After this, you can sign in with your email and password.</p>
              <button type="submit" disabled={status === "updating"} className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-black disabled:opacity-70">{status === "updating" ? <><Loader2 size={16} className="animate-spin" />Saving</> : <>Set password<ArrowRight size={16} /></>}</button>
            </form>}

            {error && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] leading-relaxed text-amber-900"><p>{error}</p><button type="button" onClick={() => resetTo("reset-email")} className="mt-2 font-medium text-amber-950 underline underline-offset-2">Start again</button></div>}
            <button type="button" onClick={() => resetTo("credentials")} className="mt-6 block w-full text-center text-[13px] font-medium text-muted hover:text-body">Back to sign in</button>
          </div>
        </div>
      )}
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(22,163,74,0.28),transparent_70%)]" />
        <div className="relative flex h-full flex-col justify-center px-14">
          <TrackMCPMark size={40} className="text-white" />
          <h2 className="mt-6 max-w-[16ch] text-[34px] font-medium leading-[1.1] tracking-[-0.02em] text-white">See how your MCP server is being used</h2>
          <ul className="mt-8 flex flex-col gap-3.5">
            {["Who is connecting, and which clients drive usage", "What people are trying to do, end to end", "Where sessions stop, and what to fix next"].map((item) => (
              <li key={item} className="flex items-start gap-3 text-[15px] text-white/80"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand"><Check size={12} className="text-white" /></span>{item}</li>
            ))}
          </ul>
          <div className="mt-10 max-w-[430px] rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">Example session trace</div><div className="mt-1 text-[13px] text-white/80">issue_resolution · Claude</div></div>
              <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-medium text-emerald-300">completed</span>
            </div>
            <div className="mt-4 space-y-2 font-mono text-[11px]">
              {["initialize · 18ms", "tools/list · 4 tools discovered", "search_docs · 142ms", "create_issue · 208ms"].map((step, index) => <div key={step} className="flex items-center gap-2 text-white/65"><span className={`h-1.5 w-1.5 rounded-full ${index === 3 ? "bg-emerald-300" : "bg-white/35"}`} />{step}</div>)}
            </div>
            <div className="mt-4 border-t border-white/10 pt-3 text-[11px] text-white/45">A sample of what TrackMCP helps your team understand.</div>
          </div>
        </div>
      </div>
    </main>
  );
}
