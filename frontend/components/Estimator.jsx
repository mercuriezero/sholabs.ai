"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Minus, Plus, Target, Timer, X } from "lucide-react";
import PayButton from "@/components/PayButton";

const CAL = "https://cal.com/sunnyrai/30min";
const CXO_RATE = 2600; // flat $30/hour, charged in INR, billed hourly only

const PRICE = {
  video: 7000, // per video
  pageBlock: 80000, // per 20 GEO/LLM citation pages
  voiceSetup: 100000, // per agent + ₹10/min usage on actuals
  sdr: 200000, // per motion + ₹10/min usage on actuals
  social: 60000, // per month
};

const ugcUnit = (qty) => (qty >= 5000 ? 6000 : qty >= 500 ? 7000 : 10000);

const AFF_TIERS = [
  { id: "none", label: "None", monthly: 0 },
  { id: "starter", label: "Starter", monthly: 20000 },
  { id: "growth", label: "Growth", monthly: 60000 },
  { id: "pro", label: "Pro", monthly: 125000 },
];

const TIMELINES = [
  { id: "4w", label: "4 weeks", weeks: 4, mult: 1.9, months: 1 },
  { id: "8w", label: "8 weeks", weeks: 8, mult: 1.4, months: 2 },
  { id: "12w", label: "12 weeks", weeks: 12, mult: 1, months: 3 },
  { id: "6m", label: "6 months", weeks: 26, mult: 0.8, months: 6 },
];

// Base scope for each goal at a standard 12-week pace.
const GOALS = [
  { id: "geo", label: "Get cited by AI", sub: "Show up inside ChatGPT, Gemini and Perplexity answers", cxo: 40,
    mix: { pages: 1, videos: 8, ugc: 6, voice: 0, sdr: 0, social: true, aff: "none" } },
  { id: "pipeline", label: "₹10L revenue pipeline", sub: "Qualified meetings and demand, fast", cxo: 60,
    mix: { pages: 1, videos: 6, ugc: 0, voice: 1, sdr: 1, social: false, aff: "none" } },
  { id: "revenue", label: "₹1Cr revenue run-rate", sub: "A full growth engine that compounds", cxo: 120,
    mix: { pages: 2, videos: 16, ugc: 12, voice: 1, sdr: 1, social: true, aff: "growth" } },
  { id: "reach", label: "Brand reach · 1M+ impressions", sub: "Video-first awareness at scale", cxo: 50,
    mix: { pages: 0, videos: 20, ugc: 15, voice: 0, sdr: 0, social: true, aff: "none" } },
  { id: "launch", label: "Launch a new product", sub: "Positioning, GTM and demand in one sprint", cxo: 90,
    mix: { pages: 1, videos: 10, ugc: 8, voice: 0, sdr: 1, social: true, aff: "none" } },
];

// What agencies + tools typically charge for the same scope (market rates researched Aug 2026).
const MARKET = { video: 18000, pageBlock: 140000, ugc: 20000, voice: 250000, sdr: 300000, social: 100000, cxoHour: 6500, affMult: 1.8 };

const inr = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function Stepper({ value, onChange, min = 0, max = 999, step = 1, testid }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        data-testid={`${testid}-minus`}
        aria-label="Decrease"
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 transition-colors hover:border-black/40"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="w-10 text-center text-sm font-semibold text-black" data-testid={`${testid}-value`}>{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        data-testid={`${testid}-plus`}
        aria-label="Increase"
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 transition-colors hover:border-black/40"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function Estimator({ open, onClose }) {
  const [goal, setGoal] = useState("pipeline");
  const [timeline, setTimeline] = useState("12w");
  const [videos, setVideos] = useState(6);
  const [pages, setPages] = useState(1);
  const [ugc, setUgc] = useState(0);
  const [voice, setVoice] = useState(1);
  const [sdr, setSdr] = useState(1);
  const [socialMonths, setSocialMonths] = useState(0);
  const [aff, setAff] = useState("none");
  const [cxoHours, setCxOHours] = useState(60);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Auto-suggest quantities from goal + timeline; the visitor can adjust anything afterwards.
  useEffect(() => {
    const g = GOALS.find((x) => x.id === goal);
    const t = TIMELINES.find((x) => x.id === timeline);
    if (!g || !t) return;
    const scale = (n) => (n > 0 ? Math.max(1, Math.round(n * t.mult)) : 0);
    setVideos(scale(g.mix.videos));
    setPages(scale(g.mix.pages));
    setUgc(scale(g.mix.ugc));
    setVoice(g.mix.voice);
    setSdr(g.mix.sdr);
    setSocialMonths(g.mix.social ? t.months : 0);
    setAff(g.mix.aff);
    setCxOHours(Math.round(g.cxo * t.mult));
  }, [goal, timeline]);

  const estimate = useMemo(() => {
    const g = GOALS.find((x) => x.id === goal);
    const t = TIMELINES.find((x) => x.id === timeline);
    if (!g || !t) return null;
    const lines = [];
    if (videos > 0) lines.push({ label: `AI Videos · ${videos} × ${inr(PRICE.video)}`, cost: videos * PRICE.video });
    if (pages > 0) lines.push({ label: `GEO pages · ${pages * 20} pages (${pages} × ${inr(PRICE.pageBlock)})`, cost: pages * PRICE.pageBlock });
    if (ugc > 0) lines.push({ label: `UGC ad creatives · ${ugc} × ${inr(ugcUnit(ugc))}`, cost: ugc * ugcUnit(ugc) });
    if (voice > 0) lines.push({ label: `Voice AI · ${voice} agent${voice > 1 ? "s" : ""} setup`, cost: voice * PRICE.voiceSetup, usage: true });
    if (sdr > 0) lines.push({ label: "AI SDR outbound motion", cost: PRICE.sdr, usage: true });
    if (socialMonths > 0) lines.push({ label: `Social media · ${socialMonths} mo × ${inr(PRICE.social)}`, cost: socialMonths * PRICE.social });
    const tier = AFF_TIERS.find((x) => x.id === aff);
    if (tier && tier.monthly > 0) lines.push({ label: `Affiliate & Partners · ${tier.label} × ${t.months} mo`, cost: tier.monthly * t.months });
    const services = lines.reduce((s, l) => s + l.cost, 0);
    const cxoCost = cxoHours * CXO_RATE;
    const total = services + cxoCost;
    let market = videos * MARKET.video + pages * MARKET.pageBlock + ugc * MARKET.ugc + voice * MARKET.voice + sdr * MARKET.sdr + socialMonths * MARKET.social + cxoHours * MARKET.cxoHour;
    if (tier && tier.monthly > 0) market += Math.round(tier.monthly * MARKET.affMult) * t.months;
    market = Math.round(market * (t.mult > 1 ? 1 + (t.mult - 1) * 0.5 : 1));
    const savingsPct = total > 0 ? Math.min(75, Math.max(0, Math.round((1 - total / market) * 100))) : 0;
    return { lines, services, cxoCost, total, market, savingsPct, usage: voice > 0 || sdr > 0, weekly: Math.max(1, Math.round(cxoHours / t.weeks)) };
  }, [goal, timeline, videos, pages, ugc, voice, sdr, socialMonths, aff, cxoHours]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && estimate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-center justify-center p-4 md:p-6"
          data-testid="estimator-modal"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-black/5 bg-white p-6 shadow-2xl md:p-8"
            role="dialog"
            aria-modal="true"
            aria-label="Project estimator"
          >
            <button onClick={onClose} data-testid="estimator-close" aria-label="Close" className="absolute right-5 top-5 text-neutral-400 transition-colors hover:text-black">
              <X className="h-5 w-5" />
            </button>

            <h2 className="font-display text-2xl font-semibold tracking-tight text-black">Project Estimator</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              Pick your goal and timeline. We suggest the scope; you adjust the quantities. Service products are
              priced per unit, CXO leadership is billed separately by the hour.
            </p>

            <p className="mt-5 flex items-center gap-2 text-sm font-medium text-neutral-700">
              <Target className="h-4 w-4 text-brand-magenta" /> Your goal
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {GOALS.map((g) => {
                const on = goal === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    data-testid={`estimator-goal-${g.id}`}
                    aria-pressed={on}
                    className={`rounded-2xl border p-3.5 text-left transition-all ${
                      on ? "border-black bg-neutral-50 shadow-sm" : "border-neutral-200 hover:border-black/40"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-black">{g.label}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">{g.sub}</span>
                  </button>
                );
              })}
            </div>

            <p className="mt-5 flex items-center gap-2 text-sm font-medium text-neutral-700">
              <Timer className="h-4 w-4 text-brand-blue" /> You want it in
            </p>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Timeline">
              {TIMELINES.map((t) => {
                const on = timeline === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTimeline(t.id)}
                    data-testid={`estimator-timeline-${t.id}`}
                    aria-pressed={on}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                      on ? "border-black bg-black text-white shadow-sm" : "border-neutral-200 text-neutral-600 hover:border-black/40 hover:text-black"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">Service products · per-unit pricing</p>
            <div className="mt-2 divide-y divide-neutral-100 rounded-2xl border border-neutral-200" data-testid="estimator-scope">
              <div className="flex items-center justify-between gap-3 p-3.5">
                <div><p className="text-sm font-medium text-black">AI Videos</p><p className="text-xs text-neutral-400">{inr(PRICE.video)} per video</p></div>
                <Stepper value={videos} onChange={setVideos} max={500} testid="estimator-videos" />
              </div>
              <div className="flex items-center justify-between gap-3 p-3.5">
                <div><p className="text-sm font-medium text-black">GEO / LLM citation pages</p><p className="text-xs text-neutral-400">{inr(PRICE.pageBlock)} per 20 pages</p></div>
                <Stepper value={pages} onChange={setPages} max={10} testid="estimator-pages" />
              </div>
              <div className="flex items-center justify-between gap-3 p-3.5">
                <div><p className="text-sm font-medium text-black">UGC ad creatives</p><p className="text-xs text-neutral-400">{inr(ugcUnit(ugc))} per creative · volume tiers at 500+</p></div>
                <Stepper value={ugc} onChange={setUgc} max={5000} step={5} testid="estimator-ugc" />
              </div>
              <div className="flex items-center justify-between gap-3 p-3.5">
                <div><p className="text-sm font-medium text-black">Voice AI agents</p><p className="text-xs text-neutral-400">{inr(PRICE.voiceSetup)} setup per agent + usage</p></div>
                <Stepper value={voice} onChange={setVoice} max={3} testid="estimator-voice" />
              </div>
              <div className="flex items-center justify-between gap-3 p-3.5">
                <div><p className="text-sm font-medium text-black">AI SDR outbound</p><p className="text-xs text-neutral-400">{inr(PRICE.sdr)} per motion + usage</p></div>
                <Stepper value={sdr} onChange={setSdr} max={2} testid="estimator-sdr" />
              </div>
              <div className="flex items-center justify-between gap-3 p-3.5">
                <div><p className="text-sm font-medium text-black">Social media</p><p className="text-xs text-neutral-400">{inr(PRICE.social)} per month</p></div>
                <Stepper value={socialMonths} onChange={setSocialMonths} max={12} testid="estimator-social" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5">
                <div><p className="text-sm font-medium text-black">Affiliate &amp; Partners</p><p className="text-xs text-neutral-400">₹15,000 to ₹1,25,000+ per month by tier</p></div>
                <div className="flex gap-1.5" role="group" aria-label="Affiliate tier">
                  {AFF_TIERS.map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setAff(tier.id)}
                      data-testid={`estimator-aff-${tier.id}`}
                      aria-pressed={aff === tier.id}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                        aff === tier.id ? "border-black bg-black text-white" : "border-neutral-200 text-neutral-600 hover:border-black/40"
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">Fractional CXO · billed hourly only</p>
            <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-3.5">
              <div><p className="text-sm font-medium text-black">CXO leadership hours</p><p className="text-xs text-neutral-400">{inr(CXO_RATE)} per hour · ~{estimate.weekly} hrs/week over your timeline</p></div>
              <Stepper value={cxoHours} onChange={setCxOHours} min={0} max={400} step={5} testid="estimator-cxo" />
            </div>

            <div className="mt-6 rounded-2xl border border-black/5 bg-neutral-50/70 p-6" data-testid="estimator-result">
              <ul className="space-y-1.5" data-testid="estimator-lines">
                {estimate.lines.map((l) => (
                  <li key={l.label} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-neutral-600">{l.label}{l.usage && <span className="text-neutral-400"> *</span>}</span>
                    <span className="flex-1 border-b border-dotted border-neutral-300" aria-hidden="true" />
                    <span className="font-medium text-black">{inr(l.cost)}</span>
                  </li>
                ))}
              </ul>
              {estimate.lines.length > 0 && (
                <div className="mt-3 flex items-baseline justify-between text-sm">
                  <span className="text-neutral-500">Service products subtotal</span>
                  <span className="font-semibold text-black" data-testid="estimator-services-subtotal">{inr(estimate.services)}</span>
                </div>
              )}
              <div className="mt-1.5 flex items-baseline justify-between text-sm">
                <span className="text-neutral-500">CXO hours · {cxoHours} × {inr(CXO_RATE)}</span>
                <span className="font-semibold text-black" data-testid="estimator-cxo-subtotal">{inr(estimate.cxoCost)}</span>
              </div>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-black/10 pt-4">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-400">Total indicative investment</p>
                  <p className="mt-1 font-display text-3xl font-bold tracking-tight text-black" data-testid="estimator-cost">{inr(estimate.total)}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Agencies + tools for this goal: ≈ {inr(estimate.market)} · <span className="font-semibold text-brand-green" data-testid="estimator-savings">you save ~{estimate.savingsPct}%</span>
                  </p>
                  {estimate.usage && (
                    <p className="mt-2 text-xs text-neutral-400">* Voice AI and AI SDR usage billed on actuals at ₹10/minute.</p>
                  )}
                </div>
                <div className="flex flex-col items-start gap-3">
                  <PayButton
                    key={estimate.total}
                    label="Lock this scope"
                    testid="estimator-book-button"
                    initialPackage={{ name: `Estimated scope · ${GOALS.find((g) => g.id === goal)?.label || "growth engine"}`, price: estimate.total }}
                  />
                  <a href={CAL} target="_blank" rel="noopener noreferrer" data-testid="estimator-call-link" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:underline">
                    Or talk it through first <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
