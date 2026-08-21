"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BadgePercent, Check, DollarSign, Loader2, Lock, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";
const PRESETS = [50, 100, 250];

const PILOT_PACKAGES = [
  { name: "Pilot Sprint", price: 290, desc: "One pillar, two weeks, real output · not a slide deck" },
  { name: "Growth Pilot", price: 580, desc: "Two pillars, 30 days, live dashboard from day one" },
  { name: "Full Engine Pilot", price: 1150, desc: "All three pillars · Get Cited, Get Watched, Get Chosen" },
];

const CXO_PACKS = [
  { name: "Trial Pack · 4 hours", price: 120, desc: "Audit snapshot and quick wins in a single week" },
  { name: "Starter Pack · 25 hours", price: 690, desc: "Growth audit, written 90-day plan · save 8%" },
  { name: "Momentum Pack · 50 hours", price: 1290, desc: "Strategy plus one pillar shipped · save 14%" },
  { name: "Scale Pack · 100 hours", price: 2400, desc: "Two pillars and team leadership · save 20%" },
];

const money = (n) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2, maximumFractionDigits: 2 })}`;

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

export default function PayButton({ label = "Pay now", testid = "pay-button", context, initialPackage, block = false }) {
  const packages = context === "pilot" ? PILOT_PACKAGES : context === "cxo" ? CXO_PACKS : null;
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [amountOpen, setAmountOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pendingStart, setPendingStart] = useState(false);
  // Coupon state
  const [applied, setApplied] = useState(null); // { code, discount_pct, discount_amount, final_amount, launch }
  const [couponBusy, setCouponBusy] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [codeInput, setCodeInput] = useState("");

  useEffect(() => setMounted(true), []);

  const openFor = (u) => {
    if (initialPackage) {
      setSelected(initialPackage);
      setAmount(String(initialPackage.price));
    }
    setApplied(null);
    setShowCode(false);
    setCodeInput("");
    if (u) setAmountOpen(true);
    else setAuthOpen(true);
  };

  const start = () => {
    if (user === undefined) {
      setPendingStart(true); // auth still resolving · open once we know
      return;
    }
    openFor(user);
  };

  useEffect(() => {
    if (pendingStart && user !== undefined) {
      setPendingStart(false);
      openFor(user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingStart, user]);

  const effectiveAmount = selected ? selected.price : parseFloat(amount);
  const finalToPay = applied ? applied.final_amount : effectiveAmount;

  const clearCoupon = () => {
    setApplied(null);
    setShowCode(false);
    setCodeInput("");
  };

  const applyDiscount = async ({ launch, code }) => {
    if (!effectiveAmount || effectiveAmount < 1) {
      toast.error("Enter an amount first");
      return;
    }
    setCouponBusy(true);
    try {
      const res = await fetch(`${API}/coupons/validate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_usd: effectiveAmount, launch: !!launch, coupon_code: code || "" }),
      });
      const d = await res.json();
      if (d.valid) {
        setApplied({ ...d, launch: !!launch });
        toast.success(launch ? `9% launch discount applied · ${d.code}` : `Code ${d.code} applied · ${d.discount_pct}% off`);
      } else {
        toast.error(d.error || "This code isn't valid.");
      }
    } catch {
      toast.error("Couldn't check that code. Please try again.");
    } finally {
      setCouponBusy(false);
    }
  };

  const pay = async () => {
    if (!effectiveAmount || effectiveAmount < 1) {
      toast.error("Enter an amount of at least $1");
      return;
    }
    setPaying(true);
    try {
      const res = await fetch(`${API}/payments/create-order`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_usd: effectiveAmount,
          package_name: selected?.name || "",
          coupon_code: applied && !applied.launch ? applied.code : "",
          launch: applied?.launch || false,
        }),
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
          if (v.ok) toast.success("Payment received · receipt sent to your email. Our team will reach out within 24 hours.");
          else toast.error("Verification failed. Any amount debited is auto-refunded.");
          setAmountOpen(false);
          setSelected(null);
          setAmount("");
          clearCoupon();
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
        className={`inline-flex items-center justify-center gap-2 rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg ${block ? "w-full sm:w-auto" : ""}`}
      >
        <DollarSign className="h-4 w-4" /> {label}
      </button>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => setAmountOpen(true)} />

      {mounted && createPortal(
      <AnimatePresence>
        {amountOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6"
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
                        clearCoupon();
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
                      <span className="shrink-0 font-display text-base font-bold text-black">${p.price.toLocaleString("en-US")}</span>
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
                        clearCoupon();
                      }}
                      className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors ${
                        !selected && parseFloat(amount) === p ? "border-black bg-black text-white" : "border-neutral-200 text-neutral-600 hover:border-black/40"
                      }`}
                    >
                      ${p.toLocaleString("en-US")}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4">
                <DollarSign className="h-4 w-4 text-neutral-400" />
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setSelected(null);
                    clearCoupon();
                  }}
                  data-testid="amount-input"
                  placeholder="Custom amount"
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none"
                />
              </div>

              {/* Discount section */}
              <div className="mt-4 rounded-2xl border border-dashed border-brand-green/40 bg-brand-green/[0.04] p-4" data-testid="coupon-section">
                {applied ? (
                  <div className="flex items-start justify-between gap-3" data-testid="coupon-applied">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-green">
                        <BadgePercent className="h-4 w-4" /> {applied.discount_pct}% off applied
                      </p>
                      <p className="mt-0.5 truncate text-xs text-neutral-500">
                        Code <span className="font-semibold text-black">{applied.code}</span> · you save {money(applied.discount_amount)}
                      </p>
                    </div>
                    <button
                      onClick={clearCoupon}
                      data-testid="coupon-remove-button"
                      aria-label="Remove discount"
                      className="shrink-0 rounded-full p-1 text-neutral-400 transition-colors hover:bg-white hover:text-brand-red"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => applyDiscount({ launch: true })}
                      disabled={couponBusy}
                      data-testid="coupon-launch-button"
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-green px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
                    >
                      {couponBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgePercent className="h-4 w-4" />}
                      Apply 9% launch discount
                    </button>
                    {showCode ? (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex flex-1 items-center rounded-xl border border-neutral-200 bg-white px-3">
                          <Tag className="h-4 w-4 text-neutral-400" />
                          <input
                            value={codeInput}
                            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && applyDiscount({ code: codeInput })}
                            data-testid="coupon-code-input"
                            placeholder="PROMO CODE"
                            className="w-full bg-transparent px-2 py-2.5 text-sm uppercase tracking-wide outline-none"
                          />
                        </div>
                        <button
                          onClick={() => applyDiscount({ code: codeInput })}
                          disabled={couponBusy || !codeInput.trim()}
                          data-testid="coupon-apply-code-button"
                          className="shrink-0 rounded-full bg-black px-4 py-2.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
                        >
                          Apply
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCode(true)}
                        data-testid="coupon-have-code-button"
                        className="mt-2 block w-full text-center text-xs font-medium text-neutral-500 underline-offset-2 hover:text-black hover:underline"
                      >
                        Have a promo code?
                      </button>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={pay}
                disabled={paying}
                data-testid="amount-pay-button"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
              >
                {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {paying ? "Starting checkout…" : `Pay ${finalToPay ? money(finalToPay) : ""} securely`}
              </button>
              {applied && (
                <p className="mt-2 text-center text-xs text-neutral-400" data-testid="coupon-savings-line">
                  <span className="line-through">{money(effectiveAmount)}</span> · you save {money(applied.discount_amount)}
                </p>
              )}
              <p className="mt-3 text-center text-xs text-neutral-400">Secured by Razorpay · cards &amp; international payments</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </>
  );
}
