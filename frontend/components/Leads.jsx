"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Loader2, BadgeCheck, ShieldCheck, Sparkle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import Footer from "@/components/Footer";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";
const CAL = "https://cal.com/sunnyrai/30min";

const STATUS = {
  Qualified: { cls: "bg-brand-green/10 text-brand-green", Icon: BadgeCheck },
  Verified: { cls: "bg-brand-blue/10 text-brand-blue", Icon: ShieldCheck },
  New: { cls: "bg-neutral-100 text-neutral-500", Icon: Sparkle },
};

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.New;
  const { Icon } = s;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.cls}`} data-testid={`lead-status-${status}`}>
      <Icon className="h-3 w-3" /> {status}
    </span>
  );
}

const usd = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short" });

export default function Leads() {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/crm/leads`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, [user]);

  const stats = data?.stats;
  const leads = data?.leads || [];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4" aria-label="Leads navigation">
          <Link href="/" data-testid="leads-nav-logo" className="flex items-center gap-3">
            <img src="/logo.webp" alt="High On AI logo" className="h-10 w-auto rounded-md" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/account" className="text-sm font-medium text-neutral-600 transition-colors hover:text-black">My account</Link>
            <a href={CAL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg">
              Book a working session <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-14 md:py-16" data-testid="leads-page">
        {user === undefined && (
          <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>
        )}

        {user === null && (
          <div className="mx-auto max-w-md py-20 text-center" data-testid="leads-login-prompt">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-black">Log in to see your leads</h1>
            <p className="mt-3 text-sm text-neutral-500">Every lead your High On AI engine captures lands here.</p>
            <button onClick={() => setAuthOpen(true)} data-testid="leads-login-button" className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg">
              Log in or sign up
            </button>
          </div>
        )}

        {user && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-4xl font-semibold tracking-tight text-black md:text-5xl">
                  Your <span className="glassy-brand-text">leads</span>
                </h1>
                <p className="mt-2 text-sm text-neutral-500">Captured across GEO, AI video, Voice AI, SDR and social · updated live.</p>
              </div>
              <span className="rounded-full border border-black/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400">Demo data</span>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-4" data-testid="leads-stats">
              {[
                { label: "Total leads", value: stats?.total ?? "·", color: "text-black" },
                { label: "Qualified", value: stats?.qualified ?? "·", color: "text-brand-green" },
                { label: "Verified", value: stats?.verified ?? "·", color: "text-brand-blue" },
                { label: "Pipeline value", value: stats ? usd(stats.pipeline) : "·", color: "text-black" },
              ].map((s) => (
                <div key={s.label} className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">{s.label}</p>
                  <p className={`mt-2 font-display text-3xl font-bold tracking-tight ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Mobile: stacked cards */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2 md:hidden" data-testid="leads-cards">
              {leads.map((l, i) => (
                <div key={i} className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-base font-semibold text-black">{l.name}</p>
                      <p className="text-xs text-neutral-500">{l.company}</p>
                    </div>
                    <StatusBadge status={l.status} />
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-neutral-500">
                    <p>{l.email}</p>
                    <p>{l.phone}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3 text-xs">
                    <span className="font-medium text-neutral-600">{l.source}</span>
                    <span className="font-display font-bold text-black">{l.value ? usd(l.value) : "—"}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="mt-8 hidden overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm md:block" data-testid="leads-table">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/5 bg-neutral-50/60 text-left text-[10px] uppercase tracking-[0.15em] text-neutral-400">
                    <th className="px-5 py-3.5 font-medium">Name</th>
                    <th className="px-5 py-3.5 font-medium">Company</th>
                    <th className="px-5 py-3.5 font-medium">Contact</th>
                    <th className="px-5 py-3.5 font-medium">Source</th>
                    <th className="px-5 py-3.5 font-medium">Status</th>
                    <th className="px-5 py-3.5 font-medium">Value</th>
                    <th className="px-5 py-3.5 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l, i) => (
                    <tr key={i} className="border-b border-black/5 transition-colors last:border-0 hover:bg-neutral-50/60" data-testid={`lead-row-${i}`}>
                      <td className="px-5 py-3.5 font-medium text-black">{l.name}</td>
                      <td className="px-5 py-3.5 text-neutral-600">{l.company}</td>
                      <td className="px-5 py-3.5 text-neutral-500">
                        <span className="block">{l.email}</span>
                        <span className="block text-xs text-neutral-400">{l.phone}</span>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-600">{l.source}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={l.status} /></td>
                      <td className="px-5 py-3.5 font-display font-bold text-black">{l.value ? usd(l.value) : "—"}</td>
                      <td className="px-5 py-3.5 text-neutral-500">{fmtDate(l.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-neutral-400">Demo leads shown for presentations · your live leads replace these once your engine is running.</p>
          </>
        )}
      </main>
      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
