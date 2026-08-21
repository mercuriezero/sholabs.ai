"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Globe, Loader2, ArrowRight, X, Users, Swords, TrendingUp, Wrench } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

const PILLARS = [
  { icon: Users, label: "ICP & personas", color: "#2B39D1" },
  { icon: Swords, label: "Competitor map", color: "#ED1C24" },
  { icon: TrendingUp, label: "Revenue opportunities", color: "#1FA84A" },
  { icon: Wrench, label: "Recommended stack", color: "#F7941E" },
];

export default function Onboarding() {
  const { user, setUser } = useAuth();
  const [step, setStep] = useState("intro"); // intro | running | done
  const [url, setUrl] = useState("");
  const [goal, setGoal] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (typeof window === "undefined") return null;
  // Only show for freshly signed-up users who have not onboarded yet.
  if (!user || user.onboarded !== false) return null;

  const finish = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/account/onboard`, { method: "POST", credentials: "include" });
    } catch (e) {
      /* non-blocking */
    }
    setUser({ ...user, onboarded: true });
  };

  const runResearch = async () => {
    if (!url.trim()) return;
    setStep("running");
    setOutput("");
    setError("");
    const prompt =
      `Business website: ${url.trim()}. ` +
      (goal.trim() ? `Primary goal: ${goal.trim()}. ` : "") +
      `Research my ICP and target personas, my top competitors, and the revenue-growth opportunities to scale existing and open new revenue streams. Recommend which High On AI services to deploy first.`;
    try {
      const res = await fetch(`${API}/research/stream`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.slice(0, 1990), source: "onboarding" }),
      });
      if (!res.ok || !res.body) throw new Error("failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const part of parts) {
          const line = part.replace(/^data:\s?/, "").trim();
          if (!line) continue;
          try {
            const obj = JSON.parse(line);
            if (obj.token) setOutput((o) => o + obj.token);
            if (obj.error) setError(obj.error);
            if (obj.done) setStep("done");
          } catch {
            /* ignore keep-alive */
          }
        }
      }
      setStep((s) => (s === "running" ? "done" : s));
    } catch (e) {
      setError("Research failed. Please try again.");
      setStep("intro");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm px-4 py-8" data-testid="onboarding-overlay">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-black/5 bg-white shadow-2xl">
        <div className="hero-grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <button onClick={finish} aria-label="Skip onboarding" data-testid="onboarding-skip" className="absolute right-5 top-5 z-10 text-neutral-400 transition-colors hover:text-black">
          <X className="h-5 w-5" />
        </button>

        <div className="relative p-7 md:p-10">
          <div className="flex items-center gap-2">
            <span className="stripe-gradient h-[3px] w-8 rounded-full" aria-hidden="true" />
            <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500">Welcome to High On AI</span>
          </div>

          {step === "intro" && (
            <>
              <h2 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-tight text-black md:text-4xl">
                Let&apos;s scan your business, <span className="glassy-brand-text">{user.name ? user.name.split(" ")[0] : "founder"}.</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-500">
                Drop your website and our AI growth agent runs a live 360 · your ICP, competitors, and the fastest
                paths to more revenue.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PILLARS.map((p) => (
                  <div key={p.label} className="flex items-center gap-2 rounded-2xl border border-black/5 bg-white/70 px-3 py-2.5">
                    <p.icon className="h-4 w-4 shrink-0" style={{ color: p.color }} />
                    <span className="text-xs font-medium text-neutral-600">{p.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 space-y-3">
                <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 focus-within:border-brand-blue">
                  <Globe className="h-4 w-4 shrink-0 text-neutral-400" />
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && runResearch()}
                    placeholder="yourcompany.com"
                    data-testid="onboarding-url-input"
                    className="w-full bg-transparent text-sm text-black outline-none placeholder:text-neutral-400"
                  />
                </div>
                <input
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Optional · what are you chasing? (e.g. $1M ARR, more demos)"
                  data-testid="onboarding-goal-input"
                  className="w-full rounded-full border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-neutral-400 focus:border-brand-blue"
                />
              </div>

              {error && <p className="mt-3 text-xs text-brand-red">{error}</p>}

              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
                <button
                  onClick={runResearch}
                  disabled={!url.trim()}
                  data-testid="onboarding-run-button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  <Sparkles className="h-4 w-4" /> Run my growth 360
                </button>
                <button onClick={finish} data-testid="onboarding-skip-text" className="text-sm font-medium text-neutral-400 transition-colors hover:text-black">
                  Skip for now
                </button>
              </div>
            </>
          )}

          {(step === "running" || step === "done") && (
            <>
              <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight text-black md:text-3xl">
                {step === "running" ? (
                  <span className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin text-brand-blue" /> Researching {url}…</span>
                ) : (
                  <span>Your growth 360 is ready.</span>
                )}
              </h2>
              <div
                data-testid="onboarding-output"
                className="mt-5 max-h-[46vh] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-black/5 bg-white/80 p-5 text-sm leading-relaxed text-neutral-700"
              >
                {output || (step === "running" ? "Warming up the research agent…" : "")}
              </div>
              {error && <p className="mt-3 text-xs text-brand-red">{error}</p>}
              {step === "done" && (
                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
                  <button
                    onClick={finish}
                    disabled={saving}
                    data-testid="onboarding-finish-button"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 sm:w-auto"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Enter dashboard <ArrowRight className="h-4 w-4" /></>}
                  </button>
                  <p className="text-xs text-neutral-400">Saved to your account · revisit it anytime under My account.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
