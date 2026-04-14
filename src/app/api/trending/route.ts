import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.trendingProduct.findMany({
    where: { isActive: true },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    take: 12,
  });
  return NextResponse.json(items);
}
