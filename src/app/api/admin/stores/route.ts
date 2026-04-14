import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STORE_REGISTRY } from "@/lib/scraper/registry";

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user || s.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [logs, requests] = await Promise.all([
    prisma.scrapingLog.groupBy({
      by: ["store", "success"],
      _count: true,
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.storeRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true } } },
      take: 50,
    }),
  ]);

  const statsByStore: Record<string, { success: number; fail: number }> = {};
  for (const l of logs) {
    const key = l.store;
    statsByStore[key] = statsByStore[key] || { success: 0, fail: 0 };
    if (l.success) statsByStore[key].success = l._count;
    else statsByStore[key].fail = l._count;
  }

  return NextResponse.json({ registry: STORE_REGISTRY, statsByStore, storeRequests: requests });
}
