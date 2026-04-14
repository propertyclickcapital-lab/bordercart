"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

type Hit = { title: string; imageUrl: string | null; priceUSD: number; store: string; sourceUrl: string };
type GoogleResult = { title: string; sourceUrl: string; store: string };

export function SearchBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Hit[]>([]);
  const [google, setGoogle] = useState<GoogleResult[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!q.trim() || q.trim().length < 3) {
      setResults([]); setGoogle([]); setLoading(false); return;
    }
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const d = await r.json();
        setResults((d.results || []).slice(0, 3));
        setGoogle((d.googleSuggestions || []).slice(0, 3));
      } catch {}
      setLoading(false);
    }, 400);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    setOpen(false);
    try {
      new URL(v);
      router.push(`/import?url=${encodeURIComponent(v)}`);
    } catch {
      router.push(`/search?q=${encodeURIComponent(v)}`);
    }
  }

  return (
    <div ref={wrapRef} className={cn("relative w-full", className)}>
      <form onSubmit={submit} className="flex">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search or paste a US product link..."
          className="flex-1 h-10 rounded-l-md border-0 px-3 text-[var(--ink)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--orange)]"
        />
        <button type="submit" className="h-10 px-4 rounded-r-md bg-[var(--orange)] hover:bg-[var(--orange-dark)] text-white flex items-center">
          <Search className="h-5 w-5" />
        </button>
      </form>

      {open && q.trim().length >= 3 && (
        <div className="absolute top-11 left-0 right-0 z-50 rounded-lg border border-[var(--border)] bg-white shadow-xl max-h-[70vh] overflow-auto">
          {loading && (
            <div className="px-4 py-3 text-sm text-[var(--ink-2)] flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching for "{q.trim()}"...
            </div>
          )}
          {!loading && google.length === 0 && results.length === 0 && (
            <div className="px-4 py-4 text-sm text-[var(--ink-2)]">
              No quick results. Press Enter to open full search.
            </div>
          )}
          {google.length > 0 && (
            <div className="border-b border-[var(--border)]">
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-2)]">Quick results from Google</p>
              {google.map((g, i) => (
                <Link
                  key={`g-${i}`}
                  href={`/import?url=${encodeURIComponent(g.sourceUrl)}`}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--bg)]"
                  onClick={() => setOpen(false)}
                >
                  <Search className="h-4 w-4 text-[var(--ink-3)]" />
                  <span className="flex-1 text-sm truncate">{g.title}</span>
                  <Badge variant="orange">{g.store}</Badge>
                </Link>
              ))}
            </div>
          )}
          {results.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-2)]">Search results</p>
              {results.map((h, i) => (
                <Link
                  key={`r-${i}`}
                  href={`/import?url=${encodeURIComponent(h.sourceUrl)}`}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--bg)]"
                  onClick={() => setOpen(false)}
                >
                  <div className="h-10 w-10 flex-shrink-0 rounded bg-[var(--bg)] overflow-hidden">
                    {h.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.imageUrl} alt="" className="h-full w-full object-contain p-0.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{h.title}</p>
                    <p className="text-xs text-[var(--ink-2)]">${h.priceUSD} USD</p>
                  </div>
                  <Badge variant="orange">{h.store}</Badge>
                </Link>
              ))}
            </div>
          )}
          {q.trim() && (
            <button
              className="w-full text-center py-2.5 text-sm text-[var(--blue)] hover:bg-[var(--bg)] border-t border-[var(--border)]"
              onClick={() => { setOpen(false); router.push(`/search?q=${encodeURIComponent(q.trim())}`); }}
            >
              See all results for "{q.trim()}" →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
