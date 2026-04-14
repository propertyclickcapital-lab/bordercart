import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [orders, manualRequests] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.manualRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const quoteIds = manualRequests.map((m) => m.quoteId).filter((id): id is string => !!id);
  const quotes = quoteIds.length
    ? await prisma.quote.findMany({
        where: { id: { in: quoteIds } },
        include: { product: true },
      })
    : [];
  const quoteMap = new Map(quotes.map((q) => [q.id, q]));

  const enrichedManualRequests = manualRequests.map((m) => {
    const q = m.quoteId ? quoteMap.get(m.quoteId) : null;
    return {
      id: m.id,
      sourceUrl: m.sourceUrl,
      status: m.status,
      quotedPriceMXN: m.quotedPriceMXN ? m.quotedPriceMXN.toString() : null,
      adminNote: m.adminNote,
      createdAt: m.createdAt,
      quoteId: m.quoteId,
      quote: q
        ? {
            id: q.id,
            totalMXN: q.totalMXN.toString(),
            expiresAt: q.expiresAt,
            adminSetPrice: q.adminSetPrice,
            product: { title: q.product.title, imageUrl: q.product.imageUrl, store: q.product.store },
          }
        : null,
    };
  });

  return NextResponse.json({ orders, manualRequests: enrichedManualRequests });
}
