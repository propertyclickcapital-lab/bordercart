import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateOrderPrice } from "@/lib/pricing/engine";
import { getFxRate } from "@/lib/pricing/fx";
import { getActivePricingRule } from "@/lib/pricing-rule";
import { searchProductByUrl } from "@/lib/scraper/serpapi";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  try {
    const { title, imageUrl, priceUSD, store } = await searchProductByUrl(url);
    if (!title || title.length < 3) throw new Error("No product found");

    const [fxRate, pricingRule, user] = await Promise.all([
      getFxRate(),
      getActivePricingRule(),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    const effectivePriceUSD = priceUSD || 80;
    const breakdown = calculateOrderPrice({
      productPriceUSD: effectivePriceUSD,
      userTier: user?.tier || "DEFAULT",
      fxRate,
      pricingRule,
    });

    const product = await prisma.importedProduct.create({
      data: {
        sourceUrl: url,
        store,
        title,
        imageUrl,
        priceUSD: effectivePriceUSD,
        currency: "USD",
        isSupported: true,
        needsPricing: priceUSD === 0,
      },
    });

    const quote = await prisma.quote.create({
      data: {
        userId,
        productId: product.id,
        productPriceUSD: effectivePriceUSD,
        fxRate,
        fxSpreadPercent: pricingRule.fxSpreadPercent,
        takeRatePercent: breakdown.takeRatePercent,
        shippingMarginUSD: pricingRule.shippingMarginUSD,
        handlingFeeUSD: pricingRule.handlingFeeUSD,
        customsBufferPercent: pricingRule.customsBufferPercent,
        minMarginMXN: pricingRule.minMarginMXN,
        totalMXN: breakdown.totalMXN,
        deliveryDaysMin: breakdown.deliveryDaysMin,
        deliveryDaysMax: breakdown.deliveryDaysMax,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ success: true, quoteId: quote.id, needsPricing: priceUSD === 0 });
  } catch {
    const manual = await prisma.manualRequest.create({
      data: { userId, sourceUrl: url, status: "pending" },
    });
    return NextResponse.json({ manual: true, requestId: manual.id });
  }
}
