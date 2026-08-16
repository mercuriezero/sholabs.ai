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
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="flex items-center justify-center gap-3">
          <span className="stripe-gradient h-[3px] w-8 rounded-full" aria-hidden="true" />
          <span
            data-testid="hero-eyebrow"
            className="font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500"
          >
            Full-Stack H.I.A.I. Engine
          </span>
          <span className="stripe-gradient h-[3px] w-8 rounded-full" aria-hidden="true" />
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
          <span className="glassy-brand-text">marketing, sales &amp; growth.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          data-testid="hero-subheadline"
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-neutral-500 md:text-lg"
        >
          New revenue from LLMs. Video that converts —{" "}
          <strong className="font-semibold text-black">89% of buyers</strong> say it seals the deal.
        </motion.p>

        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-12">
          <PromptBox />
        </motion.div>
      </div>
    </section>
  );
}
