import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import PromptBox from "@/components/PromptBox";
import KeywordField from "@/components/KeywordField";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const orbX = useSpring(mx, { stiffness: 40, damping: 18 });
  const orbY = useSpring(my, { stiffness: 40, damping: 18 });
  const orb2X = useTransform(orbX, (v) => v * -1.5);
  const orb2Y = useTransform(orbY, (v) => v * -1.2);

  const onMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left - r.width / 2) / 36);
    my.set((e.clientY - r.top - r.height / 2) / 36);
  };

  return (
    <section id="top" className="relative overflow-hidden" data-testid="hero-section" onMouseMove={onMouseMove}>
      <motion.div style={{ x: orbX, y: orbY }} className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-brand-magenta/10 blur-3xl" aria-hidden="true" />
      <motion.div style={{ x: orb2X, y: orb2Y }} className="pointer-events-none absolute -right-24 top-56 h-80 w-80 rounded-full bg-brand-blue/10 blur-3xl" aria-hidden="true" />
      <KeywordField mx={mx} my={my} />
      <div className="relative mx-auto max-w-4xl px-6 pb-24 pt-20 text-center md:pt-28">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="flex items-center justify-center gap-4">
          <span className="stripe-gradient h-1 w-10 rounded-full" aria-hidden="true" />
          <span
            data-testid="hero-eyebrow"
            className="font-mono text-sm font-medium uppercase tracking-[0.3em] text-neutral-600 md:text-base"
          >
            Full-Stack H.I.A.I. Engine
          </span>
          <span className="stripe-gradient h-1 w-10 rounded-full" aria-hidden="true" />
        </motion.div>

        <h1
          data-testid="hero-headline"
          className="mt-8 font-display text-5xl font-bold leading-[1.05] tracking-tighter text-black md:text-6xl lg:text-[72px]"
        >
          <span className="block overflow-hidden pb-1">
            <motion.span
              className="block"
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              Human intelligence + AI for
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-2">
            <motion.span
              className="glassy-brand-text block"
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              marketing, sales &amp; growth.
            </motion.span>
          </span>
        </h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          data-testid="hero-subheadline"
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-neutral-500 md:text-lg"
        >
          New revenue from LLMs. Video that converts.{" "}
          <strong className="font-semibold text-black">89% of buyers</strong> say it seals the deal.
        </motion.p>

        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-12">
          <PromptBox />
        </motion.div>
      </div>
    </section>
  );
}
