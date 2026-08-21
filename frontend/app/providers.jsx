"use client";

import { useState } from "react";
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

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <HashGate>{children}</HashGate>
      <Onboarding />
      <ChatBot />
      <Toaster position="bottom-right" richColors />
    </AuthProvider>
  );
}
