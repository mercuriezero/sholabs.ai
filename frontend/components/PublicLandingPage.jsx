"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, ChevronDown, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";
const STRIPES = ["#FFD900", "#2BBCC4", "#1FA84A", "#E200C4", "#ED1C24", "#2B39D1", "#F7941E", "#91268F"];

export default function PublicLandingPage() {
  const [page, setPage] = useState(undefined);
  const [openFaq, setOpenFaq] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", country: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("slug") || "";
    setSlug(s);
    if (!s) return setPage(null);
    fetch(`${API}/pages/${s}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setPage)
      .catch(() => setPage(null));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch(`${API}/pages/${slug}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error();
      setDone(true);
      toast.success("Thanks! Our team will reach out shortly.");
    } catch {
      toast.error("Couldn't submit. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (page === undefined) return <div className="flex min-h-screen items-center justify-center bg-white"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;
  if (page === null) return <div className="flex min-h-screen items-center justify-center bg-white text-neutral-500" data-testid="page-not-found">Page not found.</div>;

  return (
    <div className="min-h-screen bg-white" data-testid="public-landing-page">
      <div className="flex h-1.5">{STRIPES.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}</div>

      {/* Hero */}
      <header className="relative mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500">
          <Sparkles className="h-4 w-4 text-brand-magenta" /> {page.company}
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-black md:text-6xl" data-testid="landing-title">{page.title}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 md:text-lg">{page.hero || page.subtitle}</p>
        <button onClick={() => setFormOpen(true)} data-testid="landing-request-demo" className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg">
          Request a demo <ArrowUpRight className="h-4 w-4" />
        </button>
      </header>

      {/* Services */}
      <section className="border-t border-black/5 bg-neutral-50/60 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-black">What we deliver</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3" data-testid="landing-services">
            {(page.services || []).map((s, i) => (
              <div key={i} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl font-display text-sm font-bold text-white" style={{ background: STRIPES[i % STRIPES.length] }}>{i + 1}</span>
                <h3 className="mt-4 font-display text-lg font-semibold text-black">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{s.desc}</p>
                <button onClick={() => setFormOpen(true)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:underline">
                  Book now <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      {(page.faqs || []).length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-black">Frequently asked questions</h2>
            <div className="mt-8 space-y-3" data-testid="landing-faqs">
              {page.faqs.map((f, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-black/5 bg-white">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
                    <span className="text-sm font-semibold text-black">{f.q}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && <p className="border-t border-black/5 px-5 py-4 text-sm leading-relaxed text-neutral-600">{f.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-black/5 py-10 text-center text-xs text-neutral-400">
        Powered by High On AI · Human intelligence + AI for growth
      </footer>

      {/* Lead form modal */}
      <AnimatePresence>
        {formOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6" data-testid="landing-form-modal">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFormOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} className="relative w-full max-w-md rounded-[28px] border border-black/5 bg-white p-8 shadow-2xl">
              <button onClick={() => setFormOpen(false)} data-testid="landing-form-close" className="absolute right-5 top-5 text-neutral-400 hover:text-black"><X className="h-5 w-5" /></button>
              {done ? (
                <div className="py-8 text-center" data-testid="landing-form-done">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/10"><Check className="h-6 w-6 text-brand-green" /></span>
                  <h3 className="mt-4 font-display text-xl font-semibold text-black">You're on the list</h3>
                  <p className="mt-2 text-sm text-neutral-500">Our team will reach out within 24 hours.</p>
                </div>
              ) : (
                <>
                  <h3 className="font-display text-2xl font-semibold tracking-tight text-black">Request a call back</h3>
                  <p className="mt-1 text-sm text-neutral-500">Leave your details and we'll be in touch.</p>
                  <form onSubmit={submit} className="mt-5 space-y-3">
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="landing-form-name" placeholder="Full name" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-sm outline-none focus:border-black/40" />
                    <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} data-testid="landing-form-company" placeholder="Company" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-sm outline-none focus:border-black/40" />
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="landing-form-email" placeholder="Work email" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-sm outline-none focus:border-black/40" />
                    <div className="grid grid-cols-2 gap-3">
                      <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="landing-form-phone" placeholder="Phone" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-sm outline-none focus:border-black/40" />
                      <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} data-testid="landing-form-country" placeholder="Country" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-sm outline-none focus:border-black/40" />
                    </div>
                    <button type="submit" disabled={busy} data-testid="landing-form-submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60">
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
