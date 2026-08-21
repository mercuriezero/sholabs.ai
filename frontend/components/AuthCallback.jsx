"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

export default function AuthCallback() {
  const router = useRouter();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    const sessionId = window.location.hash.split("session_id=")[1]?.split("&")[0];
    if (!sessionId) {
      router.replace("/");
      return;
    }
    fetch(`${API}/auth/google/session`, {
      method: "POST",
      headers: { "X-Session-ID": sessionId },
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("auth failed"))))
      .then((user) => {
        setUser(user);
        router.replace("/portal");
      })
      .catch(() => {
        toast.error("Google sign-in failed. Please try again.");
        router.replace("/");
      });
  }, [router, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white" data-testid="auth-callback">
      <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
    </div>
  );
}
