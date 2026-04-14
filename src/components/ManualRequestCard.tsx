"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { FileSearch, ArrowRight, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { formatMXN } from "@/lib/utils/currency";

type QuotePreview = {
  id: string;
  totalMXN: string | number;
  expiresAt: string | Date;
  adminSetPrice: boolean;
  product: { title: string; imageUrl: string | null; store: string };
};

type ManualRequest = {
  id: string;
  sourceUrl: string;
  status: "pending" | "reviewed" | "quoted" | string;
  quotedPriceMXN: string | number | null;
  adminNote: string | null;
  createdAt: string | Date;
  quoteId?: string | null;
  quote?: QuotePreview | null;
};

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export function ManualRequestCard({ request }: { request: ManualRequest }) {
  const priceReady = (request.status === "reviewed" || request.status === "quoted") && !!request.quote?.id;
  const pending = request.status === "pending";

  if (priceReady && request.quote) return <PriceReadyCard quote={request.quote} />;
  if (pending) return <PendingCard request={request} />;
  return <FallbackCard request={request} />;
}

function PendingCard({ request }: { request: ManualRequest }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-[var(--blue-light)] text-[var(--blue)]">
          <FileSearch className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-2)]">
            Manual Review Request
          </p>
          <p className="mt-1 text-sm text-[var(--ink)] break-all">{truncate(request.sourceUrl, 60)}</p>
          <p className="mt-1 text-xs text-[var(--ink-2)]">
            Submitted {format(new Date(request.createdAt), "MMM d, yyyy · h:mm a")}
          </p>
          <div className="mt-2"><Badge variant="warning">In Review</Badge></div>
        </div>
      </div>
    </div>
  );
}

function PriceReadyCard({ quote }: { quote: QuotePreview }) {
  const [remaining, setRemaining] = useState<string>("");
  useEffect(() => {
    const target = new Date(quote.expiresAt).getTime();
    const update = () => {
      const diff = target - Date.now();
      if (diff <= 0) return setRemaining("Expirado");
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setRemaining(hours >= 1 ? `${hours}h ${mins}m` : `${mins} min`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [quote.expiresAt]);

  const price = Number(quote.totalMXN);

  return (
    <Link
      href={`/quote/${quote.id}`}
      className="block rounded-xl border-2 border-[var(--orange)] bg-gradient-to-br from-white via-white to-[var(--orange-light)] shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
    >
      <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-[var(--success)] text-white px-4 py-2 text-sm font-semibold flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        Price Ready — your custom quote is waiting
      </div>
      <div className="p-5 flex flex-col sm:flex-row gap-5 items-start">
        <div className="h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 overflow-hidden rounded-md bg-white border border-[var(--border)]">
          {quote.product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={quote.product.imageUrl} alt="" className="h-full w-full object-contain p-1" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-[var(--ink-3)] text-xs">No image</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Badge variant="orange">{quote.product.store.toUpperCase()}</Badge>
          <h3 className="mt-2 text-base font-semibold line-clamp-2">{quote.product.title}</h3>
          <p className="mt-2 text-3xl font-extrabold text-[var(--blue)] tabular-nums">{formatMXN(price)}</p>
          <p className="mt-1 text-xs text-[var(--ink-2)]">⏰ Este precio expira en {remaining}</p>
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="flex items-center justify-center w-full h-12 rounded-lg bg-[var(--orange)] hover:bg-[var(--orange-dark)] text-white font-semibold transition-colors">
          Comprar ahora — {formatMXN(price)}
          <ArrowRight className="h-4 w-4 ml-2" />
        </div>
      </div>
    </Link>
  );
}

function FallbackCard({ request }: { request: ManualRequest }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm opacity-75">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-[var(--bg)] text-[var(--ink-3)]">
          <FileSearch className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-2)]">
            Manual Review Request
          </p>
          <p className="mt-1 text-sm text-[var(--ink)] break-all">{truncate(request.sourceUrl, 60)}</p>
          <div className="mt-2"><Badge variant="danger">Cancelled</Badge></div>
        </div>
      </div>
    </div>
  );
}
