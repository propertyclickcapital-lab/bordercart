import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { WarehouseDetailForm } from "@/components/WarehouseDetailForm";
import Link from "next/link";

export default async function WarehouseDetail({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { package: true, user: { select: { email: true } } },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/warehouse" className="text-sm text-[var(--blue)] hover:underline">← Back to queue</Link>
      <div className="flex items-center gap-4 rounded-lg border border-[var(--border)] bg-white p-5">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-[var(--bg)] border border-[var(--border-soft)]">
          {order.productImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={order.productImageUrl} alt="" className="h-full w-full object-contain p-1" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-[var(--ink-2)]">#{order.id.slice(-6).toUpperCase()}</p>
          <h1 className="mt-0.5 text-lg font-bold">{order.productTitle}</h1>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{order.user.email}</p>
          <div className="mt-2"><StatusBadge status={order.status} /></div>
        </div>
      </div>
      <WarehouseDetailForm orderId={order.id} pkg={order.package ? {
        trackingNumber: order.package.trackingNumber,
        carrier: order.package.carrier,
        weight: order.package.weight ? Number(order.package.weight) : null,
        dimensions: (order.package.dimensions as any) ?? null,
        notes: order.package.notes,
        issueType: order.package.issueType,
      } : null} />
    </div>
  );
}
