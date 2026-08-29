"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/auth/supabase-browser";
import { TrackMCPLogo } from "@/components/TrackMCPLogo";

const field = "w-full rounded-xl border border-line-strong bg-white px-3.5 py-3 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10";

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({ full_name: "", company_name: "", role: "", use_case: "" });
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.push("/signin"); return; }
      setEmail(data.user.email || "");
      setForm((current) => ({ ...current, full_name: data.user.user_metadata?.full_name || "" }));
      const account = await fetch("/api/v1/account/workspace", { cache: "no-store" });
      const body = await account.json();
      if (account.ok && body.workspace) { router.push("/dashboard"); return; }
      setLoading(false);
    })();
  }, [router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/v1/account/workspace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not set up your workspace.");
      router.push("/dashboard");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not set up your workspace."); setSaving(false); }
  };

  if (loading) return <main className="grid min-h-screen place-items-center text-sm text-muted">Preparing your workspace…</main>;
  return <main className="min-h-screen bg-[#f7f8f7] px-5 py-8 sm:px-8"><div className="mx-auto max-w-5xl"><TrackMCPLogo mark /><div className="mt-12 grid overflow-hidden rounded-3xl border border-line bg-white shadow-sm lg:grid-cols-[0.85fr_1.15fr]"><section className="bg-ink px-7 py-9 text-white sm:px-10 sm:py-12"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">First, make it yours</p><h1 className="mt-5 max-w-[12ch] text-4xl font-medium leading-[1.05] tracking-[-0.04em]">Let&apos;s set up your observability workspace.</h1><p className="mt-5 max-w-sm text-sm leading-relaxed text-white/65">We&apos;ll tailor the first dashboard view to the MCP server and team you&apos;re building.</p><div className="mt-10 space-y-4 text-sm text-white/75">{["Create your workspace and API key", "Connect your MCP server in minutes", "See a sample dashboard before traffic arrives"].map((item) => <div key={item} className="flex items-center gap-3"><span className="grid h-5 w-5 place-items-center rounded-full bg-white/10"><Check size={12} /></span>{item}</div>)}</div></section><section className="px-7 py-9 sm:px-10 sm:py-12"><p className="text-xs font-medium text-muted">{email}</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-ink">Tell us a little about you</h2><p className="mt-2 text-sm leading-relaxed text-muted">These details personalize your workspace. You can change them later.</p><form onSubmit={submit} className="mt-7 space-y-4"><label className="block"><span className="mb-1.5 block text-xs font-medium text-body">Your name</span><input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Krishna Goyal" className={field} /></label><label className="block"><span className="mb-1.5 block text-xs font-medium text-body">Company or project</span><input required value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="Acme AI" className={field} /></label><label className="block"><span className="mb-1.5 block text-xs font-medium text-body">Your role</span><select required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={field}><option value="">Choose one</option><option>Founder</option><option>Engineering</option><option>Product</option><option>Developer relations</option><option>Platform / infrastructure</option><option>Other</option></select></label><label className="block"><span className="mb-1.5 block text-xs font-medium text-body">What are you measuring?</span><select required value={form.use_case} onChange={(e) => setForm({ ...form, use_case: e.target.value })} className={field}><option value="">Choose one</option><option>A public MCP server</option><option>An internal company MCP</option><option>An AI agent or workflow</option><option>Researching MCP observability</option></select></label>{error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<button disabled={saving} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white disabled:opacity-60">{saving ? <><Loader2 size={15} className="animate-spin" />Setting up</> : <>Create my workspace <ArrowRight size={15} /></>}</button></form><p className="mt-5 text-center text-xs text-faint"><Link href="/" className="hover:text-body">Back to TrackMCP</Link></p></section></div></div></main>;
}
