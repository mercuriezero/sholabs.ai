import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, IndianRupee, Loader2, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const PRESETS = [4999, 9999, 24999];

const PILOT_PACKAGES = [
  { name: "Pilot Sprint", price: 24999, desc: "One pillar, two weeks, real output — not a slide deck" },
  { name: "Growth Pilot", price: 49999, desc: "Two pillars, 30 days, live dashboard from day one" },
  { name: "Full Engine Pilot", price: 99999, desc: "All three pillars — Get Cited, Get Watched, Get Chosen" },
];

const CXO_PACKS = [
  { name: "Starter Pack · 25 hours", price: 49999, desc: "Growth audit, written 90-day plan, weekly cadence" },
  { name: "Momentum Pack · 50 hours", price: 94999, desc: "Strategy plus one pillar shipped end-to-end" },
  { name: "Scale Pack · 100 hours", price: 179999, desc: "Two pillars and team leadership for a full quarter" },
  { name: "Embedded Pack · 200 hours", price: 339999, desc: "Your fractional growth department, fully embedded" },
];

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function PayButton({ label = "Pay now", testid = "pay-button", context, initialPackage }) {
  const packages = context === "pilot" ? PILOT_PACKAGES : context === "cxo" ? CXO_PACKS : null;
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [amountOpen, setAmountOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [paying, setPaying] = useState(false);

  const start = () => {
    if (initialPackage) {
      setSelected(initialPackage);
      setAmount(String(initialPackage.price));
    }
    if (user) setAmountOpen(true);
    else setAuthOpen(true);
  };

  const effectiveAmount = selected ? selected.price : parseFloat(amount);

  const pay = async () => {
    if (!effectiveAmount || effectiveAmount < 1) {
      toast.error("Enter an amount of at least ₹1");
      return;
    }
    setPaying(true);
    try {
      const res = await fetch(`${API}/payments/create-order`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_rupees: effectiveAmount, package_name: selected?.name || "" }),
      });
      if (res.status === 401) {
        setAmountOpen(false);
        setAuthOpen(true);
        return;
      }
      if (!res.ok) throw new Error("order failed");
      const order = await res.json();
      if (!(await loadRazorpay())) throw new Error("checkout failed");
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "High On AI",
        description: selected?.name || "Growth engine payment",
        order_id: order.order_id,
        prefill: { name: user?.name || "", email: user?.email || "" },
        theme: { color: "#0A0A0A" },
        handler: async (resp) => {
          const v = await fetch(`${API}/payments/verify`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resp),
          });
          if (v.ok) toast.success("Payment received — receipt sent to your email. Our team will reach out within 24 hours.");
          else toast.error("Verification failed. Any amount debited is auto-refunded.");
          setAmountOpen(false);
          setSelected(null);
          setAmount("");
        },
      });
      rzp.open();
    } catch {
      toast.error("Couldn't start payment. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <button
        onClick={start}
        data-testid={testid}
        className="inline-flex items-center gap-2 rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
      >
        <IndianRupee className="h-4 w-4" /> {label}
      </button>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => setAmountOpen(true)} />

      {createPortal(
      <AnimatePresence>
        {amountOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-6"
            data-testid="amount-modal"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAmountOpen(false)} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[28px] border border-black/5 bg-white p-8 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Choose payment amount"
            >
              <button onClick={() => setAmountOpen(false)} data-testid="amount-close-button" aria-label="Close" className="absolute right-5 top-5 text-neutral-400 transition-colors hover:text-black">
                <X className="h-5 w-5" />
              </button>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-black">
                {packages ? "Pick a package" : "Choose an amount"}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">Paying as {user?.email}</p>

              {packages ? (
                <div className="mt-6 space-y-2">
                  {packages.map((p) => (
                    <button
                      key={p.name}
                      data-testid={`package-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      onClick={() => {
                        setSelected(p);
                        setAmount(String(p.price));
                      }}
                      className={`flex w-full items-start justify-between gap-3 rounded-2xl border p-4 text-left transition-all ${
                        selected?.name === p.name ? "border-black bg-neutral-50 shadow-sm" : "border-neutral-200 hover:border-black/40"
                      }`}
                    >
                      <span>
                        <span className="flex items-center gap-2 text-sm font-semibold text-black">
                          {p.name}
                          {selected?.name === p.name && <Check className="h-4 w-4 text-brand-green" />}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-neutral-500">{p.desc}</span>
                      </span>
                      <span className="shrink-0 font-display text-base font-bold text-black">₹{p.price.toLocaleString("en-IN")}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      data-testid={`amount-preset-${p}`}
                      onClick={() => {
                        setSelected(null);
                        setAmount(String(p));
                      }}
                      className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors ${
                        !selected && parseFloat(amount) === p ? "border-black bg-black text-white" : "border-neutral-200 text-neutral-600 hover:border-black/40"
                      }`}
                    >
                      ₹{p.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4">
                <IndianRupee className="h-4 w-4 text-neutral-400" />
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setSelected(null);
                  }}
                  data-testid="amount-input"
                  placeholder="Custom amount"
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none"
                />
              </div>
              <button
                onClick={pay}
                disabled={paying}
                data-testid="amount-pay-button"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
              >
                {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {paying ? "Starting checkout…" : `Pay ${effectiveAmount ? `₹${effectiveAmount.toLocaleString("en-IN")}` : ""} securely`}
              </button>
              <p className="mt-4 text-center text-xs text-neutral-400">Secured by Razorpay · UPI, cards, netbanking</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </>
  );
}
