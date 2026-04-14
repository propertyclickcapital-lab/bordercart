"use client";

import { useEffect, useState } from "react";
import { ConfettiSuccess } from "./ConfettiSuccess";
import { QuoteCountdown } from "./QuoteCountdown";
import { Badge } from "@/components/ui/badge";
import { formatMXN } from "@/lib/utils/currency";
import { getTierLabel } from "@/lib/pricing/tiers";
import { ShieldCheck, Package, Lock } from "lucide-react";
import type { UserTier } from "@prisma/client";

export function SpecialQuoteView({
  quoteId, totalMXN, productTitle, productImageUrl, store,
  deliveryDaysMin, deliveryDaysMax, expiresAt, userTier,
}: {
  quoteId: string;
  totalMXN: number;
  productTitle: string;
  productImageUrl: string | null;
  store: string;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  expiresAt: string;
  userTier: UserTier;
}) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const duration = 1400;
    const startedAt = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min((t - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(totalMXN * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [totalMXN]);

  const tierSavings = userTier !== "DEFAULT";

  return (
    <div className="relative">
      <ConfettiSuccess />

      <div className="relative overflow-hidden rounded-xl">
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background:
              "linear-gradient(120deg, #c9a84c 0%, #dbb86a 25%, #ffd983 50%, #067d62 85%, #10b981 100%)",
            backgroundSize: "200% 100%",
          }}
        />
        <div className="relative px-6 py-5 text-center text-white font-semibold text-lg tracking-wide">
          🎉 ¡Tu precio está listo!
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] bg-white p-6 relative">
          <Badge variant="orange" className="absolute top-5 left-5 z-10">{store.toUpperCase()}</Badge>
          <div className="flex items-center justify-center aspect-square bg-[var(--bg)] rounded-md">
            {productImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={productImageUrl} alt="" className="max-h-full max-w-full object-contain p-6" />
            ) : <div className="text-[var(--ink-3)] text-sm">No image</div>}
          </div>
        </div>

        <div className="flex flex-col">
          <p className="text-sm font-semibold text-amber-700 animate-fade-up">
            Precio especial preparado para ti
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-tight">{productTitle}</h1>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-wider text-[var(--ink-2)]">Tu precio delivered</p>
            <p
              className="text-[clamp(2.5rem,9vw,5.5rem)] font-extrabold text-[var(--blue)] leading-none mt-1 tabular-nums"
              aria-live="polite"
            >
              {formatMXN(displayed)}
            </p>
            <p className="mt-1 text-sm text-[var(--ink-2)]">All-in price. Nothing hidden.</p>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 self-start rounded-full bg-[var(--blue-light)] px-3 py-1.5 text-sm font-medium text-[var(--blue-dark)]">
            <Package className="h-4 w-4" />
            Entrega en {deliveryDaysMin}–{deliveryDaysMax} días
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-[var(--ink-2)]">
            <span className="flex items-center gap-1.5"><Lock className="h-4 w-4" /> Seguro</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Protegido</span>
            <span className="flex items-center gap-1.5">📦 Tracked</span>
          </div>

          {tierSavings && (
            <div className="mt-5">
              <Badge variant="orange">Precio {getTierLabel(userTier)} aplicado — ahorraste en esta orden</Badge>
            </div>
          )}

          <a
            href={`/checkout/${quoteId}`}
            className="mt-7 inline-flex items-center justify-center w-full h-[56px] rounded-lg bg-[var(--orange)] hover:bg-[var(--orange-dark)] text-white font-semibold text-base transition-colors shadow-md"
          >
            Comprar ahora — {formatMXN(totalMXN)}
          </a>

          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[var(--ink-2)]">
            <span>⏰ Este precio expira en:</span>
          </div>
          <div className="text-center">
            <QuoteCountdown expiresAt={expiresAt} />
          </div>
        </div>
      </div>
    </div>
  );
}
