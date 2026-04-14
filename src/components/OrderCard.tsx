import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMXN } from "@/lib/utils/currency";
import { format } from "date-fns";
import type { Order } from "@prisma/client";
import { ArrowRight } from "lucide-react";

export function OrderCard({ order }: { order: Order }) {
  return (
    <Link
      href={`/orders/${order.id}`}
      className="group flex items-center gap-4 rounded-lg border border-[var(--border)] bg-white p-4 transition-all hover:border-[var(--blue)] hover:shadow-md"
    >
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-[var(--bg)] border border-[var(--border-soft)]">
        {order.productImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={order.productImageUrl} alt="" className="h-full w-full object-contain p-1" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{order.productTitle}</p>
        <p className="mt-0.5 text-xs text-[var(--ink-2)]">
          Ordered {format(new Date(order.createdAt), "MMM d, yyyy")} · #{order.id.slice(-6).toUpperCase()}
        </p>
        <div className="mt-2"><StatusBadge status={order.status} /></div>
      </div>
      <div className="flex flex-col items-end gap-1 text-right">
        <p className="text-lg font-bold text-[var(--blue)]">{formatMXN(Number(order.totalPaidMXN))}</p>
        <span className="inline-flex items-center gap-1 text-xs text-[var(--blue)] group-hover:gap-2 transition-all">
          Track <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
