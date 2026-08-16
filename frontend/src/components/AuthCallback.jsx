import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    const sessionId = location.hash.split("session_id=")[1]?.split("&")[0];
    if (!sessionId) {
      navigate("/", { replace: true });
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
        navigate("/", { replace: true, state: { user } });
      })
      .catch(() => {
        toast.error("Google sign-in failed. Please try again.");
        navigate("/", { replace: true });
      });
  }, [location, navigate, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white" data-testid="auth-callback">
      <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
    </div>
  );
}
