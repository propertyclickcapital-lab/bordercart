"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "./ProductCard";
import { Loader2, SearchX } from "lucide-react";
import { Select } from "@/components/ui/select";

type Hit = { title: string; imageUrl: string | null; priceUSD: number; store: string; sourceUrl: string };
type GoogleResult = { title: string; sourceUrl: string; store: string };

const STORES = ["all", "amazon", "walmart", "target", "nike", "bestbuy", "other"];

export function SearchResultsPage({ query, category }: { query: string; category?: string }) {
  const [results, setResults] = useState<Hit[]>([]);
  const [google, setGoogle] = useState<GoogleResult[]>([]);
  const [loading, setLoading] = useState<boolean>(!!query);
  const [storeFilter, setStoreFilter] = useState("all");
  const [sort, setSort] = useState<"relevance" | "low" | "high">("relevance");

  useEffect(() => {
    if (!query) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => { setResults(d.results || []); setGoogle(d.googleSuggestions || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query]);

  const filtered = useMemo(() => {
    let out = results;
    if (storeFilter !== "all") out = out.filter((h) => h.store === storeFilter);
    if (sort === "low") out = [...out].sort((a, b) => a.priceUSD - b.priceUSD);
    else if (sort === "high") out = [...out].sort((a, b) => b.priceUSD - a.priceUSD);
    return out;
  }, [results, storeFilter, sort]);

  if (!query && !category) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-10 text-center">
        <p className="text-[var(--ink-2)]">Use the search bar above to find products.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <p className="text-sm text-[var(--ink-2)] flex items-center gap-2 mb-4">
          <Loader2 className="h-4 w-4 animate-spin" /> Searching...
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-[var(--border)] bg-white overflow-hidden">
              <div className="aspect-square shimmer" />
              <div className="p-4 space-y-2"><div className="h-3 w-16 shimmer rounded" /><div className="h-4 w-full shimmer rounded" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div>
        {google.length > 0 && (
          <div className="mb-6 rounded-lg border border-[var(--border)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-2)] mb-2">Try one of these from Google</p>
            <ul className="space-y-1.5">
              {google.map((g, i) => (
                <li key={i}>
                  <a href={`/import?url=${encodeURIComponent(g.sourceUrl)}`} className="text-sm text-[var(--blue)] hover:underline">{g.title}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-10 text-center">
          <SearchX className="mx-auto h-8 w-8 text-[var(--ink-3)]" />
          <h3 className="mt-3 font-semibold">No results</h3>
          <p className="mt-1 text-sm text-[var(--ink-2)]">Try a different search, or paste a direct product link in the URL bar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[200px_1fr] gap-6">
      <aside className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-2)] mb-1">Store</p>
          <Select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
            {STORES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-2)] mb-1">Sort</p>
          <Select value={sort} onChange={(e) => setSort(e.target.value as any)}>
            <option value="relevance">Relevance</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </Select>
        </div>
      </aside>
      <div>
        <p className="text-sm text-[var(--ink-2)] mb-4">{filtered.length} results</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((h, i) => (
            <ProductCard
              key={`${h.sourceUrl}-${i}`}
              title={h.title}
              imageUrl={h.imageUrl}
              priceUSD={h.priceUSD}
              store={h.store}
              sourceUrl={h.sourceUrl}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
