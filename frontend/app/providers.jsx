"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import AuthCallback from "@/components/AuthCallback";
import ChatBot from "@/components/ChatBot";
import Onboarding from "@/components/Onboarding";

function HashGate({ children }) {
  const [isCallback] = useState(
    () => typeof window !== "undefined" && window.location.hash?.includes("session_id=")
  );
  if (isCallback) return <AuthCallback />;
  return children;
}

// Marketing-only overlays: never show inside the portal or on public generated pages.
function MarketingOverlays() {
  const pathname = usePathname();
  const inApp =
    pathname === "/portal" || pathname.startsWith("/portal/") ||
    pathname === "/p" || pathname.startsWith("/p/");
  if (inApp) return null;
  return (
    <>
      <Onboarding />
      <ChatBot />
    </>
  );
}

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <HashGate>{children}</HashGate>
      <MarketingOverlays />
      <Toaster position="bottom-right" richColors />
    </AuthProvider>
  );
}
