"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ExternalLink, FileText, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

export default function GeneratedPages() {
  const router = useRouter();
  const [pages, setPages] = useState(undefined);
  const [generating, setGenerating] = useState(false);

  const load = () => {
    fetch(`${API}/portal/pages`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPages(d?.pages || []))
      .catch(() => setPages([]));
  };
  useEffect(load, []);

  const generate = async () => {
    if (pages && pages.length > 0 && !window.confirm("Regenerating replaces all current pages and their live URLs. Continue?")) return;
    setGenerating(true);
    try {
      const r = await fetch(`${API}/portal/generate-pages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 6 }),
      });
      if (r.status === 400) {
        toast.error("Run a scan first.");
        router.push("/portal");
        return;
      }
      if (!r.ok) throw new Error();
      const d = await r.json();
      setPages(d.pages || []);
      toast.success("Pages generated");
    } catch {
      toast.error("Couldn't generate pages. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (pages === undefined) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  return (
    <div data-testid="pages-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-black md:text-4xl">
            Get on top of your <span className="glassy-brand-text">customer's mind.</span>
          </h1>
          <p className="mt-2 text-sm text-neutral-500">Live, SEO-ready pages built to answer your buyers' searches and capture demos.</p>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          data-testid="pages-regenerate-button"
          className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {pages.length ? "Regenerate" : "Generate pages"}
        </button>
      </div>

      {pages.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-black/10 bg-white p-10 text-center" data-testid="pages-empty">
          <p className="text-sm text-neutral-500">No pages yet. Generate ranking-ready pages from your opportunities.</p>
          <button onClick={() => router.push("/portal/opportunities")} className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5">
            View opportunities <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2" data-testid="pages-list">
          {pages.map((p) => (
            <div key={p.id} className="flex flex-col rounded-3xl border border-black/5 bg-white p-6 shadow-sm" data-testid={`page-card-${p.slug}`}>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-blue">Service</span>
                <span className="rounded-full bg-brand-green/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-green">Published</span>
              </div>
              <h3 className="mt-3 flex items-start gap-2 font-display text-lg font-semibold leading-snug text-black">
                <FileText className="mt-1 h-4 w-4 shrink-0 text-neutral-400" /> {p.title}
              </h3>
              <p className="mt-2 text-sm text-neutral-500">
                Helps you show up for <span className="font-semibold text-black">{(p.reach || 0).toLocaleString("en-US")}+ searches</span>, including:
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(p.target_queries || []).slice(0, 6).map((q) => (
                  <span key={q} className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] text-neutral-600">{q}</span>
                ))}
                {(p.target_queries || []).length > 6 && (
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] text-neutral-400">+{p.target_queries.length - 6} more</span>
                )}
              </div>
              <a
                href={`/p?slug=${p.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`page-live-${p.slug}`}
                className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full border border-black/15 px-4 py-2 text-xs font-semibold text-black transition-all hover:-translate-y-0.5 hover:border-black/40"
              >
                Go to live page <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
