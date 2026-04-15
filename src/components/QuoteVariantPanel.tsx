"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatMXN } from "@/lib/utils/currency";

const COLOR_SWATCHES: Record<string, string> = {
  Black: "#0f1111", White: "#ffffff", Red: "#d92525", Blue: "#0071ce",
  Green: "#067d62", Yellow: "#f5c518", Pink: "#ff69b4", Purple: "#8b3fbf",
  Orange: "#ff6900", Brown: "#7a4a2a", Grey: "#808080", Gray: "#808080",
  Navy: "#1a2b5e", Beige: "#d4b996", Cream: "#f5f0e1", Gold: "#d4af37",
  Silver: "#c0c0c0",
};

export function QuoteVariantPanel({
  quoteId,
  totalMXN,
  sizes,
  colors,
  variantImages,
  mainImage,
  initialSize,
  initialColor,
}: {
  quoteId: string;
  totalMXN: number;
  sizes: string[];
  colors: string[];
  variantImages: string[];
  mainImage: string | null;
  initialSize: string | null;
  initialColor: string | null;
}) {
  const router = useRouter();
  const [size, setSize] = useState<string | null>(initialSize);
  const [color, setColor] = useState<string | null>(initialColor);
  const [activeImage, setActiveImage] = useState<string | null>(mainImage);
  const [loading, setLoading] = useState(false);

  const needsSize = sizes.length > 0;
  const needsColor = colors.length > 0;
  const sizeOk = !needsSize || !!size;
  const colorOk = !needsColor || !!color;
  const canBuy = sizeOk && colorOk;

  const gallery = [mainImage, ...variantImages.filter((u) => u !== mainImage)].filter(
    (u): u is string => !!u
  );

  async function buy() {
    setLoading(true);
    if (needsSize || needsColor) {
      await fetch(`/api/quotes/${quoteId}/select-variant`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedSize: size, selectedColor: color }),
      }).catch(() => {});
    }
    router.push(`/checkout/${quoteId}`);
  }

  return (
    <div className="space-y-5">
      {gallery.length > 1 && (
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-lg bg-white border border-[var(--border)] flex items-center justify-center">
            {activeImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeImage} alt="" className="max-h-full max-w-full object-contain p-4" />
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {gallery.map((u, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(u)}
                className={`flex-shrink-0 h-16 w-16 rounded-md border-2 overflow-hidden bg-white ${activeImage === u ? "border-[var(--blue)]" : "border-[var(--border)]"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="h-full w-full object-contain p-1" />
              </button>
            ))}
          </div>
        </div>
      )}

      {needsColor && (
        <div>
          <p className="text-sm font-semibold mb-2">
            Color{color && <span className="ml-2 text-[var(--ink-2)] font-normal">· {color}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const swatch = COLOR_SWATCHES[c] || "#888";
              const active = color === c;
              return (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`flex items-center gap-2 rounded-full border-2 pl-1 pr-3 py-1 text-xs ${active ? "border-[var(--blue)] ring-2 ring-[var(--blue)]/20" : "border-[var(--border)] hover:border-[var(--ink-3)]"}`}
                >
                  <span
                    className="h-6 w-6 rounded-full border border-[var(--border)]"
                    style={{ background: swatch }}
                  />
                  <span className="font-medium">{c}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {needsSize && (
        <div>
          <p className="text-sm font-semibold mb-2">
            Size{size && <span className="ml-2 text-[var(--ink-2)] font-normal">· {size}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const active = size === s;
              return (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`min-w-[3rem] h-10 rounded-md border px-3 text-sm font-medium ${active ? "bg-[var(--blue)] border-[var(--blue)] text-white" : "bg-white border-[var(--border)] text-[var(--ink)] hover:border-[var(--ink-3)]"}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Button
        variant={canBuy ? "orange" : "secondary"}
        size="xl"
        className="w-full"
        onClick={buy}
        disabled={!canBuy || loading}
      >
        {loading ? "..." : canBuy ? `Buy Now — ${formatMXN(totalMXN)}` : "Select your options"}
      </Button>
    </div>
  );
}
