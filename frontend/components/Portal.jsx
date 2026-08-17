"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Clapperboard, AudioLines, Send, Megaphone, Users, Handshake, Check, TrendingUp } from "lucide-react";

const SERVICES = [
  {
    id: "geo",
    tab: "LLM Revenue",
    color: "#2B39D1",
    soft: "rgba(43,57,209,0.06)",
    border: "rgba(43,57,209,0.18)",
    icon: Sparkles,
    heading: "Get noticed on ChatGPT, Gemini & Perplexity",
    body: "We turn your brand into the answer AI engines cite · entity-rich content, structured data, and the third-party proof LLMs cross-check before recommending a vendor.",
  },
  {
    id: "video",
    tab: "AI Videos",
    color: "#E200C4",
    soft: "rgba(226,0,196,0.06)",
    border: "rgba(226,0,196,0.18)",
    icon: Clapperboard,
    heading: "An AI video engine that never sleeps",
    body: "Category-defining videos scripted, generated, and shipped weekly · product stories, founder clips, and ad creative at a pace no studio can match.",
  },
  {
    id: "voice",
    tab: "Voice AI",
    color: "#1FA84A",
    soft: "rgba(31,168,74,0.06)",
    border: "rgba(31,168,74,0.18)",
    icon: AudioLines,
    heading: "Voice AI agents that book real meetings",
    body: "Human-grade voice agents qualify inbound, revive cold lists, and follow up in seconds · every call transcribed, scored, and synced to your CRM.",
  },
  {
    id: "sdr",
    tab: "AI SDR",
    color: "#ED1C24",
    soft: "rgba(237,28,36,0.06)",
    border: "rgba(237,28,36,0.18)",
    icon: Send,
    heading: "Outbound that replies before competitors",
    body: "Agentic outbound with human review: researched sequences, smart follow-ups, and every reply routed straight into pipeline.",
  },
  {
    id: "social",
    tab: "Social Media",
    color: "#2BBCC4",
    soft: "rgba(43,188,196,0.06)",
    border: "rgba(43,188,196,0.18)",
    icon: Megaphone,
    heading: "Social media that compounds daily",
    body: "Founder-led content, category takes, and community plays shipped on a weekly cadence across LinkedIn, X, and Instagram.",
  },
  {
    id: "ugc",
    tab: "UGC Ads",
    color: "#91268F",
    soft: "rgba(145,38,143,0.06)",
    border: "rgba(145,38,143,0.18)",
    icon: Users,
    heading: "UGC ad creatives tested weekly",
    body: "AI-generated creator-style ads in volume: hooks, angles, and variants tested until a winner carries your spend.",
  },
  {
    id: "partners",
    tab: "Affiliate & Partners",
    color: "#F7941E",
    soft: "rgba(247,148,30,0.06)",
    border: "rgba(247,148,30,0.18)",
    icon: Handshake,
    heading: "Partner programs that share your upside",
    body: "Affiliate, referral, and creator partnerships recruited and managed for you, turning other people's audiences into your pipeline.",
  },
];

function GeoPanel({ color }) {
  return (
    <div className="flex h-full flex-col gap-4 p-6 md:p-8">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-neutral-500">
        <Sparkles className="h-3.5 w-3.5" style={{ color }} /> AI answer preview
      </div>
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-black">"Which agencies get B2B brands cited by AI search?"</p>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          Based on current sources, the most-cited options include <span className="font-semibold" style={{ color }}>your brand</span> · recognized
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
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-neutral-500">
        <Clapperboard className="h-3.5 w-3.5" style={{ color }} /> This week's render queue
      </div>
      <div className="grid flex-1 grid-cols-3 gap-3">
        {["Founder story", "Product drop", "Ad creative"].map((t, i) => (
          <div key={t} className="flex flex-col justify-between rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
            <div className="h-16 rounded-xl md:h-24" style={{ background: `linear-gradient(135deg, ${color}22, ${color}55)` }} />
            <div className="mt-3">
              <p className="text-xs font-semibold text-black md:text-sm">{t}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider" style={{ color }}>
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
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-neutral-500">
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
          "Hi Riya · noticed your team is scaling outbound. Worth a 12-minute call Thursday?"
        </p>
      </div>
      <div className="mt-auto flex items-center gap-2 text-sm font-semibold" style={{ color }}>
        <TrendingUp className="h-4 w-4" /> 18 meetings booked this week
      </div>
    </div>
  );
}

function SdrPanel({ color }) {
  return (
    <div className="flex h-full flex-col gap-4 p-6 md:p-8">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-neutral-500">
        <Send className="h-3.5 w-3.5" style={{ color }} /> Outbound sequence · live
      </div>
      <div className="flex-1 space-y-2.5 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        {[
          ["Day 1 · Intro email", "Opened 2h ago"],
          ["Day 3 · Value bump", "Replied"],
          ["Day 5 · Case study", "Meeting booked"],
        ].map(([step, status]) => (
          <div key={step} className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
            <span className="text-sm text-neutral-600">{step}</span>
            <span className="text-xs font-semibold" style={{ color }}>{status}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-2 text-sm font-semibold" style={{ color }}>
        <TrendingUp className="h-4 w-4" /> 12.4% reply rate this week
      </div>
    </div>
  );
}

function SocialPanel({ color }) {
  return (
    <div className="flex h-full flex-col gap-4 p-6 md:p-8">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-neutral-500">
        <Megaphone className="h-3.5 w-3.5" style={{ color }} /> This week's content
      </div>
      <div className="grid flex-1 grid-cols-3 gap-3">
        {[
          ["Founder take", "2.1k likes"],
          ["Category teardown", "184 comments"],
          ["Client win story", "96 shares"],
        ].map(([t, stat]) => (
          <div key={t} className="flex flex-col justify-between rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
            <div className="h-14 rounded-xl md:h-20" style={{ background: `linear-gradient(135deg, ${color}22, ${color}55)` }} />
            <div className="mt-3">
              <p className="text-xs font-semibold text-black">{t}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider" style={{ color }}>{stat}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-2 text-sm font-semibold" style={{ color }}>
        <TrendingUp className="h-4 w-4" /> 4.8x engagement vs last month
      </div>
    </div>
  );
}

function UgcPanel({ color }) {
  return (
    <div className="flex h-full flex-col gap-4 p-6 md:p-8">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-neutral-500">
        <Users className="h-3.5 w-3.5" style={{ color }} /> Creative testing · round 6
      </div>
      <div className="grid flex-1 grid-cols-3 gap-3">
        {[
          ["Hook A", "1.8% CTR", false],
          ["Hook B", "3.4% CTR", true],
          ["Hook C", "1.2% CTR", false],
        ].map(([t, ctr, winner]) => (
          <div key={t} className={`flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-sm ${winner ? "" : "border-black/5"}`} style={winner ? { borderColor: color } : undefined}>
            <div className="h-14 rounded-xl md:h-20" style={{ background: `linear-gradient(135deg, ${color}${winner ? "44" : "18"}, ${color}${winner ? "77" : "33"})` }} />
            <div className="mt-3">
              <p className="text-xs font-semibold text-black">{t}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: winner ? color : "#a3a3a3" }}>
                {ctr}{winner ? " · winner" : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-2 text-sm font-semibold" style={{ color }}>
        <TrendingUp className="h-4 w-4" /> Winning creative found in 6 days
      </div>
    </div>
  );
}

function PartnerPanel({ color }) {
  return (
    <div className="flex h-full flex-col gap-4 p-6 md:p-8">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-neutral-500">
        <Handshake className="h-3.5 w-3.5" style={{ color }} /> Partner pipeline · live
      </div>
      <div className="flex-1 space-y-2.5 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        {[
          ["New partner signed", "SaaS newsletter · 40k subs"],
          ["Referral deal closed", "₹1.2L partner-sourced"],
          ["Creator collab shipped", "3 videos this month"],
        ].map(([t, sub]) => (
          <div key={t} className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
            <span className="text-sm font-medium text-black">{t}</span>
            <span className="text-xs text-neutral-500">{sub}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-2 text-sm font-semibold" style={{ color }}>
        <TrendingUp className="h-4 w-4" /> 22% of revenue from partners
      </div>
    </div>
  );
}

const PANELS = { geo: GeoPanel, video: VideoPanel, voice: VoicePanel, sdr: SdrPanel, social: SocialPanel, ugc: UgcPanel, partners: PartnerPanel };

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
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400" data-testid="services-eyebrow">
            02 · One engine. Every growth motion.
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-black md:text-5xl" data-testid="services-heading">
            Growth teams build on <span className="glassy-brand-text">High On AI</span>
          </h2>
          <p className="mt-4 text-base text-neutral-500 md:text-lg">
            Every service runs on the same H.I.A.I. operating system · so channels compound instead of compete.
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
