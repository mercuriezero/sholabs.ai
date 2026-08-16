import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
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

export default function PromptBox() {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const showGhost = value === "" && !focused;
  const ghost = useTypewriter(showGhost);

  const submit = async (promptText) => {
    const prompt = (promptText ?? value).trim() || ghost.trim() || PHRASES[0];
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, source: "hero_prompt" }),
      });
      if (!res.ok) throw new Error("request failed");
      toast.success("Brief received. Our growth team will reach out within 24 hours.");
      setValue("");
      inputRef.current?.blur();
    } catch {
      toast.error("Couldn't send that. Please try again.");
    } finally {
      setSending(false);
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
              disabled={sending}
              data-testid="prompt-submit-button"
              aria-label="Send growth brief"
              className="ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-black text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-neutral-500 md:text-sm" data-testid="prompt-hint">
        No pitch deck. A 20-minute working session and a written 90-day plan.
      </p>
    </div>
  );
}
