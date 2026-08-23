"use client";

import { Handshake, Percent, Users } from "lucide-react";

const TIERS = [
  { name: "Starter", price: "$175–290/mo", commission: "2% commission", partners: "Up to 25 partners", color: "#2BBCC4" },
  { name: "Growth", price: "$460–860/mo", commission: "1.5% commission", partners: "Up to 100 partners", color: "#1FA84A" },
  { name: "Pro (managed)", price: "$1,450+/mo", commission: "1% commission", partners: "Unlimited partners", color: "#91268F" },
];

export default function Affiliate() {
  return (
    <div data-testid="affiliate-page">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500">
        <Handshake className="h-4 w-4 text-brand-green" /> Affiliate & Partners
      </div>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-black md:text-4xl">Turn partners into a revenue channel</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-500 md:text-base">Recruit, track and pay partners who sell for you. Choose the tier that matches your ambition — our team handles onboarding, tracking and payouts.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3" data-testid="affiliate-tiers">
        {TIERS.map((t) => (
          <div key={t.name} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: t.color }}><Users className="h-5 w-5" /></span>
            <h3 className="mt-4 font-display text-lg font-semibold text-black">{t.name}</h3>
            <p className="mt-1 font-display text-2xl font-bold text-black">{t.price}</p>
            <ul className="mt-4 space-y-2 text-sm text-neutral-600">
              <li className="flex items-center gap-2"><Percent className="h-3.5 w-3.5 text-brand-green" /> {t.commission}</li>
              <li className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-brand-green" /> {t.partners}</li>
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-black/5 bg-neutral-50/60 p-6" data-testid="affiliate-cta">
        <div>
          <p className="font-display text-lg font-semibold text-black">Ready to launch your partner program?</p>
          <p className="mt-1 text-sm text-neutral-500">Talk to our team and we'll set up tracking, onboarding and payouts for you.</p>
        </div>
        <a href="https://cal.com/sunnyrai/30min" target="_blank" rel="noopener noreferrer" data-testid="affiliate-book" className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5">
          Book a partner strategy call
        </a>
      </div>
    </div>
  );
}
