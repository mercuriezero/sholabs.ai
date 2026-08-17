"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

const SUGGESTIONS = [
  "What exactly does High On AI do?",
  "How much does it cost?",
  "How do I get cited by ChatGPT?",
  "What is a Fractional AI CXO?",
];

function renderText(text) {
  return text.split(/(https?:\/\/[^\s)]+)/g).map((part, i) =>
    part.startsWith("http") ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-blue underline">
        {part.replace(/^https?:\/\//, "")}
      </a>
    ) : (
      part
    )
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const bottomRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    if (!sessionRef.current) {
      let id = localStorage.getItem("hiai_chat_session");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("hiai_chat_session", id);
      }
      sessionRef.current = id;
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Lets anywhere in the app open the concierge, optionally with a prefilled message.
  useEffect(() => {
    const handler = (e) => {
      setOpen(true);
      const prefill = e.detail?.prefill;
      if (prefill) setInput(prefill);
    };
    window.addEventListener("hia:open-chat", handler);
    return () => window.removeEventListener("hia:open-chat", handler);
  }, []);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || busy || !sessionRef.current) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: msg }, { role: "assistant", text: "" }]);
    setBusy(true);
    try {
      const res = await fetch(`${API}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionRef.current, message: msg }),
      });
      if (!res.ok || !res.body) throw new Error("failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
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
          if (payload.token) {
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { role: "assistant", text: copy[copy.length - 1].text + payload.token };
              return copy;
            });
          }
          if (payload.error) throw new Error(payload.error);
          if (payload.captured) {
            toast.success("Details received · our team will reach out within 24 hours.");
          }
        }
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          text: "Something glitched on my side. Try again, or grab a free working session: https://cal.com/sunnyrai/30min",
        };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        data-testid="chat-launcher"
        aria-label={open ? "Close chat" : "Chat with our AI concierge"}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-[0_16px_40px_-12px_rgba(10,10,10,0.5)]"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-70" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-brand-green" />
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-6 z-[70] flex h-[540px] w-[calc(100vw-3rem)] max-w-[400px] flex-col overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_32px_90px_-20px_rgba(10,10,10,0.4)]"
            data-testid="chat-panel"
            role="dialog"
            aria-label="AI concierge chat"
          >
            <div className="flex items-center gap-3 border-b border-black/5 px-5 py-4">
              <span className="stripe-gradient h-8 w-1.5 rounded-full" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-display text-sm font-semibold text-black">High On AI Concierge</p>
                <p className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-green" /> online · knows our entire business
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4" data-testid="chat-messages">
              {messages.length === 0 && (
                <div>
                  <p className="rounded-2xl rounded-tl-md bg-neutral-100 px-4 py-3 text-sm leading-relaxed text-neutral-700">
                    Hey! I know everything about High On AI: GEO, AI video, Voice AI, pricing, pilots, the works.
                    Ask me anything, or tell me your goal and I'll point you to the right move.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        data-testid={`chat-suggestion-${SUGGESTIONS.indexOf(s)}`}
                        className="rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-600 transition-all hover:-translate-y-0.5 hover:border-black/30 hover:text-black"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"} data-testid={`chat-message-${i}`}>
                  <p
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-md bg-black text-white"
                        : "rounded-tl-md bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {m.text ? renderText(m.text) : busy && i === messages.length - 1 ? "…" : ""}
                  </p>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-black/5 p-3">
              <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50/60 py-1.5 pl-4 pr-1.5">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  data-testid="chat-input"
                  placeholder="Ask about services, pricing, GEO…"
                  className="w-full bg-transparent text-sm outline-none"
                />
                <button
                  onClick={() => send()}
                  disabled={busy}
                  data-testid="chat-send"
                  aria-label="Send message"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white transition-all hover:scale-105 disabled:opacity-50"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
