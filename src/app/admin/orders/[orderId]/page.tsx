import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatMXN } from "@/lib/utils/currency";
import { format } from "date-fns";
import { StatusBadge } from "@/components/StatusBadge";
import { AdminOrderControls } from "@/components/AdminOrderControls";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default async function AdminOrderDetail({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true, quote: { include: { product: true } }, address: true,
      statusHistory: { orderBy: { createdAt: "asc" } }, payment: true, package: true,
    },
  });
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-[var(--blue)] hover:underline">← Back</Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-4 rounded-lg border border-[var(--border)] bg-white p-5">
            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-[var(--bg)] border border-[var(--border-soft)]">
              {order.productImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={order.productImageUrl} alt="" className="h-full w-full object-contain p-1" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-[var(--ink-2)]">#{order.id.slice(-6).toUpperCase()}</p>
              <h1 className="mt-0.5 text-xl font-bold">{order.productTitle}</h1>
              <p className="mt-1 text-sm text-[var(--ink-2)]">{order.user.email} · {order.user.tier}</p>
              <div className="mt-2 flex items-center gap-3">
                <StatusBadge status={order.status} />
                <span className="text-lg font-bold text-[var(--blue)]">{formatMXN(Number(order.totalPaidMXN))}</span>
              </div>
            </div>
          </div>

          <a
            href={order.quote.product.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg border-2 border-[var(--orange)] bg-[var(--orange)]/5 p-4 hover:bg-[var(--orange)]/10"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--orange)]">Purchase this item →</p>
              <p className="mt-1 text-sm text-[var(--ink-2)] truncate max-w-md">{order.quote.product.sourceUrl}</p>
            </div>
            <ExternalLink className="h-5 w-5 text-[var(--orange)]" />
          </a>

          {order.address && (
            <div className="rounded-lg border border-[var(--border)] bg-white p-5">
              <h2 className="text-sm font-semibold">Ship to</h2>
              <p className="mt-2 font-medium">{order.address.label}</p>
              <p className="text-sm text-[var(--ink-2)]">
                {order.address.street}{order.address.exteriorNumber ? ` ${order.address.exteriorNumber}` : ""}
                {order.address.interiorNumber ? `, Int. ${order.address.interiorNumber}` : ""}
                {order.address.colonia ? `, ${order.address.colonia}` : ""},{" "}
                {order.address.city}, {order.address.state} {order.address.postalCode}
              </p>
            </div>
          )}

          <div className="rounded-lg border border-[var(--border)] bg-white p-5">
            <h2 className="text-sm font-semibold">Status history</h2>
            <ul className="mt-3 space-y-3">
              {order.statusHistory.map((h) => (
                <li key={h.id} className="flex items-start justify-between gap-3 border-t border-[var(--border-soft)] pt-3 first:border-t-0 first:pt-0">
                  <div><StatusBadge status={h.status} />{h.note && <p className="mt-1 text-sm text-[var(--ink-2)]">{h.note}</p>}</div>
                  <p className="text-xs text-[var(--ink-3)] whitespace-nowrap">{format(new Date(h.createdAt), "MMM d, HH:mm")}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside>
          <AdminOrderControls
            orderId={order.id}
            currentStatus={order.status}
            initial={{
              trackingNumberUS: order.trackingNumberUS ?? "",
              trackingNumberMX: order.trackingNumberMX ?? "",
              carrierUS: order.carrierUS ?? "",
              carrierMX: order.carrierMX ?? "",
              adminNotes: order.adminNotes ?? "",
            }}
          />
        </aside>
      </div>
    </div>
  );
}
