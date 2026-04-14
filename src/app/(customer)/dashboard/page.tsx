import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LinkInput } from "@/components/LinkInput";
import { TierProgress } from "@/components/TierProgress";
import { OrderCard } from "@/components/OrderCard";
import { ManualRequestCard } from "@/components/ManualRequestCard";
import { WelcomeModal } from "@/components/WelcomeModal";
import { TierBadge } from "@/components/TierBadge";
import { ReferralCard } from "@/components/ReferralCard";
import { formatMXN } from "@/lib/utils/currency";
import Link from "next/link";
import { Package, ShoppingBag, Heart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const [user, orders, manualRequests, wishlistCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, include: { tierStatus: true } }),
    prisma.order.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
    prisma.manualRequest.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
    prisma.wishlist.count({ where: { userId: session.user.id } }),
  ]);
  if (!user) return null;
  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));

  const combined = [
    ...orders.map((o) => ({ kind: "order" as const, createdAt: o.createdAt, data: o })),
    ...manualRequests.map((m) => ({ kind: "manual" as const, createdAt: m.createdAt, data: m })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <WelcomeModal name={user.name} />

      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">Hello {user.name || user.email.split("@")[0]} 👋</h1>
        <TierBadge tier={user.tier} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total orders" value={(user.tierStatus?.orderCount ?? 0).toString()} />
        <Stat label="Total spent" value={formatMXN(Number(user.tierStatus?.totalSpendMXN ?? 0))} />
        <Stat label="Active orders" value={activeOrders.length.toString()} />
        <Stat label="Saved items" value={wishlistCount.toString()} />
      </div>

      <TierProgress
        tier={user.tier}
        orderCount={user.tierStatus?.orderCount ?? 0}
        totalSpendMXN={Number(user.tierStatus?.totalSpendMXN ?? 0)}
      />

      <section className="rounded-lg border border-[var(--border)] bg-gradient-to-br from-[var(--blue-light)] to-white p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--blue)] text-white">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">Paste a U.S. product link to get started</h2>
            <p className="text-sm text-[var(--ink-2)] mt-0.5">We'll calculate the all-in price in pesos in seconds.</p>
            <div className="mt-4"><LinkInput /></div>
          </div>
        </div>
      </section>

      <ReferralCard />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent activity</h2>
          <Link href="/orders" className="text-sm text-[var(--blue)] hover:underline">View all →</Link>
        </div>
        {combined.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg)]">
              <Package className="h-5 w-5 text-[var(--ink-3)]" />
            </div>
            <h3 className="mt-4 font-semibold">No orders yet</h3>
            <p className="mt-1 text-sm text-[var(--ink-2)]">Paste your first link above to get started.</p>
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
      </section>

      {wishlistCount > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Heart className="h-5 w-5 text-[var(--danger)]" /> Saved items</h2>
            <Link href="/wishlist" className="text-sm text-[var(--blue)] hover:underline">View all →</Link>
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4">
      <p className="text-xs uppercase tracking-wider text-[var(--ink-2)]">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
