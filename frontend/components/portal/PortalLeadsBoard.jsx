"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Phone, Search, Users } from "lucide-react";
import { toast } from "sonner";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";
const STATUSES = ["New Lead", "Contacted", "Booked", "Won", "Lost"];

export default function PortalLeadsBoard() {
  const [data, setData] = useState(undefined);
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

  const update = async (id, body) => {
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
    const leads = data?.leads || [];
    return leads.filter((l) => {
      if (!showSpam && l.spam) return false;
      if (!q) return true;
      const hay = `${l.name} ${l.email} ${l.company} ${l.page_title}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [data, q, showSpam]);

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
          {[["Total", data.stats?.total || 0], ["New", data.stats?.new || 0], ["Booked", data.stats?.booked || 0]].map(([k, v]) => (
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
        <div className="flex items-center justify-between gap-4 sm:justify-start">
          <label className="flex items-center gap-2 text-sm text-neutral-600" data-testid="leads-spam-toggle">
            <input type="checkbox" checked={showSpam} onChange={(e) => setShowSpam(e.target.checked)} className="h-4 w-4 rounded" /> Show spam
          </label>
          <button onClick={exportCsv} data-testid="leads-export" className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:border-black/40">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

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
