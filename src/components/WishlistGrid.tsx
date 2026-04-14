"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatUSD } from "@/lib/utils/currency";

type Item = {
  id: string; productId: string; title: string; imageUrl: string | null;
  sourceUrl: string; store: string; priceUSD: number;
};

export function WishlistGrid({ items: initial }: { items: Item[] }) {
  const [items, setItems] = useState(initial);

  async function remove(id: string) {
    setItems((cur) => cur.filter((x) => x.id !== id));
    await fetch(`/api/wishlist/${id}`, { method: "DELETE" });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((i) => (
        <div key={i.id} className="rounded-lg border border-[var(--border)] bg-white overflow-hidden shadow-sm">
          <div className="aspect-square bg-[var(--bg)] flex items-center justify-center">
            {i.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={i.imageUrl} alt="" className="max-h-full max-w-full object-contain p-3" />
            ) : <div className="text-xs text-[var(--ink-3)]">No image</div>}
          </div>
          <div className="p-3">
            <Badge variant="orange">{i.store.toUpperCase()}</Badge>
            <p className="mt-2 text-sm font-medium line-clamp-2 min-h-[2.5rem]">{i.title}</p>
            {i.priceUSD > 0 && <p className="mt-1 text-xs text-[var(--ink-2)]">Retail {formatUSD(i.priceUSD)}</p>}
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
              <Link href={`/import?url=${encodeURIComponent(i.sourceUrl)}`}>
                <Button size="sm" variant="orange" className="w-full">Get Price</Button>
              </Link>
              <Button size="sm" variant="outline" onClick={() => remove(i.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
