"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Globe, Loader2, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

const STEPS = [
  "Scanning your website content",
  "Understanding your products, services and ideal customer",
  "Finding what your customers search for on Google",
  "Finding what they ask ChatGPT, Gemini and beyond",
];

export default function PortalScan() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [goal, setGoal] = useState("");
  const [scanning, setScanning] = useState(false);
  const [step, setStep] = useState(0);
  const [existing, setExisting] = useState(undefined);

  useEffect(() => {
    fetch(`${API}/portal/analysis`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setExisting(d && d.id ? d : null))
      .catch(() => setExisting(null));
  }, []);

  useEffect(() => {
    if (!scanning) return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2500);
    return () => clearInterval(t);
  }, [scanning]);

  const runScan = async () => {
    if (!url.trim()) return toast.error("Enter your website URL");
    setScanning(true);
    setStep(0);
    try {
      const r = await fetch(`${API}/portal/scan`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), goal: goal.trim() }),
      });
      if (!r.ok) throw new Error();
      await r.json();
      toast.success("Scan complete · here are your opportunities");
      router.push("/portal/opportunities");
    } catch {
      setScanning(false);
      toast.error("Scan failed. Please check the URL and try again.");
    }
  };

  if (scanning) {
    return (
      <div className="grid gap-8 lg:grid-cols-2" data-testid="portal-scanning">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-black md:text-4xl">
            Finding opportunities for you to be <span className="glassy-brand-text">more visible online</span>
          </h1>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
            <div className="stripe-gradient h-full rounded-full transition-all duration-700" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
          <ul className="mt-8 space-y-4">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm" data-testid={`scan-step-${i}`}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${i <= step ? "bg-brand-green text-white" : "bg-neutral-200 text-neutral-400"}`}>
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i === step ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : i + 1}
                </span>
                <span className={i <= step ? "font-medium text-black" : "text-neutral-400"}>{s}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-neutral-500">Analyzing <span className="font-semibold text-black">{url}</span> · this takes up to a minute.</p>
        </div>
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2.5">
            <Search className="h-4 w-4 text-neutral-400" />
            <span className="truncate text-sm text-neutral-500">analysing search demand for your buyers…</span>
          </div>
          <div className="mt-4 space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-neutral-100" style={{ animationDelay: `${i * 120}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-6" data-testid="portal-scan">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500">
        <Sparkles className="h-4 w-4 text-brand-magenta" /> Demand intelligence
      </div>
      <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-black md:text-5xl">
        Find the demand your site is <span className="glassy-brand-text">missing.</span>
      </h1>
      <p className="mt-4 text-base leading-relaxed text-neutral-500">
        Drop in your website. We scan your products and ideal customer, then surface the exact buyer queries prospects
        are searching on Google and ChatGPT right now — and where you are invisible.
      </p>

      {existing && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm" data-testid="portal-existing-scan">
          <span className="text-sm text-neutral-600">
            Last scan: <span className="font-semibold text-black">{existing.company || existing.url}</span> · {existing.queries?.length || 0} opportunities
          </span>
          <button onClick={() => router.push("/portal/opportunities")} data-testid="portal-view-opportunities" className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-0.5">
            View opportunities <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Your website</label>
        <div className="mt-2 flex items-center rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4">
          <Globe className="h-4 w-4 text-neutral-400" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runScan()}
            data-testid="scan-url-input"
            placeholder="https://www.yourcompany.com"
            className="w-full bg-transparent px-3 py-3 text-sm outline-none"
          />
        </div>
        <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-neutral-400">Your goal (optional)</label>
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          data-testid="scan-goal-input"
          placeholder="e.g. book more demos from mid-market SaaS buyers"
          className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-sm outline-none focus:border-black/40"
        />
        <button
          onClick={runScan}
          data-testid="scan-start-button"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          Start AI analysis <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
