"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, FileText, Gauge, Loader2, LogOut, Mic, Sparkles, Users, Video, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { href: "/portal", label: "Dashboard", icon: Gauge, testid: "portal-nav-dashboard" },
  { href: "/portal/llm", label: "LLM Citation", icon: Sparkles, testid: "portal-nav-llm" },
  { href: "/portal/video", label: "AI Video", icon: Video, testid: "portal-nav-video" },
  { href: "/portal/voice", label: "Voice AI", icon: Mic, testid: "portal-nav-voice" },
  { href: "/portal/leads", label: "Leads", icon: Users, testid: "portal-nav-leads" },
  { href: "/portal/affiliate", label: "Affiliate", icon: FileText, testid: "portal-nav-affiliate" },
  { href: "/portal/hours", label: "CXO Hours", icon: Wallet, testid: "portal-nav-hours" },
];

export default function PortalShell({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user === null) router.replace("/");
  }, [user, router]);

  if (user === undefined || user === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50" data-testid="portal-loading">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const isActive = (href) => {
    if (href === "/portal") return pathname === "/portal";
    if (href === "/portal/llm") return pathname.startsWith("/portal/llm") || pathname.startsWith("/portal/opportunities") || pathname.startsWith("/portal/pages");
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-black/5 bg-white md:flex" data-testid="portal-sidebar">
        <div className="flex h-16 items-center border-b border-black/5 px-6">
          <img src="/logo.webp" alt="High On AI" className="h-8 w-auto rounded" />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((n) => {
            const Icon = n.icon;
            const on = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                data-testid={n.testid}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${on ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
              >
                <Icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-black/5 p-3">
          <Link href="/" data-testid="portal-view-site" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-100">
            <ExternalLink className="h-4 w-4" /> View site
          </Link>
          <button onClick={logout} data-testid="portal-logout" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-100">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-black/5 bg-white px-6" data-testid="portal-topbar">
          <img src="/logo.webp" alt="High On AI" className="h-7 w-auto rounded md:hidden" />
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-neutral-500 sm:block" data-testid="portal-user-email">{user.email}</span>
            <Link href="/" data-testid="portal-view-site-mobile" aria-label="View site" className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 md:hidden">
              <ExternalLink className="h-4 w-4" />
            </Link>
            <button onClick={logout} data-testid="portal-logout-mobile" aria-label="Log out" className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 md:hidden">
              <LogOut className="h-4 w-4" />
            </button>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black font-display text-xs font-bold text-white">
              {(user.name || user.email || "U")[0].toUpperCase()}
            </span>
          </div>
        </header>

        <div className="flex gap-1 overflow-x-auto border-b border-black/5 bg-white px-3 py-2 md:hidden">
          {NAV.map((n) => {
            const on = isActive(n.href);
            return (
              <Link key={n.href} href={n.href} data-testid={`${n.testid}-mobile`} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${on ? "bg-black text-white" : "text-neutral-600"}`}>
                {n.label}
              </Link>
            );
          })}
        </div>

        <main className="mx-auto max-w-6xl px-4 py-8 md:px-8" data-testid="portal-main">{children}</main>
      </div>
    </div>
  );
}
