import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

const FAQS = [
  {
    q: "What is GEO, and how is it different from SEO?",
    a: "GEO (Generative Engine Optimization) is the practice of making your brand the answer AI engines give. SEO competes for ten blue links on Google; GEO competes for the 3–4 brand citations inside a ChatGPT, Gemini, or Perplexity answer. High On AI optimizes your content, entity signals, and structured data so LLMs can find, trust, and quote you.",
  },
  {
    q: "How do I get my brand cited by ChatGPT, Gemini, and Perplexity?",
    a: "AI engines cite brands that publish clear, structured, entity-rich content and earn mentions across trusted sources. Our GEO program rewrites your key pages into LLM-quotable answers, adds FAQPage and Organization schema, and builds the third-party citations LLMs cross-check before recommending a vendor.",
  },
  {
    q: "What does a Fractional AI Marketing CXO actually do?",
    a: "A Fractional AI Marketing CXO owns your growth number part-time: positioning, demand generation, GEO, paid, and the AI stack that automates them. You get C-level strategy and hands-on execution for a fraction of a full-time hire, typically 10–20 hours per week.",
  },
  {
    q: "How fast can we see pipeline impact?",
    a: "Quick wins · AI search citations, video output, and voice-agent meetings · typically appear within 2–4 weeks. Compounding GEO authority that consistently places you in AI answers usually builds over 60–90 days.",
  },
  {
    q: "Will AI replace our marketing team?",
    a: "No. High On AI pairs human strategists with AI systems. AI handles research, production, and follow-up at scale; your team keeps judgment, relationships, and brand. Most clients redeploy 30–40% of manual marketing hours into higher-value work.",
  },
  {
    q: "How is High On AI different from a traditional agency?",
    a: "Traditional agencies sell hours and headcount. High On AI deploys a full-stack H.I.A.I. engine · human intelligence plus AI · covering GEO, AI video, Voice AI, and fractional leadership in one operating system, so strategy and execution ship together every week.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-20 py-24 md:py-32" data-testid="faq-section">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">05 · FAQ</p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-black md:text-5xl" data-testid="faq-heading">
              Asked by founders. Answered straight.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-neutral-500">
              Real questions about AI search, fractional leadership, and what working with High On AI actually
              looks like.
            </p>
            <a
              href="#hero-cta"
              data-testid="faq-cta-link"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Ask us directly
            </a>
          </div>
          <div className="divide-y divide-black/5 border-y border-black/5">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q}>
                  <button
                    data-testid={`faq-question-${i}`}
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span className={`text-base font-semibold md:text-lg ${isOpen ? "text-black" : "text-neutral-700"}`}>
                      {f.q}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10"
                    >
                      <Plus className="h-4 w-4" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-2xl pb-7 text-sm leading-relaxed text-neutral-500 md:text-base" data-testid={`faq-answer-${i}`}>
                          {f.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
