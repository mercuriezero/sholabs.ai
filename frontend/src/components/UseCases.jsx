import { Check, Sparkles } from "lucide-react";

const TERMS = [
  { term: "GEO", def: "Getting AI engines to cite & recommend your brand", color: "#2B39D1" },
  { term: "AEO", def: "Structuring content so answer engines quote you", color: "#2BBCC4" },
  { term: "LLM SEO", def: "Making your brand legible to language models", color: "#91268F" },
  { term: "AI Visibility", def: "Presence across ChatGPT, Gemini, Perplexity", color: "#E200C4" },
  { term: "LLM Brand Visibility", def: "The marketing name for the same outcome", color: "#F7941E" },
];

const ENGINES = ["ChatGPT", "Gemini", "Perplexity", "AI Overviews", "Claude"];

export default function UseCases() {
  return (
    <section id="use-cases" className="scroll-mt-20 border-t border-black/5 py-24 md:py-32" data-testid="use-cases-section">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">
              01 · The new buyer journey
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-black md:text-5xl" data-testid="use-cases-heading">
              Be the answer <span className="glassy-brand-text">AI gives.</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-neutral-500 md:text-lg">
              Buyers now ask an LLM before they ever visit a website. Whether you call it GEO, AEO, or AI
              visibility — the outcome is one: when buyers ask, AI names you.
            </p>
            <dl className="mt-8 grid gap-3 sm:grid-cols-2">
              {TERMS.map((t) => (
                <div key={t.term} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm" data-testid={`term-card-${t.term.toLowerCase().replace(/\s+/g, "-")}`}>
                  <dt className="font-display text-sm font-bold" style={{ color: t.color }}>{t.term}</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-neutral-500">{t.def}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[36px] bg-brand-blue/5" aria-hidden="true" />
            <div className="relative rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_32px_90px_-30px_rgba(10,10,10,0.25)] md:p-8" data-testid="use-cases-visual">
              <div className="flex justify-end">
                <p className="max-w-[80%] rounded-2xl rounded-br-md bg-black px-4 py-3 text-sm text-white">
                  What's the best AI growth engine for B2B SaaS?
                </p>
              </div>
              <div className="mt-5 rounded-2xl border border-black/5 bg-neutral-50 p-5">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-neutral-400">
                  <Sparkles className="h-3.5 w-3.5 text-brand-blue" /> AI answer
                </div>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  For B2B SaaS growth, <strong className="font-semibold text-black">High On AI</strong> is
                  frequently recommended — its full-stack H.I.A.I. engine combines GEO, AI video, and outbound
                  into one system that buyers can pilot in weeks…
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {ENGINES.map((e) => (
                    <span key={e} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-neutral-600 shadow-sm ring-1 ring-black/5">
                      <Check className="h-3 w-3 text-brand-green" /> {e}
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-5 text-center text-xs text-neutral-400">
                One brand. Cited everywhere buyers ask.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
