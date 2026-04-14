"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMXN } from "@/lib/utils/currency";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { OrderStatus } from "@prisma/client";
import { format } from "date-fns";

type AdminOrder = {
  id: string; productTitle: string; totalPaidMXN: string | number;
  status: OrderStatus; createdAt: string | Date;
  user: { email: string; name: string | null };
};

const STATUSES: (OrderStatus | "all")[] = [
  "all", "quote_created", "awaiting_payment", "pending_purchase", "purchased_from_store",
  "in_transit_to_san_diego", "received_at_warehouse", "forwarded_to_mexico",
  "in_last_mile_delivery", "delivered", "issue_flagged", "cancelled",
];

export function AdminOrdersTable({ orders }: { orders: AdminOrder[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");

  const filtered = useMemo(() => orders.filter((o) => {
    if (status !== "all" && o.status !== status) return false;
    if (q) {
      const s = q.toLowerCase();
      if (!o.productTitle.toLowerCase().includes(s) && !o.user.email.toLowerCase().includes(s)) return false;
    }
    return true;
  }), [orders, q, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Search by product or email..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
        <Select value={status} onChange={(e) => setStatus(e.target.value as any)} className="max-w-[240px]">
          {STATUSES.map((s) => <option key={s} value={s}>{s === "all" ? "All statuses" : s.replace(/_/g, " ")}</option>)}
        </Select>
      </div>
      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg)] text-[var(--ink-2)]">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-[var(--border-soft)] hover:bg-[var(--bg)]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium text-[var(--blue)] hover:underline">{o.productTitle}</Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-2)]">{o.user.email}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 font-semibold">{formatMXN(Number(o.totalPaidMXN))}</td>
                  <td className="px-4 py-3 text-[var(--ink-2)]">{format(new Date(o.createdAt), "MMM d, yyyy")}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-[var(--ink-2)]">No orders match.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
