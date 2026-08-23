"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, ChevronDown, Minus, Plus, Sparkles } from "lucide-react";
import PayButton from "@/components/PayButton";

const CAL = "https://cal.com/sunnyrai/30min";
const CXO_RATE = 30; // flat $30/hour, billed hourly only

const PRICE = {
  video: 85, // per video
  pageBlock: 950, // per 20 GEO/LLM citation pages
  voiceSetup: 1150, // per agent + $0.12/min usage on actuals
  sdr: 2300, // deprecated · AI SDR removed from offering
  social: 700, // per month
};

const ugcUnit = (qty) => (qty >= 5000 ? 70 : qty >= 500 ? 80 : 115);

const AFF_TIERS = [
  { id: "none", label: "None", monthly: 0 },
  { id: "starter", label: "Starter", monthly: 230 },
  { id: "growth", label: "Growth", monthly: 700 },
  { id: "pro", label: "Pro", monthly: 1450 },
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
  { id: "pipeline", label: "$120K revenue pipeline", sub: "Qualified meetings and demand, fast", cxo: 60,
    mix: { pages: 1, videos: 6, ugc: 0, voice: 1, sdr: 1, social: false, aff: "none" } },
  { id: "revenue", label: "$1.2M revenue run-rate", sub: "A full growth engine that compounds", cxo: 120,
    mix: { pages: 2, videos: 16, ugc: 12, voice: 1, sdr: 1, social: true, aff: "growth" } },
  { id: "reach", label: "Brand reach · 1M+ impressions", sub: "Video-first awareness at scale", cxo: 50,
    mix: { pages: 0, videos: 20, ugc: 15, voice: 0, sdr: 0, social: true, aff: "none" } },
  { id: "launch", label: "Launch a new product", sub: "Positioning, GTM and demand in one sprint", cxo: 90,
    mix: { pages: 1, videos: 10, ugc: 8, voice: 0, sdr: 1, social: true, aff: "none" } },
  { id: "other", label: "Other · custom goal", sub: "Tell us what you are chasing and we will scope it together", cxo: 0,
    mix: { pages: 0, videos: 0, ugc: 0, voice: 0, sdr: 0, social: false, aff: "none" } },
];

// What agencies + tools typically charge for the same scope (market rates researched Aug 2026).
const MARKET = { video: 210, pageBlock: 1650, ugc: 230, voice: 2900, sdr: 3450, social: 1150, cxoHour: 75, affMult: 1.8 };

const SERVICES = [
  { id: "videos", name: "AI Videos", price: "$85 / video", color: "#F7941E",
    blurb: "A weekly video engine: scripted, generated and repurposed for every channel.",
    includes: ["Hook-first scripts written for your category", "AI presenters, voiceover, captions and edits", "Repurposed into Shorts, Reels and LinkedIn cuts"] },
  { id: "pages", name: "GEO / LLM citation pages", price: "$950 / 20 pages", color: "#2B39D1",
    blurb: "Pages engineered so ChatGPT, Gemini and Perplexity cite you.",
    includes: ["Question-led research mapped to buyer prompts", "Structured answers, schema and citations LLMs trust", "Internal linking and refresh cadence built in"] },
  { id: "ugc", name: "UGC ad creatives", price: "from $115 / creative", color: "#ED1C24",
    blurb: "Creator-style ads that convert, without creator logistics.",
    includes: ["Scroll-stopping hooks and script variations", "AI presenters matched to your audience", "Volume tiers: $80 at 500+, $70 at 5000+"] },
  { id: "voice", name: "Voice AI agents", price: "$1,150 setup / agent", color: "#2BBCC4",
    blurb: "Agents that answer, qualify and book meetings on live calls.",
    includes: ["Custom call flows tuned to your pitch", "Qualification, routing and calendar booking", "$0.12/minute usage billed on actuals"] },
  { id: "social", name: "Social media", price: "$700 / month", color: "#E200C4",
    blurb: "A content engine that keeps your brand loud every week.",
    includes: ["Monthly content calendar and production", "Founder and brand channel management", "Community replies and trend-jacking"] },
  { id: "aff", name: "Affiliate & Partners", price: "from $175 / month", color: "#91268F",
    blurb: "A partner program with tracking, payouts and recruitment done for you.",
    includes: ["Starter: up to 25 partners · 2% commission", "Growth: up to 100 partners · 1.5% commission", "Pro: unlimited, fully managed · 1% commission"] },
];

const CXO_CARD = { id: "cxo", name: "Fractional CXO", price: "$30 / hour", color: "#0A0A0A",
  blurb: "C-level growth leadership, billed hourly only. No retainer lock-in.",
  includes: ["Growth strategy, GEO direction and demand engine design", "Team and agency leadership with weekly reviews", "Board-ready reporting on pipeline and spend"] };

const inr = (n) => `$${Math.round(n).toLocaleString("en-US")}`;

function Stepper({ value, onChange, min = 0, max = 999, step = 1, testid }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={(e) => { e.stopPropagation(); onChange(Math.max(min, value - step)); }}
        data-testid={`${testid}-minus`}
        aria-label="Decrease"
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 transition-colors hover:border-black/40"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="w-10 text-center text-sm font-semibold text-black" data-testid={`${testid}-value`}>{value}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onChange(Math.min(max, value + step)); }}
        data-testid={`${testid}-plus`}
        aria-label="Increase"
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 transition-colors hover:border-black/40"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function Estimator() {
  const [goal, setGoal] = useState("pipeline");
  const [timeline, setTimeline] = useState("12w");
  const [videos, setVideos] = useState(6);
  const [pages, setPages] = useState(1);
  const [ugc, setUgc] = useState(0);
  const [voice, setVoice] = useState(1);
  const [socialMonths, setSocialMonths] = useState(0);
  const [aff, setAff] = useState("none");
  const [cxoHours, setCxOHours] = useState(60);
  const [suggested, setSuggested] = useState(new Set());
  const [openCard, setOpenCard] = useState(null);
  const [customGoal, setCustomGoal] = useState("");

  // Auto-suggest quantities from goal + timeline; the visitor can adjust anything afterwards.
  useEffect(() => {
    const g = GOALS.find((x) => x.id === goal);
    const t = TIMELINES.find((x) => x.id === timeline);
    if (!g || !t) return;
    const scale = (n) => (n > 0 ? Math.max(1, Math.round(n * t.mult)) : 0);
    const mix = {
      videos: scale(g.mix.videos),
      pages: scale(g.mix.pages),
      ugc: scale(g.mix.ugc),
      voice: g.mix.voice,
      social: g.mix.social ? t.months : 0,
      aff: g.mix.aff,
      cxo: Math.round(g.cxo * t.mult),
    };
    setVideos(mix.videos);
    setPages(mix.pages);
    setUgc(mix.ugc);
    setVoice(mix.voice);
    setSocialMonths(mix.social);
    setAff(mix.aff);
    setCxOHours(mix.cxo);
    setSuggested(new Set(Object.entries(mix).filter(([k, v]) => (k === "aff" ? v !== "none" : v > 0)).map(([k]) => k)));
  }, [goal, timeline]);

  const estimate = useMemo(() => {
    const t = TIMELINES.find((x) => x.id === timeline);
    if (!t) return null;
    const lines = [];
    if (videos > 0) lines.push({ label: `AI Videos · ${videos} × ${inr(PRICE.video)}`, cost: videos * PRICE.video });
    if (pages > 0) lines.push({ label: `GEO pages · ${pages * 20} pages (${pages} × ${inr(PRICE.pageBlock)})`, cost: pages * PRICE.pageBlock });
    if (ugc > 0) lines.push({ label: `UGC ad creatives · ${ugc} × ${inr(ugcUnit(ugc))}`, cost: ugc * ugcUnit(ugc) });
    if (voice > 0) lines.push({ label: `Voice AI · ${voice} agent${voice > 1 ? "s" : ""} setup`, cost: voice * PRICE.voiceSetup, usage: true });
    if (socialMonths > 0) lines.push({ label: `Social media · ${socialMonths} mo × ${inr(PRICE.social)}`, cost: socialMonths * PRICE.social });
    const tier = AFF_TIERS.find((x) => x.id === aff);
    if (tier && tier.monthly > 0) lines.push({ label: `Affiliate & Partners · ${tier.label} × ${t.months} mo`, cost: tier.monthly * t.months });
    const services = lines.reduce((s, l) => s + l.cost, 0);
    const cxoCost = cxoHours * CXO_RATE;
    const total = services + cxoCost;
    let market = videos * MARKET.video + pages * MARKET.pageBlock + ugc * MARKET.ugc + voice * MARKET.voice + socialMonths * MARKET.social + cxoHours * MARKET.cxoHour;
    if (tier && tier.monthly > 0) market += Math.round(tier.monthly * MARKET.affMult) * t.months;
    market = Math.round(market * (t.mult > 1 ? 1 + (t.mult - 1) * 0.5 : 1));
    const savingsPct = total > 0 ? Math.min(75, Math.max(0, Math.round((1 - total / market) * 100))) : 0;
    return { lines, services, cxoCost, total, market, savingsPct, usage: voice > 0, weekly: Math.max(1, Math.round(cxoHours / t.weeks)) };
  }, [timeline, videos, pages, ugc, voice, socialMonths, aff, cxoHours]);

  const qtyOf = { videos, pages, ugc, voice, social: socialMonths, cxo: cxoHours };
  const unitLabel = { videos: "videos", pages: "blocks of 20", ugc: "creatives", voice: "agents", social: "months", cxo: "hours" };

  const cardControl = (id) => {
    switch (id) {
      case "videos": return <Stepper value={videos} onChange={setVideos} max={500} testid="estimator-videos" />;
      case "pages": return <Stepper value={pages} onChange={setPages} max={10} testid="estimator-pages" />;
      case "ugc": return <Stepper value={ugc} onChange={setUgc} max={5000} step={5} testid="estimator-ugc" />;
      case "voice": return <Stepper value={voice} onChange={setVoice} max={3} testid="estimator-voice" />;
      case "social": return <Stepper value={socialMonths} onChange={setSocialMonths} max={12} testid="estimator-social" />;
      case "cxo": return <Stepper value={cxoHours} onChange={setCxOHours} min={0} max={400} step={5} testid="estimator-cxo" />;
      case "aff": return (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Affiliate tier">
          {AFF_TIERS.map((tier) => (
            <button
              key={tier.id}
              onClick={(e) => { e.stopPropagation(); setAff(tier.id); }}
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
      );
      default: return null;
    }
  };

  const renderCard = (s, inScope, isAff) => {
    const expanded = openCard === s.id;
    const qty = isAff ? (aff !== "none" ? AFF_TIERS.find((x) => x.id === aff)?.label : null) : qtyOf[s.id];
    return (
      <div
        key={s.id}
        className={`rounded-2xl border bg-white transition-all ${
          inScope ? "border-black shadow-sm" : "border-neutral-200 hover:border-black/30"
        }`}
      >
        <button
          onClick={() => setOpenCard(expanded ? null : s.id)}
          data-testid={`estimator-service-${s.id}`}
          aria-expanded={expanded}
          className="flex w-full items-center gap-3 p-3.5 text-left"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-xs font-bold text-white" style={{ background: s.color }}>
            {s.name.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-black">
              {s.name}
              {suggested.has(s.id) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-yellow/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-black">
                  <Sparkles className="h-2.5 w-2.5" /> Suggested
                </span>
              )}
            </span>
            <span className="block truncate text-xs text-neutral-400">{s.price}</span>
          </span>
          {inScope && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold text-white" data-testid={`estimator-inscope-${s.id}`}>
              <Check className="h-3 w-3" /> {isAff ? qty : `× ${qty}`}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="border-t border-neutral-100 px-4 pb-4 pt-3">
                <p className="text-xs leading-relaxed text-neutral-500">{s.blurb}</p>
                <ul className="mt-2 space-y-1">
                  {s.includes.map((inc) => (
                    <li key={inc} className="flex items-start gap-1.5 text-xs text-neutral-600">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-brand-green" /> {inc}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-neutral-500">
                    {isAff ? "Tier (billed for your timeline months)" : `Quantity · ${unitLabel[s.id]}`}
                  </span>
                  {cardControl(s.id)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <section className="relative overflow-hidden py-16 md:py-20" data-testid="estimator-section" id="estimator">
      <div className="hero-grid-bg pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="stripe-gradient h-[3px] w-8 rounded-full" aria-hidden="true" />
            <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500" data-testid="estimator-eyebrow">
              Pricing · transparent by default
            </span>
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tighter text-black sm:text-5xl lg:text-6xl" data-testid="estimator-heading">
            Build your growth engine, <span className="glassy-brand-text">priced like a product.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-neutral-500 md:text-lg">
            Pick a goal and a timeline. We suggest the scope; tap any service to see what is inside and adjust
            quantities. Service products are priced per unit · CXO leadership is billed separately, by the hour.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="group" aria-label="Your goal">
          {GOALS.map((g) => {
            const on = goal === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setGoal(g.id)}
                data-testid={`estimator-goal-${g.id}`}
                aria-pressed={on}
                className={`rounded-2xl border bg-white p-4 text-left transition-all ${
                  on ? "border-black shadow-md" : "border-neutral-200 hover:border-black/40"
                }`}
              >
                <span className="block text-sm font-semibold text-black">{g.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">{g.sub}</span>
              </button>
            );
          })}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-neutral-200 bg-white/60 p-4" role="group" aria-label="Timeline">
            <span className="w-full text-xs font-medium text-neutral-500">You want it in</span>
            {TIMELINES.map((t) => {
              const on = timeline === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTimeline(t.id)}
                  data-testid={`estimator-timeline-${t.id}`}
                  aria-pressed={on}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                    on ? "border-black bg-black text-white shadow-sm" : "border-neutral-200 text-neutral-600 hover:border-black/40 hover:text-black"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {goal === "other" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <textarea
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                rows={3}
                data-testid="estimator-custom-goal-input"
                placeholder="Describe your goal in your own words · e.g. expand into the US market, double demo bookings, launch a partner channel…"
                aria-label="Describe your custom goal"
                className="mt-3 w-full resize-none rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-black outline-none transition-colors placeholder:text-neutral-400 focus:border-black/50"
              />
              <p className="mt-2 text-xs text-neutral-400">
                Custom scopes start with a conversation · book a working session below or ask our AI concierge, and
                we will shape the numbers together. You can still build an indicative scope with the cards.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">Service products · tap a card to explore</p>
            <div className="mt-2 space-y-2" data-testid="estimator-scope">
              {SERVICES.map((s) => {
                const inScope = s.id === "aff" ? aff !== "none" : qtyOf[s.id] > 0;
                return renderCard(s, inScope, s.id === "aff");
              })}
            </div>
            <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">Fractional CXO · billed hourly only</p>
            <div className="mt-2">
              {renderCard(CXO_CARD, cxoHours > 0, false)}
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            {estimate && (
              <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-[0_24px_80px_-24px_rgba(10,10,10,0.15)]" data-testid="estimator-result">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">Your estimate · live</p>
                <ul className="mt-4 space-y-1.5" data-testid="estimator-lines">
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
                  <span className="text-neutral-500">CXO hours · {cxoHours} × {inr(CXO_RATE)} · ~{estimate.weekly} hrs/week</span>
                  <span className="font-semibold text-black" data-testid="estimator-cxo-subtotal">{inr(estimate.cxoCost)}</span>
                </div>
                <div className="mt-4 border-t border-black/10 pt-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-400">Total indicative investment</p>
                  <p className="mt-1 font-display text-3xl font-bold tracking-tight text-black" data-testid="estimator-cost">{inr(estimate.total)}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Agencies + tools for this scope: ≈ {inr(estimate.market)} · <span className="font-semibold text-brand-green" data-testid="estimator-savings">you save ~{estimate.savingsPct}%</span>
                  </p>
                  {estimate.usage && (
                    <p className="mt-2 text-xs text-neutral-400">* Voice AI usage billed on actuals at $0.12/minute.</p>
                  )}
                </div>
                <div className="mt-5 flex flex-col items-stretch gap-3">
                  {goal === "other" ? (
                    <>
                      <a
                        href={CAL}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="estimator-book-call-button"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        Book a working session <ArrowUpRight className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent("hia:open-chat", {
                              detail: {
                                prefill: customGoal.trim()
                                  ? `I have a custom growth goal: ${customGoal.trim()}`
                                  : "I have a custom growth goal that does not fit the standard options. Can you help me scope it?",
                              },
                            })
                          )
                        }
                        data-testid="estimator-chat-button"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:border-black/40 hover:shadow-md"
                      >
                        <Sparkles className="h-4 w-4 text-brand-magenta" /> Ask our AI concierge
                      </button>
                    </>
                  ) : (
                    <>
                      <PayButton
                        key={estimate.total}
                        label="Lock this scope"
                        testid="estimator-book-button"
                        initialPackage={{ name: `Estimated scope · ${GOALS.find((g) => g.id === goal)?.label || "growth engine"}`, price: estimate.total }}
                      />
                      <a href={CAL} target="_blank" rel="noopener noreferrer" data-testid="estimator-call-link" className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-blue hover:underline">
                        Or talk it through first <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
