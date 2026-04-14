import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OrderCard } from "@/components/OrderCard";
import { ManualRequestCard } from "@/components/ManualRequestCard";
import { LinkInput } from "@/components/LinkInput";
import { Package } from "lucide-react";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [orders, manualRequests] = await Promise.all([
    prisma.order.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
    prisma.manualRequest.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const combined = [
    ...orders.map((o) => ({ kind: "order" as const, createdAt: o.createdAt, data: o })),
    ...manualRequests.map((m) => ({ kind: "manual" as const, createdAt: m.createdAt, data: m })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your orders</h1>
      {combined.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg)]">
            <Package className="h-6 w-6 text-[var(--ink-3)]" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Nothing here yet</h2>
          <p className="mt-1 text-[var(--ink-2)]">Start by pasting a product link below.</p>
          <div className="mt-6 mx-auto max-w-lg"><LinkInput /></div>
        </div>
      ) : (
        <div className="space-y-3">
          {combined.map((item) =>
            item.kind === "order" ? (
              <OrderCard key={`o-${item.data.id}`} order={item.data} />
            ) : (
              <ManualRequestCard
                key={`m-${item.data.id}`}
                request={{
                  id: item.data.id,
                  sourceUrl: item.data.sourceUrl,
                  status: item.data.status,
                  quotedPriceMXN: item.data.quotedPriceMXN ? item.data.quotedPriceMXN.toString() : null,
                  adminNote: item.data.adminNote,
                  createdAt: item.data.createdAt.toISOString(),
                }}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
