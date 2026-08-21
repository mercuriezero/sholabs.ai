"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Chrome, Loader2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AuthModal({ open, onClose, onSuccess }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const googleLogin = () => {
    const origin = window.location.origin;
    window.location.href = `${origin}/api/auth/google/login?origin=${encodeURIComponent(origin)}`;
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const u = mode === "login" ? await login(email, password) : await register(name, email, password);
      onSuccess?.(u);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          data-testid="auth-modal"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md rounded-[28px] border border-black/5 bg-white p-8 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Sign in to High On AI"
          >
            <button onClick={onClose} data-testid="auth-close-button" aria-label="Close" className="absolute right-5 top-5 text-neutral-400 transition-colors hover:text-black">
              <X className="h-5 w-5" />
            </button>
            <img src="/logo.webp" alt="High On AI" className="h-9 w-auto rounded-md" />
            <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight text-black">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">Sign in to unlock payment and save your growth plan.</p>

            <button
              onClick={googleLogin}
              data-testid="auth-google-button"
              className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <Chrome className="h-4 w-4" /> Continue with Google
            </button>

            <div className="my-5 flex items-center gap-4">
              <span className="h-px flex-1 bg-black/5" />
              <span className="text-xs text-neutral-400">or with email</span>
              <span className="h-px flex-1 bg-black/5" />
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-full bg-neutral-100 p-1">
              {["login", "signup"].map((m) => (
                <button
                  key={m}
                  data-testid={`auth-mode-${m}`}
                  onClick={() => {
                    setMode(m);
                    setError("");
                  }}
                  className={`rounded-full py-2 text-sm font-medium transition-colors ${mode === m ? "bg-white text-black shadow-sm" : "text-neutral-500"}`}
                >
                  {m === "login" ? "Log in" : "Sign up"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-3">
              {mode === "signup" && (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="auth-name-input"
                  placeholder="Your name"
                  required
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-sm outline-none transition-colors focus:border-black/40"
                />
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="auth-email-input"
                placeholder="Email address"
                required
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-sm outline-none transition-colors focus:border-black/40"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="auth-password-input"
                placeholder={mode === "signup" ? "Password (min 8 characters)" : "Password"}
                required
                minLength={8}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-sm outline-none transition-colors focus:border-black/40"
              />
              {error && (
                <p className="text-sm font-medium text-brand-red" data-testid="auth-error">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                data-testid="auth-submit-button"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "login" ? "Log in" : "Create account"}
              </button>
            </form>
            <p className="mt-5 text-center text-xs text-neutral-400">Payments are processed securely by Razorpay.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
