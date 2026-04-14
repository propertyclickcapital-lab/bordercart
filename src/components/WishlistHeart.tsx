"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useToast } from "@/components/ui/toast";

export function WishlistHeart({
  productId, initialSaved = false, wishlistId: initialWishlistId, size = "md", onRemove,
}: {
  productId: string;
  initialSaved?: boolean;
  wishlistId?: string;
  size?: "sm" | "md";
  onRemove?: () => void;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [wishlistId, setWishlistId] = useState<string | undefined>(initialWishlistId);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      if (saved && wishlistId) {
        await fetch(`/api/wishlist/${wishlistId}`, { method: "DELETE" });
        setSaved(false); setWishlistId(undefined);
        toast({ title: "Removed from saved" });
        onRemove?.();
      } else {
        const r = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        const d = await r.json();
        setSaved(true); setWishlistId(d.id);
        toast({ title: "Saved for later", variant: "success" });
      }
    } finally {
      setLoading(false);
    }
  }

  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? "Remove from saved" : "Save for later"}
      className={cn(
        "flex items-center justify-center rounded-full border transition-all shadow-sm",
        saved ? "bg-red-50 border-red-200 text-[var(--danger)]" : "bg-white border-[var(--border)] text-[var(--ink-2)] hover:text-[var(--danger)]",
        dim
      )}
    >
      <Heart className={cn(icon, saved && "fill-[var(--danger)]")} />
    </button>
  );
}
