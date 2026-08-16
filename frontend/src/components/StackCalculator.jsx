import { useMemo, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";

const BRAND = ["#F7941E", "#2BBCC4", "#1FA84A", "#E200C4", "#2B39D1", "#91268F", "#ED1C24", "#FFD900"];

// Typical 2026 list prices, small-team plans. per: "user" = ₹/user/month, "flat" = ₹/month.
const TOOLS = [
  { name: "Profound", cat: "AI visibility", price: 12000, per: "flat" },
  { name: "Peec AI", cat: "AI visibility", price: 7500, per: "flat" },
  { name: "AthenaHQ", cat: "AI visibility", price: 24000, per: "flat" },
  { name: "Otterly.AI", cat: "AI visibility", price: 5000, per: "flat" },
  { name: "HeyGen", cat: "AI video", price: 5500, per: "flat" },
  { name: "Synthesia", cat: "AI video", price: 7500, per: "flat" },
  { name: "Arcads", cat: "AI video", price: 9000, per: "flat" },
  { name: "Apollo", cat: "Outbound", price: 1000, per: "user" },
  { name: "Clay", cat: "Outbound", price: 13000, per: "flat" },
  { name: "Smartlead", cat: "Outbound", price: 8000, per: "flat" },
  { name: "Outreach", cat: "Outbound", price: 3500, per: "user" },
  { name: "impact.com", cat: "Partners", price: 41000, per: "flat" },
  { name: "PartnerStack", cat: "Partners", price: 41000, per: "flat" },
  { name: "GRIN", cat: "Creators", price: 60000, per: "flat" },
  { name: "CreatorIQ", cat: "Creators", price: 100000, per: "flat" },
  { name: "Aspire", cat: "Creators", price: 60000, per: "flat" },
  { name: "Clari", cat: "RevOps", price: 3000, per: "user" },
  { name: "HubSpot Ops Hub", cat: "RevOps", price: 800, per: "user" },
];

const DEFAULT_SELECTED = ["Profound", "HeyGen", "Apollo", "PartnerStack", "Clari"];
const PILOT_PRICE = 99999;

const inr = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function StackCalculator() {
  const [selected, setSelected] = useState(DEFAULT_SELECTED);
  const [users, setUsers] = useState(10);

  const toggle = (name) =>
    setSelected((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]));

  const { lines, monthly } = useMemo(() => {
    const chosen = TOOLS.filter((t) => selected.includes(t.name));
    const lines = chosen.map((t) => ({
      ...t,
      cost: t.per === "user" ? t.price * users : t.price,
    }));
    return { lines, monthly: lines.reduce((s, l) => s + l.cost, 0) };
  }, [selected, users]);

  const yearly = monthly * 12;
  const savings = Math.max(0, yearly - PILOT_PRICE);

  return (
    <div className="mt-8 rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-10" data-testid="stack-calculator">
      <p className="text-center text-sm text-neutral-500">
        Everything below is a real, separately-sold category in 2026. Most growing companies end up buying 5-8 of
        these: different logins, different invoices, no shared context.
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <p className="font-display text-lg font-semibold text-black">Which tools do you use?</p>
          <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
            {TOOLS.map((t, i) => {
              const on = selected.includes(t.name);
              const initials = t.name.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();
              return (
                <button
                  key={t.name}
                  onClick={() => toggle(t.name)}
                  aria-pressed={on}
                  data-testid={`tool-${t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  className={`group relative flex flex-col items-center gap-2 rounded-2xl border bg-white p-3 transition-all hover:-translate-y-0.5 ${
                    on ? "border-brand-purple shadow-md" : "border-neutral-200 hover:border-black/30"
                  }`}
                >
                  {on && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-purple">
                      <Check className="h-3 w-3 text-white" />
                    </span>
                  )}
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl font-display text-sm font-bold text-white"
                    style={{ background: BRAND[i % BRAND.length] }}
                  >
                    {initials}
                  </span>
                  <span className="text-center text-[11px] font-medium leading-tight text-neutral-600">{t.name}</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">{t.cat}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-8 font-display text-lg font-semibold text-black">How many users?</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setUsers((u) => Math.max(1, u - 1))}
              data-testid="users-minus"
              aria-label="Fewer users"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 transition-colors hover:border-black/40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              min="1"
              max="500"
              value={users}
              onChange={(e) => setUsers(Math.max(1, Math.min(500, parseInt(e.target.value, 10) || 1)))}
              data-testid="users-input"
              className="h-10 w-20 rounded-xl border border-neutral-200 text-center text-sm font-semibold outline-none focus:border-black/40"
            />
            <button
              onClick={() => setUsers((u) => Math.min(500, u + 1))}
              data-testid="users-plus"
              aria-label="More users"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 transition-colors hover:border-black/40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div>
          <p className="font-display text-lg font-semibold text-black">
            Tools to replace{" "}
            <span className="block text-xs font-normal text-neutral-400">for {users} users · per month</span>
          </p>
          {lines.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-400" data-testid="stack-empty">
              Select a few tools on the left to see what they cost you.
            </p>
          ) : (
            <>
              <ul className="mt-4 space-y-1.5" data-testid="stack-lines">
                {lines.map((l) => (
                  <li key={l.name} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-neutral-600">{l.name}</span>
                    <span className="flex-1 border-b border-dotted border-neutral-300" aria-hidden="true" />
                    <span className="font-medium text-black">
                      {l.per === "user" ? `${inr(l.price)} / user` : inr(l.cost)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-baseline justify-between border-t border-black/10 pt-4">
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-500">Total</span>
                <span className="font-display text-xl font-bold text-black" data-testid="stack-total">{inr(yearly)} / year</span>
              </div>

              <div className="mt-6 flex items-baseline justify-between">
                <span className="text-sm text-neutral-500">High On AI Full Engine Pilot</span>
                <span className="font-display text-lg font-bold text-black">{inr(PILOT_PRICE)} one-time</span>
              </div>

              <div className="mt-6 rounded-2xl bg-brand-yellow/25 p-5">
                <p className="font-display text-sm font-semibold text-black">Your savings</p>
                <p className="mt-1 font-display text-3xl font-bold tracking-tight text-black" data-testid="stack-savings">
                  <span className="bg-brand-yellow/70 box-decoration-clone px-1">{inr(savings)}</span>
                  <span className="text-lg font-semibold text-neutral-500"> / year</span>
                </p>
                <p className="mt-2 text-xs text-neutral-500">
                  One pilot price, every pillar covered · typical list prices, small-team plans
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
