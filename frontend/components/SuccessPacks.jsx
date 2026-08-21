"use client";

import { ArrowUpRight, Calculator, Check, Minus } from "lucide-react";
import PayButton from "@/components/PayButton";

const CAL = "https://cal.com/sunnyrai/30min";

// Flat $30/hour list price. Bigger packs earn a volume discount, up to 20%.
export const CXO_PACKS = [
  { name: "Trial Pack · 4 hours", hours: 4, list: 120, price: 120, discount: 0, color: "#ED1C24", tag: "Audit snapshot + quick wins in a week" },
  { name: "Starter Pack · 25 hours", hours: 25, list: 750, price: 690, discount: 8, color: "#F7941E", tag: "Audit + written 90-day plan" },
  { name: "Momentum Pack · 50 hours", hours: 50, list: 1500, price: 1290, discount: 14, color: "#2BBCC4", tag: "One pillar shipped end-to-end" },
  { name: "Scale Pack · 100 hours", hours: 100, list: 3000, price: 2400, discount: 20, color: "#1FA84A", tag: "Two pillars + team leadership" },
];

const usd = (n) => `$${Math.round(n).toLocaleString("en-US")}`;

const FEATURES = [
  ["Growth audit + written 90-day plan", [1, 1, 1, 1]],
  ["Weekly growth cadence + Slack access", [0, 1, 1, 1]],
  ["GEO / AI visibility execution", [0, 1, 1, 1]],
  ["AI video production", [0, 0, 1, 1]],
  ["Board-ready live dashboard", [0, 1, 1, 1]],
  ["Agentic outbound + Voice AI", [0, 0, 0, 1]],
  ["Team, agency and budget leadership", [0, 0, 0, 1]],
  ["Named senior CXO on your account", [0, 0, 1, 1]],
  ["Priority 48h turnaround", [0, 0, 0, 1]],
];

function PriceBlock({ p, center }) {
  return (
    <div className={center ? "text-center" : ""}>
      <p className="font-display text-xl font-bold tracking-tight text-black" data-testid={`pack-price-${p.hours}`}>
        {usd(p.price)}
      </p>
      {p.discount > 0 && (
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-400" style={center ? { justifyContent: "center" } : undefined}>
          <span className="line-through">{usd(p.list)}</span>
          <span className="rounded-full bg-brand-green/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-green">Save {p.discount}%</span>
        </p>
      )}
    </div>
  );
}

export default function SuccessPacks() {
  return (
    <section className="relative overflow-hidden border-t border-black/5 py-20 md:py-24" data-testid="cxo-packs">
      <div className="hero-grid-bg pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center" data-testid="cxo-hero">
          <div className="flex items-center justify-center gap-3">
            <span className="stripe-gradient h-[3px] w-8 rounded-full" aria-hidden="true" />
            <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500" data-testid="cxo-eyebrow">
              Fractional AI CXO
            </span>
            <span className="stripe-gradient h-[3px] w-8 rounded-full" aria-hidden="true" />
          </div>
          <h2 className="mt-8 font-display text-3xl font-semibold leading-[1.1] tracking-tight text-black md:text-5xl" data-testid="cxo-headline">
            C-level growth leadership, <span className="glassy-brand-text">without the C-level hire.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-neutral-500 md:text-base">
            A Fractional AI Marketing CXO owns your growth number · positioning, demand generation, GEO, and the
            AI stack that automates them · in 10–20 hours a week, for a fraction of a full-time salary.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
            <a href={CAL} target="_blank" rel="noopener noreferrer" data-testid="cxo-hero-cta" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg sm:w-auto">
              Book a 20-minute working session <ArrowUpRight className="h-4 w-4" />
            </a>
            <p className="text-xs text-neutral-400">No pitch deck. A working session and a written 90-day plan.</p>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-6 sm:flex-row sm:flex-wrap sm:items-end">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">Hourly success packs</p>
            <h3 className="mt-4 font-display text-3xl font-semibold tracking-tight text-black md:text-4xl" data-testid="packs-heading">
              Buy CXO hours <span className="glassy-brand-text">like a product.</span>
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-500 md:text-base">
              Flat $30/hour · bigger packs unlock up to 20% off. No retainer negotiations, no lock-ins. Pick a
              pack, we start this week · unused hours roll over for 90 days.
            </p>
          </div>
          <a
            href="#estimator"
            data-testid="open-estimator-button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
          >
            <Calculator className="h-4 w-4" /> Project Estimator
          </a>
        </div>

        {/* Mobile: stacked cards (the wide comparison table doesn't fit small screens) */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:hidden" data-testid="packs-cards">
          {CXO_PACKS.map((p, idx) => (
            <div key={p.name} className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
              <div className="px-5 py-4 text-white" style={{ background: p.color }}>
                <p className="font-display text-lg font-bold leading-tight">{p.name.split(" · ")[0]}</p>
                <p className="mt-0.5 text-xs text-white/85">{p.tag}</p>
              </div>
              <div className="p-5">
                <div className="flex items-end justify-between gap-3">
                  <p className="font-display text-2xl font-bold tracking-tight text-black">
                    {p.hours} <span className="text-sm font-semibold text-neutral-400">hours</span>
                  </p>
                  <PriceBlock p={p} />
                </div>
                <ul className="mt-4 space-y-2">
                  {FEATURES.filter(([, flags]) => flags[idx]).map(([label]) => (
                    <li key={label} className="flex items-start gap-2 text-sm text-neutral-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: p.color }} /> {label}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  <PayButton label="Book this pack" testid={`cxo-pack-pay-${p.hours}`} context="cxo" initialPackage={p} block />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: full comparison table */}
        <div className="mt-10 hidden overflow-x-auto rounded-3xl border border-black/5 bg-white shadow-sm lg:block" data-testid="packs-table">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-60 p-5 text-left align-bottom">
                  <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-400">
                    What's included
                  </span>
                </th>
                {CXO_PACKS.map((p) => (
                  <th key={p.name} className="p-0 text-left align-top">
                    <div className="px-5 py-4 text-white" style={{ background: p.color }}>
                      <p className="font-display text-lg font-bold leading-tight">{p.name.split(" · ")[0]}</p>
                      <p className="mt-0.5 text-xs text-white/85">{p.tag}</p>
                    </div>
                    <div className="border-b border-black/5 px-5 py-4">
                      <p className="font-display text-2xl font-bold tracking-tight text-black">
                        {p.hours} <span className="text-sm font-semibold text-neutral-400">hours</span>
                      </p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map(([label, flags]) => (
                <tr key={label} className="border-b border-black/5 transition-colors hover:bg-neutral-50/60">
                  <th scope="row" className="px-5 py-3.5 text-left text-sm font-medium text-neutral-600">
                    {label}
                  </th>
                  {flags.map((f, i) => (
                    <td key={i} className="px-5 py-3.5">
                      {f ? (
                        <Check className="h-4 w-4" style={{ color: CXO_PACKS[i].color }} />
                      ) : (
                        <Minus className="h-4 w-4 text-neutral-200" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row" className="px-5 py-5 text-left align-middle">
                  <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-400">Investment</span>
                  <span className="mt-1 block text-xs text-neutral-400">Flat $30/hour · volume discounts</span>
                </th>
                {CXO_PACKS.map((p) => (
                  <td key={p.name} className="px-5 py-5 align-top">
                    <PriceBlock p={p} />
                    <div className="mt-3">
                      <PayButton label="Book" testid={`cxo-pack-pay-desktop-${p.hours}`} context="cxo" initialPackage={p} />
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-neutral-400">
          Unused hours roll over 90 days · final scope confirmed together in your working session · secure payment
          via Razorpay
        </p>
      </div>
    </section>
  );
}
