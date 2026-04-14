import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WishlistGrid } from "@/components/WishlistGrid";
import { Heart } from "lucide-react";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const items = await prisma.wishlist.findMany({
    where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, include: { product: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="h-6 w-6 text-[var(--danger)]" />
        <h1 className="text-3xl font-bold">Saved items</h1>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-12 text-center">
          <p className="text-[var(--ink-2)]">Nothing saved yet. Tap the heart on any product to save it.</p>
        </div>
      ) : (
        <WishlistGrid items={items.map((i) => ({
          id: i.id, productId: i.productId, title: i.product.title,
          imageUrl: i.product.imageUrl, sourceUrl: i.product.sourceUrl,
          store: i.product.store, priceUSD: Number(i.product.priceUSD),
        }))} />
      )}
    </div>
  );
}
