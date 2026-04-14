"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { FileSearch, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { formatMXN } from "@/lib/utils/currency";

type ManualRequest = {
  id: string;
  sourceUrl: string;
  status: "pending" | "reviewed" | "quoted" | string;
  quotedPriceMXN: string | number | null;
  adminNote: string | null;
  createdAt: string | Date;
};

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function labelFor(status: string) {
  if (status === "pending") return { label: "In Review", variant: "warning" as const };
  if (status === "reviewed" || status === "quoted") return { label: "Price Ready", variant: "success" as const };
  return { label: "Cancelled", variant: "danger" as const };
}

export function ManualRequestCard({ request }: { request: ManualRequest }) {
  const [open, setOpen] = useState(false);
  const { label, variant } = labelFor(request.status);
  const priceReady = request.status === "reviewed" || request.status === "quoted";
  const price = request.quotedPriceMXN != null ? Number(request.quotedPriceMXN) : null;

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
          <p className="mt-1 text-sm text-[var(--ink)] break-all">{truncate(request.sourceUrl, 40)}</p>
          <p className="mt-1 text-xs text-[var(--ink-2)]">
            Submitted {format(new Date(request.createdAt), "MMM d, yyyy · h:mm a")}
          </p>
          <div className="mt-2"><Badge variant={variant}>{label}</Badge></div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {priceReady && price != null && (
            <p className="text-lg font-bold text-[var(--blue)]">{formatMXN(price)}</p>
          )}
          {priceReady && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--blue)] hover:underline"
            >
              View Price <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      {open && priceReady && (
        <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--bg)] p-3 text-sm">
          {price != null && (
            <p><span className="text-[var(--ink-2)]">Quoted price:</span> <span className="font-bold text-[var(--blue)]">{formatMXN(price)} MXN</span></p>
          )}
          {request.adminNote && <p className="mt-1 text-[var(--ink-2)]">{request.adminNote}</p>}
          {!request.adminNote && price == null && <p className="text-[var(--ink-2)]">Our team will follow up shortly.</p>}
        </div>
      )}
    </div>
  );
}
