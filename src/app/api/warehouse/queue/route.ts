import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user || (s.user.role !== "WAREHOUSE_OPERATOR" && s.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ["purchased_from_store", "in_transit_to_san_diego", "received_at_warehouse", "forwarded_to_mexico"] },
    },
    orderBy: { createdAt: "asc" },
    include: { package: true, user: { select: { email: true } } },
  });
  return NextResponse.json(orders);
}
