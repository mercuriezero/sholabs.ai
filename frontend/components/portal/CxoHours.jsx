"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2, Wallet } from "lucide-react";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

export default function CxoHours() {
  const router = useRouter();
  const [data, setData] = useState(undefined);

  useEffect(() => {
    fetch(`${API}/account/summary`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (data === undefined) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  const packs = (data?.payments || []).filter((p) => (p.hours_total || 0) > 0);
  const totalHrs = packs.reduce((s, p) => s + (p.hours_total || 0), 0);
  const usedHrs = packs.reduce((s, p) => s + (p.hours_used || 0), 0);
  const remaining = Math.max(totalHrs - usedHrs, 0);

  return (
    <div data-testid="cxo-hours-page">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500">
        <Wallet className="h-4 w-4 text-brand-orange" /> Fractional AI CXO
      </div>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-black md:text-4xl">Your growth-leadership hours</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-500 md:text-base">C-level growth ownership on tap. Track your success-pack balance and top up whenever you need more senior firepower.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3" data-testid="cxo-hours-stats">
        {[["Purchased", totalHrs], ["Used", usedHrs], ["Remaining", remaining]].map(([k, v]) => (
          <div key={k} className="rounded-3xl border border-black/5 bg-white p-6 text-center shadow-sm">
            <p className="font-display text-4xl font-bold text-black">{v}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-neutral-400">{k} hrs</p>
          </div>
        ))}
      </div>

      {packs.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-black/10 bg-white p-10 text-center" data-testid="cxo-hours-empty">
          <Clock className="mx-auto h-8 w-8 text-neutral-300" />
          <p className="mt-3 text-sm text-neutral-500">No success packs yet. Book fractional CXO hours to get a dedicated growth leader.</p>
          <button onClick={() => router.push("/fractional-cxo")} data-testid="cxo-hours-buy" className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5">
            View success packs
          </button>
        </div>
      ) : (
        <>
          <ul className="mt-8 space-y-3" data-testid="cxo-hours-list">
            {packs.map((p) => {
              const rem = (p.hours_total || 0) - (p.hours_used || 0);
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                  <span className="text-sm font-semibold text-black">{p.package_name || "Success pack"}</span>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${rem < 5 ? "bg-brand-red/10 text-brand-red" : "bg-neutral-100 text-neutral-600"}`}>
                    {rem} / {p.hours_total} hrs left
                  </span>
                </li>
              );
            })}
          </ul>
          <button onClick={() => router.push("/fractional-cxo")} data-testid="cxo-hours-topup" className="mt-6 inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:border-black/40">
            Top up hours
          </button>
        </>
      )}
    </div>
  );
}
