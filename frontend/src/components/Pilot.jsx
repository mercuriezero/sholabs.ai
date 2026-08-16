import { Check, ArrowUpRight } from "lucide-react";

const POINTS = [
  "No long-term contract to get your plan",
  "No call required to see your strategy",
  "Pay for one focused pilot project, see real output, decide from there",
];

export default function Pilot() {
  return (
    <section className="py-24 md:py-32" data-testid="pilot-section">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-[36px] border border-black/5 bg-white p-10 text-center shadow-[0_32px_90px_-30px_rgba(10,10,10,0.18)] md:p-16">
          <div className="stripe-gradient absolute inset-x-0 top-0 h-1.5" aria-hidden="true" />
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">
            Proof over promises
          </p>
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-semibold tracking-tight text-black md:text-5xl" data-testid="pilot-heading">
            We're not asking you to trust a pitch · we're asking you to trust a{" "}
            <span className="glassy-brand-text">pilot.</span>
          </h2>
          <ul className="mx-auto mt-10 grid max-w-3xl gap-4 text-left sm:grid-cols-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 rounded-2xl bg-neutral-50 p-5 text-sm font-medium text-neutral-700" data-testid={`pilot-point-${POINTS.indexOf(p)}`}>
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-green/10">
                  <Check className="h-3 w-3 text-brand-green" />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <a
            href="https://cal.com/sunnyrai/30min"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="pilot-cta"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Scope your pilot <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
