import { Sparkles } from "lucide-react";

const ITEMS = ["Get Cited", "Get Watched", "Get Chosen", "Human Intelligence + AI", "GEO", "AEO", "AI Visibility"];
const COLORS = ["#2B39D1", "#E200C4", "#F7941E", "#1FA84A", "#2BBCC4", "#91268F", "#ED1C24"];

export default function EditorialMarquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="overflow-hidden border-y border-black/5 bg-white py-6" aria-hidden="true" data-testid="editorial-marquee">
      <div className="marquee-track">
        {row.map((item, i) => (
          <span key={i} className="flex shrink-0 items-center gap-10 pr-10">
            <span className="whitespace-nowrap font-display text-2xl font-semibold tracking-tight text-neutral-300 md:text-4xl">
              {item}
            </span>
            <Sparkles className="h-5 w-5 shrink-0" style={{ color: COLORS[i % COLORS.length] }} />
          </span>
        ))}
      </div>
    </div>
  );
}
