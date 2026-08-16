import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function OwnerTools({ onLogged }) {
  const [payments, setPayments] = useState(null);
  const [hours, setHours] = useState({});
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/account/all-payments`, { credentials: "include" });
      if (r.ok) setPayments(await r.json());
    } catch {
      /* keep last data */
    }
  }, []);

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

  return (
    <section className="mt-14 rounded-[28px] border-2 border-dashed border-brand-orange/30 bg-brand-orange/[0.04] p-6 md:p-8" data-testid="owner-tools">
      <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-brand-orange">
        <ShieldCheck className="h-4 w-4" /> Owner tools · only you see this
      </p>
      <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-black">Log client hours</h2>

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
                  <span className={`rounded-full px-3 py-1 font-mono text-[11px] font-medium ${remaining < 5 ? "bg-brand-red/10 text-brand-red" : "bg-neutral-100 text-neutral-600"}`} data-testid={`owner-remaining-${p.id}`}>
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
    </section>
  );
}
