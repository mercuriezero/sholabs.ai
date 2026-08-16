"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";

const DEMO_URL = "yourbrand.com";
const DEMO_GOAL = "grow demo bookings from AI search";

const PLAN_LINES = [
  { head: "Get Cited", body: "Rewrite 5 money pages into LLM-quotable answers with FAQ schema" },
  { head: "Get Watched", body: "Ship 3 founder-led videos per week, auto-cut for LinkedIn and YouTube" },
  { head: "Get Chosen", body: "Voice agent follows up every inbound lead within 60 seconds" },
  { head: "First 2 weeks", body: "Audit done, citation baseline live on your dashboard" },
];

const STEPS = [
  ["01", "Tell us your website + your goal", "Drop in your brand URL and what you want to grow: pipeline, bookings, revenue, AI visibility."],
  ["02", "Get your plan, instantly", "Our AI agent audits where you are invisible to AI, to search, and to buyers, then recommends the exact strategy across the 3 pillars."],
  ["03", "Run a pilot", "Test the engine on one focused project before committing to anything bigger. Real output, not a slide deck."],
  ["04", "Scale with add-ons", "Add Get Cited, Get Watched, or Get Chosen at your pace. Every pillar lights up on your dashboard from day one."],
];

function DemoCard() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState("typing");
  const [typedUrl, setTypedUrl] = useState("");
  const [typedGoal, setTypedGoal] = useState("");
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (reduce) {
      setTypedUrl(DEMO_URL);
      setTypedGoal(DEMO_GOAL);
      setPhase("output");
      setShown(PLAN_LINES.length);
      return;
    }
    let cancelled = false;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      while (!cancelled) {
        setTypedUrl("");
        setTypedGoal("");
        setShown(0);
        setPhase("typing");
        await sleep(600);
        for (let i = 1; i <= DEMO_URL.length; i++) {
          if (cancelled) return;
          setTypedUrl(DEMO_URL.slice(0, i));
          await sleep(70);
        }
        await sleep(350);
        for (let i = 1; i <= DEMO_GOAL.length; i++) {
          if (cancelled) return;
          setTypedGoal(DEMO_GOAL.slice(0, i));
          await sleep(42);
        }
        await sleep(400);
        setPhase("generating");
        await sleep(1300);
        if (cancelled) return;
        setPhase("output");
        for (let i = 1; i <= PLAN_LINES.length; i++) {
          if (cancelled) return;
          setShown(i);
          await sleep(450);
        }
        await sleep(4200);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reduce]);

  const typingGoal = phase === "typing" && typedUrl.length === DEMO_URL.length;

  return (
    <div className="relative" data-testid="process-demo">
      <div className="absolute -inset-3 rounded-[36px] bg-brand-magenta/5" aria-hidden="true" />
      <div className="relative rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_32px_90px_-30px_rgba(10,10,10,0.25)] md:p-7">
        <div className="flex items-center gap-2.5 border-b border-black/5 pb-4">
          <span className="stripe-gradient h-4 w-1.5 rounded-full" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-wide text-neutral-500">highon.ai · instant plan</span>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-3">
            <span className="w-16 shrink-0 text-[10px] uppercase tracking-widest text-neutral-400">Website</span>
            <span className={`text-sm text-black ${!typingGoal && phase === "typing" ? "type-caret" : ""}`} data-testid="demo-url">
              {typedUrl}
            </span>
          </div>
          <div className="flex items-center rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-3">
            <span className="w-16 shrink-0 text-[10px] uppercase tracking-widest text-neutral-400">Goal</span>
            <span className={`text-sm text-black ${typingGoal ? "type-caret" : ""}`} data-testid="demo-goal">
              {typedGoal}
            </span>
          </div>
          <div className="flex justify-end">
            <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition-transform ${phase === "generating" ? "scale-110" : ""}`}>
              {phase === "generating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            </span>
          </div>
        </div>

        <div className="mt-2 min-h-[220px] rounded-2xl border border-black/5 bg-neutral-50/70 p-5" data-testid="demo-output">
          {phase === "generating" && (
            <p className="flex items-center gap-2 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Auditing your brand across AI, search and video…
            </p>
          )}
          {phase === "output" && (
            <div className="space-y-3">
              {PLAN_LINES.slice(0, shown).map((l) => (
                <motion.div key={l.head} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-start gap-3">
                  <span className="stripe-gradient mt-1.5 h-8 w-1 shrink-0 rounded-full" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-black">{l.head}</p>
                    <p className="text-xs leading-relaxed text-neutral-500">{l.body}</p>
                  </div>
                </motion.div>
              ))}
              {shown === PLAN_LINES.length && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-1 text-[10px] uppercase tracking-widest text-brand-green">
                  Plan ready · no call needed
                </motion.p>
              )}
            </div>
          )}
          {phase === "typing" && (
            <p className="text-sm text-neutral-300">Your plan appears here…</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Process() {
  return (
    <section id="process" className="scroll-mt-20 border-t border-black/5 py-24 md:py-32" data-testid="process-section">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">01 · How it works</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-black md:text-5xl" data-testid="process-heading">
            No sales call to get started. No waiting on a strategist. <span className="text-neutral-400">Just:</span>
          </h2>
          <ol className="mt-10 space-y-6">
            {STEPS.map(([n, title, desc]) => (
              <li key={n} className="flex gap-5" data-testid={`process-step-${n}`}>
                <span className="font-display text-2xl font-bold text-black/15">{n}</span>
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-black">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-500">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <a
            href="#hero-cta"
            data-testid="process-cta"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Get your plan <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <DemoCard />
      </div>
    </section>
  );
}
