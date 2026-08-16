import { Check, X } from "lucide-react";

const COMPARISON = [
  ["Ownership", "5+ disconnected vendors", "One accountable engine"],
  ["AI visibility", "Ignored or bolted on", "Core pillar, day one"],
  ["Video", "Freelancer, inconsistent", "Built into the growth system"],
  ["Reporting", "Vanity metrics per channel, monthly PDF", "Real-time KPI dashboard, unified across every pillar"],
  ["Speed", "Months to align teams", "Weeks to first signal"],
];

const STACK = [
  ["AI/LLM visibility tracking", "Profound, AthenaHQ, Peec AI, Otterly.AI", "Built-in GEO/AEO pillar · tracking and the fix"],
  ["AI/UGC video creation", "HeyGen, Synthesia, Arcads", "Built-in video pillar · scripted, generated, repurposed"],
  ["Affiliate & partner programs", "impact.com, PartnerStack", "Included in the Get Chosen pillar"],
  ["Influencer/creator management", "GRIN, CreatorIQ, Aspire", "Included in the Get Chosen pillar"],
  ["Outbound / AI SDR", "Apollo, Clay, Outreach, Smartlead", "Agentic outbound with human review, built in"],
  ["RevOps & forecasting", "Clari, HubSpot Operations Hub", "RevOps backbone across the whole engine"],
];

export default function WhyUs() {
  return (
    <section id="why-us" className="scroll-mt-20 border-t border-black/5 bg-neutral-50/60 py-24 md:py-32" data-testid="why-us-section">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">04 · The honest comparison</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-black md:text-5xl" data-testid="why-us-heading">
            Why High On AI <span className="text-neutral-400">(vs. hiring 5 vendors)</span>
          </h2>
        </div>

        <div className="mt-12 overflow-x-auto rounded-3xl border border-black/5 bg-white shadow-sm" data-testid="comparison-table">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/5">
                <th className="px-6 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400"> </th>
                <th className="px-6 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400">Traditional stack</th>
                <th className="px-6 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-brand-magenta">High On AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {COMPARISON.map(([label, oldWay, newWay]) => (
                <tr key={label} className="transition-colors hover:bg-neutral-50/60">
                  <th scope="row" className="px-6 py-4 font-semibold text-black">{label}</th>
                  <td className="px-6 py-4 text-neutral-500">
                    <span className="flex items-start gap-2">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300" /> {oldWay}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-black">
                    <span className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" /> {newWay}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-20 max-w-3xl">
          <h3 className="font-display text-2xl font-semibold tracking-tight text-black md:text-3xl" data-testid="stack-heading">
            The stack you'd otherwise need
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-neutral-500 md:text-base">
            Everything below is a real, separately-sold category in 2026. Most growing companies end up buying 5–8
            of these · different logins, different invoices, no shared context. High On AI's engine covers the
            outcome each one sells, in a single plan.
          </p>
        </div>

        <div className="mt-8 overflow-x-auto rounded-3xl border border-black/5 bg-white shadow-sm" data-testid="stack-table">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-neutral-50/70">
                <th className="px-6 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400">Job to be done</th>
                <th className="px-6 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400">What companies buy today</th>
                <th className="px-6 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400">What High On AI replaces it with</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {STACK.map(([job, today, ours]) => (
                <tr key={job} className="transition-colors hover:bg-neutral-50/60">
                  <th scope="row" className="px-6 py-4 font-semibold text-black">{job}</th>
                  <td className="px-6 py-4 text-neutral-500">{today}</td>
                  <td className="px-6 py-4 font-medium text-black">{ours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs italic text-neutral-400">
          This table works hardest paired with our pilot offer · it turns "trust us" into "here's the exact stack we're replacing."
        </p>
      </div>
    </section>
  );
}
