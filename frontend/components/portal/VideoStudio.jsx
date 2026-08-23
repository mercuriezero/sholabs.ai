"use client";

import { useEffect, useState } from "react";
import { Clapperboard, Clock, Loader2, Video } from "lucide-react";
import { toast } from "sonner";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

const VIDEO_TYPES = ["Product Advertisement", "Educational Explainer", "Social Media Reel", "Corporate Introduction", "Avatar Spokesperson", "Video Translation"];
const RATIOS = ["Landscape 16:9", "Portrait 9:16", "Square 1:1"];

export default function VideoStudio() {
  const [reqs, setReqs] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ project_name: "", video_type: VIDEO_TYPES[0], script: "", avatar: "", language: "English (US)", aspect_ratio: RATIOS[0], duration: "30-60s", brand_assets: "", notes: "" });

  const load = () => fetch(`${API}/portal/video-requests`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null)).then((d) => setReqs(d?.requests || [])).catch(() => setReqs([]));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch(`${API}/portal/video-requests`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error();
      toast.success("Brief submitted — our studio team is on it.");
      setForm({ ...form, project_name: "", script: "", avatar: "", brand_assets: "", notes: "" });
      load();
    } catch { toast.error("Couldn't submit. Please try again."); } finally { setBusy(false); }
  };

  const field = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div data-testid="video-studio">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500">
        <Video className="h-4 w-4 text-brand-purple" /> Get Watched · AI Video engine
      </div>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-black md:text-4xl">Brief your next AI video</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-500 md:text-base">Tell us what you need. Our production team scripts, generates and delivers your video — you'll see it here as it moves through production.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm" data-testid="video-form">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Project name</label>
            <input required value={form.project_name} onChange={(e) => field("project_name", e.target.value)} data-testid="video-project-name" placeholder="e.g. Q3 product launch reel" className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-2.5 text-sm outline-none focus:border-black/40" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Video type</label>
              <select value={form.video_type} onChange={(e) => field("video_type", e.target.value)} data-testid="video-type" className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-black/40">
                {VIDEO_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Aspect ratio</label>
              <select value={form.aspect_ratio} onChange={(e) => field("aspect_ratio", e.target.value)} data-testid="video-ratio" className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-black/40">
                {RATIOS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Language</label>
              <input value={form.language} onChange={(e) => field("language", e.target.value)} data-testid="video-language" className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-2.5 text-sm outline-none focus:border-black/40" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Target duration</label>
              <input value={form.duration} onChange={(e) => field("duration", e.target.value)} data-testid="video-duration" placeholder="e.g. 30-60s" className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-2.5 text-sm outline-none focus:border-black/40" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Avatar / spokesperson preference</label>
            <input value={form.avatar} onChange={(e) => field("avatar", e.target.value)} data-testid="video-avatar" placeholder="e.g. Professional female presenter, or 'use my footage'" className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-2.5 text-sm outline-none focus:border-black/40" />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Script or prompt</label>
            <textarea value={form.script} onChange={(e) => field("script", e.target.value)} data-testid="video-script" rows={4} placeholder="Paste your script, or describe the video you want us to create." className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-2.5 text-sm outline-none focus:border-black/40" />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Brand assets & reference links</label>
            <textarea value={form.brand_assets} onChange={(e) => field("brand_assets", e.target.value)} data-testid="video-assets" rows={2} placeholder="Logo/drive links, brand colors, reference videos…" className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-2.5 text-sm outline-none focus:border-black/40" />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Notes</label>
            <textarea value={form.notes} onChange={(e) => field("notes", e.target.value)} data-testid="video-notes" rows={2} className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-2.5 text-sm outline-none focus:border-black/40" />
          </div>
          <button type="submit" disabled={busy} data-testid="video-submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit video brief
          </button>
        </form>

        <div>
          <h2 className="font-display text-lg font-semibold text-black">Your videos</h2>
          {reqs === undefined ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-neutral-400" /></div>
          ) : reqs.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-dashed border-black/10 bg-white p-8 text-center" data-testid="video-empty">
              <Clapperboard className="mx-auto h-8 w-8 text-neutral-300" />
              <p className="mt-3 text-sm text-neutral-500">No videos yet. Submit a brief to get started.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3" data-testid="video-list">
              {reqs.map((r) => (
                <li key={r.id} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm" data-testid={`video-req-${r.id}`}>
                  <p className="text-sm font-semibold text-black">{r.project_name}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{r.video_type} · {r.aspect_ratio}</p>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-purple/10 px-2.5 py-1 text-[11px] font-medium text-brand-purple">
                    <Clock className="h-3 w-3 animate-pulse" /> Video generation in progress
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
