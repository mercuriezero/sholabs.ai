import { motion } from "framer-motion";
import PromptBox from "@/components/PromptBox";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden" data-testid="hero-section">
      <div className="hero-grid-bg pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl px-6 pb-24 pt-20 text-center md:pt-28">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
          <span
            data-testid="hero-eyebrow"
            className="inline-flex items-center gap-2.5 rounded-full border border-black/10 bg-white px-4 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-600 shadow-sm"
          >
            <span className="flex gap-1" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-brand-magenta" />
              <span className="h-2 w-2 rounded-full bg-brand-cyan" />
              <span className="h-2 w-2 rounded-full bg-brand-orange" />
            </span>
            Full-Stack H.I.A.I. Engine
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          data-testid="hero-headline"
          className="mt-8 font-display text-5xl font-bold leading-[1.05] tracking-tighter text-black md:text-6xl lg:text-[72px]"
        >
          Human intelligence + AI for{" "}
          <span className="glassy-brand-text">marketing, sales, and growth.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          data-testid="hero-subheadline"
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-neutral-500 md:text-lg"
        >
          Deploy the complete growth engine with a high-performing Fractional AI Marketing CXO — strategy,
          execution, and AI systems shipping together every week.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={3}
          data-testid="hero-stat-callout"
          className="mx-auto mt-8 flex max-w-2xl items-start gap-4 rounded-2xl border border-black/5 bg-neutral-50 p-5 text-left"
        >
          <span className="stripe-gradient mt-1 h-10 w-1.5 shrink-0 rounded-full" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-neutral-600 md:text-base">
            <strong className="font-semibold text-black">94% of B2B buyers</strong> now use LLMs to research
            vendors — and AI cites only <strong className="font-semibold text-black">3–4 brands per answer</strong>.
            High On AI makes sure you're one of them.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4} className="mt-12">
          <PromptBox />
        </motion.div>
      </div>
    </section>
  );
}
