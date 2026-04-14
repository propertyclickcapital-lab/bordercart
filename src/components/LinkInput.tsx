"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function LinkInput({
  autoFocus = false, size = "md", placeholder = "Paste a product link from any U.S. store...", onHero = false,
}: {
  autoFocus?: boolean;
  size?: "md" | "lg";
  placeholder?: string;
  onHero?: boolean;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    router.push(`/import?url=${encodeURIComponent(url.trim())}`);
  }

  const h = size === "lg" ? "h-14" : "h-12";

  return (
    <form onSubmit={submit} className="w-full">
      <div className={cn("flex items-stretch rounded-xl overflow-hidden border shadow-md bg-white", onHero ? "border-transparent" : "border-[var(--border)]")}>
        <input
          type="url" required autoFocus={autoFocus}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={placeholder}
          className={cn("flex-1 px-4 text-[var(--ink)] outline-none placeholder:text-[var(--ink-3)]", h, size === "lg" ? "text-base" : "text-sm")}
        />
        <button
          type="submit"
          disabled={loading}
          className={cn("px-6 font-semibold text-white bg-[var(--blue)] hover:bg-[var(--blue-dark)] disabled:opacity-70 transition-colors flex items-center gap-2", h)}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (<>Get My Price<ArrowRight className="h-4 w-4" /></>)}
        </button>
      </div>
    </form>
  );
}
