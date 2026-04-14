import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as OrderStatus | null;
  const search = searchParams.get("q");

  const orders = await prisma.order.findMany({
    where: {
      ...(status && Object.values(OrderStatus).includes(status) ? { status } : {}),
      ...(search
        ? {
            OR: [
              { productTitle: { contains: search, mode: "insensitive" } },
              { trackingNumberUS: { contains: search, mode: "insensitive" } },
              { trackingNumberMX: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true, tier: true } } },
    take: 300,
  });
  return NextResponse.json(orders);
}
