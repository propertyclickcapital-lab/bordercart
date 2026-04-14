"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WishlistHeart } from "./WishlistHeart";
import { formatUSD } from "@/lib/utils/currency";

type Props = {
  title: string;
  imageUrl: string | null;
  priceUSD: number;
  store: string;
  sourceUrl: string;
  productId?: string;
  wishlistId?: string;
  savedInitial?: boolean;
};

export function ProductCard({ title, imageUrl, priceUSD, store, sourceUrl, productId, wishlistId, savedInitial }: Props) {
  return (
    <div className="relative rounded-lg border border-[var(--border)] bg-white overflow-hidden shadow-sm group flex flex-col">
      {productId && (
        <div className="absolute top-2 right-2 z-10">
          <WishlistHeart productId={productId} initialSaved={!!savedInitial} wishlistId={wishlistId} size="sm" />
        </div>
      )}
      <div className="aspect-square bg-[var(--bg)] flex items-center justify-center">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="max-h-full max-w-full object-contain p-3" />
        ) : (
          <div className="text-xs text-[var(--ink-3)]">No image</div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <Badge variant="orange" className="self-start">{store.toUpperCase()}</Badge>
        <p className="mt-2 font-medium text-sm line-clamp-2 min-h-[2.5rem]">{title}</p>
        {priceUSD > 0 && <p className="mt-2 text-xs text-[var(--ink-2)]">Retail {formatUSD(priceUSD)} USD</p>}
        <Link href={`/import?url=${encodeURIComponent(sourceUrl)}`} className="mt-auto pt-3">
          <Button size="sm" variant="orange" className="w-full">Get MXN Price</Button>
        </Link>
      </div>
    </div>
  );
}
