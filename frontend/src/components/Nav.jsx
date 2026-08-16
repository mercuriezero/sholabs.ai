import { useState } from "react";
import { Menu, X, ArrowUpRight, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

const links = [
  { label: "Services", href: "#services" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "Process", href: "#process" },
  { label: "FAQ", href: "#faq" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4" aria-label="Main navigation">
        <a href="#top" data-testid="nav-logo-link" className="flex items-center gap-3">
          <img src="/logo.webp" alt="High On AI logo" className="h-10 w-auto rounded-md" />
        </a>
        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              data-testid={`nav-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-black"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="hidden items-center gap-4 md:flex">
          {user === null && (
            <button
              onClick={() => setAuthOpen(true)}
              data-testid="nav-login-button"
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-black"
            >
              Log in
            </button>
          )}
          {user && (
            <div className="flex items-center gap-2.5" data-testid="nav-user-menu">
              {user.picture ? (
                <img src={user.picture} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black font-display text-xs font-bold text-white">
                  {(user.name || user.email || "U")[0].toUpperCase()}
                </span>
              )}
              <button onClick={logout} data-testid="nav-logout-button" aria-label="Log out" className="text-neutral-400 transition-colors hover:text-black">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
          <a
            href="https://cal.com/sunnyrai/30min"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="nav-cta-button"
            className="group inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Book a growth call
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
        <button
          className="md:hidden"
          data-testid="nav-mobile-menu-button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-black/5 bg-white px-6 py-4 md:hidden" data-testid="nav-mobile-menu">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                data-testid={`nav-mobile-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm font-medium text-neutral-700"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            {user === null && (
              <button
                data-testid="nav-mobile-login-button"
                className="w-fit text-sm font-medium text-neutral-700"
                onClick={() => {
                  setOpen(false);
                  setAuthOpen(true);
                }}
              >
                Log in
              </button>
            )}
            {user && (
              <button
                data-testid="nav-mobile-logout-button"
                className="w-fit text-sm font-medium text-neutral-700"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
              >
                Log out ({user.name || user.email})
              </button>
            )}
            <a
              href="https://cal.com/sunnyrai/30min"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="nav-mobile-cta-button"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Book a growth call <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  );
}
