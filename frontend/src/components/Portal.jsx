import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Clapperboard, AudioLines, Briefcase, Check, TrendingUp } from "lucide-react";

const SERVICES = [
  {
    id: "geo",
    tab: "GEO Leads",
    color: "#2B39D1",
    soft: "rgba(43,57,209,0.06)",
    border: "rgba(43,57,209,0.18)",
    icon: Sparkles,
    heading: "Get noticed on ChatGPT, Gemini & Perplexity",
    body: "We turn your brand into the answer AI engines cite — entity-rich content, structured data, and the third-party proof LLMs cross-check before recommending a vendor.",
  },
  {
    id: "video",
    tab: "AI Videos",
    color: "#E200C4",
    soft: "rgba(226,0,196,0.06)",
    border: "rgba(226,0,196,0.18)",
    icon: Clapperboard,
    heading: "An AI video engine that never sleeps",
    body: "Category-defining videos scripted, generated, and shipped weekly — product stories, founder clips, and ad creative at a pace no studio can match.",
  },
  {
    id: "voice",
    tab: "Voice AI",
    color: "#1FA84A",
    soft: "rgba(31,168,74,0.06)",
    border: "rgba(31,168,74,0.18)",
    icon: AudioLines,
    heading: "Voice AI agents that book real meetings",
    body: "Human-grade voice agents qualify inbound, revive cold lists, and follow up in seconds — every call transcribed, scored, and synced to your CRM.",
  },
  {
    id: "cxo",
    tab: "Fractional CXO",
    color: "#F7941E",
    soft: "rgba(247,148,30,0.06)",
    border: "rgba(247,148,30,0.18)",
    icon: Briefcase,
    heading: "Hire a Fractional AI Marketing CXO",
    body: "C-level ownership of your growth number — positioning, demand, GEO, and the AI stack — in 10–20 hours a week, for a fraction of a full-time hire.",
  },
];

function GeoPanel({ color }) {
  return (
    <div className="flex h-full flex-col gap-4 p-6 md:p-8">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-neutral-500">
        <Sparkles className="h-3.5 w-3.5" style={{ color }} /> AI answer preview
      </div>
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-black">"Which agencies get B2B brands cited by AI search?"</p>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          Based on current sources, the most-cited options include <span className="font-semibold" style={{ color }}>your brand</span> — recognized
          for GEO programs covering ChatGPT, Gemini, and Perplexity…
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["ChatGPT", "Gemini", "Perplexity", "Claude"].map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-600">
              <Check className="h-3 w-3" style={{ color }} /> {s}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-auto flex items-center gap-2 text-sm font-semibold" style={{ color }}>
        <TrendingUp className="h-4 w-4" /> Citation share +212% in 90 days
      </div>
    </div>
  );
}

function VideoPanel({ color }) {
  return (
    <div className="flex h-full flex-col gap-4 p-6 md:p-8">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-neutral-500">
        <Clapperboard className="h-3.5 w-3.5" style={{ color }} /> This week's render queue
      </div>
      <div className="grid flex-1 grid-cols-3 gap-3">
        {["Founder story", "Product drop", "Ad creative"].map((t, i) => (
          <div key={t} className="flex flex-col justify-between rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
            <div className="h-16 rounded-xl md:h-24" style={{ background: `linear-gradient(135deg, ${color}22, ${color}55)` }} />
            <div className="mt-3">
              <p className="text-xs font-semibold text-black md:text-sm">{t}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider" style={{ color }}>
                {i === 2 ? "Rendering" : "Shipped"}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-2 text-sm font-semibold" style={{ color }}>
        <TrendingUp className="h-4 w-4" /> 32 videos shipped this month
      </div>
    </div>
  );
}

function VoicePanel({ color }) {
  return (
    <div className="flex h-full flex-col gap-4 p-6 md:p-8">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-neutral-500">
        <AudioLines className="h-3.5 w-3.5" style={{ color }} /> Voice AI SDR · live
      </div>
      <div className="flex flex-1 flex-col justify-center rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex h-20 items-center justify-center gap-1.5" aria-hidden="true">
          {[18, 34, 52, 30, 62, 44, 26, 56, 38, 22, 48, 32, 58, 28, 40, 20].map((h, i) => (
            <span
              key={i}
              className="w-1.5 animate-pulse rounded-full"
              style={{ height: h, background: color, animationDelay: `${i * 0.12}s`, opacity: 0.35 + (i % 4) * 0.2 }}
            />
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-neutral-600">
          "Hi Riya — noticed your team is scaling outbound. Worth a 12-minute call Thursday?"
        </p>
      </div>
      <div className="mt-auto flex items-center gap-2 text-sm font-semibold" style={{ color }}>
        <TrendingUp className="h-4 w-4" /> 18 meetings booked this week
      </div>
    </div>
  );
}

function CxoPanel({ color }) {
  return (
    <div className="flex h-full flex-col gap-4 p-6 md:p-8">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-neutral-500">
        <Briefcase className="h-3.5 w-3.5" style={{ color }} /> Growth cockpit · weekly review
      </div>
      <div className="grid flex-1 grid-cols-2 gap-3">
        {[
          { k: "CAC", v: "-38%" },
          { k: "MQLs", v: "+3.1x" },
          { k: "AI citations", v: "47" },
          { k: "Pipeline", v: "+64%" },
        ].map((m) => (
          <div key={m.k} className="flex flex-col justify-center rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">{m.k}</p>
            <p className="mt-1 font-display text-2xl font-bold text-black md:text-3xl">{m.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-2 text-sm font-semibold" style={{ color }}>
        <TrendingUp className="h-4 w-4" /> Strategy shipped every single week
      </div>
    </div>
  );
}

const PANELS = { geo: GeoPanel, video: VideoPanel, voice: VoicePanel, cxo: CxoPanel };

export default function Portal() {
  const [active, setActive] = useState(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) return;
    const id = setInterval(() => setActive((a) => (a + 1) % SERVICES.length), 3000);
    return () => clearInterval(id);
  }, []);

  const service = SERVICES[active];
  const Panel = PANELS[service.id];

  return (
    <section id="services" className="scroll-mt-20 py-24 md:py-32" data-testid="services-section">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400" data-testid="services-eyebrow">
            One engine. Four growth motions.
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-black md:text-5xl" data-testid="services-heading">
            Growth teams build on <span className="glassy-brand-text">High On AI</span>
          </h2>
          <p className="mt-4 text-base text-neutral-500 md:text-lg">
            Every service runs on the same H.I.A.I. operating system — so channels compound instead of compete.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Services">
          {SERVICES.map((s, i) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={i === active}
              data-testid={`portal-tab-${s.id}`}
              onClick={() => setActive(i)}
              className="relative rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
              style={{
                background: i === active ? s.color : "#f5f5f5",
                color: i === active ? "#fff" : "#737373",
              }}
            >
              {s.tab}
            </button>
          ))}
        </div>

        <div className="relative mx-auto mt-8 max-w-5xl">
          <div
            className="absolute -inset-3 rounded-[36px] transition-colors duration-700"
            style={{ background: service.soft }}
            aria-hidden="true"
          />
          <div
            className="relative min-h-[420px] overflow-hidden rounded-[28px] border bg-white shadow-[0_32px_90px_-30px_rgba(10,10,10,0.25)] transition-colors duration-700 md:min-h-[380px]"
            style={{ borderColor: service.border }}
            data-testid="portal-panel"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="flex h-full flex-col md:flex-row"
              >
                <div className="flex flex-col justify-center gap-4 p-6 md:w-[42%] md:p-10">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ background: service.soft, color: service.color }}
                  >
                    <service.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-2xl font-semibold tracking-tight text-black md:text-3xl" data-testid="portal-panel-heading">
                    {service.heading}
                  </h3>
                  <p className="text-sm leading-relaxed text-neutral-500 md:text-base">{service.body}</p>
                  <a
                    href="#hero-cta"
                    data-testid={`portal-cta-${service.id}`}
                    className="mt-2 inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                    style={{ background: service.color }}
                  >
                    Deploy this motion
                  </a>
                </div>
                <div className="md:w-[58%]" style={{ background: service.soft }}>
                  <Panel color={service.color} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
