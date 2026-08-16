import { motion, useReducedMotion, useTransform } from "framer-motion";

const TOKENS = [
  { t: "ChatGPT", x: "6%", y: "16%", d: 1.8 },
  { t: "Gemini", x: "84%", y: "12%", d: 1.8 },
  { t: "Perplexity", x: "12%", y: "68%", d: 1.8 },
  { t: "Claude", x: "88%", y: "60%", d: 1 },
  { t: "GEO", x: "24%", y: "8%", d: 0.6 },
  { t: "AEO", x: "68%", y: "28%", d: 0.6 },
  { t: "LLM SEO", x: "30%", y: "84%", d: 0.6 },
  { t: "AI Overviews", x: "64%", y: "80%", d: 1 },
  { t: "Citations", x: "3%", y: "44%", d: 0.6 },
  { t: "Share of Voice", x: "78%", y: "86%", d: 1.8 },
  { t: "Entity Graph", x: "46%", y: "5%", d: 1 },
  { t: "Answer Engine", x: "50%", y: "90%", d: 1 },
];

const COLORS = ["#2B39D1", "#E200C4", "#1FA84A", "#F7941E", "#2BBCC4", "#91268F", "#ED1C24", "#FFD900"];

const DEPTH = {
  0.6: "opacity-40 blur-[1.5px] scale-90",
  1: "opacity-60 blur-[0.5px]",
  1.8: "opacity-90",
};

function Token({ t, x, y, d, i, mx, my, reduce }) {
  const tx = useTransform(mx, (v) => v * 1.4 * d);
  const ty = useTransform(my, (v) => v * d);
  return (
    <motion.span style={{ left: x, top: y, x: tx, y: ty }} className={`absolute ${DEPTH[d]}`}>
      <motion.span
        animate={reduce ? undefined : { y: [0, -12, 0] }}
        transition={{ repeat: Infinity, duration: 6 + (i % 5), ease: "easeInOut", delay: i * 0.45 }}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-black/5 bg-white/70 px-3 py-1.5 font-mono text-[11px] font-medium text-neutral-500 shadow-sm backdrop-blur-sm"
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
        {t}
      </motion.span>
    </motion.span>
  );
}

export default function KeywordField({ mx, my }) {
  const reduce = useReducedMotion();
  const rotateX = useTransform(my, (v) => v * -0.22);
  const rotateY = useTransform(mx, (v) => v * 0.22);
  return (
    <motion.div
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      data-testid="keyword-field"
    >
      {TOKENS.map((token, i) => (
        <Token key={token.t} {...token} i={i} mx={mx} my={my} reduce={reduce} />
      ))}
    </motion.div>
  );
}
