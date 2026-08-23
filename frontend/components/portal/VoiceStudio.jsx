"use client";

import { useEffect, useState } from "react";
import { Clock, Loader2, Mic, PhoneCall } from "lucide-react";
import { toast } from "sonner";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

const PURPOSES = ["Customer support / FAQ", "Subscription management", "Lead qualification / intake", "Outbound outreach & reminders"];
const VOICES = ["Warm female (default)", "Confident male", "Neutral / professional", "Energetic"];

export default function VoiceStudio() {
  const [reqs, setReqs] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ agent_name: "", website: "", purpose: PURPOSES[0], voice: VOICES[0], language: "English (US)", greeting: "", knowledge: "", outcomes: "", phone: "", notes: "" });

  const load = () => fetch(`${API}/portal/voice-requests`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null)).then((d) => setReqs(d?.requests || [])).catch(() => setReqs([]));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch(`${API}/portal/voice-requests`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error();
      toast.success("Agent brief submitted — we'll build & configure it for you.");
      setForm({ ...form, agent_name: "", greeting: "", knowledge: "", outcomes: "", notes: "" });
      load();
    } catch { toast.error("Couldn't submit. Please try again."); } finally { setBusy(false); }
  };

  const field = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div data-testid="voice-studio">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500">
        <Mic className="h-4 w-4 text-brand-blue" /> Get Chosen · Voice AI agents
      </div>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-black md:text-4xl">Design your Voice AI agent</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-500 md:text-base">Answer a few questions and our team builds a ready-to-deploy calling agent — grounded in your business, tuned to qualify and book.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm" data-testid="voice-form">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Agent name</label>
              <input required value={form.agent_name} onChange={(e) => field("agent_name", e.target.value)} data-testid="voice-agent-name" placeholder="e.g. Riya · Subscription support" className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-2.5 text-sm outline-none focus:border-black/40" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Business website</label>
              <input value={form.website} onChange={(e) => field("website", e.target.value)} data-testid="voice-website" placeholder="https://yourcompany.com" className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-2.5 text-sm outline-none focus:border-black/40" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">What should this agent do on calls?</label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2" data-testid="voice-purpose">
              {PURPOSES.map((p) => (
                <button type="button" key={p} onClick={() => field("purpose", p)} className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${form.purpose === p ? "border-black bg-neutral-50 font-semibold" : "border-neutral-200 text-neutral-600 hover:border-black/40"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Voice</label>
              <select value={form.voice} onChange={(e) => field("voice", e.target.value)} data-testid="voice-voice" className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-black/40">
                {VOICES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Language</label>
              <input value={form.language} onChange={(e) => field("language", e.target.value)} data-testid="voice-language" className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-2.5 text-sm outline-none focus:border-black/40" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Greeting / opening line</label>
            <input value={form.greeting} onChange={(e) => field("greeting", e.target.value)} data-testid="voice-greeting" placeholder="How should the agent open the call?" className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-2.5 text-sm outline-none focus:border-black/40" />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Knowledge & FAQs</label>
            <textarea value={form.knowledge} onChange={(e) => field("knowledge", e.target.value)} data-testid="voice-knowledge" rows={3} placeholder="Key facts, policies, FAQs the agent must know." className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-2.5 text-sm outline-none focus:border-black/40" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Target outcomes / data to capture</label>
              <textarea value={form.outcomes} onChange={(e) => field("outcomes", e.target.value)} data-testid="voice-outcomes" rows={2} placeholder="e.g. book a demo, capture name + email + intent" className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-2.5 text-sm outline-none focus:border-black/40" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Phone preference</label>
              <input value={form.phone} onChange={(e) => field("phone", e.target.value)} data-testid="voice-phone" placeholder="Inbound number, or 'need a new one'" className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-2.5 text-sm outline-none focus:border-black/40" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Notes</label>
            <textarea value={form.notes} onChange={(e) => field("notes", e.target.value)} data-testid="voice-notes" rows={2} className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-2.5 text-sm outline-none focus:border-black/40" />
          </div>
          <button type="submit" disabled={busy} data-testid="voice-submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit agent brief
          </button>
        </form>

        <div>
          <h2 className="font-display text-lg font-semibold text-black">Your agents</h2>
          {reqs === undefined ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-neutral-400" /></div>
          ) : reqs.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-dashed border-black/10 bg-white p-8 text-center" data-testid="voice-empty">
              <PhoneCall className="mx-auto h-8 w-8 text-neutral-300" />
              <p className="mt-3 text-sm text-neutral-500">No agents yet. Submit a brief to get started.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3" data-testid="voice-list">
              {reqs.map((r) => (
                <li key={r.id} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm" data-testid={`voice-req-${r.id}`}>
                  <p className="text-sm font-semibold text-black">{r.agent_name}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{r.purpose} · {r.voice}</p>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-2.5 py-1 text-[11px] font-medium text-brand-blue">
                    <Clock className="h-3 w-3 animate-pulse" /> Building your agent
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
