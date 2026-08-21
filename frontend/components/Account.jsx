"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock, DollarSign, Loader2, FileText, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import OwnerTools from "@/components/OwnerTools";
import Footer from "@/components/Footer";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";
const CAL = "https://cal.com/sunnyrai/30min";

export default function Account() {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [data, setData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [openPlan, setOpenPlan] = useState(null);

  const loadSummary = useCallback(() => {
    if (!user) return;
    fetch(`${API}/account/summary`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
    fetch(`${API}/account/plans`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPlans(d?.plans || []))
      .catch(() => setPlans([]));
  }, [user]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const remaining = data ? data.hours_total - data.hours_used : 0;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4" aria-label="Account navigation">
          <Link href="/" data-testid="account-nav-logo" className="flex items-center gap-3">
            <img src="/logo.webp" alt="High On AI logo" className="h-10 w-auto rounded-md" />
          </Link>
          <div className="flex items-center gap-4">
            <a href={CAL} target="_blank" rel="noopener noreferrer" data-testid="account-nav-cta" className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg">
              Book a working session <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16 md:py-20" data-testid="account-page">
        {user === undefined && (
          <div className="flex justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        )}

        {user === null && (
          <div className="mx-auto max-w-md py-20 text-center" data-testid="account-login-prompt">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-black">Log in to view your account</h1>
            <p className="mt-3 text-sm text-neutral-500">Your packs, hours balance, and payments live here.</p>
            <button
              onClick={() => setAuthOpen(true)}
              data-testid="account-login-button"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Log in or sign up
            </button>
          </div>
        )}

        {user && (
          <>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-black md:text-5xl">
              Hi{user.name ? `, ${user.name.split(" ")[0]}` : ""} · <span className="glassy-brand-text">your engine room</span>
            </h1>
            <p className="mt-2 text-sm text-neutral-500">{user.email}</p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3" data-testid="account-kpis">
              <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
                <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-brand-green">
                  <Clock className="h-3.5 w-3.5" /> Hours remaining
                </p>
                <p className="mt-2 font-display text-4xl font-bold tracking-tight text-black" data-testid="account-hours-remaining">
                  {data ? remaining : " · "}
                </p>
                <p className="text-xs text-neutral-500">of {data?.hours_total ?? 0} hours purchased</p>
              </div>
              <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-brand-orange">Hours used</p>
                <p className="mt-2 font-display text-4xl font-bold tracking-tight text-black" data-testid="account-hours-used">
                  {data ? data.hours_used : " · "}
                </p>
                <p className="text-xs text-neutral-500">logged by your High On AI team</p>
              </div>
              <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
                <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-brand-blue">
                  <DollarSign className="h-3.5 w-3.5" /> Total invested
                </p>
                <p className="mt-2 font-display text-4xl font-bold tracking-tight text-black" data-testid="account-spend">
                  ${data ? (data.spend_total / 100).toLocaleString("en-US") : " · "}
                </p>
                <p className="text-xs text-neutral-500">{data?.payments?.length ?? 0} payment{data?.payments?.length === 1 ? "" : "s"}</p>
              </div>
            </div>

            <div className="mt-12">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold tracking-tight text-black">Your packs & payments</h2>
                <Link href="/fractional-cxo" data-testid="account-buy-more-link" className="text-sm font-semibold text-brand-blue hover:underline">
                  Buy more hours →
                </Link>
              </div>
              {!data || data.payments.length === 0 ? (
                <p className="mt-4 rounded-3xl border border-dashed border-black/10 bg-neutral-50/60 p-8 text-center text-sm text-neutral-400" data-testid="account-empty">
                  No packs yet · grab an hourly success pack and your balance shows up here.
                </p>
              ) : (
                <ul className="mt-6 space-y-4" data-testid="account-payments">
                  {data.payments.map((p) => {
                    const pct = p.hours_total ? Math.min(100, (p.hours_used / p.hours_total) * 100) : 0;
                    return (
                      <li key={p.id} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm" data-testid={`account-payment-${p.id}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-display text-lg font-semibold text-black">{p.package_name || "Custom payment"}</p>
                            <p className="mt-1 text-[11px] text-neutral-400">
                              {new Date(p.paid_at || p.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })} · {p.payment_id}
                            </p>
                          </div>
                          <p className="font-display text-xl font-bold text-black">${(p.amount / 100).toLocaleString("en-US")}</p>
                        </div>
                        {p.hours_total > 0 && (
                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-neutral-500">
                              <span>{p.hours_used} hrs used</span>
                              <span>{p.hours_total - p.hours_used} hrs left of {p.hours_total}</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                              <div className="stripe-gradient h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="mt-4 text-xs text-neutral-400">
                Hours are logged by your High On AI team as work is delivered · this page updates automatically.
              </p>
            </div>

            {data?.is_owner && <OwnerTools onLogged={loadSummary} />}

            <div className="mt-14" data-testid="account-snapshots">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold tracking-tight text-black">Your growth snapshots</h2>
                <span className="text-xs text-neutral-400">{plans.length} saved</span>
              </div>
              {plans.length === 0 ? (
                <p className="mt-4 rounded-3xl border border-dashed border-black/10 bg-neutral-50/60 p-8 text-center text-sm text-neutral-400" data-testid="snapshots-empty">
                  No snapshots yet · run a growth 360 from the concierge or on your next sign-in and it saves here.
                </p>
              ) : (
                <ul className="mt-6 space-y-3" data-testid="snapshots-list">
                  {plans.map((pl) => {
                    const open = openPlan === pl.id;
                    return (
                      <li key={pl.id} className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm" data-testid={`snapshot-${pl.id}`}>
                        <button
                          onClick={() => setOpenPlan(open ? null : pl.id)}
                          className="flex w-full items-center justify-between gap-3 px-6 py-5 text-left"
                        >
                          <div className="flex items-start gap-3">
                            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                            <div>
                              <p className="font-display text-base font-semibold text-black">
                                {pl.url || (pl.prompt ? pl.prompt.slice(0, 60) : "Growth 360")}
                              </p>
                              <p className="mt-0.5 text-[11px] text-neutral-400">
                                {pl.created_at ? new Date(pl.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : ""}
                              </p>
                            </div>
                          </div>
                          <ChevronDown className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
                        </button>
                        {open && (
                          <div className="whitespace-pre-wrap border-t border-black/5 px-6 py-5 text-sm leading-relaxed text-neutral-700">
                            {pl.plan}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
