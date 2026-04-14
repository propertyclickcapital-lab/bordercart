"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

export function CancelledBanner() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}

function Inner() {
  const params = useSearchParams();
  if (params.get("cancelled") !== "1") return null;
  return (
    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-[var(--warning)] flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold">Complete your purchase</p>
        <p className="text-xs text-[var(--ink-2)] mt-0.5">Your order wasn't completed. Your price is still locked — tap Buy Now to continue.</p>
      </div>
    </div>
  );
}
