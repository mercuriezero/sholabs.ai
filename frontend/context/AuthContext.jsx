"use client";

import { createContext, useContext, useEffect, useState } from "react";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";
const AuthContext = createContext(null);

function formatDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

async function toError(res) {
  let message = "Something went wrong. Please try again.";
  try {
    const data = await res.json();
    message = formatDetail(data.detail);
  } catch {
    /* keep default */
  }
  return new Error(message);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = checking, null = logged out

  useEffect(() => {
    // CRITICAL: if returning from the OAuth callback, AuthCallback exchanges the
    // session_id first · skip the /me check to avoid a race.
    if (window.location.hash?.includes("session_id=")) return;
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const login = async (email, password) => {
    const r = await fetch(`${API}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) throw await toError(r);
    const u = await r.json();
    setUser(u);
    return u;
  };

  const register = async (name, email, password) => {
    const r = await fetch(`${API}/auth/register`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!r.ok) throw await toError(r);
    const u = await r.json();
    setUser(u);
    return u;
  };

  const logout = async () => {
    await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, setUser, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
