"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Phone, Search, Users } from "lucide-react";
import { toast } from "sonner";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";
const STATUSES = ["New Lead", "Contacted", "Booked", "Won", "Lost"];

// Recent ISO date, `daysAgo` days back with an hour offset.
const ago = (daysAgo, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, (daysAgo * 7) % 60, 0, 0);
  return d.toISOString();
};

// Demo leads that resonate with High On AI services (LLM Citation, AI Video, Voice AI, Affiliate, CXO).
const DEMO_LEADS = [
  { id: "demo-1", name: "Priya Nair", company: "Zenlytic", email: "priya@zenlytic.io", phone: "+1 415 555 0142", country: "United States", page_title: "AI Analytics for RevOps · LLM Citation", action: "Requested a demo", status: "Booked", notes: "Warm — wants GEO audit first", spam: false, created_at: ago(0, 9) },
  { id: "demo-2", name: "Marcus Lee", company: "Flowstate HR", email: "marcus@flowstatehr.com", phone: "+1 646 555 0198", country: "United States", page_title: "Founder UGC Ad · AI Video", action: "Watched showreel, requested pricing", status: "Contacted", notes: "", spam: false, created_at: ago(0, 14) },
  { id: "demo-3", name: "Sara Gomez", company: "Brightcart", email: "sara@brightcart.co", phone: "+1 312 555 0176", country: "United States", page_title: "24/7 Voice Agent · Voice AI", action: "Requested a demo", status: "New Lead", notes: "", spam: false, created_at: ago(1, 11) },
  { id: "demo-4", name: "Rahul Verma", company: "Payloop", email: "rahul@payloop.in", phone: "+91 98200 11234", country: "India", page_title: "Fractional AI CXO", action: "Booked a working session", status: "Won", notes: "50h pack signed", spam: false, created_at: ago(2, 16) },
  { id: "demo-5", name: "Emily Chen", company: "Northwind Health", email: "emily@northwind.health", phone: "+1 617 555 0155", country: "United States", page_title: "Be the answer AI gives · LLM Citation", action: "Requested a demo", status: "Booked", notes: "Compliance-heavy, needs case study", spam: false, created_at: ago(3, 10) },
  { id: "demo-6", name: "Olivia Brooks", company: "Cadence Studio", email: "olivia@cadence.studio", phone: "+44 20 7946 0321", country: "United Kingdom", page_title: "Ad Creative V3 · AI Video", action: "Requested a demo", status: "Contacted", notes: "", spam: false, created_at: ago(4, 13) },
  { id: "demo-7", name: "Tomás Rivera", company: "Grivera Foods", email: "tomas@griverafoods.com", phone: "+1 305 555 0188", country: "United States", page_title: "Partner Program · Affiliate", action: "Applied to partner program", status: "New Lead", notes: "", spam: false, created_at: ago(5, 15) },
  { id: "demo-8", name: "Aisha Khan", company: "Lumen Legal", email: "aisha@lumenlegal.com", phone: "+1 713 555 0144", country: "United States", page_title: "Voice Intake Agent · Voice AI", action: "Requested a demo", status: "Won", notes: "Live agent shipped", spam: false, created_at: ago(6, 9) },
  { id: "demo-9", name: "Arjun Mehta", company: "Cloudpeak Analytics", email: "arjun@cloudpeak.ai", phone: "+91 90040 77812", country: "India", page_title: "LLM Visibility Report · LLM Citation", action: "Requested a demo", status: "Contacted", notes: "Sent proposal", spam: false, created_at: ago(7, 12) },
  { id: "demo-10", name: "David Kim", company: "Nimbus Fintech", email: "david@nimbusfin.com", phone: "+1 415 555 0203", country: "United States", page_title: "Product Demo Reel · AI Video", action: "Requested a demo", status: "New Lead", notes: "", spam: false, created_at: ago(8, 17) },
  { id: "demo-11", name: "Leo Fernandes", company: "Portside Logistics", email: "leo@portside.co", phone: "+1 206 555 0170", country: "United States", page_title: "Fractional AI CXO", action: "Booked a working session", status: "Booked", notes: "", spam: false, created_at: ago(9, 11) },
  { id: "demo-12", name: "Chloe Dubois", company: "Atelier Mode", email: "chloe@ateliermode.fr", phone: "+33 1 70 18 99 21", country: "France", page_title: "Get Cited · LLM Citation", action: "Requested a demo", status: "Lost", notes: "Went with in-house", spam: false, created_at: ago(11, 10) },
  { id: "demo-13", name: "Spammy Bot", company: "", email: "noreply@spam-xyz.ru", phone: "", country: "", page_title: "AI Video", action: "asdkjh cheap seo backlinks", status: "New Lead", notes: "", spam: true, created_at: ago(2, 3) },
];

const computeStats = (leads) => {
  const real = leads.filter((l) => !l.spam);
  return {
    total: real.length,
    new: real.filter((l) => l.status === "New Lead").length,
    booked: real.filter((l) => l.status === "Booked").length,
  };
};

export default function PortalLeadsBoard() {
  const [data, setData] = useState(undefined);
  const [demo, setDemo] = useState(true);
  const [demoLeads, setDemoLeads] = useState(DEMO_LEADS);
  const [q, setQ] = useState("");
  const [showSpam, setShowSpam] = useState(false);
  const [notes, setNotes] = useState({});

  const load = () => {
    fetch(`${API}/portal/leads`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setData(d || { leads: [], stats: {} });
        const n = {};
        (d?.leads || []).forEach((l) => (n[l.id] = l.notes || ""));
        setNotes(n);
      })
      .catch(() => setData({ leads: [], stats: {} }));
  };
  useEffect(() => { load(); }, []);

  // Seed the notes map for demo rows once.
  useEffect(() => {
    setNotes((prev) => {
      const n = { ...prev };
      DEMO_LEADS.forEach((l) => { if (!(l.id in n)) n[l.id] = l.notes || ""; });
      return n;
    });
  }, []);

  const activeLeads = demo ? demoLeads : (data?.leads || []);
  const stats = demo ? computeStats(demoLeads) : (data?.stats || {});

  const update = async (id, body) => {
    if (demo) {
      setDemoLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...body } : l)));
      toast.success("Lead updated");
      return;
    }
    try {
      const r = await fetch(`${API}/portal/leads/${id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error();
      toast.success("Lead updated");
      load();
    } catch {
      toast.error("Couldn't update lead");
    }
  };

  const filtered = useMemo(() => {
    return activeLeads.filter((l) => {
      if (!showSpam && l.spam) return false;
      if (!q) return true;
      const hay = `${l.name} ${l.email} ${l.company} ${l.page_title}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [activeLeads, q, showSpam]);

  const exportCsv = () => {
    const rows = [["When", "Name", "Company", "Email", "Phone", "Country", "Page", "Status", "Notes"]];
    filtered.forEach((l) => rows.push([l.created_at, l.name, l.company, l.email, l.phone, l.country, l.page_title, l.status, notes[l.id] || ""]));
    const csv = rows.map((r) => r.map((c) => `"${(c || "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "leads.csv";
    a.click();
  };

  if (data === undefined) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  return (
    <div data-testid="leads-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-black md:text-4xl">Leads dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">Everything you need to close more deals.</p>
        </div>
        <div className="flex gap-4">
          {[["Total", stats?.total || 0], ["New", stats?.new || 0], ["Booked", stats?.booked || 0]].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-black/5 bg-white px-4 py-2 text-center shadow-sm">
              <p className="font-display text-xl font-bold text-black" data-testid={`leads-stat-${k.toLowerCase()}`}>{v}</p>
              <p className="text-[10px] uppercase tracking-wide text-neutral-400">{k}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex min-w-0 flex-1 items-center rounded-full border border-neutral-200 bg-white px-4 sm:min-w-[220px]">
          <Search className="h-4 w-4 shrink-0 text-neutral-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} data-testid="leads-search" placeholder="Search name, email, company…" className="w-full bg-transparent px-3 py-2.5 text-sm outline-none" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-start">
          <label className="flex items-center gap-2 rounded-full border border-brand-purple/30 bg-brand-purple/5 px-3 py-2 text-sm font-medium text-brand-purple" data-testid="leads-demo-toggle">
            <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} className="h-4 w-4 rounded accent-brand-purple" /> Demo data
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-600" data-testid="leads-spam-toggle">
            <input type="checkbox" checked={showSpam} onChange={(e) => setShowSpam(e.target.checked)} className="h-4 w-4 rounded" /> Show spam
          </label>
          <button onClick={exportCsv} data-testid="leads-export" className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:border-black/40">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {demo && (
        <p className="mt-3 text-xs text-neutral-400" data-testid="leads-demo-note">
          Showing sample leads so you can explore the workflow. Uncheck “Demo data” to see your real captured leads.
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-black/10 bg-white p-12 text-center" data-testid="leads-empty">
          <Users className="mx-auto h-8 w-8 text-neutral-300" />
          <p className="mt-3 text-sm text-neutral-500">No leads yet. Share your live pages — every "Request a demo" lands here.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl border border-black/5 bg-white shadow-sm" data-testid="leads-table">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-[10px] uppercase tracking-wide text-neutral-400">
                <th className="px-5 py-3">When</th>
                <th className="px-5 py-3">Lead</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Notes</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-black/5 last:border-0 align-top hover:bg-neutral-50/60" data-testid={`lead-row-${l.id}`}>
                  <td className="px-5 py-4 text-xs text-neutral-400 whitespace-nowrap">
                    {new Date(l.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                    <br />{new Date(l.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-black">{l.name}</p>
                    <p className="text-xs text-neutral-500">{l.email}</p>
                    {l.phone && <p className="text-xs text-neutral-500">{l.phone} · {l.country}</p>}
                    {l.company && <p className="text-xs text-neutral-400">{l.company}</p>}
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-neutral-300">{l.page_title}</p>
                  </td>
                  <td className="px-5 py-4 text-xs text-neutral-600">{l.action}</td>
                  <td className="px-5 py-4">
                    <select
                      value={l.status}
                      onChange={(e) => update(l.id, { status: e.target.value })}
                      data-testid={`lead-status-${l.id}`}
                      className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-black/40"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <input
                      value={notes[l.id] || ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [l.id]: e.target.value }))}
                      onBlur={() => (notes[l.id] || "") !== (l.notes || "") && update(l.id, { notes: notes[l.id] || "" })}
                      data-testid={`lead-notes-${l.id}`}
                      placeholder="Add notes…"
                      className="w-40 rounded-lg border border-neutral-200 bg-neutral-50/60 px-3 py-1.5 text-xs outline-none focus:border-black/40"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <a href={`tel:${l.phone}`} data-testid={`lead-call-${l.id}`} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${l.phone ? "bg-brand-green text-white hover:-translate-y-0.5 transition-transform" : "pointer-events-none bg-neutral-100 text-neutral-300"}`}>
                      <Phone className="h-3.5 w-3.5" /> Call
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
