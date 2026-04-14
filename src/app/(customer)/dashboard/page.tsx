import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LinkInput } from "@/components/LinkInput";
import { TierProgress } from "@/components/TierProgress";
import { LiveActivityList } from "@/components/LiveActivityList";
import { WelcomeModal } from "@/components/WelcomeModal";
import { TierBadge } from "@/components/TierBadge";
import { ReferralCard } from "@/components/ReferralCard";
import { formatMXN } from "@/lib/utils/currency";
import Link from "next/link";
import { ShoppingBag, Heart } from "lucide-react";

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
        <LiveActivityList initial={{ orders: initialOrders as any, manualRequests: enrichedManual }} limit={5} />
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
