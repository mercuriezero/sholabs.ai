"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Loader2, Mic, Sparkles, Users, Video, Wallet, TrendingUp, Quote, PhoneCall, Target } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useAuth } from "@/context/AuthContext";

const API = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

const C = {
  blue: "#2B39D1", green: "#1FA84A", orange: "#F7941E", magenta: "#E200C4",
  cyan: "#2BBCC4", purple: "#91268F", red: "#ED1C24", yellow: "#FFD900",
};
const STRIPES = [C.blue, C.green, C.orange, C.magenta, C.cyan, C.purple];

// ---------- Demo data (resonates with the High On AI service stack) ----------
const KPIS = [
  { label: "AI Citations", value: "1,284", sub: "+18% vs last month", grad: `linear-gradient(135deg, ${C.blue}, #4756e6)`, icon: Quote },
  { label: "Share of Voice", value: "62%", sub: "across ChatGPT · Gemini · Perplexity", grad: `linear-gradient(135deg, ${C.cyan}, #1f9aa1)`, icon: TrendingUp },
  { label: "Videos Produced", value: "47", sub: "9 in production", grad: `linear-gradient(135deg, ${C.magenta}, #b5009c)`, icon: Video },
  { label: "Voice Minutes", value: "8.6K", sub: "312 calls handled", grad: `linear-gradient(135deg, ${C.green}, #167d38)`, icon: PhoneCall },
  { label: "Leads Captured", value: "342", sub: "+64 this week", grad: `linear-gradient(135deg, ${C.orange}, #d97b12)`, icon: Users },
  { label: "Pipeline Value", value: "$128K", sub: "win rate 31%", grad: `linear-gradient(135deg, ${C.purple}, #6f1c6d)`, icon: Target },
];

const VISIBILITY = [
  { wk: "Wk 1", citations: 210, sov: 38 },
  { wk: "Wk 2", citations: 265, sov: 44 },
  { wk: "Wk 3", citations: 240, sov: 46 },
  { wk: "Wk 4", citations: 320, sov: 51 },
  { wk: "Wk 5", citations: 380, sov: 55 },
  { wk: "Wk 6", citations: 355, sov: 58 },
  { wk: "Wk 7", citations: 430, sov: 60 },
  { wk: "Wk 8", citations: 490, sov: 62 },
];

const LEADS_TREND = [
  { m: "Mar", leads: 34, booked: 9 },
  { m: "Apr", leads: 41, booked: 12 },
  { m: "May", leads: 38, booked: 11 },
  { m: "Jun", leads: 55, booked: 18 },
  { m: "Jul", leads: 62, booked: 21 },
  { m: "Aug", leads: 78, booked: 27 },
];

const SOURCES = [
  { name: "LLM Citation", value: 128, color: C.blue },
  { name: "AI Video", value: 84, color: C.magenta },
  { name: "Voice AI", value: 61, color: C.green },
  { name: "Affiliate", value: 39, color: C.orange },
  { name: "Fractional CXO", value: 30, color: C.purple },
];

const GAUGES = [
  { name: "Q3 pipeline goal", value: 78, fill: C.green },
  { name: "SoV target", value: 62, fill: C.blue },
  { name: "Content published", value: 84, fill: C.magenta },
];

const ChartCard = ({ title, subtitle, testid, children }) => (
  <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm md:p-6" data-testid={testid}>
    <p className="font-display text-base font-semibold text-black md:text-lg">{title}</p>
    {subtitle && <p className="text-xs text-neutral-400">{subtitle}</p>}
    <div className="mt-4">{children}</div>
  </div>
);

const tooltipStyle = { borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" };

function DashboardCharts() {
  return (
    <div className="mt-8" data-testid="dashboard-charts">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-green">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-green" /> Live
        </span>
        <span className="text-xs text-neutral-400">Sample performance across your growth engine · last 8 weeks</span>
      </div>

      {/* KPI tiles */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6" data-testid="dashboard-kpis">
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="relative overflow-hidden rounded-2xl p-4 text-white shadow-sm" style={{ background: k.grad }} data-testid={`kpi-${k.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
              <Icon className="absolute right-3 top-3 h-5 w-5 opacity-40" />
              <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">{k.label}</p>
              <p className="mt-1 font-display text-2xl font-bold leading-none">{k.value}</p>
              <p className="mt-2 text-[10px] leading-tight opacity-80">{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Row 1: area + combo */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="AI visibility & citations" subtitle="Citations count vs. share of voice %" testid="chart-visibility">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={VISIBILITY} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="gCit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.blue} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
              <XAxis dataKey="wk" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area yAxisId="l" type="monotone" dataKey="citations" name="Citations" stroke={C.blue} strokeWidth={2.5} fill="url(#gCit)" />
              <Line yAxisId="r" type="monotone" dataKey="sov" name="Share of voice %" stroke={C.cyan} strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Leads & booked meetings" subtitle="Captured leads vs. meetings booked" testid="chart-leads">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={LEADS_TREND} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="leads" name="Leads" fill={C.orange} radius={[6, 6, 0, 0]} maxBarSize={26} />
              <Bar dataKey="booked" name="Booked" fill={C.magenta} radius={[6, 6, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: pie + gauges */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Leads by service" subtitle="Where your pipeline comes from" testid="chart-sources">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={SOURCES} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2}>
                {SOURCES.map((s) => <Cell key={s.name} fill={s.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Goal progress" subtitle="How close you are to this quarter's targets" testid="chart-gauges">
          <ResponsiveContainer width="100%" height={210}>
            <RadialBarChart innerRadius="35%" outerRadius="100%" data={GAUGES} startAngle={90} endAngle={-270}>
              <RadialBar background dataKey="value" cornerRadius={8} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v, _n, p) => [`${v}%`, p?.payload?.name]} />
              {GAUGES.map((g) => <Cell key={g.name} fill={g.fill} />)}
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {GAUGES.map((g) => (
              <div key={g.name} className="flex items-center gap-2 text-xs text-neutral-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: g.fill }} />
                {g.name} · <span className="font-semibold text-black">{g.value}%</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

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

      <DashboardCharts />

      {!ov ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>
      ) : (
        <>
          <h2 className="mt-12 font-display text-xl font-semibold text-black">Jump into a service</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="dashboard-cards">
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
        </>
      )}
    </div>
  );
}
