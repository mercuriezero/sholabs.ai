"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, useTransform } from "framer-motion";
import { AudioLines, Bot, Play, Users } from "lucide-react";

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

const CARDS = [
  { t: "Engine showreel", views: "12.4k", dur: "0:04", x: "3%", y: "12%", xm: "58%", ym: "74%", d: 1.8, color: "#E200C4", src: "/hero-ad.mp4" },
  { t: "Ad creative · V3", views: "4.2k", dur: "0:18", x: "83%", y: "60%", xm: null, ym: null, d: 1.8, color: "#F7941E" },
];

const CHIPS = [
  { t: "ChatGPT", x: "22%", y: "10%", xm: "4%", ym: "3%", d: 1.8 },
  { t: "Gemini", x: "72%", y: "16%", xm: "66%", ym: "6%", d: 1 },
  { t: "UGC Ads", icon: Users, x: "10%", y: "42%", xm: null, ym: null, d: 1 },
  { t: "Perplexity", x: "8%", y: "78%", xm: "6%", ym: "58%", d: 1 },
  { t: "AI SDR", icon: Bot, x: "24%", y: "89%", xm: null, ym: null, d: 1.8 },
  { t: "GEO", x: "56%", y: "88%", xm: "58%", ym: "92%", d: 1.8 },
  { t: "Voice AI", icon: AudioLines, x: "90%", y: "38%", xm: "80%", ym: "42%", d: 1.8 },
];

const DEPTH = {
  0.6: "opacity-40 blur-[1.5px] scale-90",
  1: "opacity-60 blur-[0.5px]",
  1.8: "opacity-90",
};

function Chip({ t, icon: Icon, x, y, xm, ym, d, i, mx, my, reduce, mobile }) {
  const tx = useTransform(mx, (v) => v * 1.4 * d);
  const ty = useTransform(my, (v) => v * d);
  if (mobile && xm === null) return null;
  return (
    <motion.span style={{ left: mobile ? xm : x, top: mobile ? ym : y, x: tx, y: ty }} className={`absolute ${DEPTH[d]}`}>
      <motion.span
        animate={reduce ? undefined : { y: [0, -12, 0] }}
        transition={{ repeat: Infinity, duration: 6 + (i % 5), ease: "easeInOut", delay: i * 0.45 }}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-black/5 bg-white/70 px-3 py-1.5 text-[11px] font-medium text-neutral-500 shadow-sm backdrop-blur-sm"
      >
        {Icon ? (
          <Icon className="h-3.5 w-3.5 text-brand-green" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-brand-blue" />
        )}
        {t}
      </motion.span>
    </motion.span>
  );
}

function VideoCard({ t, views, dur, live, color, src, x, y, xm, ym, d, i, mx, my, reduce, mobile }) {
  const tx = useTransform(mx, (v) => v * 1.6 * d);
  const ty = useTransform(my, (v) => v * 1.1 * d);
  if (mobile && xm === null) return null;
  return (
    <motion.span style={{ left: mobile ? xm : x, top: mobile ? ym : y, x: tx, y: ty }} className={`absolute ${DEPTH[d]}`}>
      <motion.div
        animate={reduce ? undefined : { y: [0, -14, 0] }}
        transition={{ repeat: Infinity, duration: 7 + (i % 4), ease: "easeInOut", delay: i * 0.6 }}
        className="w-36 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-md md:w-44"
      >
        <div className="relative h-20 md:h-24" style={{ background: `linear-gradient(135deg, ${color}26, ${color}59)` }}>
          {src ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              aria-label={t}
              onCanPlay={(e) => e.currentTarget.play().catch(() => {})}
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source src={`${src.replace(/\.mp4$/, "")}.webm`} type="video/webm" />
              <source src={src} type="video/mp4" />
            </video>
          ) : (
            <>
              {!reduce && (
                <motion.span
                  className="absolute inset-y-0 w-1/2 bg-white/25 blur-md"
                  animate={{ x: ["-120%", "260%"] }}
                  transition={{ repeat: Infinity, duration: 2.8 + i * 0.5, ease: "easeInOut", repeatDelay: 1.2 }}
                  aria-hidden="true"
                />
              )}
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md">
                  <Play className="ml-0.5 h-4 w-4 fill-black text-black" />
                </span>
              </span>
            </>
          )}
          {live && (
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-brand-red px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              <span className="h-1 w-1 animate-pulse rounded-full bg-white" /> Live
            </span>
          )}
          <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] text-white">
            {dur}
          </span>
        </div>
        <div className="p-2.5">
          <p className="text-[11px] font-semibold leading-tight text-black">{t}</p>
          <p className="mt-0.5 text-[9px] text-neutral-400">{views} views</p>
          {!src && (
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-neutral-100">
              {reduce ? (
                <span className="block h-full w-2/3 rounded-full" style={{ background: color }} />
              ) : (
                <motion.span
                  className="block h-full rounded-full"
                  style={{ background: color }}
                  animate={{ width: ["4%", "96%"] }}
                  transition={{ repeat: Infinity, duration: 5 + i, ease: "linear", repeatDelay: 0.6 }}
                />
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.span>
  );
}

export default function KeywordField({ mx, my }) {
  const reduce = useReducedMotion();
  const mobile = useIsMobile();
  const rotateX = useTransform(my, (v) => v * -0.22);
  const rotateY = useTransform(mx, (v) => v * 0.22);
  return (
    <motion.div
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      data-testid="keyword-field"
    >
      {CARDS.map((c, i) => (
        <VideoCard key={c.t} {...c} i={i} mx={mx} my={my} reduce={reduce} mobile={mobile} />
      ))}
      {CHIPS.map((c, i) => (
        <Chip key={c.t} {...c} i={i} mx={mx} my={my} reduce={reduce} mobile={mobile} />
      ))}
    </motion.div>
  );
}
