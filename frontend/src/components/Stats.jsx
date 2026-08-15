const STATS = [
  { value: "94%", label: "of B2B buyers use LLMs to research vendors", color: "#2B39D1" },
  { value: "3–4", label: "brands cited per AI answer — the only seats that matter", color: "#E200C4" },
  { value: "2–4 wks", label: "to first AI citations, videos, and booked meetings", color: "#1FA84A" },
  { value: "10–20 hrs", label: "per week of C-level growth ownership, fractional", color: "#F7941E" },
];

export default function Stats() {
  return (
    <section id="why-now" className="scroll-mt-20 border-y border-black/5 bg-neutral-50/60 py-20 md:py-24" data-testid="stats-section">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">Why now</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-black md:text-5xl" data-testid="stats-heading">
            The shortlist moved into the answer box
          </h2>
          <p className="mt-4 text-base text-neutral-500 md:text-lg">
            Buyers no longer scroll ten links — they ask an AI, get 3–4 names, and shortlist from there. If you're
            not in the answer, you're not in the deal.
          </p>
        </div>
        <dl className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              data-testid={`stat-card-${s.value.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
              className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm transition-transform hover:-translate-y-1"
            >
              <dt className="order-2 mt-3 block text-sm leading-relaxed text-neutral-500">{s.label}</dt>
              <dd className="font-display text-4xl font-bold tracking-tight" style={{ color: s.color }}>
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
