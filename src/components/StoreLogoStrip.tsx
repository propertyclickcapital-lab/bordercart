"use client";

import { useState } from "react";
import { STORE_REGISTRY, type StoreCategory, storesByCategory } from "@/lib/scraper/registry";

const CATS: StoreCategory[] = ["Electronics", "Fashion", "Shoes", "Beauty", "Home", "Sports", "Luxury", "Baby", "Pets", "Auto", "Office", "Books", "Food"];

export function StoreLogoStrip() {
  const [cat, setCat] = useState<StoreCategory | "All">("All");
  const grouped = storesByCategory();
  const stores = cat === "All" ? STORE_REGISTRY : (grouped[cat] || []);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-3">
        <Pill label={`All (${STORE_REGISTRY.length})`} active={cat === "All"} onClick={() => setCat("All")} />
        {CATS.map((c) => (
          <Pill key={c} label={c} active={cat === c} onClick={() => setCat(c)} />
        ))}
      </div>
      <div className="flex gap-3 overflow-x-auto py-2">
        {stores.map((s) => (
          <div key={s.key} className="flex-shrink-0 flex items-center gap-2 rounded-full border border-[var(--border)] bg-white pl-2 pr-4 py-2 shadow-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold" style={{ background: s.color }}>
              {s.name.charAt(0)}
            </span>
            <span className="text-sm font-medium text-[var(--ink)] whitespace-nowrap">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${active ? "bg-[var(--navy)] border-[var(--navy)] text-white" : "bg-white border-[var(--border)] text-[var(--ink-2)] hover:border-[var(--navy)]"}`}
    >
      {label}
    </button>
  );
}
