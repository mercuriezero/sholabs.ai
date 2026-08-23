"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Loader2, Mic, Sparkles, Users, Video, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

const STRIPES = ["#2B39D1", "#1FA84A", "#F7941E", "#E200C4", "#2BBCC4", "#91268F"];

export default function PortalDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [ov, setOv] = useState(null);

  useEffect(() => {
    fetch(`${API}/portal/overview`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setOv)
      .catch(() => setOv({}));
  }, []);

  const cards = [
    { key: "llm", label: "LLM Citation", desc: "Find demand & publish ranking pages", icon: Sparkles, href: "/portal/llm", stat: ov?.opportunities ? `${ov.opportunities} opportunities` : "Run your first scan" },
    { key: "video", label: "AI Video", desc: "Brief a video, our team produces it", icon: Video, href: "/portal/video", stat: ov?.video_requests ? `${ov.video_requests} in production` : "Start a brief" },
    { key: "voice", label: "Voice AI", desc: "Deploy an AI calling agent", icon: Mic, href: "/portal/voice", stat: ov?.voice_requests ? `${ov.voice_requests} agents building` : "Design an agent" },
    { key: "leads", label: "Leads", desc: "Every captured lead in one place", icon: Users, href: "/portal/leads", stat: ov ? `${ov.leads} leads` : "—" },
    { key: "affiliate", label: "Affiliate & Partners", desc: "Grow revenue with partners", icon: FileText, href: "/portal/affiliate", stat: "Program overview" },
    { key: "hours", label: "Fractional CXO Hours", desc: "Your C-level growth ownership", icon: Wallet, href: "/portal/hours", stat: ov ? `${ov.hours_remaining} / ${ov.hours_total} hrs left` : "—" },
  ];

  return (
    <div data-testid="portal-dashboard">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500">
        <Sparkles className="h-4 w-4 text-brand-magenta" /> Command center
      </div>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-black md:text-4xl">
        Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-500 md:text-base">
        Your full-stack H.I.A.I. growth engine — Get Cited, Get Watched, Get Chosen — all in one place.
      </p>

      {!ov ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="dashboard-cards">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                onClick={() => router.push(c.href)}
                data-testid={`dashboard-card-${c.key}`}
                className="group flex flex-col items-start rounded-3xl border border-black/5 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: STRIPES[i % STRIPES.length] }}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-black">{c.label}</h3>
                <p className="mt-1 text-sm text-neutral-500">{c.desc}</p>
                <span className="mt-4 flex w-full items-center justify-between text-xs font-medium text-neutral-400">
                  {c.stat}
                  <ArrowRight className="h-4 w-4 text-black transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
