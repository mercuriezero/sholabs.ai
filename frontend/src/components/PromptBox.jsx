import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PHRASES = [
  "Get my brand cited by ChatGPT, Gemini & Perplexity…",
  "Generate 50 marketing-qualified leads with GEO this quarter…",
  "Launch an AI video engine for my category…",
  "Deploy a Voice AI SDR that books meetings while I sleep…",
  "Turn one focused pilot into a full growth engine…",
];

const CHIPS = [
  { label: "GEO Leads", prompt: PHRASES[0] },
  { label: "AI Videos", prompt: PHRASES[2] },
  { label: "Voice AI", prompt: PHRASES[3] },
];

function useTypewriter(active) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!active) return;
    let phrase = 0;
    let char = 0;
    let deleting = false;
    let timer;
    const tick = () => {
      const current = PHRASES[phrase];
      if (!deleting) {
        char++;
        setText(current.slice(0, char));
        if (char === current.length) {
          deleting = true;
          timer = setTimeout(tick, 2000);
          return;
        }
        timer = setTimeout(tick, 34);
      } else {
        char -= 3;
        if (char <= 0) {
          char = 0;
          deleting = false;
          phrase = (phrase + 1) % PHRASES.length;
        }
        setText(PHRASES[phrase].slice(0, Math.max(char, 0)));
        timer = setTimeout(tick, deleting ? 14 : 400);
      }
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, [active]);
  return text;
}

function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-black">{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}

function PlanBody({ text }) {
  const blocks = [];
  let list = [];
  const flush = () => {
    if (list.length) {
      const items = list;
      list = [];
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-neutral-600">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-magenta" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    }
  };
  text.split("\n").forEach((raw) => {
    const line = raw.trim();
    if (line.startsWith("#")) {
      flush();
      blocks.push(
        <h4 key={`h-${blocks.length}`} className="pt-3 font-display text-base font-semibold tracking-tight text-black">
          {renderInline(line.replace(/^#+\s*/, ""))}
        </h4>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      list.push(line.slice(2));
    } else if (line === "") {
      flush();
    } else {
      flush();
      blocks.push(
        <p key={`p-${blocks.length}`} className="text-sm leading-relaxed text-neutral-600">
          {renderInline(line)}
        </p>
      );
    }
  });
  flush();
  return <div className="space-y-2">{blocks}</div>;
}

export default function PromptBox() {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle | loading | streaming | done
  const [plan, setPlan] = useState("");
  const inputRef = useRef(null);
  const busy = phase === "loading" || phase === "streaming";
  const showGhost = value === "" && !focused && phase === "idle";
  const ghost = useTypewriter(showGhost);

  const submit = async (promptText) => {
    const prompt = (promptText ?? value).trim() || ghost.trim() || PHRASES[0];
    if (busy) return;
    setPhase("loading");
    setPlan("");
    try {
      const res = await fetch(`${API}/plan/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, source: "hero_prompt" }),
      });
      if (!res.ok || !res.body) throw new Error("request failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      setPhase("streaming");
      for (;;) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        buffer += decoder.decode(chunk, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const payload = JSON.parse(line.slice(5));
          if (payload.token) setPlan((p) => p + payload.token);
          if (payload.error) throw new Error(payload.error);
        }
      }
      setPhase("done");
    } catch {
      setPhase("idle");
      toast.error("Couldn't generate your plan. Please try again.");
    }
  };

  return (
    <div id="hero-cta" data-testid="prompt-box" className="w-full scroll-mt-28">
      <div className="rounded-[28px] border border-black/5 bg-white p-2 shadow-[0_24px_80px_-24px_rgba(10,10,10,0.25)]">
        <div className="relative rounded-[22px] border border-neutral-200 bg-neutral-50/60">
          {showGhost && (
            <div
              aria-hidden="true"
              data-testid="prompt-typewriter"
              className="type-caret pointer-events-none absolute inset-x-0 top-0 px-6 pt-6 text-left text-base text-neutral-400 md:text-lg"
            >
              {ghost}
            </div>
          )}
          <textarea
            ref={inputRef}
            value={value}
            data-testid="prompt-input"
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={3}
            aria-label="Describe your growth goal"
            className="relative z-10 w-full resize-none bg-transparent px-6 pt-6 text-base text-black outline-none md:text-lg"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  data-testid={`prompt-chip-${chip.label.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => {
                    setValue(chip.prompt);
                    inputRef.current?.focus();
                  }}
                  className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-medium text-neutral-600 transition-all hover:-translate-y-0.5 hover:border-black/30 hover:text-black hover:shadow-sm"
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => submit()}
              disabled={busy}
              data-testid="prompt-submit-button"
              aria-label="Generate my instant plan"
              className="ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-black text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-neutral-500 md:text-sm" data-testid="prompt-hint">
        No pitch deck. A 20-minute working session and a written 90-day plan.
      </p>

      <AnimatePresence>
        {phase !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 rounded-[28px] border border-black/5 bg-white p-6 text-left shadow-[0_24px_80px_-24px_rgba(10,10,10,0.2)] md:p-8"
            data-testid="plan-result"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                <Sparkles className="h-4 w-4 text-brand-magenta" />
                Your instant plan
              </div>
              {phase === "done" ? (
                <span className="rounded-full bg-brand-green/10 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-widest text-brand-green">
                  Ready
                </span>
              ) : (
                <span className="rounded-full bg-brand-blue/10 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-widest text-brand-blue">
                  Generating
                </span>
              )}
            </div>
            <div className="mt-5" data-testid="plan-text">
              {phase === "loading" ? (
                <p className="flex items-center gap-2 text-sm text-neutral-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Auditing your brand across AI, search &amp; video…
                </p>
              ) : (
                <div className={busy ? "type-caret" : ""}>
                  <PlanBody text={plan} />
                </div>
              )}
            </div>
            {phase === "done" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-6 flex flex-wrap items-center gap-4 border-t border-black/5 pt-5"
              >
                <a
                  href="https://cal.com/sunnyrai/30min"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="plan-cta"
                  className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Build this with us <ArrowUpRight className="h-4 w-4" />
                </a>
                <p className="text-xs text-neutral-400">Brief saved — our team has it too.</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
