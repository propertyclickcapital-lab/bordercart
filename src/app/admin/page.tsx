import { prisma } from "@/lib/prisma";
import { AdminOrdersTable } from "@/components/AdminOrdersTable";
import { formatMXN } from "@/lib/utils/currency";
import { ShoppingCart, DollarSign, Users, Package } from "lucide-react";

export default async function AdminOverview() {
  const [totalOrders, revenue, activeUsers, pendingWarehouse, orders] = await Promise.all([
    prisma.order.count(),
    prisma.payment.aggregate({ _sum: { amountMXN: true }, where: { status: "succeeded" } }),
    prisma.user.count({ where: { tier: { not: "DEFAULT" } } }),
    prisma.order.count({ where: { status: { in: ["purchased_from_store", "in_transit_to_san_diego"] } } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true, name: true, tier: true } } },
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-[var(--ink-2)]">Everything at a glance.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={DollarSign} label="Revenue MXN" value={formatMXN(Number(revenue._sum.amountMXN ?? 0))} color="blue" />
        <Stat icon={ShoppingCart} label="Total orders" value={totalOrders.toString()} color="orange" />
        <Stat icon={Users} label="Active users" value={activeUsers.toString()} color="blue" />
        <Stat icon={Package} label="Pending warehouse" value={pendingWarehouse.toString()} color="orange" />
      </div>
      <section>
        <h2 className="mb-4 text-lg font-semibold">Orders</h2>
        <AdminOrdersTable orders={orders.map((o) => ({
          id: o.id, productTitle: o.productTitle,
          totalPaidMXN: o.totalPaidMXN.toString(), status: o.status,
          createdAt: o.createdAt.toISOString(),
          user: { email: o.user.email, name: o.user.name },
        }))} />
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: "blue" | "orange" }) {
  const cls = color === "blue" ? "bg-[var(--blue-light)] text-[var(--blue)]" : "bg-[var(--orange-light)] text-[var(--orange)]";
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${cls}`}><Icon className="h-4 w-4" /></div>
      <p className="mt-3 text-xs uppercase tracking-wider text-[var(--ink-2)]">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
