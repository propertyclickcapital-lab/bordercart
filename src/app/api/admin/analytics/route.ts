import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user || s.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [totalOrders, revenue, totalUsers, pendingWarehouse, topStores, last30] = await Promise.all([
    prisma.order.count(),
    prisma.payment.aggregate({ _sum: { amountMXN: true }, where: { status: "succeeded" } }),
    prisma.user.count(),
    prisma.order.count({ where: { status: { in: ["purchased_from_store", "in_transit_to_san_diego"] } } }),
    prisma.importedProduct.groupBy({ by: ["store"], _count: true, orderBy: { _count: { store: "desc" } }, take: 6 }),
    prisma.order.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      select: { createdAt: true, totalPaidMXN: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const byDay: Record<string, { orders: number; revenue: number }> = {};
  for (const o of last30) {
    const d = o.createdAt.toISOString().slice(0, 10);
    byDay[d] = byDay[d] || { orders: 0, revenue: 0 };
    byDay[d].orders += 1;
    byDay[d].revenue += Number(o.totalPaidMXN);
  }

  return NextResponse.json({
    totalOrders,
    revenueMXN: Number(revenue._sum.amountMXN ?? 0),
    totalUsers,
    pendingWarehouse,
    topStores,
    timeseries: Object.entries(byDay).map(([date, v]) => ({ date, ...v })),
  });
}
