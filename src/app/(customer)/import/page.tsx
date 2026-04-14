"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";

export default function ImportPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const url = params.get("url");
  const [status, setStatus] = useState<string>("Detecting store...");
  const [err, setErr] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (!url || ran.current) return;
    ran.current = true;
    (async () => {
      try {
        setStatus("Importing product details...");
        const r = await fetch("/api/products/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (!r.ok) throw new Error("Could not import");
        const product = await r.json();
        if (!product.isSupported || Number(product.priceUSD) <= 0) {
          const mr = await fetch("/api/manual-requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sourceUrl: url }),
          });
          const mrData = await mr.json();
          router.push(`/import/manual/${mrData.id}?url=${encodeURIComponent(url)}`);
          return;
        }
        setStatus("Calculating your MXN price...");
        const q = await fetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
        });
        if (!q.ok) throw new Error("Could not create quote");
        const quote = await q.json();
        router.push(`/quote/${quote.id}`);
      } catch (e: any) {
        setErr(e.message || "Something went wrong");
      }
    })();
  }, [url, router]);

  if (!url) return <div className="py-16 text-center text-[var(--ink-2)]">No URL provided.</div>;

  if (err) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
          <AlertTriangle className="h-6 w-6 text-[var(--warning)]" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-[var(--ink-2)]">{err}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--blue-light)] text-[var(--blue)]">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
      <h1 className="mt-5 text-2xl font-bold">{status}</h1>
      <p className="mt-2 text-sm text-[var(--ink-2)]">Hang tight — we're reading the product page.</p>
      <div className="mt-8 mx-auto max-w-sm rounded-lg border border-[var(--border)] bg-white p-5 flex items-center gap-4">
        <div className="h-16 w-16 shimmer rounded-md" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 shimmer rounded" />
          <div className="h-4 w-full shimmer rounded" />
          <div className="h-4 w-2/3 shimmer rounded" />
        </div>
      </div>
    </div>
  );
}
