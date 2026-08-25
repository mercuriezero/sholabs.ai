"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

export default function ResetPassword() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    try {
      const r = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Reset failed");
      setDone(true);
      toast.success("Password updated. You can log in now.");
      setTimeout(() => router.replace("/"), 2200);
    } catch (err) {
      setError(typeof err.message === "string" ? err.message : "Reset failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6" data-testid="reset-password-page">
      <div className="w-full max-w-md rounded-[28px] border border-black/5 bg-white p-8 shadow-2xl">
        <img src="/logo.webp" alt="High On AI" className="h-9 w-auto rounded-md" />
        {done ? (
          <div className="py-8 text-center" data-testid="reset-done">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/10"><Check className="h-6 w-6 text-brand-green" /></span>
            <h1 className="mt-4 font-display text-xl font-semibold text-black">Password updated</h1>
            <p className="mt-2 text-sm text-neutral-500">Redirecting you to log in…</p>
          </div>
        ) : !token ? (
          <div className="py-8 text-center" data-testid="reset-no-token">
            <h1 className="font-display text-xl font-semibold text-black">Invalid reset link</h1>
            <p className="mt-2 text-sm text-neutral-500">This link is missing or malformed. Please request a new one from the login screen.</p>
          </div>
        ) : (
          <>
            <h1 className="mt-5 flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-black">
              <Lock className="h-5 w-5 text-brand-orange" /> Set a new password
            </h1>
            <p className="mt-1 text-sm text-neutral-500">Choose a strong password for your High On AI account.</p>
            <form onSubmit={submit} className="mt-6 space-y-3">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="reset-password-input" placeholder="New password (min 8 characters)" required className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-sm outline-none focus:border-black/40" />
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} data-testid="reset-confirm-input" placeholder="Confirm new password" required className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-sm outline-none focus:border-black/40" />
              {error && <p className="text-sm font-medium text-brand-red" data-testid="reset-error">{error}</p>}
              <button type="submit" disabled={busy} data-testid="reset-submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Update password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
