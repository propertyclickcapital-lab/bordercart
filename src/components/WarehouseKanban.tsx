"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import type { OrderStatus } from "@prisma/client";

type Order = {
  id: string;
  productTitle: string;
  productImageUrl: string | null;
  status: OrderStatus;
  userEmail: string;
  trackingNumber: string | null;
};

const COLUMNS: { title: string; statuses: OrderStatus[] }[] = [
  { title: "Awaiting in US", statuses: ["purchased_from_store", "in_transit_to_san_diego"] },
  { title: "At warehouse", statuses: ["received_at_warehouse"] },
  { title: "Forwarded", statuses: ["forwarded_to_mexico"] },
];

export function WarehouseKanban({ orders: initial }: { orders: Order[] }) {
  const [orders, setOrders] = useState(initial);

  async function patch(id: string, body: any) {
    await fetch(`/api/warehouse/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
  }

  async function markReceived(o: Order, tracking: string) {
    await patch(o.id, { trackingNumber: tracking, receivedAt: new Date().toISOString(), status: "received_at_warehouse" });
    setOrders((cur) => cur.map((x) => x.id === o.id ? { ...x, status: "received_at_warehouse", trackingNumber: tracking } : x));
  }

  async function flag(o: Order) {
    await patch(o.id, { issueFlag: true, status: "issue_flagged" });
    setOrders((cur) => cur.filter((x) => x.id !== o.id));
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {COLUMNS.map((col) => (
        <div key={col.title} className="rounded-lg bg-[var(--bg)] border border-[var(--border)] p-3">
          <h2 className="font-semibold text-sm px-1 mb-3">{col.title} <span className="text-[var(--ink-3)] ml-1">({orders.filter((o) => col.statuses.includes(o.status)).length})</span></h2>
          <div className="space-y-3">
            {orders.filter((o) => col.statuses.includes(o.status)).map((o) => (
              <Card key={o.id} order={o} onMarkReceived={markReceived} onFlag={flag} />
            ))}
            {orders.filter((o) => col.statuses.includes(o.status)).length === 0 && (
              <p className="text-xs text-[var(--ink-3)] text-center py-6">Empty</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Card({ order, onMarkReceived, onFlag }: { order: Order; onMarkReceived: (o: Order, t: string) => void; onFlag: (o: Order) => void }) {
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const [loading, setLoading] = useState(false);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-[var(--bg)] border border-[var(--border-soft)]">
          {order.productImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={order.productImageUrl} alt="" className="h-full w-full object-contain p-1" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/warehouse/${order.id}`} className="font-medium text-sm line-clamp-2 hover:text-[var(--blue)]">{order.productTitle}</Link>
          <p className="text-xs text-[var(--ink-2)] truncate">{order.userEmail}</p>
          <div className="mt-1"><StatusBadge status={order.status} /></div>
        </div>
      </div>

      {order.status === "purchased_from_store" || order.status === "in_transit_to_san_diego" ? (
        <div className="mt-3 space-y-2">
          <Input placeholder="Tracking #" value={tracking} onChange={(e) => setTracking(e.target.value)} />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Button size="sm" disabled={loading || !tracking} onClick={async () => { setLoading(true); await onMarkReceived(order, tracking); setLoading(false); }}>Mark received</Button>
            <Button size="sm" variant="outline" onClick={() => onFlag(order)}><AlertTriangle className="h-4 w-4" /></Button>
          </div>
        </div>
      ) : (
        <Link href={`/warehouse/${order.id}`} className="mt-3 block text-xs text-[var(--blue)] hover:underline">Open detail →</Link>
      )}
    </div>
  );
}
