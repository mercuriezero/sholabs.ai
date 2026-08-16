const STRIPES = ["#FFD900", "#2BBCC4", "#1FA84A", "#E200C4", "#ED1C24", "#2B39D1", "#F7941E", "#91268F"];

export default function Footer() {
  return (
    <footer data-testid="footer" className="border-t border-black/5">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <img src="/logo.webp" alt="High On AI logo" className="h-14 w-auto rounded-lg" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-neutral-500">
              The full-stack H.I.A.I. engine · human intelligence plus AI for marketing, sales, and growth.
            </p>
            <p className="mt-6 text-xs text-neutral-400" data-testid="footer-powered-by">
              High On AI is powered by <span className="font-semibold text-neutral-600">QuantumAI OS Pvt Ltd</span>
            </p>
          </div>
          <nav aria-label="Services">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">Services</p>
            <ul className="mt-5 space-y-3 text-sm">
              {[
                ["LLM Revenue", "services"],
                ["AI Videos", "services"],
                ["Voice AI", "services"],
                ["Dashboard", "dashboard"],
              ].map(([label, id]) => (
                <li key={label}>
                  <a href={window.location.pathname === "/" ? `#${id}` : `/#${id}`} data-testid={`footer-service-${label.toLowerCase().replace(/\s+/g, "-")}`} className="text-neutral-600 transition-colors hover:text-black">
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <a href="/fractional-cxo" data-testid="footer-service-fractional-ai-cxo" className="text-neutral-600 transition-colors hover:text-black">
                  Fractional AI CXO
                </a>
              </li>
            </ul>
          </nav>
          <nav aria-label="Company">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">Company</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li><a href={window.location.pathname === "/" ? "#process" : "/#process"} data-testid="footer-link-process" className="text-neutral-600 transition-colors hover:text-black">Process</a></li>
              <li><a href={window.location.pathname === "/" ? "#why-us" : "/#why-us"} data-testid="footer-link-why-us" className="text-neutral-600 transition-colors hover:text-black">Why us</a></li>
              <li><a href={window.location.pathname === "/" ? "#faq" : "/#faq"} data-testid="footer-link-faq" className="text-neutral-600 transition-colors hover:text-black">FAQ</a></li>
              <li><a href={window.location.pathname === "/" ? "#hero-cta" : "/#hero-cta"} data-testid="footer-link-contact" className="text-neutral-600 transition-colors hover:text-black">Start a brief</a></li>
            </ul>
          </nav>
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-black/5 pt-8 text-xs text-neutral-400 md:flex-row md:items-center">
          <p data-testid="footer-copyright">© {new Date().getFullYear()} High On AI · QuantumAI OS Pvt Ltd. All rights reserved.</p>
          <div className="flex h-1.5 w-40 overflow-hidden rounded-full" aria-hidden="true">
            {STRIPES.map((c) => (
              <span key={c} className="h-full flex-1" style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>

      <div className="relative h-[40vh] min-h-[320px] overflow-hidden" data-testid="brand-wall">
        <div className="absolute inset-0 flex" aria-hidden="true">
          {STRIPES.map((c) => (
            <span key={c} className="h-full flex-1" style={{ background: c }} />
          ))}
        </div>
        <div className="absolute inset-0 bg-white/55 backdrop-blur-2xl" aria-hidden="true" />
        <div className="relative flex h-full items-end justify-center overflow-hidden">
          <span
            aria-label="high on ai"
            className="glassy-brand-text translate-y-[12%] select-none whitespace-nowrap font-display text-[18vw] font-black leading-none tracking-tighter opacity-40 md:text-[15vw]"
          >
            high on ai
          </span>
        </div>
      </div>
    </footer>
  );
}
