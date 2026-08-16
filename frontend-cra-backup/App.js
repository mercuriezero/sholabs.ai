import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";
import AuthCallback from "@/components/AuthCallback";
import ChatBot from "@/components/ChatBot";
import Landing from "@/pages/Landing";
import FractionalCxO from "@/pages/FractionalCxO";
import CommandCenter from "@/pages/CommandCenter";
import Account from "@/pages/Account";

function AppRouter() {
  const location = useLocation();
  // Google OAuth returns with #session_id=... · process it before any route renders
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/fractional-cxo" element={<FractionalCxO />} />
      <Route path="/dashboard" element={<CommandCenter />} />
      <Route path="/account" element={<Account />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <AppRouter />
          <ChatBot />
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

export default App;
