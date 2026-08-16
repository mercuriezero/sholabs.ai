import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Compass, Eye, Megaphone, Users, CalendarClock, BarChart3, Check } from "lucide-react";
import Footer from "@/components/Footer";
import PayButton from "@/components/PayButton";

const CAL = "https://cal.com/sunnyrai/30min";

const CXO_PACKS = [
  { name: "Starter Pack · 25 hours", hours: "25", price: 65000, desc: "Growth audit, written 90-day plan, weekly cadence" },
  { name: "Momentum Pack · 50 hours", hours: "50", price: 130000, desc: "Strategy plus one pillar shipped end-to-end" },
  { name: "Scale Pack · 100 hours", hours: "100", price: 260000, desc: "Two pillars and team leadership for a full quarter" },
  { name: "Embedded Pack · 200 hours", hours: "200", price: 520000, desc: "Your fractional growth department, fully embedded" },
];

const AUDIENCES = [
  {
    title: "Funded, but no senior marketer",
    desc: "You've raised, you're building, and marketing is a rotating founder task. You need ownership, not another agency deck.",
  },
  {
    title: "Founder-led team, channel sprawl",
    desc: "Some SEO here, a freelancer there, a CRM nobody trusts. You need one operating system — and someone accountable for the number.",
  },
  {
    title: "Scale-up entering a new market",
    desc: "Proven product, new territory or segment. You need senior strategy fast, without a 4-month executive search.",
  },
];

const SCOPE = [
  { icon: Compass, title: "Growth strategy & positioning", desc: "Category narrative, ICP, messaging, and the 90-day plan the whole company executes against." },
  { icon: Eye, title: "GEO & AI visibility", desc: "Getting your brand cited by ChatGPT, Gemini, and Perplexity as a core channel — not an afterthought." },
  { icon: Megaphone, title: "Demand engine", desc: "AI video, agentic outbound, paid, and partnerships run as one system with shared context." },
  { icon: Users, title: "Team, agencies & budget", desc: "Hiring plans, vendor management, and budget allocation against pipeline — not impressions." },
  { icon: CalendarClock, title: "Weekly operating cadence", desc: "A growth meeting that ships decisions, async updates in your tools, and zero status-theater." },
  { icon: BarChart3, title: "Board-ready reporting", desc: "One live dashboard mapping every pillar to revenue — ready for investors without a slide rebuild." },
];

const VS = [
  ["Annual cost", "$250k+ salary, bonus & equity", "A fraction — pay for outcomes, not overhead"],
  ["Time to impact", "3–6 months of ramp-up", "Weeks to first signal"],
  ["Tooling", "You still buy and wire the stack", "The H.I.A.I. engine comes included"],
  ["Risk", "One resume, one bet", "A proven operating system with human leadership"],
];

const PHASES = [
  { phase: "Days 1–30", title: "Audit & plan", desc: "Full growth audit — AI visibility, funnel, stack, team. You get a written 90-day plan with owners and KPIs.", color: "#2BBCC4" },
  { phase: "Days 31–60", title: "Build the engine", desc: "GEO pillar live, first videos shipped, outbound sequences running, dashboard wired to real data.", color: "#E200C4" },
  { phase: "Days 61–90", title: "Scale what works", desc: "Double down on the pillar producing signal, cut what's not, and hand you a rhythm your team can keep.", color: "#1FA84A" },
];

const FAQS = [
  {
    q: "How many hours per week do we get?",
    a: "Typically 10–20 hours, flexed to your stage. Enough for strategy, cadence, and hands-on reviews — the engine's AI systems handle the production volume.",
  },
  {
    q: "Who do we actually work with?",
    a: "A senior growth leader from the High On AI team, backed by the full H.I.A.I. engine — researchers, video systems, and voice agents. One accountable human, one machine behind them.",
  },
  {
    q: "What does it cost?",
    a: "A monthly retainer sized to scope — consistently far below a full-time CMO's fully-loaded cost. Book a working session and we'll scope it against your goals, not a rate card.",
  },
];

export default function FractionalCxO() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4" aria-label="Page navigation">
          <Link to="/" data-testid="cxo-nav-logo" className="flex items-center gap-3">
            <img src="/logo.webp" alt="High On AI logo" className="h-10 w-auto rounded-md" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" data-testid="cxo-back-link" className="hidden items-center gap-2 text-sm font-medium text-neutral-600 transition-colors hover:text-black sm:inline-flex">
              <ArrowLeft className="h-4 w-4" /> Back to site
            </Link>
            <a
              href={CAL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="cxo-nav-cta"
              className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Book a working session <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden" data-testid="cxo-hero">
          <div className="hero-grid-bg pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
            <div className="flex items-center justify-center gap-3">
              <span className="stripe-gradient h-[3px] w-8 rounded-full" aria-hidden="true" />
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500" data-testid="cxo-eyebrow">
                Fractional AI CXO
              </span>
              <span className="stripe-gradient h-[3px] w-8 rounded-full" aria-hidden="true" />
            </div>
            <h1 className="mt-8 font-display text-5xl font-bold leading-[1.05] tracking-tighter text-black md:text-6xl" data-testid="cxo-headline">
              C-level growth leadership, <span className="glassy-brand-text">without the C-level hire.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-neutral-500 md:text-lg">
              A Fractional AI Marketing CXO owns your growth number — positioning, demand generation, GEO, and the
              AI stack that automates them — in 10–20 hours a week, for a fraction of a full-time salary.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a href={CAL} target="_blank" rel="noopener noreferrer" data-testid="cxo-hero-cta" className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg">
                Book a 20-minute working session <ArrowUpRight className="h-4 w-4" />
              </a>
              <p className="text-xs text-neutral-400">No pitch deck. A working session and a written 90-day plan.</p>
            </div>
          </div>
        </section>

        <section className="border-t border-black/5 py-20 md:py-24" data-testid="cxo-audience">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-black md:text-4xl">Is this you?</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {AUDIENCES.map((a) => (
                <div key={a.title} className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg" data-testid={`cxo-audience-${AUDIENCES.indexOf(a)}`}>
                  <h3 className="font-display text-lg font-semibold text-black">{a.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-500">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-black/5 bg-neutral-50/60 py-20 md:py-24" data-testid="cxo-scope">
          <div className="mx-auto max-w-6xl px-6">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">Scope of ownership</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-black md:text-4xl">What your CXO owns</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {SCOPE.map((s) => (
                <div key={s.title} className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm" data-testid={`cxo-scope-${SCOPE.indexOf(s)}`}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-orange/10 text-brand-orange">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-black">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-black/5 py-20 md:py-24" data-testid="cxo-vs">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-black md:text-4xl">Fractional vs. full-time</h2>
            <div className="mt-10 overflow-x-auto rounded-3xl border border-black/5 bg-white shadow-sm" data-testid="cxo-vs-table">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/5 bg-neutral-50/70">
                    <th className="px-6 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400"> </th>
                    <th className="px-6 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400">Full-time CMO</th>
                    <th className="px-6 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-brand-orange">Fractional AI CXO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {VS.map(([label, full, frac]) => (
                    <tr key={label} className="transition-colors hover:bg-neutral-50/60">
                      <th scope="row" className="px-6 py-4 font-semibold text-black">{label}</th>
                      <td className="px-6 py-4 text-neutral-500">{full}</td>
                      <td className="px-6 py-4 font-medium text-black">
                        <span className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" /> {frac}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="border-t border-black/5 bg-neutral-50/60 py-20 md:py-24" data-testid="cxo-plan">
          <div className="mx-auto max-w-6xl px-6">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">The first 90 days</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-black md:text-4xl">A plan, not a probation period</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {PHASES.map((p) => (
                <div key={p.phase} className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-7 shadow-sm" data-testid={`cxo-phase-${PHASES.indexOf(p)}`}>
                  <span className="absolute inset-x-0 top-0 h-1" style={{ background: p.color }} aria-hidden="true" />
                  <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: p.color }}>{p.phase}</p>
                  <h3 className="mt-3 font-display text-xl font-semibold text-black">{p.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-500">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-black/5 py-20 md:py-24" data-testid="cxo-packs">
          <div className="mx-auto max-w-6xl px-6">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">Hourly success packs</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-black md:text-4xl">
              Buy CXO hours <span className="glassy-brand-text">like a product.</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-500 md:text-base">
              No retainer negotiations, no lock-ins. Pick a pack, we start this week — unused hours roll over for
              90 days.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {CXO_PACKS.map((p) => (
                <div key={p.name} className="flex flex-col rounded-3xl border border-black/5 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg" data-testid={`cxo-pack-${p.hours}`}>
                  <p className="font-display text-4xl font-bold tracking-tight text-black">
                    {p.hours}<span className="text-lg font-semibold text-neutral-400"> hrs</span>
                  </p>
                  <p className="mt-1 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-brand-orange">{p.name.split(" · ")[0]}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-neutral-500">{p.desc}</p>
                  <p className="mt-5 font-display text-2xl font-bold text-black">₹{p.price.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-neutral-400">Flat $30/hour · unused hours roll over 90 days</p>
                  <div className="mt-5">
                    <PayButton label="Book this pack" testid={`cxo-pack-pay-${p.hours}`} context="cxo" initialPackage={p} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-black/5 bg-neutral-50/60 py-20 md:py-24" data-testid="cxo-faq">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-black md:text-4xl">Straight answers</h2>
            <div className="mt-10 space-y-4">
              {FAQS.map((f) => (
                <div key={f.q} className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm" data-testid={`cxo-faq-${FAQS.indexOf(f)}`}>
                  <h3 className="font-display text-lg font-semibold text-black">{f.q}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-500">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-black/5 py-20 md:py-28" data-testid="cxo-final-cta">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="font-display text-4xl font-semibold tracking-tight text-black md:text-5xl">
              Your growth number deserves <span className="glassy-brand-text">an owner.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-neutral-500">
              Twenty minutes. Your funnel, our engine, a written 90-day plan — whether or not we work together.
            </p>
            <a href={CAL} target="_blank" rel="noopener noreferrer" data-testid="cxo-final-cta-button" className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg">
              Book your working session <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
