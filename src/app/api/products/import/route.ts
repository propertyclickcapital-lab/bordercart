import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scrapeProduct } from "@/lib/scraper";

const CACHE_MS = 30 * 60 * 1000;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  if (!url || typeof url !== "string") return NextResponse.json({ error: "URL required" }, { status: 400 });

  const existing = await prisma.importedProduct.findFirst({
    where: { sourceUrl: url },
    orderBy: { scrapedAt: "desc" },
  });
  if (existing && Date.now() - existing.scrapedAt.getTime() < CACHE_MS && existing.isSupported) {
    return NextResponse.json(existing);
  }

  let scraped;
  try {
    scraped = await scrapeProduct(url);
  } catch {
    scraped = null;
  }

  const failed = !scraped || !scraped.isSupported || !(scraped.priceUSD > 0);

  if (failed) {
    const req = await prisma.manualRequest.create({
      data: { userId: session.user.id, sourceUrl: url, status: "pending" },
    });
    return NextResponse.json({ manual: true, requestId: req.id });
  }

  const product = await prisma.importedProduct.create({
    data: {
      sourceUrl: scraped.sourceUrl,
      store: scraped.store,
      title: scraped.title,
      imageUrl: scraped.imageUrl,
      priceUSD: scraped.priceUSD,
      currency: scraped.currency,
      availability: scraped.availability,
      isSupported: scraped.isSupported,
      rawData: (scraped.rawData as any) ?? undefined,
    },
  });

  if (scraped.priceUSD > 0) {
    prisma.priceHistory.create({
      data: { productSourceUrl: scraped.sourceUrl, priceUSD: scraped.priceUSD },
    }).catch(() => {});
  }

  return NextResponse.json(product);
}
