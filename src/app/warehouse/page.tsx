import { prisma } from "@/lib/prisma";
import { WarehouseKanban } from "@/components/WarehouseKanban";
import { Inbox } from "lucide-react";

export default async function WarehouseQueue() {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ["purchased_from_store", "in_transit_to_san_diego", "received_at_warehouse", "forwarded_to_mexico"] },
    },
    orderBy: { createdAt: "asc" },
    include: { package: true, user: { select: { email: true } } },
  });

  const plain = orders.map((o) => ({
    id: o.id,
    productTitle: o.productTitle,
    productImageUrl: o.productImageUrl,
    status: o.status,
    userEmail: o.user.email,
    trackingNumber: o.package?.trackingNumber ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inbound queue</h1>
        <p className="mt-1 text-[var(--ink-2)]">{orders.length} package{orders.length === 1 ? "" : "s"} to process.</p>
      </div>
      {orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg)]">
            <Inbox className="h-6 w-6 text-[var(--ink-3)]" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">All clear</h2>
          <p className="mt-1 text-[var(--ink-2)]">No packages waiting for intake.</p>
        </div>
      ) : (
        <WarehouseKanban orders={plain} />
      )}
    </div>
  );
}
