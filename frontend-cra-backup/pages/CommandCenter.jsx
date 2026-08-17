import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, FileText, IndianRupee, Sparkles } from "lucide-react";
import Footer from "@/components/Footer";
import PayButton from "@/components/PayButton";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CAL = "https://cal.com/sunnyrai/30min";

function timeAgo(iso) {
  if (!iso) return " · ";
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const SAMPLE_KPIS = [
  { label: "Get cited", value: "38%", sub: "AI citation rate", color: "#2B39D1" },
  { label: "Get watched", value: "64.2k", sub: "Views this week", color: "#E200C4" },
  { label: "Get chosen", value: "$184k", sub: "Pipeline generated", color: "#F7941E" },
];

export default function CommandCenter() {
  const [leads, setLeads] = useState([]);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);

  const load = useCallback(async () => {
    try {
      const [l, p, pay] = await Promise.all([
        fetch(`${API}/leads`).then((r) => r.json()),
        fetch(`${API}/plans`).then((r) => r.json()),
        fetch(`${API}/payments`).then((r) => r.json()),
      ]);
      setLeads(l);
      setPlans(p);
      setPayments(pay);
    } catch {
      /* keep last data */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  const feed = [
    ...leads.map((l) => ({ type: "brief", text: l.prompt, time: l.created_at })),
    ...plans.map((p) => ({ type: "plan", text: p.prompt, time: p.created_at })),
    ...payments.map((p) => ({
      type: "payment",
      text: `₹${(p.amount / 100).toLocaleString("en-IN")}${p.package_name ? ` · ${p.package_name}` : ""} from ${p.name || p.email || "a client"}`,
      time: p.paid_at || p.created_at,
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time));

  const latest = feed[0] ? timeAgo(feed[0].time) : " · ";
  const revenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4" aria-label="Dashboard navigation">
          <Link to="/" data-testid="dash-nav-logo" className="flex items-center gap-3">
            <img src="/logo.webp" alt="High On AI logo" className="h-10 w-auto rounded-md" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" data-testid="dash-back-link" className="hidden items-center gap-2 text-sm font-medium text-neutral-600 transition-colors hover:text-black sm:inline-flex">
              <ArrowLeft className="h-4 w-4" /> Back to site
            </Link>
            <PayButton label="Make a payment" testid="dash-pay-button" />
            <a href={CAL} target="_blank" rel="noopener noreferrer" data-testid="dash-nav-cta" className="hidden items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg md:inline-flex">
              Book a working session <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16 md:py-20" data-testid="command-center">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-black md:text-5xl">
              High On AI · <span className="glassy-brand-text">command center</span>
            </h1>
            <p className="mt-2 text-sm text-neutral-500">Every pillar, one live view. Refreshes automatically.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-green/10 px-4 py-1.5 text-[11px] font-medium uppercase tracking-widest text-brand-green" data-testid="dash-live-badge">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-green" />
            </span>
            live
          </span>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="dash-real-kpis">
          {[
            { label: "Briefs received", value: leads.length, sub: "via the hero prompt box" },
            { label: "Plans generated", value: plans.length, sub: "instant AI strategies delivered" },
            { label: "Revenue collected", value: `₹${revenue.toLocaleString("en-IN")}`, sub: `${payments.length} payment${payments.length === 1 ? "" : "s"} via Razorpay` },
            { label: "Latest signal", value: latest, sub: "most recent activity" },
          ].map((k) => (
            <div key={k.label} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">{k.label}</p>
              <p className="mt-2 font-display text-3xl font-bold tracking-tight text-black">{k.value}</p>
              <p className="text-xs text-neutral-500">{k.sub}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
          Pillar targets · sample until connected
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {SAMPLE_KPIS.map((k) => (
            <div key={k.label} className="rounded-3xl border border-black/5 bg-neutral-50/70 p-6" data-testid={`dash-kpi-${k.label.replace(/\s+/g, "-")}`}>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em]" style={{ color: k.color }}>{k.label}</p>
              <p className="mt-2 font-display text-3xl font-bold tracking-tight text-black">{k.value}</p>
              <p className="text-xs text-neutral-500">{k.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">Live signal feed</p>
          {feed.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-400" data-testid="dash-feed-empty">
              No signals yet · submit a brief on the homepage to see it land here in real time.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5" data-testid="dash-feed">
              {feed.slice(0, 12).map((f, i) => (
                <li key={`${f.time}-${i}`} className="flex items-center justify-between gap-4 rounded-xl bg-neutral-50 px-4 py-3">
                  <span className="flex min-w-0 items-center gap-2.5 text-sm text-neutral-700">
                    {f.type === "plan" ? (
                      <Sparkles className="h-4 w-4 shrink-0 text-brand-magenta" />
                    ) : f.type === "payment" ? (
                      <IndianRupee className="h-4 w-4 shrink-0 text-brand-green" />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0 text-brand-blue" />
                    )}
                    <span className="truncate">
                      <strong className="font-semibold text-black">
                        {f.type === "plan" ? "Plan generated" : f.type === "payment" ? "Payment received" : "New brief"}
                      </strong>
                      {" · "}
                      {f.text}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-neutral-400">{timeAgo(f.time)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
