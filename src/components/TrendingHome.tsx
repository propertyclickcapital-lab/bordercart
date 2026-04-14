"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

type Item = {
  id: string;
  title: string;
  imageUrl: string | null;
  priceUSD: string | number;
  store: string;
  sourceUrl: string;
};

export function TrendingHome() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => { fetch("/api/trending").then((r) => r.json()).then(setItems).catch(() => {}); }, []);
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl w-full px-6 py-14">
      <div className="flex items-center gap-2 mb-6">
        <Flame className="h-5 w-5 text-[var(--orange)]" />
        <h2 className="text-3xl font-bold">Trending Right Now</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto md:grid md:grid-cols-4 pb-2">
        {items.slice(0, 8).map((p) => {
          const mxn = Math.round(Number(p.priceUSD) * 18 * 1.35);
          return (
            <div key={p.id} className="flex-shrink-0 w-56 md:w-auto rounded-lg border border-[var(--border)] bg-white overflow-hidden shadow-sm">
              <div className="aspect-square bg-[var(--bg)] flex items-center justify-center">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" className="max-h-full max-w-full object-contain p-3" />
                ) : <div className="text-xs text-[var(--ink-3)]">No image</div>}
              </div>
              <div className="p-4">
                <Badge variant="orange">{p.store.toUpperCase()}</Badge>
                <p className="mt-2 font-medium text-sm line-clamp-2 min-h-[2.5rem]">{p.title}</p>
                <p className="mt-2 text-sm text-[var(--ink-2)]">From <span className="font-bold text-[var(--blue)]">${mxn.toLocaleString("es-MX")} MXN</span></p>
                <Link href={`/import?url=${encodeURIComponent(p.sourceUrl)}`}>
                  <Button size="sm" variant="orange" className="mt-3 w-full">Get Price</Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
