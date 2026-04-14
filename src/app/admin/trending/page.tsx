import { prisma } from "@/lib/prisma";
import { TrendingManager } from "@/components/TrendingManager";

export default async function AdminTrending() {
  const items = await prisma.trendingProduct.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
  });
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trending Products</h1>
        <p className="mt-1 text-[var(--ink-2)]">These appear in the "Trending Right Now" section on the homepage.</p>
      </div>
      <TrendingManager initial={items.map((i) => ({
        id: i.id, title: i.title, imageUrl: i.imageUrl,
        priceUSD: Number(i.priceUSD), store: i.store, sourceUrl: i.sourceUrl,
        category: i.category, position: i.position, isActive: i.isActive,
      }))} />
    </div>
  );
}
