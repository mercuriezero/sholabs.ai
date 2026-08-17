"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Target, Timer, X } from "lucide-react";
import PayButton from "@/components/PayButton";
import { CXO_PACKS } from "@/components/SuccessPacks";

const CAL = "https://cal.com/sunnyrai/30min";
const RATE = 2600; // flat $30/hour, charged in INR

// Effort scoped for a standard 12-week pace. market = what agencies + tools charge for the same outcome.
const GOALS = [
  { id: "geo", label: "Get cited by AI", sub: "Show up inside ChatGPT, Gemini and Perplexity answers", hours: 40, market: 220000 },
  { id: "pipeline", label: "₹10L revenue pipeline", sub: "Qualified meetings and demand, fast", hours: 60, market: 420000 },
  { id: "revenue", label: "₹1Cr revenue run-rate", sub: "A full growth engine that compounds", hours: 120, market: 900000 },
  { id: "reach", label: "Brand reach · 1M+ impressions", sub: "Video-first awareness at scale", hours: 50, market: 350000 },
  { id: "launch", label: "Launch a new product", sub: "Positioning, GTM and demand in one sprint", hours: 90, market: 600000 },
];

// Compressing the timeline means parallel workstreams and senior hours up front, so investment rises.
const TIMELINES = [
  { id: "4w", label: "4 weeks", weeks: 4, mult: 1.9 },
  { id: "8w", label: "8 weeks", weeks: 8, mult: 1.4 },
  { id: "12w", label: "12 weeks", weeks: 12, mult: 1 },
  { id: "6m", label: "6 months", weeks: 26, mult: 0.8 },
];

export default function Estimator({ open, onClose }) {
  const [goal, setGoal] = useState("pipeline");
  const [timeline, setTimeline] = useState("12w");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const estimate = useMemo(() => {
    const g = GOALS.find((x) => x.id === goal);
    const t = TIMELINES.find((x) => x.id === timeline);
    if (!g || !t) return null;
    const hours = Math.ceil(g.hours * t.mult);
    const cost = hours * RATE;
    const weekly = Math.max(1, Math.round(hours / t.weeks));
    const market = Math.round(g.market * (t.mult > 1 ? 1 + (t.mult - 1) * 0.5 : 1));
    const savingsPct = Math.min(75, Math.max(0, Math.round((1 - cost / market) * 100)));
    const biggest = CXO_PACKS[CXO_PACKS.length - 1];
    const pack = CXO_PACKS.find((p) => p.hours >= hours) || biggest;
    return { hours, cost, weekly, market, savingsPct, pack, custom: hours > biggest.hours, weeks: t.weeks };
  }, [goal, timeline]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-center justify-center p-6"
          data-testid="estimator-modal"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-black/5 bg-white p-8 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Project estimator"
          >
            <button onClick={onClose} data-testid="estimator-close" aria-label="Close" className="absolute right-5 top-5 text-neutral-400 transition-colors hover:text-black">
              <X className="h-5 w-5" />
            </button>

            <h2 className="font-display text-2xl font-semibold tracking-tight text-black">Project Estimator</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              Tell us the goal you are chasing and how fast you want it. The tighter the timeline, the more
              parallel workstreams we run, and the higher the investment.
            </p>

            <p className="mt-6 flex items-center gap-2 text-sm font-medium text-neutral-700">
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
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      on ? "border-black bg-neutral-50 shadow-sm" : "border-neutral-200 hover:border-black/40"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-black">{g.label}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">{g.sub}</span>
                  </button>
                );
              })}
            </div>

            <p className="mt-6 flex items-center gap-2 text-sm font-medium text-neutral-700">
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
                    className={`rounded-full border px-5 py-2 text-sm font-medium transition-all ${
                      on ? "border-black bg-black text-white shadow-sm" : "border-neutral-200 text-neutral-600 hover:border-black/40 hover:text-black"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-black/5 bg-neutral-50/70 p-6" data-testid="estimator-result">
              {estimate && (
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-400">
                      Estimated scope · {estimate.hours} hours over {estimate.weeks} weeks · ~{estimate.weekly} hrs/week
                    </p>
                    <p className="mt-1 font-display text-3xl font-bold tracking-tight text-black" data-testid="estimator-cost">
                      ₹{estimate.cost.toLocaleString("en-IN")}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">Flat $30/hour · indicative, confirmed in your working session</p>
                    <p className="mt-3 text-sm text-neutral-600">
                      Agencies + tools for this goal: ≈ ₹{estimate.market.toLocaleString("en-IN")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-green" data-testid="estimator-savings">
                      You save ~{estimate.savingsPct}%
                    </p>
                    <p className="mt-3 text-sm text-neutral-600">
                      Recommended:{" "}
                      <span className="font-semibold" style={{ color: estimate.pack.color }} data-testid="estimator-recommendation">
                        {estimate.pack.name}
                      </span>
                      {estimate.custom && <span className="text-neutral-400"> · custom top-up, sized together</span>}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-3">
                    <PayButton
                      key={estimate.pack.name}
                      label={`Book ${estimate.pack.name.split(" · ")[0]}`}
                      testid="estimator-book-button"
                      context="cxo"
                      initialPackage={estimate.pack}
                    />
                    <a href={CAL} target="_blank" rel="noopener noreferrer" data-testid="estimator-call-link" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:underline">
                      Or talk it through first <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
