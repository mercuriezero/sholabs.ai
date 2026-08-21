"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Loader2, Search, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

export default function Opportunities() {
  const router = useRouter();
  const [data, setData] = useState(undefined);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch(`${API}/portal/analysis`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d && d.id ? d : null))
      .catch(() => setData(null));
  }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await fetch(`${API}/portal/generate-pages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 6 }),
      });
      if (!r.ok) throw new Error();
      await r.json();
      toast.success("Your ranking-ready pages are live");
      router.push("/portal/pages");
    } catch {
      setGenerating(false);
      toast.error("Couldn't generate pages. Please try again.");
    }
  };

  if (data === undefined) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  if (data === null) {
    return (
      <div className="mx-auto max-w-md py-20 text-center" data-testid="opportunities-empty">
        <h1 className="font-display text-2xl font-semibold text-black">No scan yet</h1>
        <p className="mt-2 text-sm text-neutral-500">Run a demand scan first to surface your opportunities.</p>
        <button onClick={() => router.push("/portal")} data-testid="opportunities-scan-cta" className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5">
          Run a scan <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const queries = data.queries || [];
  const top5 = queries.slice(0, 5);

  return (
    <div data-testid="opportunities-page">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500">
        <Sparkles className="h-4 w-4 text-brand-magenta" /> {data.company || data.url}
      </div>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-black md:text-5xl" data-testid="opportunities-count">
        {queries.length} opportunities <span className="glassy-brand-text">to get found.</span>
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-500 md:text-base">
        The top searches your buyers make today. Answer them directly and you show up on page one — turning
        impressions into leads. <span className="text-neutral-400">Search volumes are AI-estimated.</span>
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-2.5 sm:grid-cols-2" data-testid="opportunities-top5">
          {top5.map((q, i) => (
            <div key={q.q} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm" data-testid={`opportunity-top-${i}`}>
              <div className="flex items-center gap-2 text-neutral-400">
                <Search className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium uppercase tracking-wide">{q.intent} intent</span>
              </div>
              <p className="mt-2 text-sm font-semibold leading-snug text-black">{q.q}</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
                <TrendingUp className="h-3.5 w-3.5 text-brand-green" /> ~{q.volume.toLocaleString("en-US")} searches / month
              </p>
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-brand-red/20 bg-brand-red/[0.04] p-5" data-testid="opportunities-missed">
          <div>
            <div className="flex items-center gap-2 text-brand-red">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">Demand going to competitors</span>
            </div>
            <p className="mt-3 font-display text-4xl font-bold tracking-tight text-black" data-testid="opportunities-missed-count">
              {(data.missed || 0).toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-sm text-neutral-500">estimated searches last month didn't find your website across your top 5 queries.</p>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            data-testid="generate-pages-button"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "Generating your pages…" : "Create content that brings customers"}
          </button>
        </div>
      </div>

      <div className="mt-10 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm" data-testid="opportunities-table">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-black">All {queries.length} opportunities</h2>
          <span className="text-xs text-neutral-400">query · est. volume · status</span>
        </div>
        <div className="max-h-[520px] overflow-y-auto">
          <table className="w-full text-sm">
            <tbody>
              {queries.map((q, i) => (
                <tr key={q.q} className="border-b border-black/5 last:border-0 hover:bg-neutral-50/60" data-testid={`opportunity-row-${i}`}>
                  <td className="px-5 py-3 text-neutral-700">{q.q}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-black">{q.volume.toLocaleString("en-US")}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-orange/10 px-2.5 py-1 text-[11px] font-medium text-brand-orange">
                      Not visible yet
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
