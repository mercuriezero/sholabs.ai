"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgePercent, Brain, Loader2, ShieldCheck, Tag, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

export default function OwnerTools({ isOwner, onLogged }) {
  const [payments, setPayments] = useState(null);
  const [hours, setHours] = useState({});
  const [busy, setBusy] = useState("");
  const [facts, setFacts] = useState(null);
  const [newFact, setNewFact] = useState("");
  const [factBusy, setFactBusy] = useState(false);

  // Coupons
  const [coupons, setCoupons] = useState(null);
  const [form, setForm] = useState({ code: "", discount_pct: "", label: "", expiry: "", max_uses: "" });
  const [couponBusy, setCouponBusy] = useState(false);

  // Admins (owner only)
  const [users, setUsers] = useState(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const calls = [
        fetch(`${API}/account/all-payments`, { credentials: "include" }),
        fetch(`${API}/chat/teach`, { credentials: "include" }),
        fetch(`${API}/admin/coupons`, { credentials: "include" }),
      ];
      if (isOwner) calls.push(fetch(`${API}/admin/users`, { credentials: "include" }));
      const [r, f, c, u] = await Promise.all(calls);
      if (r?.ok) setPayments(await r.json());
      if (f?.ok) setFacts(await f.json());
      if (c?.ok) setCoupons(await c.json());
      if (u?.ok) setUsers(await u.json());
    } catch {
      /* keep last data */
    }
  }, [isOwner]);

  useEffect(() => {
    load();
  }, [load]);

  const log = async (paymentId) => {
    const h = parseFloat(hours[paymentId]);
    if (!h || h <= 0) {
      toast.error("Enter the hours to log");
      return;
    }
    setBusy(paymentId);
    try {
      const r = await fetch(`${API}/account/log-hours`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId, hours: h }),
      });
      if (!r.ok) throw new Error();
      toast.success("Hours logged · client balance updated (low-balance alert auto-sends under 5 hrs).");
      setHours((prev) => ({ ...prev, [paymentId]: "" }));
      load();
      onLogged?.();
    } catch {
      toast.error("Couldn't log hours. Try again.");
    } finally {
      setBusy("");
    }
  };

  const addFact = async () => {
    const fact = newFact.trim();
    if (fact.length < 3) return;
    setFactBusy(true);
    try {
      const r = await fetch(`${API}/chat/teach`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fact }),
      });
      if (!r.ok) throw new Error();
      toast.success("The concierge just learned that.");
      setNewFact("");
      load();
    } catch {
      toast.error("Couldn't save that. Try again.");
    } finally {
      setFactBusy(false);
    }
  };

  const removeFact = async (id) => {
    try {
      await fetch(`${API}/chat/teach/${id}`, { method: "DELETE", credentials: "include" });
      load();
    } catch {
      toast.error("Couldn't remove that.");
    }
  };

  const createCoupon = async () => {
    const code = form.code.trim().toUpperCase();
    const pct = parseFloat(form.discount_pct);
    if (!code || code.length < 3) return toast.error("Enter a code of at least 3 characters");
    if (!pct || pct <= 0 || pct > 90) return toast.error("Enter a discount between 1 and 90");
    setCouponBusy(true);
    try {
      const r = await fetch(`${API}/admin/coupons`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discount_pct: pct,
          label: form.label.trim(),
          expiry: form.expiry || "",
          max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "failed");
      toast.success(`Coupon ${code} created`);
      setForm({ code: "", discount_pct: "", label: "", expiry: "", max_uses: "" });
      load();
    } catch (e) {
      toast.error(typeof e.message === "string" ? e.message : "Couldn't create coupon.");
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = async (id) => {
    try {
      await fetch(`${API}/admin/coupons/${id}`, { method: "DELETE", credentials: "include" });
      load();
    } catch {
      toast.error("Couldn't delete that coupon.");
    }
  };

  const setRole = async (email, role) => {
    const target = (email || adminEmail).trim().toLowerCase();
    if (!target) return toast.error("Enter an email");
    setAdminBusy(true);
    try {
      const r = await fetch(`${API}/admin/set-role`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target, role }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "failed");
      toast.success(role === "admin" ? `${target} is now an admin` : `${target} is no longer an admin`);
      setAdminEmail("");
      load();
    } catch (e) {
      toast.error(typeof e.message === "string" ? e.message : "Couldn't update role.");
    } finally {
      setAdminBusy(false);
    }
  };

  return (
    <section className="mt-14 rounded-[28px] border-2 border-dashed border-brand-orange/30 bg-brand-orange/[0.04] p-6 md:p-8" data-testid="owner-tools">
      <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-brand-orange">
        <ShieldCheck className="h-4 w-4" /> Admin tools · {isOwner ? "super-owner" : "admin"} access
      </p>

      {/* Coupons */}
      <div className="mt-6" data-testid="coupons-panel">
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-black">
          <BadgePercent className="h-5 w-5 text-brand-green" /> Discount coupons
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          Everyone gets a one-click 9% launch discount. Create custom promo codes here to send special customers.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <input
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            data-testid="coupon-form-code"
            placeholder="CODE e.g. VIP20"
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm uppercase outline-none focus:border-black/40"
          />
          <input
            type="number"
            min="1"
            max="90"
            value={form.discount_pct}
            onChange={(e) => setForm((f) => ({ ...f, discount_pct: e.target.value }))}
            data-testid="coupon-form-pct"
            placeholder="% off"
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-black/40"
          />
          <input
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            data-testid="coupon-form-label"
            placeholder="Label (optional)"
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-black/40"
          />
          <input
            type="date"
            value={form.expiry}
            onChange={(e) => setForm((f) => ({ ...f, expiry: e.target.value }))}
            data-testid="coupon-form-expiry"
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-600 outline-none focus:border-black/40"
          />
          <input
            type="number"
            min="1"
            value={form.max_uses}
            onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
            data-testid="coupon-form-maxuses"
            placeholder="Max uses"
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-black/40"
          />
        </div>
        <button
          onClick={createCoupon}
          disabled={couponBusy}
          data-testid="coupon-create-button"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-green px-5 py-2.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
        >
          {couponBusy && <Loader2 className="h-3 w-3 animate-spin" />}
          <Tag className="h-3.5 w-3.5" /> Create coupon
        </button>

        {coupons && coupons.length > 0 && (
          <ul className="mt-5 space-y-2" data-testid="coupons-list">
            {coupons.map((c) => {
              const expired = c.expiry && new Date(c.expiry) < new Date(new Date().toDateString());
              const maxed = c.max_uses != null && c.used_count >= c.max_uses;
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white p-4" data-testid={`coupon-${c.id}`}>
                  <span className="rounded-lg bg-black px-3 py-1 font-mono text-xs font-bold uppercase tracking-wide text-white">{c.code}</span>
                  <span className="text-sm font-semibold text-brand-green">{c.discount_pct}% off</span>
                  {c.label && <span className="text-xs text-neutral-500">{c.label}</span>}
                  <span className="text-xs text-neutral-400">
                    {c.used_count}{c.max_uses != null ? ` / ${c.max_uses}` : ""} used
                    {c.expiry ? ` · exp ${new Date(c.expiry).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                  </span>
                  {(expired || maxed) && (
                    <span className="rounded-full bg-brand-red/10 px-2 py-0.5 text-[10px] font-semibold text-brand-red">{expired ? "Expired" : "Maxed out"}</span>
                  )}
                  <button onClick={() => removeCoupon(c.id)} data-testid={`coupon-delete-${c.id}`} aria-label="Delete coupon" className="ml-auto text-neutral-300 transition-colors hover:text-brand-red">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Admins · owner only */}
      {isOwner && (
        <div className="mt-10 border-t border-brand-orange/20 pt-8" data-testid="admins-panel">
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-black">
            <UserCog className="h-5 w-5 text-brand-blue" /> Admins
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            Promote any registered user to admin. Admins can manage coupons, log hours and train the concierge. Only you (super-owner) can manage admins.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setRole(null, "admin")}
              data-testid="admin-email-input"
              placeholder="person@company.com (must have signed up)"
              className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-black/40"
            />
            <button
              onClick={() => setRole(null, "admin")}
              disabled={adminBusy}
              data-testid="admin-add-button"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-blue px-5 py-2.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
            >
              {adminBusy && <Loader2 className="h-3 w-3 animate-spin" />}
              Make admin
            </button>
          </div>

          {users && (
            <ul className="mt-5 space-y-2" data-testid="admins-list">
              {users
                .filter((u) => u.is_owner || u.role === "admin")
                .map((u) => (
                  <li key={u.user_id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white p-4" data-testid={`admin-user-${u.user_id}`}>
                    <span className="text-sm font-semibold text-black">{u.name || u.email}</span>
                    <span className="text-xs text-neutral-400">{u.email}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${u.is_owner ? "bg-brand-orange/10 text-brand-orange" : "bg-brand-blue/10 text-brand-blue"}`}>
                      {u.is_owner ? "Super-owner" : "Admin"}
                    </span>
                    {!u.is_owner && (
                      <button
                        onClick={() => setRole(u.email, "user")}
                        data-testid={`admin-remove-${u.user_id}`}
                        className="ml-auto text-xs font-medium text-neutral-400 transition-colors hover:text-brand-red"
                      >
                        Remove admin
                      </button>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      {/* Log hours */}
      <div className="mt-10 border-t border-brand-orange/20 pt-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-black">Log client hours</h2>
        {payments === null ? (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
          </div>
        ) : payments.length === 0 ? (
          <p className="mt-6 text-sm text-neutral-500" data-testid="owner-tools-empty">No paid packs yet.</p>
        ) : (
          <ul className="mt-6 space-y-3" data-testid="owner-tools-list">
            {payments.map((p) => {
              const remaining = p.hours_total - p.hours_used;
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-black/5 bg-white p-5" data-testid={`owner-payment-${p.id}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-black">
                      {p.package_name || "Custom payment"} · {p.name || p.email}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-400">{p.email}</p>
                  </div>
                  {p.hours_total > 0 && (
                    <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${remaining < 5 ? "bg-brand-red/10 text-brand-red" : "bg-neutral-100 text-neutral-600"}`} data-testid={`owner-remaining-${p.id}`}>
                      {remaining} / {p.hours_total} hrs left
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={hours[p.id] || ""}
                      onChange={(e) => setHours((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      data-testid={`owner-hours-input-${p.id}`}
                      placeholder="hrs"
                      className="w-20 rounded-xl border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-sm outline-none focus:border-black/40"
                    />
                    <button
                      onClick={() => log(p.id)}
                      disabled={busy === p.id}
                      data-testid={`owner-log-button-${p.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                    >
                      {busy === p.id && <Loader2 className="h-3 w-3 animate-spin" />}
                      Log
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Train the concierge */}
      <div className="mt-10 border-t border-brand-orange/20 pt-8">
        <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-brand-purple">
          <Brain className="h-4 w-4" /> Train the AI concierge
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Teach the website chatbot your business context: new offers, case results, positioning, processes. Every
          line becomes ground truth in its answers.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            value={newFact}
            onChange={(e) => setNewFact(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFact()}
            data-testid="teach-input"
            placeholder='e.g. "We guarantee 3 AI citations in the first 30 days or the pilot is free"'
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-black/40"
          />
          <button
            onClick={addFact}
            disabled={factBusy}
            data-testid="teach-add-button"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-purple px-5 py-2.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
          >
            {factBusy && <Loader2 className="h-3 w-3 animate-spin" />}
            Teach
          </button>
        </div>
        {facts && facts.length > 0 && (
          <ul className="mt-4 space-y-2" data-testid="teach-list">
            {facts.map((f) => (
              <li key={f.id} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white px-4 py-2.5" data-testid={`teach-fact-${f.id}`}>
                <span className="flex-1 text-sm text-neutral-700">{f.fact}</span>
                <button onClick={() => removeFact(f.id)} data-testid={`teach-delete-${f.id}`} aria-label="Remove fact" className="text-neutral-300 transition-colors hover:text-brand-red">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
