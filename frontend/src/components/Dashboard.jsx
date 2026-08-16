import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Eye, Quote, Target } from "lucide-react";

const PILLARS = [
  {
    name: "Get Cited",
    color: "#2B39D1",
    icon: Quote,
    desc: "Live AI citation rate across ChatGPT, Gemini, Perplexity; share-of-voice vs. named competitors; sentiment on every mention.",
  },
  {
    name: "Get Watched",
    color: "#E200C4",
    icon: Eye,
    desc: "Views, watch-through, and click-to-site by video, updating as it happens.",
  },
  {
    name: "Get Chosen",
    color: "#F7941E",
    icon: Target,
    desc: "Pipeline generated, reply rates, partner-sourced revenue, deal velocity — one feed, not four CRMs.",
  },
];

const KPIS = [
  { label: "Get cited", value: "38%", sub: "AI citation rate", extra: "Share of voice · 2nd of 6", color: "#2B39D1" },
  { label: "Get watched", value: "64.2k", sub: "Views this week", extra: "Watch-through · 71%", color: "#E200C4" },
  { label: "Get chosen", value: "$184k", sub: "Pipeline generated", extra: "Reply rate · 12.4%", color: "#F7941E" },
];

const FEED = [
  { text: 'Cited by Perplexity for "best growth engine for B2B SaaS"', time: "2m ago", color: "#2B39D1" },
  { text: "Founder-led demo crossed 10k views", time: "14m ago", color: "#E200C4" },
  { text: "New reply from outbound sequence — routed to pipeline", time: "31m ago", color: "#F7941E" },
  { text: 'Gemini now lists you in "top AI video agencies"', time: "42m ago", color: "#2B39D1" },
  { text: "Voice agent booked a demo — 12-min call confirmed", time: "1h ago", color: "#F7941E" },
  { text: "Watch-through on launch video passed 70%", time: "2h ago", color: "#E200C4" },
];

export default function Dashboard() {
  const [start, setStart] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setStart((s) => (s + 1) % FEED.length), 4000);
    return () => clearInterval(id);
  }, []);

  const visible = [0, 1, 2].map((i) => FEED[(start + i) % FEED.length]);

  return (
    <section id="dashboard" className="scroll-mt-20 border-t border-black/5 bg-neutral-50/60 py-24 md:py-32" data-testid="dashboard-section">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">03 · Command center</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-black md:text-5xl" data-testid="dashboard-heading">
            One dashboard. Every signal. <span className="glassy-brand-text">Live.</span>
          </h2>
          <p className="mt-4 text-base text-neutral-500 md:text-lg">
            Three pillars, seventeen tactics, zero reason to check five different tools to know if it's working.
            Every pillar feeds one command center — real-time, not end-of-month.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.name} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm" data-testid={`pillar-card-${p.name.toLowerCase().replace(/\s+/g, "-")}`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${p.color}14`, color: p.color }}>
                <p.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-black">{p.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="relative mx-auto mt-10 max-w-5xl">
          <div className="absolute -inset-3 rounded-[36px] bg-brand-blue/5" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_32px_90px_-30px_rgba(10,10,10,0.25)]" data-testid="dashboard-mock">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-6 py-4">
              <div className="flex items-center gap-3">
                <img src="/logo.webp" alt="" className="h-6 w-auto rounded" />
                <div>
                  <p className="text-sm font-semibold text-black">High On AI — command center</p>
                  <p className="text-xs text-neutral-400">Every pillar, one live view</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-green/10 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-widest text-brand-green" data-testid="dashboard-live-badge">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-green" />
                </span>
                live
              </span>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-3 md:p-8">
              {KPIS.map((k) => (
                <div key={k.label} className="rounded-2xl border border-black/5 bg-neutral-50/70 p-5" data-testid={`kpi-${k.label.replace(/\s+/g, "-")}`}>
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em]" style={{ color: k.color }}>
                    {k.label}
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold tracking-tight text-black">{k.value}</p>
                  <p className="text-xs text-neutral-500">{k.sub}</p>
                  <p className="mt-3 border-t border-black/5 pt-3 text-xs font-medium text-neutral-600">{k.extra}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-black/5 px-6 py-5 md:px-8">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">Live signal feed</p>
              <ul className="mt-3 space-y-2.5" data-testid="signal-feed">
                <AnimatePresence mode="popLayout" initial={false}>
                  {visible.map((f) => (
                    <motion.li
                      key={f.text}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4 }}
                      className="flex items-center justify-between gap-4 rounded-xl bg-neutral-50 px-4 py-2.5"
                    >
                      <span className="flex items-center gap-2.5 text-sm text-neutral-700">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: f.color }} />
                        {f.text}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-neutral-400">{f.time}</span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-3xl text-center">
          <p className="text-sm leading-relaxed text-neutral-500 md:text-base">
            No vanity metrics. No "check back next week." Just the KPIs that map straight to revenue, scored and
            surfaced by AI the moment they move — so you always know which pillar is working and which needs
            attention, without asking us.
          </p>
          <a
            href="/dashboard"
            data-testid="dashboard-cta"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            See the Dashboard <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
