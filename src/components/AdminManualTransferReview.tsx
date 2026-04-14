"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { CheckCircle2, XCircle } from "lucide-react";

export function AdminManualTransferReview({
  orderId,
  confirmationImageUrl,
  paymentStatus,
  rejectionNote,
}: {
  orderId: string;
  confirmationImageUrl: string;
  paymentStatus: string;
  rejectionNote: string | null;
}) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const { toast } = useToast();

  async function act(action: "approve" | "reject") {
    setLoading(action);
    const r = await fetch(`/api/admin/payments/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note: action === "reject" ? note : undefined }),
    });
    setLoading(null);
    if (r.ok) {
      toast({ title: action === "approve" ? "Payment approved" : "Payment rejected", variant: "success" });
      setTimeout(() => location.reload(), 500);
    } else {
      const d = await r.json().catch(() => ({}));
      toast({ title: d.error || "Failed", variant: "error" });
    }
  }

  const isImage = confirmationImageUrl.startsWith("data:image/");
  const isPdf = confirmationImageUrl.startsWith("data:application/pdf");
  const alreadyResolved = paymentStatus === "succeeded" || paymentStatus === "failed";

  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Manual transfer proof</h2>
        {paymentStatus === "succeeded" && <Badge variant="success">Approved</Badge>}
        {paymentStatus === "failed" && <Badge variant="danger">Rejected</Badge>}
        {paymentStatus === "pending" && <Badge variant="warning">Awaiting verification</Badge>}
      </div>

      {rejectionNote && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-[var(--danger)]">
          <strong>Rejection note:</strong> {rejectionNote}
        </div>
      )}

      <div className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-2">
        {isImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={confirmationImageUrl} alt="Payment proof" className="w-full max-h-[500px] object-contain rounded" />
        )}
        {isPdf && (
          <div className="text-center py-6">
            <p className="text-sm text-[var(--ink-2)] mb-3">PDF comprobante</p>
            <a href={confirmationImageUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--blue)] hover:underline">
              Open PDF →
            </a>
          </div>
        )}
        {!isImage && !isPdf && <p className="text-sm text-[var(--ink-2)] p-4">Unsupported format</p>}
      </div>

      {!alreadyResolved && (
        <>
          <Button onClick={() => act("approve")} disabled={loading !== null} variant="success" className="w-full">
            <CheckCircle2 className="h-4 w-4" />
            {loading === "approve" ? "Approving..." : "Aprobar pago"}
          </Button>
          <div className="space-y-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Reason for rejection (shown to buyer)"
              className="w-full rounded-md border border-[var(--border)] p-2 text-sm"
            />
            <Button onClick={() => act("reject")} disabled={loading !== null} variant="danger" className="w-full">
              <XCircle className="h-4 w-4" />
              {loading === "reject" ? "Rejecting..." : "Rechazar pago"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
