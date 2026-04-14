"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { OrderStatus } from "@prisma/client";
import { useToast } from "@/components/ui/toast";

const STATUSES: OrderStatus[] = [
  "quote_created", "awaiting_payment", "pending_purchase", "purchased_from_store",
  "in_transit_to_san_diego", "received_at_warehouse", "forwarded_to_mexico",
  "in_last_mile_delivery", "delivered", "issue_flagged", "cancelled",
];

const CARRIERS_US = ["USPS", "UPS", "FedEx", "DHL"];
const CARRIERS_MX = ["DHL MX", "Estafeta", "FedEx MX", "Paquetexpress", "99 Minutos"];

export function AdminOrderControls({
  orderId, currentStatus, initial,
}: {
  orderId: string; currentStatus: OrderStatus;
  initial: { trackingNumberUS: string; trackingNumberMX: string; carrierUS: string; carrierMX: string; adminNotes: string };
}) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [note, setNote] = useState("");
  const [trackingNumberUS, setTUS] = useState(initial.trackingNumberUS);
  const [trackingNumberMX, setTMX] = useState(initial.trackingNumberMX);
  const [carrierUS, setCUS] = useState(initial.carrierUS);
  const [carrierMX, setCMX] = useState(initial.carrierMX);
  const [adminNotes, setAN] = useState(initial.adminNotes);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function save(withStatus = true) {
    setLoading(true);
    const r = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(withStatus ? { status, note } : {}),
        trackingNumberUS: trackingNumberUS || null,
        trackingNumberMX: trackingNumberMX || null,
        carrierUS: carrierUS || null,
        carrierMX: carrierMX || null,
        adminNotes,
      }),
    });
    setLoading(false);
    toast({ title: r.ok ? "Saved" : "Save failed", variant: r.ok ? "success" : "error" });
    if (r.ok && withStatus) location.reload();
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-semibold">Update status</h2>
        <div className="mt-3 space-y-3">
          <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </Select>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="w-full min-h-20 rounded-lg border border-[var(--border)] bg-white p-3 text-sm" />
          <Button onClick={() => save(true)} disabled={loading} className="w-full">{loading ? "Saving..." : "Save status"}</Button>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-semibold">Tracking</h2>
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-xs text-[var(--ink-2)] mb-1">U.S. leg</p>
            <Input placeholder="US tracking #" value={trackingNumberUS} onChange={(e) => setTUS(e.target.value)} />
            <Select value={carrierUS} onChange={(e) => setCUS(e.target.value)} className="mt-2">
              <option value="">Carrier…</option>
              {CARRIERS_US.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <p className="text-xs text-[var(--ink-2)] mb-1">Mexico leg</p>
            <Input placeholder="MX tracking #" value={trackingNumberMX} onChange={(e) => setTMX(e.target.value)} />
            <Select value={carrierMX} onChange={(e) => setCMX(e.target.value)} className="mt-2">
              <option value="">Carrier…</option>
              {CARRIERS_MX.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <Button variant="outline" onClick={() => save(false)} disabled={loading} className="w-full">Save tracking</Button>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-semibold">Admin notes</h2>
        <textarea value={adminNotes} onChange={(e) => setAN(e.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-white p-3 text-sm" />
        <Button variant="outline" onClick={() => save(false)} disabled={loading} className="w-full mt-2">Save notes</Button>
      </div>
    </div>
  );
}
