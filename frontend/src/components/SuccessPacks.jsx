import { useState } from "react";
import { Calculator, Check, Minus } from "lucide-react";
import PayButton from "@/components/PayButton";
import Estimator from "@/components/Estimator";

export const CXO_PACKS = [
  { name: "Starter Pack · 25 hours", hours: 25, price: 65000, color: "#F7941E", tag: "Audit + written 90-day plan" },
  { name: "Momentum Pack · 50 hours", hours: 50, price: 130000, color: "#2BBCC4", tag: "One pillar shipped end-to-end" },
  { name: "Scale Pack · 100 hours", hours: 100, price: 260000, color: "#1FA84A", tag: "Two pillars + team leadership" },
  { name: "Embedded Pack · 200 hours", hours: 200, price: 520000, color: "#91268F", tag: "Your fractional growth department" },
];

const FEATURES = [
  ["Growth audit + written 90-day plan", [1, 1, 1, 1]],
  ["Weekly growth cadence + Slack access", [1, 1, 1, 1]],
  ["GEO / AI visibility execution", [0, 1, 1, 1]],
  ["AI video production", [0, 1, 1, 1]],
  ["Board-ready live dashboard", [0, 1, 1, 1]],
  ["Agentic outbound + Voice AI", [0, 0, 1, 1]],
  ["Team, agency and budget leadership", [0, 0, 1, 1]],
  ["Named senior CXO on your account", [0, 0, 1, 1]],
  ["Priority 48h turnaround", [0, 0, 0, 1]],
];

export default function SuccessPacks() {
  const [estimatorOpen, setEstimatorOpen] = useState(false);

  return (
    <section className="border-t border-black/5 py-20 md:py-24" data-testid="cxo-packs">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">Hourly success packs</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-black md:text-4xl" data-testid="packs-heading">
              Buy CXO hours <span className="glassy-brand-text">like a product.</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-500 md:text-base">
              No retainer negotiations, no lock-ins. Pick a pack, we start this week · unused hours roll over for
              90 days.
            </p>
          </div>
          <button
            onClick={() => setEstimatorOpen(true)}
            data-testid="open-estimator-button"
            className="inline-flex items-center gap-2 rounded-full bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Calculator className="h-4 w-4" /> Project Estimator
          </button>
        </div>

        <div className="mt-10 overflow-x-auto rounded-3xl border border-black/5 bg-white shadow-sm" data-testid="packs-table">
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
                  <span className="mt-1 block text-xs text-neutral-400">Flat $30/hour</span>
                </th>
                {CXO_PACKS.map((p) => (
                  <td key={p.name} className="px-5 py-5 align-top">
                    <p className="font-display text-xl font-bold tracking-tight text-black" data-testid={`pack-price-${p.hours}`}>
                      ₹{p.price.toLocaleString("en-IN")}
                    </p>
                    <div className="mt-3">
                      <PayButton label="Book" testid={`cxo-pack-pay-${p.hours}`} context="cxo" initialPackage={p} />
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

      <Estimator open={estimatorOpen} onClose={() => setEstimatorOpen(false)} />
    </section>
  );
}
