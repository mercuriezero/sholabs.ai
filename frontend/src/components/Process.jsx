import { ArrowRight, Globe, Sparkles, Rocket, Layers } from "lucide-react";

const STEPS = [
  {
    n: "01",
    color: "#2BBCC4",
    icon: Globe,
    title: "Tell us your website + your goal",
    desc: "Drop in your brand URL and what you're trying to grow — pipeline, bookings, revenue, AI visibility.",
  },
  {
    n: "02",
    color: "#E200C4",
    icon: Sparkles,
    title: "Get your plan, instantly",
    desc: "Our AI agent audits where you're invisible — to AI, to search, to buyers — and recommends the exact strategy across the engine's 3 pillars for your business.",
  },
  {
    n: "03",
    color: "#1FA84A",
    icon: Rocket,
    title: "Run a pilot",
    desc: "Test the engine on one focused project before you commit to anything bigger. See real output, not a slide deck.",
  },
  {
    n: "04",
    color: "#F7941E",
    icon: Layers,
    title: "Scale with add-ons",
    desc: "Liked the pilot? Pick the pillars and channels you want to scale next — Get Cited, Get Watched, or Get Chosen. Every pillar you add lights up on your dashboard from day one.",
  },
];

export default function Process() {
  return (
    <section id="process" className="scroll-mt-20 py-24 md:py-32" data-testid="process-section">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">How it works</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-black md:text-5xl" data-testid="process-heading">
            No sales call to get started. No waiting on a strategist. <span className="text-neutral-400">Just:</span>
          </h2>
        </div>

        <ol className="relative mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li
              key={s.n}
              data-testid={`process-step-${s.n}`}
              className="group relative rounded-3xl border border-black/5 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${s.color}14`, color: s.color }}>
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="font-display text-3xl font-bold" style={{ color: `${s.color}33` }}>{s.n}</span>
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-black">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">{s.desc}</p>
              <span className="mt-5 block h-1 w-10 rounded-full transition-all group-hover:w-16" style={{ background: s.color }} aria-hidden="true" />
            </li>
          ))}
        </ol>

        <div className="mt-12">
          <a
            href="#hero-cta"
            data-testid="process-cta"
            className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Get your plan <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
