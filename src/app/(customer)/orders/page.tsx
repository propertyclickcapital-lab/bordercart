import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LiveActivityList } from "@/components/LiveActivityList";
import { LinkInput } from "@/components/LinkInput";
import { Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [orders, manualRequests] = await Promise.all([
    prisma.order.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
    prisma.manualRequest.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const quoteIds = manualRequests.map((m) => m.quoteId).filter((x): x is string => !!x);
  const quotes = quoteIds.length
    ? await prisma.quote.findMany({ where: { id: { in: quoteIds } }, include: { product: true } })
    : [];
  const quoteMap = new Map(quotes.map((q) => [q.id, q]));

  const enrichedManual = manualRequests.map((m) => {
    const q = m.quoteId ? quoteMap.get(m.quoteId) : null;
    return {
      id: m.id,
      sourceUrl: m.sourceUrl,
      status: m.status,
      quotedPriceMXN: m.quotedPriceMXN ? m.quotedPriceMXN.toString() : null,
      adminNote: m.adminNote,
      createdAt: m.createdAt.toISOString(),
      quoteId: m.quoteId,
      quote: q
        ? {
            id: q.id,
            totalMXN: q.totalMXN.toString(),
            expiresAt: q.expiresAt.toISOString(),
            adminSetPrice: q.adminSetPrice,
            product: { title: q.product.title, imageUrl: q.product.imageUrl, store: q.product.store },
          }
        : null,
    };
  });

  const initialOrders = orders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString() as any,
    updatedAt: o.updatedAt.toISOString() as any,
    totalPaidMXN: o.totalPaidMXN.toString() as any,
    creditAppliedMXN: o.creditAppliedMXN.toString() as any,
  }));

  const empty = orders.length === 0 && manualRequests.length === 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your orders</h1>
      {empty ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg)]">
            <Package className="h-6 w-6 text-[var(--ink-3)]" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Nothing here yet</h2>
          <p className="mt-1 text-[var(--ink-2)]">Start by pasting a product link below.</p>
          <div className="mt-6 mx-auto max-w-lg"><LinkInput /></div>
        </div>
      ) : (
        <LiveActivityList initial={{ orders: initialOrders as any, manualRequests: enrichedManual }} />
      )}
    </div>
  );
}
