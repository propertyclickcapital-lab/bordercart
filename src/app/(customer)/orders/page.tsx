import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OrderCard } from "@/components/OrderCard";
import { LinkInput } from "@/components/LinkInput";
import { Package } from "lucide-react";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const orders = await prisma.order.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your orders</h1>
      {orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg)]">
            <Package className="h-6 w-6 text-[var(--ink-3)]" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Nothing here yet</h2>
          <p className="mt-1 text-[var(--ink-2)]">Start by pasting a product link below.</p>
          <div className="mt-6 mx-auto max-w-lg"><LinkInput /></div>
        </div>
      ) : (
        <div className="space-y-3">{orders.map((o) => <OrderCard key={o.id} order={o} />)}</div>
      )}
    </div>
  );
}
