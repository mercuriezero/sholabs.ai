import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, X } from "lucide-react";
import PayButton from "@/components/PayButton";
import { CXO_PACKS } from "@/components/SuccessPacks";

const CAL = "https://cal.com/sunnyrai/30min";
const RATE = 2600; // flat $30/hour, charged in INR

const NEEDS = [
  { id: "geo", label: "AI visibility (GEO)", sub: "Get cited by ChatGPT, Gemini and Perplexity", hours: 20, market: 220000 },
  { id: "video", label: "AI video engine", sub: "Weekly videos, scripted, generated, repurposed", hours: 15, market: 160000 },
  { id: "voice", label: "Outbound + Voice AI", sub: "Agents that qualify leads and book meetings", hours: 15, market: 130000 },
  { id: "cxo", label: "Fractional CXO leadership", sub: "Strategy, weekly cadence, team ownership", hours: 25, market: 260000 },
  { id: "revops", label: "Live dashboard + RevOps", sub: "One command center for every signal", hours: 8, market: 100000 },
];

function sizeMultiplier(size) {
  if (size <= 10) return 1;
  if (size <= 50) return 1.2;
  if (size <= 200) return 1.4;
  return 1.6;
}

export default function Estimator({ open, onClose }) {
  const [size, setSize] = useState("10");
  const [selected, setSelected] = useState(["geo", "cxo"]);

  const estimate = useMemo(() => {
    const chosen = NEEDS.filter((n) => selected.includes(n.id));
    const base = chosen.reduce((s, n) => s + n.hours, 0);
    if (!base) return null;
    const hours = Math.ceil(base * sizeMultiplier(parseInt(size, 10) || 1));
    const cost = hours * RATE;
    const market = chosen.reduce((s, n) => s + n.market, 0);
    const savingsPct = Math.min(75, Math.max(0, Math.round((1 - cost / market) * 100)));
    const pack = CXO_PACKS.find((p) => p.hours >= hours) || CXO_PACKS[CXO_PACKS.length - 1];
    return { hours, cost, market, savingsPct, pack };
  }, [size, selected]);

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

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
              A strong engagement needs strategy, execution and reporting scoped to your stage. Tell us what you
              need and we estimate the hours, the investment, and the success pack that fits.
            </p>

            <div className="mt-6 flex items-center gap-3 text-sm">
              <label htmlFor="company-size" className="font-medium text-neutral-700">Your company size</label>
              <input
                id="company-size"
                type="number"
                min="1"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                data-testid="estimator-size-input"
                className="w-20 rounded-xl border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-sm outline-none focus:border-black/40"
              />
              <span className="text-neutral-500">employees</span>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {NEEDS.map((n) => {
                const on = selected.includes(n.id);
                return (
                  <button
                    key={n.id}
                    onClick={() => toggle(n.id)}
                    data-testid={`estimator-need-${n.id}`}
                    aria-pressed={on}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                      on ? "border-black bg-neutral-50 shadow-sm" : "border-neutral-200 hover:border-black/40"
                    }`}
                  >
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${on ? "border-black bg-black" : "border-neutral-300 bg-white"}`}>
                      {on && <Check className="h-3 w-3 text-white" />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-black">{n.label}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">{n.sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-black/5 bg-neutral-50/70 p-6" data-testid="estimator-result">
              {estimate ? (
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-400">
                      Estimated scope · {estimate.hours} hours
                    </p>
                    <p className="mt-1 font-display text-3xl font-bold tracking-tight text-black" data-testid="estimator-cost">
                      ₹{estimate.cost.toLocaleString("en-IN")}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">Flat $30/hour · indicative, confirmed in your working session</p>
                    <p className="mt-3 text-sm text-neutral-600">
                      Agencies + tools for this scope: ≈ ₹{estimate.market.toLocaleString("en-IN")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-green" data-testid="estimator-savings">
                      You save ~{estimate.savingsPct}%
                    </p>
                    <p className="mt-3 text-sm text-neutral-600">
                      Recommended:{" "}
                      <span className="font-semibold" style={{ color: estimate.pack.color }} data-testid="estimator-recommendation">
                        {estimate.pack.name}
                      </span>
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
              ) : (
                <p className="text-sm text-neutral-400" data-testid="estimator-empty">
                  Select at least one need above to see your estimate.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
